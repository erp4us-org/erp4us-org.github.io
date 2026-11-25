import type { APIRoute } from "astro";
import { articlePath, posts } from "../../../devlog";
import { catalogs, path, translate, type Locale } from "../../../site";
import { xml, xmlResponse } from "../../../xml";

export const getStaticPaths = () =>
  (Object.keys(catalogs) as Locale[]).map((locale) => ({
    params: { lang: locale === "en" ? undefined : locale },
    props: { locale },
  }));
export const GET: APIRoute = async ({ props, site }) => {
  const locale: Locale = props.locale;
  const link = xml(new URL(path(locale, "devlog"), site).href);
  const items = (await posts(locale)).map(({ data }) => {
    const href = xml(new URL(articlePath(locale, data.slug), site).href);
    return `<item><title>${xml(data.title)}</title><link>${href}</link><guid>${href}</guid><description>${xml(data.description)}</description><pubDate>${data.date.toUTCString()}</pubDate><dc:creator>${xml(data.author)}</dc:creator>${data.categories.map((item) => `<category>${xml(item)}</category>`).join("")}</item>`;
  });
  return xmlResponse(
    `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/"><channel><title>erp4us · ${xml(translate(locale, "nav.devlog"))}</title><link>${link}</link><description>${xml(translate(locale, "devlog.intro"))}</description><language>${locale}</language><atom:link href="${link}rss.xml" rel="self" type="application/rss+xml"/>${items.join("")}</channel></rss>`,
    "application/rss+xml",
  );
};
