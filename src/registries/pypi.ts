import type { CheckResult, RegistryAdapter, RunOptions } from "../types.js";
import { REGISTRY_URLS } from "../config/defaults.js";

export const pypiAdapter: RegistryAdapter = {
  name: "pypi",
  async check(name: string, options: RunOptions): Promise<CheckResult[]> {
    try {
      const res = await fetch(`${REGISTRY_URLS.pypi}/${encodeURIComponent(name)}/json`, {
        signal: AbortSignal.timeout(options.timeout),
      });
      if (res.status === 200) return [{ registry: "pypi", status: "taken" }];
      if (res.status === 404) return [{ registry: "pypi", status: "available" }];
      return [{ registry: "pypi", status: "unknown", detail: `HTTP ${res.status}` }];
    } catch (err) {
      return [{ registry: "pypi", status: "error", detail: err instanceof Error ? err.message : String(err) }];
    }
  },
};
