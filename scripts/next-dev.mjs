#!/usr/bin/env node
import { spawn } from "node:child_process";

function hasPortArg(args) {
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "-p" || arg === "--port") return true;
    if (arg.startsWith("--port=")) return true;
    if (arg.startsWith("-p=")) return true;
  }
  return false;
}

const defaultPortArg = process.argv[2];
const defaultPort = Number(defaultPortArg);
if (!Number.isFinite(defaultPort) || defaultPort <= 0) {
  console.error(`Invalid default port: "${defaultPortArg}". Usage: next-dev.mjs <defaultPort> [nextArgs...]`);
  process.exit(1);
}

const nextArgs = process.argv.slice(3);
const port = process.env.PORT?.trim() ? Number(process.env.PORT) : defaultPort;
const finalArgs = ["dev", ...nextArgs];
if (!hasPortArg(nextArgs)) {
  finalArgs.push("-p", String(port));
}

const child = spawn("next", finalArgs, { stdio: "inherit", shell: true });
child.on("exit", (code) => process.exit(code ?? 0));
child.on("error", (err) => {
  console.error("Failed to start Next.js dev server:", err);
  process.exit(1);
});

