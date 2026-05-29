import type { CheckResult, CheckStatus } from "../types.js";
import { DEFAULTS } from "../config/defaults.js";

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

export async function checkRdap(name: string, tld: string, timeout: number, retries = 1): Promise<CheckResult> {
  const registry = `domain:${tld}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`https://rdap.org/domain/${name}${tld}`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
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
    clearTimeout(timer);
    return { registry, status: "error", detail: err instanceof Error ? err.message : String(err) };
  }
}
