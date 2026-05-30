import { describe, it, expect, vi, afterEach } from "vitest";
import { npmAdapter } from "../../src/registries/npm.js";

const opts = { registries: ["npm"], domains: [], concurrency: 1, timeout: 5000 };

afterEach(() => vi.unstubAllGlobals());

describe("npmAdapter", () => {
  it("returns taken on 200", async () => {
    vi.stubGlobal("fetch", async () => ({ status: 200 }));
    expect((await npmAdapter.check("foo", opts))[0].status).toBe("taken");
  });

  it("returns available on 404", async () => {
    vi.stubGlobal("fetch", async () => ({ status: 404 }));
    expect((await npmAdapter.check("foo", opts))[0].status).toBe("available");
  });

  it("returns unknown on unexpected status", async () => {
    vi.stubGlobal("fetch", async () => ({ status: 503 }));
    expect((await npmAdapter.check("foo", opts))[0].status).toBe("unknown");
  });

  it("returns error on network failure", async () => {
    vi.stubGlobal("fetch", async () => { throw new Error("network error"); });
    const result = (await npmAdapter.check("foo", opts))[0];
    expect(result.status).toBe("error");
    expect(result.detail).toContain("network error");
  });
});
