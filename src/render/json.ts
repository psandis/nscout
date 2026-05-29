import type { NameResult } from "../types.js";

export function renderJson(results: NameResult[]): string {
  return JSON.stringify(results, null, 2);
}
