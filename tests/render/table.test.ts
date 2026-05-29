import { describe, it, expect } from "vitest";
import { renderTable } from "../../src/render/table.js";
import type { NameResult } from "../../src/types.js";

const result: NameResult = {
  name: "foo",
  checks: [
    { registry: "npm", status: "available" },
    { registry: "github", status: "taken" },
  ],
};

describe("renderTable", () => {
  it("returns empty string for no results", () => {
    expect(renderTable([])).toBe("");
  });

  it("contains name and registry headers", () => {
    const out = renderTable([result], { color: false });
    expect(out).toContain("name");
    expect(out).toContain("npm");
    expect(out).toContain("github");
  });

  it("renders correct symbols without color", () => {
    const out = renderTable([result], { color: false });
    expect(out).toContain("✓");
    expect(out).toContain("✗");
  });

  it("includes legend", () => {
    const out = renderTable([result], { color: false });
    expect(out).toContain("legend:");
  });

  it("shows detail in verbose mode", () => {
    const r: NameResult = {
      name: "bar",
      checks: [{ registry: "npm", status: "error", detail: "timeout" }],
    };
    const out = renderTable([r], { color: false, verbose: true });
    expect(out).toContain("timeout");
  });
});
