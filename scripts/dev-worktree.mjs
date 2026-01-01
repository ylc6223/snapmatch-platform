#!/usr/bin/env node
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import crypto from "node:crypto";

const repoRoot = process.cwd();
const localEnvPath = path.join(repoRoot, ".env.worktree.local");

function parseEnvFile(content) {
  const result = {};
  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

function stringifyEnvFile(env) {
  const keys = Object.keys(env).sort((a, b) => a.localeCompare(b));
  return `${keys.map((k) => `${k}=${env[k]}`).join("\n")}\n`;
}

function probePort(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.unref();
    server.once("error", (err) => {
      const code = err && typeof err === "object" && "code" in err ? err.code : undefined;
      if (code === "EACCES" || code === "EPERM") {
        resolve({ ok: false, supported: false });
        return;
      }
      resolve({ ok: false, supported: true });
    });
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve({ ok: true, supported: true }));
    });
  });
}

async function probePorts(ports) {
  const results = await Promise.all(ports.map((p) => probePort(p)));
  const supported = results.every((r) => r.supported);
  const allFree = results.every((r) => r.ok);
  return { supported, allFree };
}

function pickDeterministicPorts({ baseStart, step, count, groups }) {
  const input = `${repoRoot}`;
  const digest = crypto.createHash("sha256").update(input).digest();
  const bucket = digest.readUInt32BE(0) % groups;
  const base = baseStart + bucket * step;
  return Array.from({ length: count }, (_, idx) => base + idx);
}

async function findFreePortGroupFrom({ baseStart, step, count, groups, startGroup }) {
  for (let i = 0; i < groups; i += 1) {
    const g = (startGroup + i) % groups;
    const ports = Array.from({ length: count }, (_, idx) => baseStart + g * step + idx);
    // eslint-disable-next-line no-await-in-loop
    const { supported, allFree } = await probePorts(ports);
    if (!supported) return null;
    if (allFree) return { ports, group: g };
  }
  return null;
}

function readWorktreeEnvIfExists() {
  if (!fs.existsSync(localEnvPath)) return null;
  const content = fs.readFileSync(localEnvPath, "utf8");
  const env = parseEnvFile(content);
  const webPort = Number(env.PORT_WEB);
  const adminPort = Number(env.PORT_ADMIN);
  const backendPort = Number(env.PORT_BACKEND);
  if (!Number.isFinite(webPort) || !Number.isFinite(adminPort) || !Number.isFinite(backendPort)) return null;
  return { webPort, adminPort, backendPort };
}

function ensureLocalEnvFile(ports) {
  const { webPort, adminPort, backendPort } = ports;
  const adminBasePathRaw = (process.env.NEXT_PUBLIC_ADMIN_BASE_PATH ?? "/admin").trim() || "/admin";
  const adminBasePath = adminBasePathRaw === "/" ? "" : adminBasePathRaw.replace(/\/+$/, "");
  const adminOrigin = `http://localhost:${adminPort}`;
  const adminPublicBaseUrl = adminBasePath ? `${adminOrigin}${adminBasePath}` : adminOrigin;

  const env = {
    PORT_ADMIN: String(adminPort),
    PORT_BACKEND: String(backendPort),
    PORT_WEB: String(webPort),
    NEXT_PUBLIC_ADMIN_BASE_URL: adminPublicBaseUrl,
    NEXT_PUBLIC_ADMIN_BASE_PATH: adminBasePath || "/",
    BACKEND_BASE_URL: `http://localhost:${backendPort}`,
    ADMIN_ORIGIN: adminOrigin,
  };

  const header =
    "# 由 scripts/dev-worktree.mjs 自动生成（仅本地使用，不提交 git）\n" +
    "# 如需自定义端口：删除本文件或直接修改 PORT_WEB/PORT_ADMIN/PORT_BACKEND。\n";

  fs.writeFileSync(localEnvPath, `${header}\n${stringifyEnvFile(env)}`, "utf8");
}

function shouldRewriteLocalEnvFile({ ports, adminPublicBaseUrl, adminOrigin }) {
  if (!fs.existsSync(localEnvPath)) return true;
  try {
    const content = fs.readFileSync(localEnvPath, "utf8");
    const env = parseEnvFile(content);
    if (env.PORT_WEB !== String(ports.webPort)) return true;
    if (env.PORT_ADMIN !== String(ports.adminPort)) return true;
    if (env.PORT_BACKEND !== String(ports.backendPort)) return true;
    if ((env.NEXT_PUBLIC_ADMIN_BASE_URL ?? "").trim() !== adminPublicBaseUrl) return true;
    if ((env.ADMIN_ORIGIN ?? "").trim() !== adminOrigin) return true;
    return false;
  } catch {
    return true;
  }
}

function pickFromArgs() {
  const args = process.argv.slice(2);
  const result = { print: false, reset: false };
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--print") result.print = true;
    if (arg === "--reset") result.reset = true;
  }
  return result;
}

async function resolvePorts({ reset }) {
  const baseStart = Number(process.env.WORKTREE_PORT_BASE ?? "3000");
  const group = process.env.WORKTREE_PORT_GROUP?.trim()
    ? Number(process.env.WORKTREE_PORT_GROUP)
    : null;
  const step = 100;
  const groups = Number(process.env.WORKTREE_PORT_GROUPS ?? "200");

  if (!reset) {
    const existing = readWorktreeEnvIfExists();
    if (existing) {
      const { supported, allFree } = await probePorts([
        existing.webPort,
        existing.adminPort,
        existing.backendPort,
      ]);
      if (!supported) return { ports: existing, strategy: "existing-unchecked" };
      if (allFree) return { ports: existing, strategy: "existing" };

      const existingGroup = Math.floor((existing.webPort - baseStart) / step);
      if (Number.isFinite(existingGroup) && existingGroup >= 0) {
        const found = await findFreePortGroupFrom({
          baseStart,
          step,
          count: 3,
          groups,
          startGroup: existingGroup,
        });
        if (found) {
          const [webPort, adminPort, backendPort] = found.ports;
          return { ports: { webPort, adminPort, backendPort }, strategy: "existing-conflict" };
        }
      }
    }
  }

  if (Number.isFinite(group) && group !== null) {
    const ports = Array.from({ length: 3 }, (_, idx) => baseStart + group * step + idx);
    const [webPort, adminPort, backendPort] = ports;
    return { ports: { webPort, adminPort, backendPort }, strategy: "group" };
  }

  const deterministicPorts = pickDeterministicPorts({ baseStart, step, count: 3, groups });
  const [dWeb, dAdmin, dBackend] = deterministicPorts;
  const { supported: deterministicProbeSupported, allFree: deterministicAllFree } = await probePorts([
    dWeb,
    dAdmin,
    dBackend,
  ]);
  if (!deterministicProbeSupported) {
    return { ports: { webPort: dWeb, adminPort: dAdmin, backendPort: dBackend }, strategy: "deterministic-unchecked" };
  }
  if (deterministicAllFree) {
    return { ports: { webPort: dWeb, adminPort: dAdmin, backendPort: dBackend }, strategy: "deterministic" };
  }

  const digest = crypto.createHash("sha256").update(`${repoRoot}`).digest();
  const startGroup = digest.readUInt32BE(0) % groups;
  const found = await findFreePortGroupFrom({ baseStart, step, count: 3, groups, startGroup });
  if (!found) {
    return { ports: { webPort: dWeb, adminPort: dAdmin, backendPort: dBackend }, strategy: "deterministic-unchecked" };
  }
  const [webPort, adminPort, backendPort] = found.ports;
  return { ports: { webPort, adminPort, backendPort }, strategy: "deterministic-fallback" };
}

function runApp({ name, cwd, env, command }) {
  const child = spawn(command, {
    cwd,
    env,
    stdio: "inherit",
    shell: true,
  });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });
  return child;
}

async function main() {
  const { print, reset } = pickFromArgs();
  const previous = reset ? null : readWorktreeEnvIfExists();
  const resolved = await resolvePorts({ reset });
  const ports = resolved.ports;

  const portsChanged =
    previous &&
    (previous.webPort !== ports.webPort ||
      previous.adminPort !== ports.adminPort ||
      previous.backendPort !== ports.backendPort);

  const webUrl = `http://localhost:${ports.webPort}`;
  const adminBasePathRaw = (process.env.NEXT_PUBLIC_ADMIN_BASE_PATH ?? "/admin").trim() || "/admin";
  const adminBasePath = adminBasePathRaw === "/" ? "" : adminBasePathRaw.replace(/\/+$/, "");
  const adminOrigin = `http://localhost:${ports.adminPort}`;
  const adminUrl = adminBasePath ? `${adminOrigin}${adminBasePath}` : adminOrigin;
  const backendUrl = `http://localhost:${ports.backendPort}`;

  if (reset || portsChanged || shouldRewriteLocalEnvFile({ ports, adminPublicBaseUrl: adminUrl, adminOrigin })) {
    ensureLocalEnvFile(ports);
    if (portsChanged) {
      console.log("检测到已保存端口被占用，已自动切换到新的端口组并写入本 worktree 的 .env.worktree.local。");
    }
  }

  console.log("");
  console.log("Worktree 开发模式（自动避开端口冲突）");
  console.log(`- Web:     ${webUrl}`);
  console.log(`- Admin:   ${adminUrl}`);
  console.log(`- Backend: ${backendUrl}`);
  console.log(`- 本地配置: ${path.relative(repoRoot, localEnvPath)}`);
  console.log("");
  if (resolved.strategy === "deterministic") {
    console.log("端口分配策略：按 worktree 路径固定映射（不同 worktree 默认不会混用端口）。");
    console.log("");
  }
  if (resolved.strategy === "existing-unchecked" || resolved.strategy === "deterministic-unchecked") {
    console.log("提示：当前环境不支持端口占用探测，将直接使用本 worktree 的固定端口。");
    console.log("如发生冲突：设置 WORKTREE_PORT_GROUP 或直接修改 .env.worktree.local。");
    console.log("");
  }
  if (resolved.strategy === "deterministic-fallback" || resolved.strategy === "existing-conflict") {
    console.log("提示：检测到默认/已保存端口冲突，已在本 worktree 内自动换到下一组可用端口。");
    console.log("如需固定某一组：设置 WORKTREE_PORT_GROUP 或直接修改 .env.worktree.local。");
    console.log("");
  }

  if (print) return;

  const baseEnv = { ...process.env };
  const children = [
    runApp({
      name: "web",
      cwd: path.join(repoRoot, "apps/web"),
      env: {
        ...baseEnv,
        PORT: String(ports.webPort),
        NEXT_PUBLIC_ADMIN_BASE_URL: adminUrl,
      },
      command: "pnpm dev",
    }),
    runApp({
      name: "admin",
      cwd: path.join(repoRoot, "apps/admin"),
      env: {
        ...baseEnv,
        PORT: String(ports.adminPort),
        NEXT_PUBLIC_ADMIN_BASE_PATH: adminBasePath || "/",
        BACKEND_BASE_URL: backendUrl,
      },
      command: "pnpm dev",
    }),
    runApp({
      name: "backend",
      cwd: path.join(repoRoot, "apps/backend"),
      env: {
        ...baseEnv,
        PORT: String(ports.backendPort),
        ADMIN_ORIGIN: adminOrigin,
      },
      command: "pnpm dev",
    }),
  ];

  const shutdown = (signal) => {
    for (const child of children) {
      if (child?.pid) child.kill(signal);
    }
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
