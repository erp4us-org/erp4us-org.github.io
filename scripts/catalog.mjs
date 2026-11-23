import { readdir, readFile } from "node:fs/promises";
const dir = new URL("../src/i18n/", import.meta.url);
const load = async (f) => JSON.parse(await readFile(new URL(f, dir), "utf8"));
const keys = Object.keys(await load("en.json"));
for (const f of await readdir(dir)) {
  const d = await load(f);
  for (const k of keys)
    if (typeof d[k] !== "string" || !d[k].trim())
      throw Error(`${f}: missing ${k}`);
  for (const k of Object.keys(d))
    if (!keys.includes(k)) throw Error(`${f}: unknown ${k}`);
}
