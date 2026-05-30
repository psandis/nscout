import type { CheckResult, RegistryAdapter, RunOptions } from "../types.js";
import { REGISTRY_URLS } from "../config/defaults.js";

export const dockerHubAdapter: RegistryAdapter = {
  name: "dockerhub",
  async check(name: string, options: RunOptions): Promise<CheckResult[]> {
    try {
      const res = await fetch(`${REGISTRY_URLS.dockerHub}/${encodeURIComponent(name)}`, {
        signal: AbortSignal.timeout(options.timeout),
      });
      if (res.status === 200) return [{ registry: "dockerhub", status: "taken" }];
      if (res.status === 404) return [{ registry: "dockerhub", status: "available" }];
      return [{ registry: "dockerhub", status: "unknown", detail: `HTTP ${res.status}` }];
    } catch (err) {
      return [{ registry: "dockerhub", status: "error", detail: err instanceof Error ? err.message : String(err) }];
    }
  },
};
