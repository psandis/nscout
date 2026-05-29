#!/usr/bin/env node
import { Command } from "commander";
import { DEFAULTS } from "../config/defaults.js";
import { run } from "../registries/index.js";
import { suggest } from "../ai/suggest.js";
import { renderTable } from "../render/table.js";
import { renderJson } from "../render/json.js";
import type { Style } from "../types.js";

const program = new Command();

program
  .name("nscout")
  .description("Scout a name across npm, GitHub, PyPI, and domain registries")
  .argument("[names...]", "names to check")
  .option("-r, --registries <list>", "registries to check (comma-separated)", DEFAULTS.registries.join(","))
  .option("-d, --domains <list>",    "TLDs to probe (comma-separated)",        DEFAULTS.domains.join(","))
  .option("-s, --suggest <description>", "AI-generate candidate names from a description")
  .option("--style <style>",         "claw | short | portmanteau | free",       DEFAULTS.style)
  .option("-n, --limit <n>",         "number of AI suggestions to generate",    String(DEFAULTS.limit))
  .option("-c, --concurrency <n>",   "parallel name checks",                    String(DEFAULTS.concurrency))
  .option("-t, --timeout <ms>",      "per-request timeout in ms",               String(DEFAULTS.timeout))
  .option("--json",                  "print JSON instead of a table")
  .option("--no-color",              "disable ANSI colors")
  .option("-v, --verbose",           "print extra detail (errors, expiry dates)")
  .action(async (names: string[], opts) => {
    const registries  = opts.registries.split(",").map((s: string) => s.trim());
    const domains     = opts.domains.split(",").map((s: string) => s.trim());
    const concurrency = Number(opts.concurrency);
    const timeout     = Number(opts.timeout);
    const limit       = Number(opts.limit);
    const style       = opts.style as Style;

    if (opts.suggest) {
      const candidates = await suggest(opts.suggest, style, limit);
      names = [...names, ...candidates];
    }

    if (names.length === 0) {
      program.help();
    }

    const results = await run(names, { registries, domains, concurrency, timeout });

    if (opts.json) {
      console.log(renderJson(results));
    } else {
      console.log(renderTable(results, { verbose: opts.verbose, color: opts.color }));
    }
  });

program.parseAsync();
