import { config } from "dotenv";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });
import { execFile } from "node:child_process";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";

const app = new Hono();
const PORT = Number(process.env.PORT || 3000);
const NSCOUT_BIN = (process.env.NSCOUT_BIN || "nscout").split(" ");
const [bin, ...binArgs] = NSCOUT_BIN;

function runNscout(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(bin, [...binArgs, ...args], { env: { ...process.env } }, (err, stdout, stderr) => {
      if (err) reject(new Error(stderr || err.message));
      else resolve(stdout);
    });
  });
}

app.post("/api/check", async (c) => {
  const { names, registries, domains } = await c.req.json<{
    names: string[];
    registries: string[];
    domains: string[];
  }>();

  const args = [
    ...names,
    "--json",
    "--no-color",
    "-r", registries.join(","),
    "-d", domains.join(","),
  ];

  try {
    const stdout = await runNscout(args);
    return c.json(JSON.parse(stdout));
  } catch (err) {
    return c.json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

app.use("/*", serveStatic({ root: "./dist/app" }));

serve({ fetch: app.fetch, port: PORT }, () => {
  process.stdout.write(`nscout-ui running at http://localhost:${PORT}\n`);
});
