"""Check generated internal navigation, fragment IDs and local assets without a server."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote
from xml.etree import ElementTree
import json

root = Path('dist').resolve()
class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs, self.ids = [], set()
        self.meta, self.alternates = {}, {}
        self.canonical = self.lang = self.schema = None
        self.read_schema = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.ids.add(attrs.get('id'))
        self.refs.extend(attrs[k] for k in ('src', 'href') if attrs.get(k))
        if tag == 'html':
            self.lang = attrs.get('lang')
        if tag == 'meta':
            self.meta[attrs.get('name') or attrs.get('property')] = attrs.get('content')
        if tag == 'link' and attrs.get('rel') == 'canonical':
            self.canonical = attrs.get('href')
        if tag == 'link' and attrs.get('hreflang'):
            self.alternates[attrs['hreflang']] = attrs['href']
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.read_schema = True
    def handle_data(self, data):
        if self.read_schema:
            self.schema = json.loads(data)
    def handle_endtag(self, tag):
        if tag == 'script':
            self.read_schema = False

pages = {}
for f in root.rglob('*.html'):
    parser = Links()
    parser.feed(f.read_text())
    pages[f] = parser
assert root / 'index.html' in pages
def target_of(url):
    target = root / unquote(urlsplit(url).path.lstrip('/'))
    return target / 'index.html' if target.is_dir() else target

for f, page in pages.items():
    assert target_of(page.canonical) == f, (f, page.canonical)
    assert page.meta['og:url'] == page.canonical, f
    assert page.meta['description'] and page.meta['og:description'], f
    assert target_of(page.meta['og:image']).is_file(), f
    assert page.schema['inLanguage'] == page.lang, f
    assert page.alternates[page.lang] == page.canonical, f
    for lang, alt in page.alternates.items():
        if lang != 'x-default':
            assert pages[target_of(alt)].alternates[page.lang] == page.canonical, (f, alt)
    for ref in page.refs:
        url = urlsplit(urljoin(page.canonical, ref))
        if url.netloc != urlsplit(page.canonical).netloc:
            continue
        target = root / unquote(url.path.lstrip('/'))
        if target.is_dir():
            target /= 'index.html'
        assert target.is_file(), (f, ref)
        if url.fragment:
            assert unquote(url.fragment) in pages[target].ids, (f, ref)
    if page.schema['@type'] == 'BlogPosting':
        assert page.schema['datePublished'] and page.meta['article:published_time'], f

sitemap = ElementTree.parse(root / 'sitemap.xml')
assert {loc.text for loc in sitemap.findall('.//{*}loc')} == {page.canonical for page in pages.values()}
assert 'Sitemap: ' + urljoin(pages[root / 'index.html'].canonical, 'sitemap.xml') in (root / 'robots.txt').read_text()
for lang, folder in [('en', root), ('de', root / 'de')]:
    feed = ElementTree.parse(folder / 'devlog/rss.xml')
    assert feed.findtext('./channel/language') == lang
    assert {item.text for item in feed.findall('./channel/item/link')} == {
        page.canonical for page in pages.values() if page.lang == lang and page.schema['@type'] == 'BlogPosting'
    }
print(f'Validated internal links, assets and metadata on {len(pages)} pages, sitemap and RSS')
