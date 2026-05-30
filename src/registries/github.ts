import type { CheckResult, RegistryAdapter, RunOptions } from "../types.js";
import { ENV, REGISTRY_URLS, GITHUB_HEADERS } from "../config/defaults.js";

export const githubAdapter: RegistryAdapter = {
  name: "github",
  async check(name: string, options: RunOptions): Promise<CheckResult[]> {
    const headers: Record<string, string> = { Accept: GITHUB_HEADERS.accept };
    if (ENV.github.token) headers["Authorization"] = `Bearer ${ENV.github.token}`;

    try {
      const [userResult, orgResult] = await Promise.allSettled([
        fetch(`${REGISTRY_URLS.github}/${encodeURIComponent(name)}`, {
          headers,
          signal: AbortSignal.timeout(options.timeout),
        }),
        fetch(`${REGISTRY_URLS.githubOrgs}/${encodeURIComponent(name)}`, {
          headers,
          signal: AbortSignal.timeout(options.timeout),
        }),
      ]);

      const userStatus = userResult.status === "fulfilled" ? userResult.value.status : null;
      const orgStatus  = orgResult.status  === "fulfilled" ? orgResult.value.status  : null;

      if (userStatus === 200 || orgStatus === 200) {
        return [{ registry: "github", status: "taken" }];
      }

      if (userStatus === 404 && orgStatus === 404) {
        return [{ registry: "github", status: "available" }];
      }

      if (userStatus === null && orgStatus === null) {
        const detail = userResult.status === "rejected" && userResult.reason instanceof Error
          ? userResult.reason.message
          : "request failed";
        return [{ registry: "github", status: "error", detail }];
      }

      const detail = [
        userStatus !== null && userStatus !== 200 && userStatus !== 404
          ? `user: HTTP ${userStatus}` : null,
        orgStatus !== null && orgStatus !== 200 && orgStatus !== 404
          ? `org: HTTP ${orgStatus}` : null,
        userStatus === null && userResult.status === "rejected"
          ? `user: ${userResult.reason instanceof Error ? userResult.reason.message : "failed"}` : null,
        orgStatus === null && orgResult.status === "rejected"
          ? `org: ${orgResult.reason instanceof Error ? orgResult.reason.message : "failed"}` : null,
      ].filter(Boolean).join(", ");

      return [{ registry: "github", status: "unknown", detail }];
    } catch (err) {
      return [{ registry: "github", status: "error", detail: err instanceof Error ? err.message : String(err) }];
    }
  },
};
