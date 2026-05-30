import type { CheckResult, CheckStatus, RegistryAdapter, RunOptions } from "../types.js";
import { DEFAULTS, REGISTRY_URLS } from "../config/defaults.js";

interface RdapEvent { eventAction: string; eventDate: string; }
interface RdapResponse { status?: string[]; events?: RdapEvent[]; }

function resolveStatus(data: RdapResponse): CheckStatus {
  const statuses = data.status ?? [];
  if (statuses.includes("reserved")) return "reserved";
  if (statuses.some(s => s === "redemption period" || s === "pending delete")) return "expiring";
  const expiry = data.events?.find(e => e.eventAction === "expiration");
  if (expiry) {
    const days = (new Date(expiry.eventDate).getTime() - Date.now()) / 86_400_000;
    if (days <= DEFAULTS.expiringThresholdDays) return "expiring";
  }
  return "taken";
}

async function checkRdap(name: string, tld: string, timeout: number, retries: number): Promise<CheckResult> {
  const registry = `domain:${tld}`;
  try {
    const res = await fetch(`${REGISTRY_URLS.rdap}/${name}${tld}`, {
      signal: AbortSignal.timeout(timeout),
    });
    if (res.status === 404) return { registry, status: "available" };
    if (!res.ok) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, DEFAULTS.rdapRetryDelayMs));
        return checkRdap(name, tld, timeout, retries - 1);
      }
      return { registry, status: "unknown", detail: `HTTP ${res.status}` };
    }
    const data = await res.json() as RdapResponse;
    return { registry, status: resolveStatus(data) };
  } catch (err) {
    return { registry, status: "error", detail: err instanceof Error ? err.message : String(err) };
  }
}

export const rdapAdapter: RegistryAdapter = {
  name: "domains",
  check(name: string, options: RunOptions): Promise<CheckResult[]> {
    return Promise.all(options.domains.map(tld => checkRdap(name, tld, options.timeout, DEFAULTS.rdapRetryCount)));
  },
};
