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
  "development",
  "devlog",
] as const;
export type Page = (typeof pages)[number];
export const path = (l: Locale, p: Page) =>
  `/${l === "en" ? "" : l + "/"}${p === "home" ? "" : p + "/"}`;
export const repo = "https://github.com/erp4us-org/erp4us";
export const organization = "https://github.com/erp4us-org";
const forum = repo + "/discussions";
const guide = repo + "/blob/main/CONTRIBUTING.md";
export const actions = {
  forum,
  industryKnowledge: forum + "/72",
  businessRequirement: forum + "/new/choose",
  guide,
  issues: repo + "/issues",
  prs: repo + "/pulls",
  rfc: repo + "/blob/main/GOVERNANCE.md",
};
export const translate = (locale: Locale, key: string) =>
  (catalogs[locale] as Record<string, string>)[key] ??
  (catalogs.en as Record<string, string>)[key] ??
  (() => {
    throw new Error(`Unknown translation key: ${key}`);
  })();
export const areaLinks = {
  engineering: repo + "/issues/36",
  architecture: forum + "/73",
  domain: forum + "/72",
  design: forum + "/74",
  infrastructure: repo + "/issues/78",
  automation: forum + "/76",
  docs: repo + "/issues/33",
};
export const policies = {
  contributing: `${repo}/blob/main/CONTRIBUTING.md`,
  conduct: `${repo}/blob/main/CODE_OF_CONDUCT.md`,
  security: `${repo}/blob/main/SECURITY.md`,
  license: `${repo}/blob/main/LICENSE`,
  agents: `${repo}/blob/main/AGENTS.md`,
  governance: actions.rfc,
  decisions: `${repo}/tree/main/docs/adr`,
  discussions: forum,
  projects: `${organization.replace("github.com/", "github.com/orgs/")}/projects`,
};
