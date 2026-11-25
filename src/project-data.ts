import { readBuildSnapshot } from "../scripts/github.mjs";
import { repo } from "./site";

type Entry = { repo: string; title: string; url: string; summary: string };
type Snapshot = {
  updated: string;
  metrics: Record<string, number>;
  opportunities: (Entry & {
    labels: string[];
    areas: string[];
    level: "first" | null;
    status: string;
  })[];
  questions: (Entry & { category: string; issue: boolean })[];
  milestones: (Entry & { state: "open" | "closed" })[];
  activity: (Omit<Entry, "summary"> & { kind: string; date: string })[];
};

// Offline builds do not fetch; missing data is distinct from a valid empty snapshot.
export const projectData: Promise<Snapshot | null> = readBuildSnapshot();

export const decisions = [
  "0001-independent-services",
  "0002-at-least-once",
  "0003-semantic-contracts",
].map((id, index) => ({
  index: index + 1,
  url: `${repo}/blob/main/docs/adr/${id}.md`,
}));
