import type { ProviderAdapter } from "./types.js";

const adapters = new Map<string, ProviderAdapter>();

export function register(adapter: ProviderAdapter): void {
  adapters.set(adapter.name, adapter);
}

export function resolve(providerName: string | null): ProviderAdapter {
  if (providerName) {
    const adapter = adapters.get(providerName);
    if (!adapter) throw new Error(`Unknown AI provider: "${providerName}"`);
    return adapter;
  }
  for (const adapter of adapters.values()) {
    if (adapter.isAvailable()) return adapter;
  }
  return adapters.get("stub")!;
}
