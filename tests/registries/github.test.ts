import { describe, it, expect, vi, afterEach } from "vitest";
import { githubAdapter } from "../../src/registries/github.js";

const opts = { registries: ["github"], domains: [], concurrency: 1, timeout: 5000 };

afterEach(() => vi.unstubAllGlobals());

function mockFetch(userStatus: number | "error", orgStatus: number | "error") {
  vi.stubGlobal("fetch", async (url: unknown) => {
    const isOrg = String(url).includes("/orgs/");
    const status = isOrg ? orgStatus : userStatus;
    if (status === "error") throw new Error("network error");
    return { status };
  });
}

describe("githubAdapter", () => {
  it("returns available when both user and org return 404", async () => {
    mockFetch(404, 404);
    expect((await githubAdapter.check("foo", opts))[0].status).toBe("available");
  });

  it("returns taken when user returns 200", async () => {
    mockFetch(200, 404);
    expect((await githubAdapter.check("foo", opts))[0].status).toBe("taken");
  });

  it("returns taken when org returns 200", async () => {
    mockFetch(404, 200);
    expect((await githubAdapter.check("foo", opts))[0].status).toBe("taken");
  });

  it("returns taken when both return 200", async () => {
    mockFetch(200, 200);
    expect((await githubAdapter.check("foo", opts))[0].status).toBe("taken");
  });

  it("returns taken when user is 200 and org fails", async () => {
    mockFetch(200, "error");
    expect((await githubAdapter.check("foo", opts))[0].status).toBe("taken");
  });

  it("returns taken when org is 200 and user fails", async () => {
    mockFetch("error", 200);
    expect((await githubAdapter.check("foo", opts))[0].status).toBe("taken");
  });

  it("returns error when both requests fail", async () => {
    mockFetch("error", "error");
    expect((await githubAdapter.check("foo", opts))[0].status).toBe("error");
  });

  it("includes error detail when both requests fail", async () => {
    mockFetch("error", "error");
    expect((await githubAdapter.check("foo", opts))[0].detail).toContain("network error");
  });

  it("returns unknown when user is 404 and org fails", async () => {
    mockFetch(404, "error");
    expect((await githubAdapter.check("foo", opts))[0].status).toBe("unknown");
  });

  it("returns unknown when user fails and org is 404", async () => {
    mockFetch("error", 404);
    expect((await githubAdapter.check("foo", opts))[0].status).toBe("unknown");
  });

  it("returns unknown on unexpected HTTP status", async () => {
    mockFetch(403, 404);
    expect((await githubAdapter.check("foo", opts))[0].status).toBe("unknown");
  });

  it("includes HTTP status in detail for unexpected status", async () => {
    mockFetch(403, 404);
    expect((await githubAdapter.check("foo", opts))[0].detail).toContain("HTTP 403");
  });
});
