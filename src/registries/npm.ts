import type { CheckResult } from "../types.js";

export async function checkNpm(name: string, timeout: number): Promise<CheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(name)}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.status === 200) return { registry: "npm", status: "taken" };
    if (res.status === 404) return { registry: "npm", status: "available" };
    return { registry: "npm", status: "unknown", detail: `HTTP ${res.status}` };
  } catch (err) {
    clearTimeout(timer);
    return { registry: "npm", status: "error", detail: err instanceof Error ? err.message : String(err) };
  }
}
