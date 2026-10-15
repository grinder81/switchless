/**
 * Lines of dispatcher code, under one rule used everywhere (README, reports, charts):
 *
 *   a router's lines = logical lines (non-blank, non-comment) in its own files
 *   (src/routers/<name>.ts, src/routers/<name>-*.ts, src/routers/<name>/**)
 *   + the lines of every router it is built from.
 *
 * Shared code (catalogue, handlers, the Router interface, harness) is not counted for any router.
 * This measures this implementation's integration code, not a model's complexity or operating burden.
 *
 *   pnpm loc
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROUTERS_DIR = fileURLToPath(new URL("../src/routers/", import.meta.url));

/** Routers built from other routers (see src/routers/registry.ts). */
export const COMPOSED_OF: Record<string, string[]> = { hybrid: ["rules", "jev"] };

export function logicalLines(source: string): number {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//")).length;
}

const files = (path: string): string[] =>
  statSync(path).isDirectory() ? readdirSync(path).flatMap((f) => files(`${path}/${f}`)) : [path];

/** Lines in the router's own files only. */
export function ownLoc(router: string): number | undefined {
  const own = [
    `${ROUTERS_DIR}${router}.ts`,
    `${ROUTERS_DIR}${router}`,
    ...readdirSync(ROUTERS_DIR)
      .filter((f) => f.startsWith(`${router}-`) && f.endsWith(".ts"))
      .map((f) => `${ROUTERS_DIR}${f}`),
  ].filter(existsSync);
  if (!own.length) return undefined;
  return own.flatMap(files).reduce((sum, f) => sum + logicalLines(readFileSync(f, "utf8")), 0);
}

/** Own lines plus the lines of the routers it is built from. */
export function countLoc(router: string): number | undefined {
  const own = ownLoc(router);
  if (own === undefined) return undefined;
  return (COMPOSED_OF[router] ?? []).reduce((sum, r) => sum + (countLoc(r) ?? 0), own);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const name of ["rules", "llm", "jev", "hybrid", "oracle", "random"]) {
    const parts = COMPOSED_OF[name];
    const detail = parts
      ? `  (${ownLoc(name)} own + ${parts.map((p) => `${p} ${countLoc(p)}`).join(" + ")})`
      : "";
    console.log(`${name.padEnd(8)} ${countLoc(name) ?? "–"}${detail}`);
  }
}
