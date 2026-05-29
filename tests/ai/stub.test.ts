import { describe, it, expect } from "vitest";
import { stubAdapter } from "../../src/ai/providers/stub.js";

describe("stub provider", () => {
  it("returns exactly limit names", async () => {
    const names = await stubAdapter.complete("image to ascii cli", 5);
    expect(names).toHaveLength(5);
  });

  it("returns strings", async () => {
    const names = await stubAdapter.complete("test prompt", 3);
    for (const n of names) expect(typeof n).toBe("string");
  });

  it("is always available", () => {
    expect(stubAdapter.isAvailable()).toBe(true);
  });
});
