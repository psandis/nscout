import type { ProviderAdapter } from "../types.js";
import { STUB_SUFFIXES } from "../../config/defaults.js";

export const stubAdapter: ProviderAdapter = {
  name: "stub",
  isAvailable: () => true,
  async complete(prompt, limit) {
    const words = prompt.match(/\b[a-z]{3,}\b/gi) ?? ["name"];
    const results: string[] = [];
    for (let i = 0; i < limit; i++) {
      const word = words[i % words.length].toLowerCase();
      const suffix = STUB_SUFFIXES[i % STUB_SUFFIXES.length];
      results.push(`${word}${suffix}`);
    }
    return results;
  },
};
