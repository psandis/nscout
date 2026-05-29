import type { ProviderAdapter } from "../types.js";
import { ENV } from "../../config/defaults.js";

export const anthropicAdapter: ProviderAdapter = {
  name: "anthropic",
  isAvailable: () => Boolean(ENV.anthropic.apiKey),
  async complete(prompt, limit) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: ENV.anthropic.apiKey });
    const res = await client.messages.create({
      model: ENV.anthropic.model,
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }],
    });
    const text = res.content.find(b => b.type === "text")?.text ?? "";
    return parseNames(text, limit);
  },
};

function parseNames(text: string, limit: number): string[] {
  return text
    .split("\n")
    .map(l => l.trim().replace(/^[\d.\-*]+\s*/, ""))
    .filter(Boolean)
    .slice(0, limit);
}
