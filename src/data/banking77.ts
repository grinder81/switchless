import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const DATA_DIR = fileURLToPath(new URL("../../data/banking77/", import.meta.url));

export interface Example {
  text: string;
  intent: string;
}

/** Minimal RFC 4180 CSV parser (quoted fields, escaped quotes, embedded newlines). */
export function parseCsv(src: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export function loadSplit(split: "train" | "test", dir = DATA_DIR): Example[] {
  const path = `${dir}${split}.csv`;
  if (!existsSync(path)) throw new Error(`${path} not found; run \`pnpm data:download\``);
  const [, ...rows] = parseCsv(readFileSync(path, "utf8"));
  return rows.map(([text = "", intent = ""]) => ({ text, intent }));
}
