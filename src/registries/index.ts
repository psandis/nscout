import type { NameResult, RunOptions, RegistryAdapter } from "../types.js";
import { ADAPTERS } from "./adapters.js";

export type { RunOptions };

async function checkName(name: string, options: RunOptions): Promise<NameResult> {
  const tasks = options.registries
    .map(r => ADAPTERS.get(r))
    .filter((a): a is RegistryAdapter => a !== undefined)
    .map(a => a.check(name, options));

  const results = await Promise.all(tasks);
  return { name, checks: results.flat() };
}

export async function run(names: string[], options: RunOptions): Promise<NameResult[]> {
  for (const r of options.registries) {
    if (!ADAPTERS.has(r)) {
      process.stderr.write(`Warning: Unknown registry "${r}" skipped.\n`);
    }
  }

  const results: NameResult[] = new Array(names.length);
  let cursor = 0;

  async function worker() {
    while (cursor < names.length) {
      const i = cursor++;
      results[i] = await checkName(names[i], options);
    }
  }

  await Promise.all(Array.from({ length: Math.min(options.concurrency, names.length) }, worker));
  return results;
}
