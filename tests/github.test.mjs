import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import {
  collect,
  opportunity,
  refresh,
  restPages,
  validateSnapshot,
} from "../scripts/github.mjs";

const source = "https://github.com/erp4us-org/erp4us";
const issue = {
  title: "Try the docs",
  body: "<!-- omit me --> Read [the setup](https://example.org) and report friction.",
  html_url: `${source}/issues/1`,
  state: "open",
  locked: false,
  assignees: [],
  labels: [{ name: "good first issue" }, { name: "documentation" }],
};
const repo = {
  name: "erp4us",
  private: false,
  archived: false,
  fork: false,
  has_issues: true,
  has_discussions: true,
  default_branch: "main",
};
const first = {
  title: "A design question",
  url: `${source}/discussions/1`,
  bodyText: "Discuss it.",
  closed: false,
  locked: false,
  isAnswered: null,
  category: { name: "Architecture" },
  updatedAt: "2026-01-01T12:00:00Z",
};
const now = new Date("2026-01-02T00:00:00Z");
const mock = async (url, payload) => {
  const path = new URL(url).pathname;
  const key = path.split("/").at(-1);
  if (key === "graphql") {
    const isFirst = !payload.variables.cursor;
    return {
      data: {
        data: {
          repository: {
            discussions: {
              nodes: isFirst ? [first] : [{ ...first, isAnswered: true }],
              pageInfo: { hasNextPage: isFirst, endCursor: "next" },
            },
          },
        },
      },
    };
  }
  const responses = {
    repos: [repo, { ...repo, name: "archived", archived: true }],
    issues:
      new URL(url).searchParams.get("state") === "open"
        ? [issue, { ...issue, pull_request: {} }]
        : [],
    branches: [{ name: "main" }],
    contributors: [
      { type: "User", login: "example-user", id: 2 },
      { type: "User", login: "example-user", id: 2 },
      { type: "Bot", login: "example[bot]", id: 3 },
    ],
    commits: [{ sha: "a" }, { sha: "a" }, { sha: "b" }],
    pulls:
      new URL(url).searchParams.get("state") === "open"
        ? [{}]
        : [
            {
              title: "Merged",
              html_url: `${source}/pull/2`,
              merged_at: "2026-01-01T00:00:00Z",
            },
            { title: "Closed without merge", merged_at: null },
          ],
    milestones: [],
    releases: [],
  };
  assert.ok(Object.hasOwn(responses, key), url);
  return { data: responses[key] };
};

test("REST follows next links and rejects cycles and off-origin destinations", async () => {
  const pages = await restPages(
    async (url) =>
      new URL(url).searchParams.has("page")
        ? { data: [2] }
        : {
            data: [1],
            link: '<https://api.github.com/repos?page=2>; rel="next"',
          },
    "/repos",
  );
  assert.deepEqual(pages, [1, 2]);
  await assert.rejects(
    restPages(
      async (url) => ({ data: [], link: `<${url}>; rel="next"` }),
      "/repos",
    ),
    /pagination/,
  );
  await assert.rejects(
    restPages(
      async () => ({ data: [], link: '<https://example.com/>; rel="next"' }),
      "/repos",
    ),
    /pagination/,
  );
});

test("collects further discussion pages and aggregates correctly without PRs or bots in issue and people metrics", async () => {
  let discussions = 0;
  const snapshot = await collect(async (url, body) => {
    if (body) discussions++;
    return mock(url, body);
  }, now);
  assert.equal(discussions, 2);
  assert.deepEqual(snapshot.metrics, {
    repositories: 2,
    contributors: 1,
    commits: 2,
    issues: 1,
    pulls: 1,
    merged: 1,
    milestones: 0,
    opportunities: 1,
  });
  assert.equal(snapshot.questions.length, 1);
  assert.deepEqual(
    snapshot.activity.map(({ kind }) => kind),
    ["pull"],
  );
  assert.deepEqual(snapshot.milestones, []);
});

test("opportunities reject assigned, locked and blocked issues and validate links", () => {
  assert.equal(
    opportunity(issue, "erp4us").summary,
    "Read the setup and report friction.",
  );
  assert.deepEqual(opportunity(issue, "erp4us").areas, ["docs"]);
  assert.equal(opportunity({ ...issue, locked: true }, "erp4us"), null);
  assert.equal(opportunity({ ...issue, assignees: [{}] }, "erp4us"), null);
  assert.equal(
    opportunity(
      { ...issue, labels: [...issue.labels, { name: "status:blocked" }] },
      "erp4us",
    ),
    null,
  );
  assert.throws(
    () => opportunity({ ...issue, html_url: "javascript:void(0)" }, "erp4us"),
    /organization URL/,
  );
});

test("empty activity is valid; a failed refresh cannot replace the last good snapshot", async () => {
  const dir = await mkdtemp(join(tmpdir(), "erp4us-test-"));
  try {
    const file = pathToFileURL(join(dir, "github.json"));
    const empty = await collect(
      async (url) => ({
        data: url.includes("/orgs/")
          ? [{ ...repo, has_discussions: false }]
          : [],
      }),
      now,
    );
    assert.equal(empty.metrics.opportunities, 0);
    assert.deepEqual(empty.activity, []);
    assert.throws(
      () => validateSnapshot({ ...empty, updated: "" }),
      /timestamp/,
    );
    const serialized = JSON.stringify(empty);
    await writeFile(file, serialized);
    await assert.rejects(
      refresh(async (url, body) => {
        if (body) return { data: { errors: [{ message: "rate limited" }] } };
        return mock(url, body);
      }, file),
      /rate limited/,
    );
    assert.equal(await readFile(file, "utf8"), serialized);
  } finally {
    await rm(dir, { force: true, recursive: true });
  }
});
