import en from "./i18n/en.json";
import de from "./i18n/de.json";
export const catalogs = { en, de };
export const languages = { en: "English", de: "Deutsch" };
export type Locale = keyof typeof catalogs;
export const pages = [
  "home",
  "vision",
  "architecture",
  "industries",
  "roadmap",
  "community",
  "contribute",
] as const;
export type Page = (typeof pages)[number];
export const path = (l: Locale, p: Page) =>
  `/${l === "en" ? "" : l + "/"}${p === "home" ? "" : p + "/"}`;
export const repo = "https://github.com/erp4us-org/erp4us";
export const actions = {
  first: repo + "/issues?q=is%3Aopen+label%3A%22good+first+issue%22",
  scenario: repo + "/issues/16",
  forum: repo + "/discussions",
  issues: repo + "/issues",
  prs: repo + "/pulls",
  rfc: repo + "/blob/main/GOVERNANCE.md",
  guide: repo + "/blob/main/CONTRIBUTING.md",
};
async function snapshot() {
  try {
    const r = await fetch("https://api.github.com/repos/erp4us-org/erp4us", {
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) return;
    const data = await r.json();
    if (
      Number.isSafeInteger(data.stargazers_count) &&
      data.stargazers_count >= 0
    )
      return {
        stars: data.stargazers_count,
        date: new Date().toISOString().slice(0, 10),
      };
  } catch {
    /* Optional metadata: omit it when unavailable. */
  }
}
export const signals = snapshot();
