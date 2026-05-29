import { describe, it, expect } from "vitest";
import { renderJson } from "../../src/render/json.js";
import type { NameResult } from "../../src/types.js";

describe("renderJson", () => {
  it("returns valid JSON array", () => {
    const results: NameResult[] = [
      { name: "foo", checks: [{ registry: "npm", status: "available" }] },
    ];
    const output = JSON.parse(renderJson(results));
    expect(output).toHaveLength(1);
    expect(output[0].name).toBe("foo");
  });

  it("returns empty array for no results", () => {
    expect(JSON.parse(renderJson([]))).toEqual([]);
  });
});
