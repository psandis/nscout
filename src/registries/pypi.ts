import type { CheckResult } from "../types.js";

export async function checkPypi(name: string, timeout: number): Promise<CheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.status === 200) return { registry: "pypi", status: "taken" };
    if (res.status === 404) return { registry: "pypi", status: "available" };
    return { registry: "pypi", status: "unknown", detail: `HTTP ${res.status}` };
  } catch (err) {
    clearTimeout(timer);
    return { registry: "pypi", status: "error", detail: err instanceof Error ? err.message : String(err) };
  }
}
