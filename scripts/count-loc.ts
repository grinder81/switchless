/**
 * Logical lines of code per dispatcher: non-blank, non-comment lines in src/routers/<name>.ts and
 * src/routers/<name>/**. Shared code (catalogue, handlers, harness) is not counted.
 *
 *   pnpm loc
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROUTERS_DIR = fileURLToPath(new URL("../src/routers/", import.meta.url));

export function logicalLines(source: string): number {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("//")).length;
}

const files = (path: string): string[] =>
  statSync(path).isDirectory() ? readdirSync(path).flatMap((f) => files(`${path}/${f}`)) : [path];

export function countLoc(router: string): number | undefined {
  const paths = [`${ROUTERS_DIR}${router}.ts`, `${ROUTERS_DIR}${router}`].filter(existsSync);
  if (!paths.length) return undefined;
  return paths.flatMap(files).reduce((sum, f) => sum + logicalLines(readFileSync(f, "utf8")), 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const name of ["rules", "llm", "jev", "hybrid", "oracle", "random"]) {
    console.log(`${name.padEnd(8)} ${countLoc(name) ?? "–"}`);
  }
}
