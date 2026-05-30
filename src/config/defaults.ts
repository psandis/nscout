import "dotenv/config";

export const DEFAULTS = {
  registries:            (process.env.NSCOUT_REGISTRIES            || "npm,github,pypi,domains").split(","),
  domains:               (process.env.NSCOUT_DOMAINS               || ".com,.dev,.io,.sh").split(","),
  concurrency:           Number(process.env.NSCOUT_CONCURRENCY            || 4),
  timeout:               Number(process.env.NSCOUT_TIMEOUT                || 8_000),
  limit:                 Number(process.env.NSCOUT_LIMIT                  || 10),
  style:                 process.env.NSCOUT_STYLE                         || "free",
  expiringThresholdDays: Number(process.env.NSCOUT_EXPIRING_THRESHOLD_DAYS || 30),
  rdapRetryDelayMs:      Number(process.env.NSCOUT_RDAP_RETRY_DELAY_MS    || 600),
  rdapRetryCount:        Number(process.env.NSCOUT_RDAP_RETRY_COUNT        || 1),
  aiMaxTokens:           Number(process.env.NSCOUT_AI_MAX_TOKENS           || 512),
};

export const REGISTRY_URLS = {
  npm:        "https://registry.npmjs.org",
  github:     "https://api.github.com/users",
  githubOrgs: "https://api.github.com/orgs",
  pypi:       "https://pypi.org/pypi",
  rdap:       "https://rdap.org/domain",
} as const;

export const GITHUB_HEADERS = {
  accept: "application/vnd.github+json",
} as const;

export const STUB_SUFFIXES = ["kit", "hub", "lab", "cli", "run", "box", "dot", "bit"] as const;

export const TABLE_SYMBOLS: Record<string, string> = {
  available: "✓",
  taken:     "✗",
  reserved:  "⚠",
  expiring:  "⏳",
  unknown:   "?",
  error:     "!",
};

export const TABLE_LEGEND =
  "legend: ✓ available   ✗ taken   ⚠ reserved   ⏳ expiring   ? unknown   ! error";

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
};
