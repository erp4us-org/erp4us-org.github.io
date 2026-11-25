# erp4us website

The organization website is an Astro static build. Use the Node version in `.nvmrc`, npm and Python 3. Run `npm ci` then `npm run dev`. Before submitting run `npm run format && npm run lint && npm test && npm run check && GITHUB_SNAPSHOT=tests/fixtures/github.json npm run build && npm run links`. To format changes use `npx prettier --write .`. No server, API key, external fonts or translation service is needed at runtime. See the [community launch and maintenance guide](docs/community-launch.md) for live data, editorial approvals and optional browser checks.

## Content and translations

English at `/` is the source catalog. Locale pages such as `/de/architecture/` are rendered at build time; links preserve the current page. Add a matching `src/i18n/<locale>.json`, then register the catalog and language name in `src/site.ts`. Keep keys stable. The renderer falls back to English and the catalog lint flags omissions before publishing. For assisted translation, pass only public source strings and keys to an optional external API or offline assistant, review terminology and meaning with a speaker, then submit the resulting JSON in a normal PR. No provider code or credentials belong in the build.

The [application roadmap](https://github.com/erp4us-org/erp4us/blob/main/ROADMAP.md) and merged ADRs are authoritative. The website summarizes them, not open proposals. When stable machine-readable requirements exist in the application repository, import a pinned Git revision in a reviewed update, validate IDs/status/source links, then render localized summaries keyed by those IDs. Keep the last reviewed revision when an update fails. Do not maintain a second requirements database.

## Publishing

Pull requests validate offline with fixtures; only a validated main build with a successful public GitHub refresh uploads and deploys to GitHub Pages. Preview: https://erp4us-org.github.io/. [Custom domain runbook](docs/domain.md). [Brand assets](public/brand/README.md).

## Dependencies

Follow the [monthly review and critical-fix process](https://github.com/erp4us-org/.github/blob/main/docs/dependency-maintenance.md). Group Astro, checker and compatible TypeScript versions in a reviewed maintenance PR; keep `package-lock.json` and `.nvmrc`. Run `npm ci`, `npm audit --audit-level=high` (including build dependencies), and the full validation sequence above. Review new packages, licenses, Node engine and deployment compatibility before a manual merge.
