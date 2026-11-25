import type { APIRoute } from "astro";
import { articlePath, posts } from "../devlog";
import { catalogs, pages, path, type Locale } from "../site";
import { xml, xmlResponse } from "../xml";

export const GET: APIRoute = async ({ site }) => {
  const routes = (Object.keys(catalogs) as Locale[]).flatMap((locale) =>
    pages.map((page) => path(locale, page)),
  );
  routes.push(
    ...(await posts()).map(({ data }) => articlePath(data.locale, data.slug)),
  );
  return xmlResponse(
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes
      .map((route) => `<url><loc>${xml(new URL(route, site).href)}</loc></url>`)
      .join("")}</urlset>`,
  );
};
