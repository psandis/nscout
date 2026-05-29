import "dotenv/config";

export const DEFAULTS = {
  registries: ["npm", "github", "pypi", "domains"],
  domains: [".com", ".dev", ".io", ".sh"],
  concurrency: 4,
  timeout: 8_000,
  limit: 10,
  style: "free",
  expiringThresholdDays: 30,
  rdapRetryDelayMs: 600,
};

export const ENV = {
  ai: {
    provider: process.env.NSCOUT_AI_PROVIDER || null,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: process.env.ANTHROPIC_MODEL || "claude-haiku-4-5-20251001",
  },
  github: {
    token: process.env.GITHUB_TOKEN || "",
  },
  server: {
    port: Number(process.env.PORT || "3000"),
    host: process.env.HOST || "localhost",
  },
};
