// Contrôle sans navigateur, lancé par scripts/check.sh : chaque capture du guide est
// rejouable. Échoue si une image citée par une page n'a pas d'entrée dans captures.json,
// si une entrée n'est citée par aucune page, ou si un fichier du dossier n'est ni l'un ni l'autre.
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CAPTURES = path.join(SITE, "public/captures");
const SKIPPED = new Set(["node_modules", "public", ".vitepress", "scripts"]);

function markdownFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) return SKIPPED.has(name) ? [] : markdownFiles(full);
    return name.endsWith(".md") ? [full] : [];
  });
}

const cited = new Set();
for (const file of markdownFiles(SITE)) {
  for (const match of readFileSync(file, "utf8").matchAll(/\/captures\/([a-z0-9-]+)\.webp/g)) cited.add(match[1]);
}
const ids = JSON.parse(readFileSync(path.join(SITE, "scripts/captures.json"), "utf8")).captures.map((e) => e.id);
const defined = new Set(ids);
const files = existsSync(CAPTURES)
  ? readdirSync(CAPTURES).filter((n) => n.endsWith(".webp")).map((n) => n.slice(0, -5))
  : [];

const errors = [
  ...ids.filter((id, i) => ids.indexOf(id) !== i).map((id) => `entrée en double : ${id}`),
  ...[...cited].filter((id) => !defined.has(id)).map((id) => `citée sans entrée dans captures.json : ${id}`),
  ...[...defined].filter((id) => !cited.has(id)).map((id) => `entrée citée par aucune page : ${id}`),
  ...[...defined].filter((id) => !files.includes(id)).map((id) => `fichier absent (lancer npm run docs:screenshots) : ${id}`),
  ...files.filter((id) => !defined.has(id)).map((id) => `fichier orphelin : ${id}.webp`),
];
for (const error of errors) console.error(`captures : ${error}`);
if (errors.length) process.exit(1);
console.log(`captures : ${ids.length} entrées, toutes citées et présentes`);
