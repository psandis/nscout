# nscout

[![npm](https://img.shields.io/npm/v/nscout)](https://www.npmjs.com/package/nscout)

Scout a name across npm, GitHub, PyPI, and domain registries before you commit to it.
Optional AI suggest mode generates candidates from a description, then runs them all
through the same check pipeline.

## Requirements

- Node 24+
- Optional: OpenAI or Anthropic API key for `--suggest` mode

## Install

Install globally:

```bash
npm install -g nscout
```

Or build from source:

```bash
pnpm install
pnpm build
```

**Before first use, create your `.env` file:**

```bash
cp .env.example .env
```

Edit `.env` to add API keys or change defaults. If no `.env` is found, nscout warns on startup and runs with built-in defaults.

## Quick start

Check names directly:

```bash
nscout myapp mytool myproject
```

Check only specific registries (e.g. a JS package — skip PyPI and domains):

```bash
nscout myapp mytool -r npm,github
```

Check with custom TLDs:

```bash
nscout myapp -d .com,.net,.ai
```

Show error details and expiry dates:

```bash
nscout myapp -v
```

AI-generate candidates from a description:

```bash
nscout --suggest "image to ascii cli" --style claw
```

Combine explicit names with AI-generated candidates in one run:

```bash
nscout myapp --suggest "fast cli tool for images"
```

JSON output for scripting (no ANSI codes):

```bash
nscout myapp mytool --json --no-color
```

Filter to fully available names with jq:

```bash
nscout myapp mytool --json | jq '.[] | select(.checks | all(.status == "available"))'
```

## Usage

```
nscout [names...] [options]

  -r, --registries <list>      npm,github,pypi,domains (default: all)
  -d, --domains <list>         TLDs to probe (default: .com,.dev,.io,.sh)
  -s, --suggest <description>  AI-generate candidate names from a description
      --style <style>          claw | short | portmanteau | free (default: free)
  -n, --limit <n>              number of AI suggestions to generate (default: 10)
  -c, --concurrency <n>        parallel name checks (default: 4)
  -t, --timeout <ms>           per-request timeout in ms (default: 8000)
      --json                   print JSON instead of a table
      --no-color               disable ANSI colors
  -v, --verbose                print extra detail: errors and expiry dates
```

## Output

Each column is one registry. Each cell shows availability:

```
name       npm  github  pypi  domain:.com  domain:.dev  domain:.io  domain:.sh
------------------------------------------------------------------------------
myapp      ✓    ✓       ✓     ✗            ✓            ✓           ✓
mytool     ✗    ✓       ✓     ✓            ✓            ✓           ✓
mylib      ✓    ✗       ✗     ✗            ✓            ✓           ✓

legend: ✓ available   ✗ taken   ⚠ reserved   ⏳ expiring   ? unknown   ! error
```

| Symbol | Meaning |
|--------|---------|
| ✓ | Name or domain is available |
| ✗ | Name or domain is taken |
| ⚠ | Domain is reserved by the registry |
| ⏳ | Domain is expiring within 30 days |
| ? | Could not determine status |
| ! | Request failed or timed out |

Pass `-v` to show error details and expiry dates below the table.

## What it checks

- **npm**: exact package match on the public registry
- **GitHub**: checks both user and organization namespaces at `github.com/{name}` — taken if either exists
- **PyPI**: exact package match
- **Docker Hub**: checks official library namespace at `hub.docker.com/r/library/{name}`
- **Domains via RDAP**: `.com`, `.dev`, `.io`, `.sh` by default

All checks run in parallel per name. Names run with bounded concurrency. RDAP
distinguishes available from taken from reserved from expiring, which most domain
checkers collapse into one binary answer.

## AI suggest mode

Add your API key to `.env`, then generate and check candidates in one command:

```bash
nscout --suggest "rss reader with AI digest" --style claw -n 8
```

Without a key, `--suggest` falls back to a deterministic stub and prints a warning
to stderr. The CLI still runs end-to-end. The provider adapter pattern supports any
LLM: OpenAI, Anthropic, or any future provider registered via the adapter interface.

## Configuration

All configuration is through environment variables in `.env`. Copy `.env.example` to `.env` and edit as needed. All values have built-in defaults so only set what you want to change.

### Registries

| Variable | Default | What it does |
|---|---|---|
| `NSCOUT_REGISTRIES` | `npm,github,pypi,domains,dockerhub` | Registries to check by default |
| `NSCOUT_DOMAINS` | `.com,.dev,.io,.sh` | TLDs to check when domains registry is enabled |

### Performance

| Variable | Default | What it does |
|---|---|---|
| `NSCOUT_CONCURRENCY` | `4` | Number of names checked in parallel |
| `NSCOUT_TIMEOUT` | `8000` | Per-request timeout in milliseconds |

### AI suggest

| Variable | Default | What it does |
|---|---|---|
| `NSCOUT_LIMIT` | `10` | Number of name candidates to generate with `--suggest` |
| `NSCOUT_STYLE` | `free` | Default naming style: `free`, `claw`, `short`, `portmanteau` |
| `NSCOUT_AI_MAX_TOKENS` | `512` | Maximum tokens returned by the AI provider |
| `NSCOUT_AI_PROVIDER` | auto | Force a specific provider: `openai` or `anthropic`. Auto-selects if not set. |
| `OPENAI_API_KEY` | | Enables OpenAI-backed suggestions |
| `OPENAI_MODEL` | `gpt-4.1-mini` | OpenAI model ID |
| `ANTHROPIC_API_KEY` | | Enables Anthropic-backed suggestions |
| `ANTHROPIC_MODEL` | `claude-haiku-4-5-20251001` | Anthropic model ID |

### GitHub

| Variable | Default | What it does |
|---|---|---|
| `GITHUB_TOKEN` | | Raises GitHub API rate limit from 60 to 5000 req/hr |

### RDAP (domain checks)

| Variable | Default | What it does |
|---|---|---|
| `NSCOUT_RDAP_RETRY_COUNT` | `1` | Retry attempts on non-404 RDAP errors |
| `NSCOUT_RDAP_RETRY_DELAY_MS` | `600` | Delay in milliseconds between RDAP retries |
| `NSCOUT_EXPIRING_THRESHOLD_DAYS` | `30` | Domains expiring within this many days show as expiring |

## Architecture

nscout is built as a set of independent modules with no coupling between layers.

```
src/
  registries/     pure registry adapters, no CLI awareness
    adapters.ts   registry map: name -> RegistryAdapter
    index.ts      orchestrator, bounded concurrency
    npm.ts        npm adapter
    github.ts     GitHub adapter, checks users + orgs
    pypi.ts       PyPI adapter
    rdap.ts       RDAP adapter, status-aware (available/taken/reserved/expiring)
  ai/
    suggest.ts    name generation entry point
    registry.ts   provider adapter registry, auto-resolves available provider
    providers/    openai | anthropic | stub | any future adapter
  render/
    table.ts      terminal table with ANSI color
    json.ts       JSON output
  cli/
    index.ts      CLI entry point, Commander wiring
  config/
    defaults.ts   all defaults, URLs, symbols, and env vars in one place
  types.ts        shared interfaces: RegistryAdapter, CheckResult, RunOptions, NameResult
```

Design rules:

- All registry adapters implement `RegistryAdapter` from `types.ts`. Adding a new registry requires only a new file and one line in `adapters.ts`.
- All hardcoded values live in `config/defaults.ts`: URLs, headers, symbols, retry counts, timeouts, AI token limits. Nothing is hardcoded in logic files.
- All timeouts, TLDs, concurrency limits, AI provider, model IDs, and display symbols come from config or environment variables.
- Each module is independently testable and independently usable.
- Unknown registry names passed via `--registries` print a warning to stderr and are skipped.
- When no AI provider is configured, `--suggest` falls back to stub and warns to stderr.

## Notes on the lane

There is a comprehensive incumbent in this space: `bradtraversy/namescout-cli`
plus a website at namescout.dev, shipped May 2026. It checks more surfaces
(Docker Hub, VS Code Marketplace, Homebrew, six TLDs, etc.) and scores names.
`nscout` is intentionally smaller and built around Claw conventions: fast,
focused, and the AI suggest mode is the headline that differentiates it.

## Roadmap

- [x] Docker Hub check.
- [ ] VS Code Marketplace check.


## OpenClaw

nscout works standalone or as an OpenClaw skill. Once installed globally, your
OpenClaw agent can check name availability on demand:

> "Check if mytool is available on npm and as a .com domain"

The `--json` output makes nscout agent-friendly: structured results that any
agent or script can parse and act on.

To use `--suggest` through your OpenClaw agent's configured LLM instead of a
separate API key, configure `NSCOUT_AI_PROVIDER` in your `.env`.

## License

MIT. See [LICENSE](LICENSE).
