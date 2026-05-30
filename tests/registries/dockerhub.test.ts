import { describe, it, expect, vi, afterEach } from "vitest";
import { dockerHubAdapter } from "../../src/registries/dockerhub.js";

const opts = { registries: ["dockerhub"], domains: [], concurrency: 1, timeout: 5000 };

afterEach(() => vi.unstubAllGlobals());

describe("dockerHubAdapter", () => {
  it("returns taken on 200", async () => {
    vi.stubGlobal("fetch", async () => ({ status: 200 }));
    expect((await dockerHubAdapter.check("nginx", opts))[0].status).toBe("taken");
  });

  it("returns available on 404", async () => {
    vi.stubGlobal("fetch", async () => ({ status: 404 }));
    expect((await dockerHubAdapter.check("myapp", opts))[0].status).toBe("available");
  });

  it("returns unknown on unexpected status", async () => {
    vi.stubGlobal("fetch", async () => ({ status: 503 }));
    expect((await dockerHubAdapter.check("myapp", opts))[0].status).toBe("unknown");
  });

  it("includes HTTP status in detail for unexpected status", async () => {
    vi.stubGlobal("fetch", async () => ({ status: 503 }));
    expect((await dockerHubAdapter.check("myapp", opts))[0].detail).toContain("HTTP 503");
  });

  it("returns error on network failure", async () => {
    vi.stubGlobal("fetch", async () => { throw new Error("network error"); });
    const result = (await dockerHubAdapter.check("myapp", opts))[0];
    expect(result.status).toBe("error");
    expect(result.detail).toContain("network error");
  });

  it("sets registry to dockerhub", async () => {
    vi.stubGlobal("fetch", async () => ({ status: 404 }));
    expect((await dockerHubAdapter.check("myapp", opts))[0].registry).toBe("dockerhub");
  });
});
