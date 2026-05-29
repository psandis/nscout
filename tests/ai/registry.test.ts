import { describe, it, expect, beforeEach } from "vitest";
import { register, resolve } from "../../src/ai/registry.js";
import type { ProviderAdapter } from "../../src/ai/types.js";

function makeAdapter(name: string, available: boolean): ProviderAdapter {
  return {
    name,
    isAvailable: () => available,
    complete: async () => [],
  };
}

describe("AI registry", () => {
  beforeEach(() => {
    register(makeAdapter("stub", true));
  });

  it("resolves a named provider", () => {
    register(makeAdapter("testprovider", false));
    const adapter = resolve("testprovider");
    expect(adapter.name).toBe("testprovider");
  });

  it("throws on unknown provider name", () => {
    expect(() => resolve("nonexistent")).toThrow("Unknown AI provider");
  });

  it("auto-detects an available provider", () => {
    register(makeAdapter("unavailable", false));
    register(makeAdapter("myprovider", true));
    const adapter = resolve(null);
    expect(adapter.isAvailable()).toBe(true);
  });

  it("falls back to stub when nothing is available", () => {
    register(makeAdapter("offline", false));
    const adapter = resolve(null);
    expect(adapter.name).toBe("stub");
  });
});
