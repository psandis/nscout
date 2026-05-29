import type { NameResult, CheckResult } from "../types.js";
import { checkNpm } from "./npm.js";
import { checkGithub } from "./github.js";
import { checkPypi } from "./pypi.js";
import { checkRdap } from "./rdap.js";

export interface RunOptions {
  registries: string[];
  domains: string[];
  concurrency: number;
  timeout: number;
}

async function checkName(name: string, options: RunOptions): Promise<NameResult> {
  const { registries, domains, timeout } = options;
  const tasks: Array<() => Promise<CheckResult>> = [];

  if (registries.includes("npm"))     tasks.push(() => checkNpm(name, timeout));
  if (registries.includes("github"))  tasks.push(() => checkGithub(name, timeout));
  if (registries.includes("pypi"))    tasks.push(() => checkPypi(name, timeout));
  if (registries.includes("domains")) {
    for (const tld of domains) tasks.push(() => checkRdap(name, tld, timeout));
  }

  return { name, checks: await Promise.all(tasks.map(t => t())) };
}

export async function run(names: string[], options: RunOptions): Promise<NameResult[]> {
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
