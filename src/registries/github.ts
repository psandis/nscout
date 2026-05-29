import type { CheckResult } from "../types.js";
import { ENV } from "../config/defaults.js";

export async function checkGithub(name: string, timeout: number): Promise<CheckResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
    if (ENV.github.token) headers["Authorization"] = `Bearer ${ENV.github.token}`;

    const res = await fetch(`https://api.github.com/users/${encodeURIComponent(name)}`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.status === 200) return { registry: "github", status: "taken" };
    if (res.status === 404) return { registry: "github", status: "available" };
    return { registry: "github", status: "unknown", detail: `HTTP ${res.status}` };
  } catch (err) {
    clearTimeout(timer);
    return { registry: "github", status: "error", detail: err instanceof Error ? err.message : String(err) };
  }
}
