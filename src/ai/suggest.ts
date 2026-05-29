import type { Style } from "../types.js";
import { ENV } from "../config/defaults.js";
import { register, resolve } from "./registry.js";
import { openaiAdapter } from "./providers/openai.js";
import { anthropicAdapter } from "./providers/anthropic.js";
import { stubAdapter } from "./providers/stub.js";

register(openaiAdapter);
register(anthropicAdapter);
register(stubAdapter);

const STYLE_INSTRUCTIONS: Record<Style, string> = {
  claw:        "All names must end with the suffix 'claw'.",
  short:       "Names must be one or two syllables, easy to type and remember.",
  portmanteau: "Names must blend two relevant words into one coined word.",
  free:        "No style constraint. Prioritize originality and clarity.",
};

function buildPrompt(description: string, style: Style, limit: number): string {
  return [
    `Generate ${limit} unique, available-sounding project name candidates for: "${description}".`,
    STYLE_INSTRUCTIONS[style],
    "Return only the names, one per line, no numbering, no explanations.",
  ].join("\n");
}

export async function suggest(description: string, style: Style, limit: number): Promise<string[]> {
  const adapter = resolve(ENV.ai.provider);
  const prompt = buildPrompt(description, style, limit);
  return adapter.complete(prompt, limit);
}
