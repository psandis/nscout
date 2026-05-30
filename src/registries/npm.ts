import type { CheckResult, RegistryAdapter, RunOptions } from "../types.js";
import { REGISTRY_URLS } from "../config/defaults.js";

export const npmAdapter: RegistryAdapter = {
  name: "npm",
  async check(name: string, options: RunOptions): Promise<CheckResult[]> {
    try {
      const res = await fetch(`${REGISTRY_URLS.npm}/${encodeURIComponent(name)}`, {
        signal: AbortSignal.timeout(options.timeout),
      });
      if (res.status === 200) return [{ registry: "npm", status: "taken" }];
      if (res.status === 404) return [{ registry: "npm", status: "available" }];
      return [{ registry: "npm", status: "unknown", detail: `HTTP ${res.status}` }];
    } catch (err) {
      return [{ registry: "npm", status: "error", detail: err instanceof Error ? err.message : String(err) }];
    }
  },
};
