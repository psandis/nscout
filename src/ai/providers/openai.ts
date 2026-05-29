import type { ProviderAdapter } from "../types.js";
import { ENV } from "../../config/defaults.js";

export const openaiAdapter: ProviderAdapter = {
  name: "openai",
  isAvailable: () => Boolean(ENV.openai.apiKey),
  async complete(prompt, limit) {
    const { default: OpenAI } = await import("openai");
    const client = new OpenAI({ apiKey: ENV.openai.apiKey });
    const res = await client.responses.create({
      model: ENV.openai.model,
      input: prompt,
    });
    return parseNames(res.output_text, limit);
  },
};

function parseNames(text: string, limit: number): string[] {
  return text
    .split("\n")
    .map(l => l.trim().replace(/^[\d.\-*]+\s*/, ""))
    .filter(Boolean)
    .slice(0, limit);
}
