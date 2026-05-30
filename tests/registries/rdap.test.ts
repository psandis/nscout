import { describe, it, expect, vi, afterEach } from "vitest";
import { rdapAdapter } from "../../src/registries/rdap.js";

afterEach(() => vi.unstubAllGlobals());

function mockFetch(status: number, body?: object) {
  vi.stubGlobal("fetch", async () => ({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body ?? {},
  }));
}

function opts(tld: string) {
  return { registries: ["domains"], domains: [tld], concurrency: 1, timeout: 5000 };
}

describe("rdapAdapter", () => {
  it("returns available on 404", async () => {
    mockFetch(404);
    expect((await rdapAdapter.check("foo", opts(".com")))[0].status).toBe("available");
  });

  it("returns taken for active domain", async () => {
    mockFetch(200, { status: ["active"] });
    expect((await rdapAdapter.check("foo", opts(".com")))[0].status).toBe("taken");
  });

  it("returns reserved for reserved domain", async () => {
    mockFetch(200, { status: ["reserved"] });
    expect((await rdapAdapter.check("foo", opts(".com")))[0].status).toBe("reserved");
  });

  it("returns expiring for redemption period", async () => {
    mockFetch(200, { status: ["redemption period"] });
    expect((await rdapAdapter.check("foo", opts(".com")))[0].status).toBe("expiring");
  });

  it("returns expiring when expiry is within threshold", async () => {
    const soon = new Date(Date.now() + 5 * 86_400_000).toISOString();
    mockFetch(200, {
      status: ["active"],
      events: [{ eventAction: "expiration", eventDate: soon }],
    });
    expect((await rdapAdapter.check("foo", opts(".com")))[0].status).toBe("expiring");
  });

  it("returns taken when expiry is beyond threshold", async () => {
    const far = new Date(Date.now() + 365 * 86_400_000).toISOString();
    mockFetch(200, {
      status: ["active"],
      events: [{ eventAction: "expiration", eventDate: far }],
    });
    expect((await rdapAdapter.check("foo", opts(".com")))[0].status).toBe("taken");
  });

  it("returns error on network failure", async () => {
    vi.stubGlobal("fetch", async () => { throw new Error("timeout"); });
    expect((await rdapAdapter.check("foo", opts(".com")))[0].status).toBe("error");
  });

  it("sets registry to domain:tld", async () => {
    mockFetch(404);
    expect((await rdapAdapter.check("foo", opts(".dev")))[0].registry).toBe("domain:.dev");
  });

  it("returns one result per TLD", async () => {
    mockFetch(404);
    const results = await rdapAdapter.check("foo", { registries: ["domains"], domains: [".com", ".dev", ".io"], concurrency: 1, timeout: 5000 });
    expect(results).toHaveLength(3);
  });
});
