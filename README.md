# nscout

[![npm](https://img.shields.io/npm/v/nscout)](https://www.npmjs.com/package/nscout)

Scout a name across npm, GitHub, PyPI, and domain registries before you commit to it.
Optional AI suggest mode generates candidates from a description, then runs them all
through the same check pipeline.

## Requirements

- Node 22+
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

Works with npm or yarn as well.

## Quick start

Check names directly:

```bash
nscout myapp mytool myproject
```

AI-generate candidates from a description:

```bash
nscout --suggest "image to ascii cli" --style claw
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
nscout     ✓    ✗       ✗     ✗            ✓            ✓           ✓
myapp      ✓    ✓       ✓     ✗            ✓            ✓           ✓
mytool     ✗    ✓       ✓     ✓            ✓            ✓           ✓

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
- **GitHub**: global user and org namespace at `github.com/{name}`
- **PyPI**: exact package match
- **Domains via RDAP**: `.com`, `.dev`, `.io`, `.sh` by default

All checks run in parallel per name. Names run with bounded concurrency. RDAP
distinguishes available from taken from reserved from expiring, which most domain
checkers collapse into one binary answer.

## AI suggest mode

Configure your provider in `.env`:

```bash
cp .env.example .env
# add OPENAI_API_KEY or ANTHROPIC_API_KEY
```

Then generate and check candidates in one command:

```bash
nscout --suggest "rss reader with AI digest" --style claw -n 8
```

Without a key, `--suggest` falls back to a deterministic stub so the CLI still
runs end-to-end. The provider adapter pattern supports any LLM: OpenAI, Anthropic,
or any future provider registered via the adapter interface.

## Configuration

All configuration is through environment variables. Copy `.env.example` to `.env`.

| Variable | Default | What it does |
|---|---|---|
| `NSCOUT_AI_PROVIDER` | auto | Force a specific provider: `openai`, `anthropic`, or any registered adapter |
| `OPENAI_API_KEY` | | Enables OpenAI-backed suggestions |
| `OPENAI_MODEL` | `gpt-4.1-mini` | OpenAI model ID |
| `ANTHROPIC_API_KEY` | | Enables Anthropic-backed suggestions |
| `ANTHROPIC_MODEL` | `claude-haiku-4-5-20251001` | Anthropic model ID |
| `GITHUB_TOKEN` | | Raises GitHub rate limit from 60 to 5000 req/hr |
| `PORT` | `3000` | Server port (roadmap) |
| `HOST` | `localhost` | Server host (roadmap) |

## Architecture

nscout is built as a set of independent modules with no coupling between layers.
Any consumer, CLI, server, or API, calls the same core functions directly.

```
src/
  registries/     pure check functions, no CLI or server awareness
    index.ts      orchestrator, bounded concurrency
    npm.ts        npm registry check
    github.ts     GitHub namespace check
    pypi.ts       PyPI registry check
    rdap.ts       RDAP domain check, status-aware
  ai/
    suggest.ts    name generation entry point
    registry.ts   provider adapter registry
    providers/    openai | anthropic | stub | any future adapter
  render/
    table.ts      terminal table with ANSI color
    json.ts       JSON output
  cli/
    index.ts      CLI entry point, Commander wiring
  server/         (roadmap) HTTP server, same core functions
  api/            (roadmap) REST API layer
  config/
    defaults.ts   all defaults in one place, no hardcoded values in logic
```

Design rules:

- Registry checkers have no knowledge of the CLI or server layer.
- CLI has no knowledge of the server layer.
- All timeouts, TLDs, concurrency limits, AI provider, and model IDs come from config or environment variables.
- Each module is independently testable and independently usable.
- Adding a server or API consumer does not require changes to core logic.

## Notes on the lane

There is a comprehensive incumbent in this space: `bradtraversy/namescout-cli`
plus a website at namescout.dev, shipped May 2026. It checks more surfaces
(Docker Hub, VS Code Marketplace, Homebrew, six TLDs, etc.) and scores names.
`nscout` is intentionally smaller and built around Claw conventions: fast,
focused, and the AI suggest mode is the headline that differentiates it.

## Roadmap

- [ ] Optional: route `src/ai/suggest.ts` through **psclawmcp** instead of direct provider calls.
- [ ] Docker Hub check (`hub.docker.com/v2/repositories/library/{name}`).
- [ ] VS Code Marketplace check.
- [ ] Homebrew tap availability.
- [ ] Premium-domain detection (would need a paid API like Domainr).
- [ ] Watch mode: poll an expiring domain until it frees up.

## OpenClaw

nscout works standalone or as an OpenClaw skill. Once installed globally, your
OpenClaw agent can check name availability on demand:

> "Check if mytool is available on npm and as a .com domain"

The `--json` output makes nscout agent-friendly: structured results that any
agent or script can parse and act on.

To use `--suggest` through your OpenClaw agent's configured LLM instead of a
separate API key, see the `psclawmcp` roadmap item above.

## License

MIT. See [LICENSE](LICENSE).
