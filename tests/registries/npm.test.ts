import { describe, it, expect, vi, afterEach } from "vitest";
import { checkNpm } from "../../src/registries/npm.js";

afterEach(() => vi.unstubAllGlobals());

describe("checkNpm", () => {
  it("returns taken on 200", async () => {
    vi.stubGlobal("fetch", async () => ({ status: 200 }));
    expect((await checkNpm("foo", 5000)).status).toBe("taken");
  });

  it("returns available on 404", async () => {
    vi.stubGlobal("fetch", async () => ({ status: 404 }));
    expect((await checkNpm("foo", 5000)).status).toBe("available");
  });

  it("returns unknown on unexpected status", async () => {
    vi.stubGlobal("fetch", async () => ({ status: 503 }));
    expect((await checkNpm("foo", 5000)).status).toBe("unknown");
  });

  it("returns error on network failure", async () => {
    vi.stubGlobal("fetch", async () => { throw new Error("network error"); });
    const result = await checkNpm("foo", 5000);
    expect(result.status).toBe("error");
    expect(result.detail).toContain("network error");
  });
});
