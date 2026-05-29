import { describe, it, expect, vi, afterEach } from "vitest";
import { run } from "../../src/registries/index.js";

afterEach(() => vi.unstubAllGlobals());

describe("registry orchestrator", () => {
  it("preserves input order with concurrency", async () => {
    vi.stubGlobal("fetch", async () => ({ status: 404 }));
    const names = ["alpha", "beta", "gamma"];
    const results = await run(names, {
      registries: ["npm"],
      domains: [],
      concurrency: 2,
      timeout: 5000,
    });
    expect(results.map(r => r.name)).toEqual(names);
  });

  it("only checks specified registries", async () => {
    vi.stubGlobal("fetch", async () => ({ status: 404 }));
    const results = await run(["foo"], {
      registries: ["npm"],
      domains: [],
      concurrency: 1,
      timeout: 5000,
    });
    expect(results[0].checks).toHaveLength(1);
    expect(results[0].checks[0].registry).toBe("npm");
  });

  it("checks all domains as separate checks", async () => {
    vi.stubGlobal("fetch", async () => ({ status: 404, ok: false, json: async () => ({}) }));
    const results = await run(["foo"], {
      registries: ["domains"],
      domains: [".com", ".dev", ".io"],
      concurrency: 1,
      timeout: 5000,
    });
    expect(results[0].checks).toHaveLength(3);
  });
});
