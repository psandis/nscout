import chalk from "chalk";
import type { NameResult, CheckStatus } from "../types.js";

export interface RenderOptions {
  verbose?: boolean;
  color?: boolean;
}

const SYMBOLS: Record<CheckStatus, string> = {
  available: "✓",
  taken:     "✗",
  reserved:  "⚠",
  expiring:  "⏳",
  unknown:   "?",
  error:     "!",
};

function colorize(status: CheckStatus, symbol: string): string {
  switch (status) {
    case "available": return chalk.green(symbol);
    case "taken":     return chalk.red(symbol);
    case "reserved":  return chalk.yellow(symbol);
    case "expiring":  return chalk.yellow(symbol);
    case "unknown":   return chalk.dim(symbol);
    case "error":     return chalk.red.dim(symbol);
  }
}

function visibleLength(str: string): number {
  return str.replace(/\x1b\[[0-9;]*m/g, "").length;
}

function pad(str: string, width: number): string {
  return str + " ".repeat(Math.max(0, width - visibleLength(str)));
}

export function renderTable(results: NameResult[], options: RenderOptions = {}): string {
  if (results.length === 0) return "";

  const useColor = options.color !== false;
  const verbose = options.verbose ?? false;

  const registries = results[0].checks.map(c => c.registry);
  const nameWidth = Math.max("name".length, ...results.map(r => r.name.length));
  const colWidths = registries.map(r => r.length);

  const header = [
    pad("name", nameWidth),
    ...registries.map((r, i) => pad(r, colWidths[i])),
  ].join("  ");

  const divider = "-".repeat(header.length);

  const rows = results.map(result => {
    const cells = result.checks.map((check, i) => {
      const symbol = SYMBOLS[check.status];
      const cell = useColor ? colorize(check.status, symbol) : symbol;
      return pad(cell, colWidths[i]);
    });
    return [pad(result.name, nameWidth), ...cells].join("  ");
  });

  const legend =
    "legend: ✓ available   ✗ taken   ⚠ reserved   ⏳ expiring   ? unknown   ! error";

  const lines = [header, divider, ...rows, "", legend];

  if (verbose) {
    const details: string[] = [];
    for (const result of results) {
      for (const check of result.checks) {
        if (check.detail) {
          details.push(`  ${result.name} ${check.registry}: ${check.detail}`);
        }
      }
    }
    if (details.length > 0) lines.push("", ...details);
  }

  return lines.join("\n");
}
