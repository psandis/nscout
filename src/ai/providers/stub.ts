import type { ProviderAdapter } from "../types.js";

export const stubAdapter: ProviderAdapter = {
  name: "stub",
  isAvailable: () => true,
  async complete(prompt, limit) {
    const words = prompt.match(/\b[a-z]{3,}\b/gi) ?? ["name"];
    const suffixes = ["kit", "hub", "lab", "cli", "run", "box", "dot", "bit"];
    const results: string[] = [];
    for (let i = 0; i < limit; i++) {
      const word = words[i % words.length].toLowerCase();
      const suffix = suffixes[i % suffixes.length];
      results.push(`${word}${suffix}`);
    }
    return results;
  },
};
