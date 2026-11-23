"""Check generated internal navigation, fragment IDs and local assets without a server."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, unquote

root = Path('dist').resolve()
class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs, self.ids = [], set()
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.ids.add(attrs.get('id'))
        self.refs.extend(attrs[k] for k in ('src', 'href') if attrs.get(k))

pages = {}
for f in root.rglob('*.html'):
    parser = Links()
    parser.feed(f.read_text())
    pages[f] = parser
assert root / 'index.html' in pages
for f, page in pages.items():
    for ref in page.refs:
        url = urlsplit(urljoin('https://erp4us.org/' + str(f.relative_to(root)), ref))
        if url.hostname not in ('erp4us.org', 'erp4us-org.github.io'):
            continue
        target = root / unquote(url.path.lstrip('/'))
        if target.is_dir():
            target /= 'index.html'
        assert target.is_file(), (f, ref)
        if url.fragment:
            assert unquote(url.fragment) in pages[target].ids, (f, ref)
print(f'Validated internal links and assets on {len(pages)} pages')
