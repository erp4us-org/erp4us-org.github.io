import { getCollection } from "astro:content";
import { path, type Locale } from "./site";

export const articlePath = (locale: Locale, slug: string) =>
  `${path(locale, "devlog")}${slug}/`;

const published = async () => {
  const entries = await getCollection("devlog", ({ data }) => !data.draft);
  for (const key of ["slug", "translationKey"] as const) {
    const ids = entries.map(({ data }) => `${data.locale}:${data[key]}`);
    if (new Set(ids).size !== ids.length)
      throw new Error(`Duplicate devlog ${key}`);
  }
  return entries.sort(
    (a, b) =>
      b.data.date.getTime() - a.data.date.getTime() || a.id.localeCompare(b.id),
  );
};
export const posts = async (locale?: Locale) =>
  (await published()).filter(({ data }) => !locale || data.locale === locale);
export const readingTime = (body: string) =>
  Math.max(1, Math.ceil(body.trim().split(/\s+/).length / 220));
