Use lowercase erp4us. Publish only capability claims supported by the application default branch. Edit stable translation keys rather than embedding copy in components. Keep PR checks credential-free and deployment main-only. Run the README validation sequence; record results and outstanding work in the PR. No production DNS changes or new external services without approval.

## Product philosophy

- When explaining a workflow, start with what the person needs to do. Show the answer, the evidence they can inspect, and a next step they’re allowed to take. Use tables for detail, comparison and bulk work, not as the default starting point.
- Describe the global workspace input as one place to find records, ask questions, and start permitted workflows. Show the interpreted scope and how to reach the same answer by direct navigation. Both routes should work with a keyboard and screen reader, without AI, chat or voice. Keep read-only answers separate from changes that require permission and explicit human confirmation.
- Use evidence visuals for relationships, quantities and decisions. Provide equivalent text and labels that work without color; hide decorative icons from assistive technology. Make uncertainty visible.
- Label fictional examples and prototypes where they appear. Review both locales so neither presents a design intention as a live capability or a release promise.

## Dependency changes

Follow the [monthly maintenance policy](https://github.com/erp4us-org/.github/blob/main/docs/dependency-maintenance.md). Keep alerts and grouped security updates enabled, scheduled version PRs and auto-merge disabled. Preserve lockfiles and pins; review advisories, licenses, migration and rollback, and require passing gates before manual merge. Expedite critical fixes.
