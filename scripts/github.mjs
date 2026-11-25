import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const org = "erp4us-org";
const api = "https://api.github.com";
export const snapshotFile = new URL("../.cache/github.json", import.meta.url);
export const areas = {
  engineering: [
    "frontend",
    "backend",
    "testing",
    "area:testing",
    "rust",
    "area:api",
  ],
  architecture: ["architecture", "area:events"],
  domain: ["domain expertise needed", "domain-expertise"],
  design: ["accessibility", "design", "frontend"],
  infrastructure: [
    "infrastructure",
    "area:infrastructure",
    "security",
    "docker",
    "github_actions",
  ],
  automation: ["area:mcp", "domain:ai", "automation"],
  docs: ["documentation", "translation", "localization", "domain:loc"],
};
const day = 86400000;
const requireValue = (condition, label) => {
  if (!condition) throw new Error(`Invalid GitHub data: ${label}`);
};
const array = (value) => {
  requireValue(Array.isArray(value), "expected array");
  return value;
};
const text = (value) => {
  requireValue(typeof value === "string", "expected string");
  return value;
};
const timestamp = (value) => {
  requireValue(
    typeof value === "string" && Number.isFinite(Date.parse(value)),
    "timestamp",
  );
  return new Date(value).toISOString();
};
const githubUrl = (value) => {
  const url = new URL(text(value));
  requireValue(
    url.origin === "https://github.com" &&
      !url.username &&
      !url.password &&
      (url.pathname.startsWith(`/${org}/`) ||
        url.pathname.startsWith(`/orgs/${org}/`)),
    "public organization URL",
  );
  return url.href;
};
function summary(body) {
  return text(body ?? "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^\s*#+\s*/gm, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(.{240})[\s\S]+$/u, "$1…");
}

function request(token) {
  return async (url, body) => {
    const response = await fetch(url, {
      method: body ? "POST" : "GET",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body && JSON.stringify(body),
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) {
      throw new Error(
        `GitHub ${new URL(url).pathname}: HTTP ${response.status}, remaining ${response.headers.get("x-ratelimit-remaining") ?? "unknown"}`,
      );
    }
    return { data: await response.json(), link: response.headers.get("link") };
  };
}

export async function restPages(send, path) {
  let url = new URL(path, api);
  url.searchParams.set("per_page", "100");
  const visited = new Set();
  const rows = [];
  while (url) {
    requireValue(
      url.origin === api && !visited.has(url.href),
      "REST pagination URL",
    );
    visited.add(url.href);
    const { data, link } = await send(url.href);
    rows.push(...array(data));
    const next = link?.match(/<([^>]+)>;\s*rel="next"/)?.[1];
    url = next ? new URL(next) : null;
  }
  return rows;
}

async function discussions(send, repo) {
  const nodes = [];
  const seen = new Set();
  let cursor = null;
  do {
    const { data: result } = await send(`${api}/graphql`, {
      query: `query($owner:String!, $repo:String!, $cursor:String) {
        repository(owner:$owner,name:$repo) {
          discussions(first:100,after:$cursor,orderBy:{field:UPDATED_AT,direction:DESC}) {
            nodes { title url bodyText closed isAnswered locked category { name } updatedAt }
            pageInfo { hasNextPage endCursor }
          }
        }
      }`,
      variables: { owner: org, repo, cursor },
    });
    if (result.errors?.length)
      throw new Error(
        `GitHub Discussions for ${repo}: ${result.errors.map(({ message }) => message).join("; ")}`,
      );
    const connection = result.data?.repository?.discussions;
    requireValue(
      connection && typeof connection.pageInfo?.hasNextPage === "boolean",
      "Discussions page",
    );
    nodes.push(...array(connection.nodes));
    cursor = connection.pageInfo.hasNextPage
      ? text(connection.pageInfo.endCursor)
      : null;
    if (cursor !== null) {
      requireValue(cursor && !seen.has(cursor), "Discussions cursor");
      seen.add(cursor);
    }
  } while (cursor);
  return nodes;
}

const blocked = [
  "status:blocked",
  "status:proposed",
  "status:in-progress",
  "duplicate",
  "invalid",
  "wontfix",
  "dependencies",
  "type:epic",
  "type:rfc",
];
const signals = [
  "good first issue",
  "help wanted",
  "status:ready",
  "domain expertise needed",
  "domain-expertise",
];
export function opportunity(issue, repo) {
  const labels = array(issue.labels).map((label) => text(label.name));
  const keys = labels.map((label) => label.toLowerCase());
  if (
    issue.state !== "open" ||
    issue.pull_request ||
    issue.locked !== false ||
    array(issue.assignees).length ||
    keys.some((key) => blocked.includes(key)) ||
    !keys.some((key) => signals.includes(key))
  )
    return null;
  return {
    title: text(issue.title),
    url: githubUrl(issue.html_url),
    repo,
    summary: summary(issue.body),
    labels,
    areas: Object.keys(areas).filter((area) =>
      areas[area].some((label) => keys.includes(label)),
    ),
    level: keys.includes("good first issue") ? "first" : null,
    status: keys.includes("status:needs-analysis") ? "analysis" : "unassigned",
  };
}

export async function collect(send, now = new Date()) {
  const since = new Date(now.getTime() - 30 * day).toISOString();
  const repositories = await restPages(send, `/orgs/${org}/repos?type=public`);
  requireValue(
    repositories.some(
      (repo) =>
        repo.name === "erp4us" &&
        repo.private === false &&
        !repo.archived &&
        !repo.fork,
    ),
    "application repository missing",
  );
  const publicRepos = repositories.filter((repo) => repo.private === false);
  const metrics = {
    repositories: publicRepos.length,
    contributors: 0,
    commits: 0,
    issues: 0,
    pulls: 0,
    merged: 0,
    milestones: 0,
    opportunities: 0,
  };
  const people = new Set(),
    commits = new Set();
  const opportunities = [],
    questions = [],
    milestones = [],
    activity = [];
  const event = (kind, repo, title, url, date) =>
    activity.push({
      kind,
      repo,
      title: text(title),
      url: githubUrl(url),
      date: timestamp(date),
    });
  for (const project of publicRepos.filter(
    (repo) => !repo.archived && !repo.fork && !repo.disabled,
  )) {
    const repo = text(project.name);
    requireValue(/^[A-Za-z0-9_.-]+$/.test(repo), "repository name");
    const list = (path) => restPages(send, `/repos/${org}/${repo}/${path}`);
    if (project.has_issues) {
      const open = await list("issues?state=open");
      for (const issue of open.filter((item) => !item.pull_request)) {
        metrics.issues++;
        const entry = opportunity(issue, repo);
        if (entry) opportunities.push(entry);
        const labels = array(issue.labels).map((label) =>
          text(label.name).toLowerCase(),
        );
        if (
          !issue.locked &&
          !labels.includes("status:blocked") &&
          labels.some((label) => ["type:rfc", "type:research"].includes(label))
        ) {
          questions.push({
            repo,
            title: text(issue.title),
            url: githubUrl(issue.html_url),
            summary: summary(issue.body),
            category: labels.includes("type:rfc") ? "RFC" : "Research",
            issue: true,
            date: timestamp(issue.updated_at),
          });
        }
      }
      for (const issue of await list(
        `issues?state=closed&since=${encodeURIComponent(since)}`,
      )) {
        if (
          !issue.pull_request &&
          issue.state_reason === "completed" &&
          issue.closed_at >= since
        )
          event("issue", repo, issue.title, issue.html_url, issue.closed_at);
      }
      for (const milestone of await list("milestones?state=all")) {
        requireValue(
          ["open", "closed"].includes(milestone.state),
          "milestone state",
        );
        milestones.push({
          repo,
          title: text(milestone.title),
          url: githubUrl(milestone.html_url),
          summary: summary(milestone.description),
          state: milestone.state,
        });
        if (milestone.state === "closed") {
          metrics.milestones++;
          if (milestone.closed_at >= since)
            event(
              "milestone",
              repo,
              milestone.title,
              milestone.html_url,
              milestone.closed_at,
            );
        }
      }
    }
    metrics.pulls += (await list("pulls?state=open")).length;
    const closed = await list("pulls?state=closed");
    for (const pull of closed) {
      if (pull.merged_at >= since) {
        metrics.merged++;
        event("pull", repo, pull.title, pull.html_url, pull.merged_at);
      }
    }
    // GitHub's commits and contributors endpoints return 409 for empty repositories.
    // size=0 alone is not an emptiness test (a tiny repository may also round to zero).
    const branches = await list("branches");
    if (branches.some((branch) => branch.name === project.default_branch)) {
      for (const commit of await list(
        `commits?sha=${encodeURIComponent(text(project.default_branch))}&since=${encodeURIComponent(since)}`,
      ))
        commits.add(text(commit.sha));
      for (const actor of await list("contributors?anon=false")) {
        if (
          actor.type === "User" &&
          !/(\[bot\]$|^dependabot(?:-preview)?$|^github-actions$)/i.test(
            text(actor.login),
          )
        ) {
          requireValue(Number.isSafeInteger(actor.id), "contributor id");
          people.add(actor.id);
        }
      }
    }
    for (const release of await list("releases")) {
      if (!release.draft && release.published_at >= since)
        event(
          "release",
          repo,
          release.name || release.tag_name,
          release.html_url,
          release.published_at,
        );
    }
    if (project.has_discussions) {
      for (const topic of await discussions(send, repo)) {
        if (
          topic.closed === false &&
          topic.locked === false &&
          (topic.isAnswered === false || topic.isAnswered === null) &&
          topic.category?.name !== "Announcements"
        ) {
          questions.push({
            repo,
            title: text(topic.title),
            url: githubUrl(topic.url),
            summary: summary(topic.bodyText),
            category: text(topic.category?.name),
            issue: false,
            date: timestamp(topic.updatedAt),
          });
        }
      }
    }
  }
  metrics.contributors = people.size;
  metrics.commits = commits.size;
  metrics.opportunities = opportunities.length;
  opportunities.sort(
    (a, b) =>
      Number(Boolean(b.level)) - Number(Boolean(a.level)) ||
      a.url.localeCompare(b.url),
  );
  const recentFirst = (a, b) =>
    b.date.localeCompare(a.date) || a.url.localeCompare(b.url);
  return validateSnapshot({
    version: 1,
    updated: now.toISOString(),
    metrics,
    opportunities,
    questions: questions.sort(recentFirst),
    milestones,
    activity: activity.sort(recentFirst).slice(0, 15),
  });
}

export function validateSnapshot(value) {
  requireValue(value?.version === 1, "snapshot version");
  timestamp(value.updated);
  for (const key of [
    "repositories",
    "contributors",
    "commits",
    "issues",
    "pulls",
    "merged",
    "milestones",
    "opportunities",
  ]) {
    requireValue(
      Number.isSafeInteger(value.metrics?.[key]) && value.metrics[key] >= 0,
      `metric ${key}`,
    );
  }
  for (const kind of ["opportunities", "questions", "milestones", "activity"]) {
    for (const entry of array(value[kind])) {
      text(entry.repo);
      text(entry.title);
      githubUrl(entry.url);
      if (kind !== "activity") text(entry.summary);
      if (kind === "opportunities") {
        array(entry.labels).forEach(text);
        requireValue(
          array(entry.areas).every((area) => Object.hasOwn(areas, area)),
          "opportunity area",
        );
        requireValue(
          entry.level === null || entry.level === "first",
          "opportunity level",
        );
        requireValue(
          ["analysis", "unassigned"].includes(entry.status),
          "opportunity status",
        );
      }
      if (kind === "questions") {
        text(entry.category);
        requireValue(typeof entry.issue === "boolean", "question type");
      }
      if (kind === "milestones")
        requireValue(
          ["open", "closed"].includes(entry.state),
          "milestone state",
        );
      if (kind === "activity")
        requireValue(
          ["issue", "pull", "milestone", "release"].includes(entry.kind),
          "activity kind",
        );
      if (kind === "questions" || kind === "activity") timestamp(entry.date);
    }
  }
  requireValue(
    value.metrics.opportunities === value.opportunities.length,
    "opportunity count",
  );
  return value;
}

export async function readSnapshot(file = snapshotFile) {
  return validateSnapshot(JSON.parse(await readFile(file, "utf8")));
}

export async function readBuildSnapshot() {
  const { GITHUB_SNAPSHOT, REQUIRE_GITHUB_SNAPSHOT } = process.env;
  try {
    return await readSnapshot(resolve(GITHUB_SNAPSHOT ?? ".cache/github.json"));
  } catch (error) {
    if (
      error.code !== "ENOENT" ||
      GITHUB_SNAPSHOT ||
      REQUIRE_GITHUB_SNAPSHOT === "1"
    )
      throw error;
    return null;
  }
}

export async function refresh(send, file = snapshotFile) {
  const snapshot = await collect(send);
  await mkdir(new URL(".", file), { recursive: true });
  const temp = new URL(`${file.href}.tmp`);
  await writeFile(temp, `${JSON.stringify(snapshot, null, 2)}\n`);
  await rename(temp, file);
  return snapshot;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const token = process.env.GITHUB_TOKEN;
  if (!token)
    throw new Error("GITHUB_TOKEN is required to refresh project data");
  const snapshot = await refresh(request(token));
  console.log(`Refreshed public GitHub data at ${snapshot.updated}`);
}
