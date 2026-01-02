import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { DataSource, Repository } from "typeorm";
import { AuthSessionEntity } from "../database/entities/auth-session.entity";
import { RbacPermissionEntity } from "../database/entities/rbac-permission.entity";
import { RbacRoleDataScopeEntity } from "../database/entities/rbac-role-data-scope.entity";
import { RbacRolePermissionEntity } from "../database/entities/rbac-role-permission.entity";
import { RbacRoleEntity } from "../database/entities/rbac-role.entity";
import { RbacUserRoleEntity } from "../database/entities/rbac-user-role.entity";
import { RbacUserEntity } from "../database/entities/rbac-user.entity";

type EnvType = "admin" | "photographer" | "sales" | "visitor";

type SeedUser = {
  envType: EnvType;
  account: string;
  passwordHash: string;
  userType: "photographer" | "sales" | "customer";
  status: number;
};

type RoleSeed = { code: string; name: string; status: number };
type PermissionSeed = {
  code: string;
  type: "page" | "action" | "data";
  resource: string;
  action: string;
  name: string;
  status: number;
};
type DataScopeSeed = { roleCode: string; resource: string; scopeType: string; scopeValue?: string };

function parseEnvLine(line: string): { key: string; value: string } | null {
  const trimmed = line.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.startsWith("#")) return null;
  const index = trimmed.indexOf("=");
  if (index <= 0) return null;

  const key = trimmed.slice(0, index).trim();
  let value = trimmed.slice(index + 1).trim();
  if (value.startsWith("\"") && value.endsWith("\"")) value = value.slice(1, -1);
  if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
  return { key, value };
}

function loadEnvFiles(cwd: string, filenames: string[]) {
  for (const filename of filenames) {
    const fullPath = path.join(cwd, filename);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;
      if (process.env[parsed.key] === undefined) {
        process.env[parsed.key] = parsed.value;
      }
    }
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing env: ${name}`);
  }
  return value.trim();
}

async function resolvePasswordHash(which: EnvType): Promise<string> {
  const prefix = which.toUpperCase(); // ADMIN / VISITOR
  const hash = process.env[`SEED_${prefix}_PASSWORD_HASH`]?.trim();
  if (hash) return hash;
  const password = process.env[`SEED_${prefix}_PASSWORD`]?.trim();
  if (!password) {
    // photographer/sales 默认复用 admin 的密码，避免本地联调时必须额外配置环境变量。
    if (which !== "admin" && which !== "visitor") {
      return resolvePasswordHash("admin");
    }
    throw new Error(
      `Missing seed password for ${which}. Set SEED_${prefix}_PASSWORD_HASH (recommended) or SEED_${prefix}_PASSWORD.`,
    );
  }
  return bcrypt.hash(password, 10);
}

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  return ["1", "true", "yes", "y", "on"].includes(value.trim().toLowerCase());
}

function generateId34Safe(): string {
  // 表的 `_id` 为 varchar(34)，这里生成 32 位 hex（不含 "-"），保证不超长。
  return randomUUID().replaceAll("-", "");
}

function buildDataSource(): DataSource {
  const host = process.env.DB_HOST ?? process.env.MYSQL_HOST ?? "localhost";
  const portValue = process.env.DB_PORT ?? process.env.MYSQL_PORT ?? "3306";
  const port = Number(portValue);

  const username = process.env.DB_USERNAME ?? process.env.MYSQL_USERNAME ?? "root";
  const password = process.env.DB_PASSWORD ?? process.env.MYSQL_PASSWORD ?? "";
  const database = process.env.DB_DATABASE ?? process.env.MYSQL_DATABASE ?? "snapmatch";

  const sslEnabled = normalizeBoolean(process.env.DB_SSL);

  return new DataSource({
    type: "mysql",
    host,
    port: Number.isFinite(port) && port > 0 ? port : 3306,
    username,
    password,
    database,
    entities: [
      AuthSessionEntity,
      RbacUserEntity,
      RbacRoleEntity,
      RbacPermissionEntity,
      RbacUserRoleEntity,
      RbacRolePermissionEntity,
      RbacRoleDataScopeEntity,
    ],
    synchronize: false,
    ...(sslEnabled ? { ssl: { rejectUnauthorized: true } } : {}),
  });
}

async function upsertRole(repo: Repository<RbacRoleEntity>, seed: RoleSeed): Promise<RbacRoleEntity> {
  const existing = await repo.findOne({ where: { code: seed.code } });
  const now = Date.now();
  if (existing) {
    await repo.update({ id: existing.id }, { name: seed.name, status: seed.status, updatedAt: now });
    return (await repo.findOneOrFail({ where: { id: existing.id } })) as RbacRoleEntity;
  }
  const created = repo.create({
    id: generateId34Safe(),
    code: seed.code,
    name: seed.name,
    status: seed.status,
    createdAt: now,
    updatedAt: now,
  });
  await repo.insert(created);
  return created;
}

async function upsertPermission(repo: Repository<RbacPermissionEntity>, seed: PermissionSeed): Promise<RbacPermissionEntity> {
  const existing = await repo.findOne({ where: { code: seed.code } });
  const now = Date.now();
  if (existing) {
    await repo.update(
      { id: existing.id },
      {
        type: seed.type,
        resource: seed.resource,
        action: seed.action,
        name: seed.name,
        status: seed.status,
        updatedAt: now,
      },
    );
    return (await repo.findOneOrFail({ where: { id: existing.id } })) as RbacPermissionEntity;
  }
  const created = repo.create({
    id: generateId34Safe(),
    code: seed.code,
    type: seed.type,
    resource: seed.resource,
    action: seed.action,
    name: seed.name,
    status: seed.status,
    createdAt: now,
    updatedAt: now,
  });
  await repo.insert(created);
  return created;
}

async function upsertUser(repo: Repository<RbacUserEntity>, user: SeedUser): Promise<RbacUserEntity> {
  const account = user.account.toLowerCase();
  const existing = await repo.findOne({ where: { account } });
  const now = Date.now();
  if (existing) {
    await repo.update(
      { id: existing.id },
      { passwordHash: user.passwordHash, userType: user.userType, status: user.status, updatedAt: now },
    );
    return (await repo.findOneOrFail({ where: { id: existing.id } })) as RbacUserEntity;
  }
  const created = repo.create({
    id: generateId34Safe(),
    account,
    passwordHash: user.passwordHash,
    userType: user.userType,
    status: user.status,
    createdAt: now,
    updatedAt: now,
  });
  await repo.insert(created);
  return created;
}

async function main() {
  loadEnvFiles(process.cwd(), [".env.local", ".env"]);

  // 基本连接信息（本地直连远程 MySQL / 服务器本机 MySQL 都通用）。
  requireEnv("DB_HOST");
  requireEnv("DB_USERNAME");
  requireEnv("DB_DATABASE");

  const roles: RoleSeed[] = [
    { code: "admin", name: "管理员(摄影师)", status: 1 },
    { code: "photographer", name: "摄影师/修图师", status: 1 },
    { code: "sales", name: "销售/客服", status: 1 },
    { code: "customer", name: "访客(客户)", status: 1 },
  ];

  const resources = ["dashboard", "packages", "assets", "users", "settings"] as const;

  const permissions: PermissionSeed[] = [
    ...resources.map((r) => ({
      code: `page:${r}`,
      type: "page" as const,
      resource: r,
      action: "",
      name: `页面访问：${r}`,
      status: 1,
    })),
    ...resources.flatMap((r) => {
      if (r === "dashboard") {
        return [
          {
            code: "dashboard:view",
            type: "action" as const,
            resource: "dashboard",
            action: "view",
            name: "查看仪表盘",
            status: 1,
          },
        ];
      }
      return [
        {
          code: `${r}:read`,
          type: "action" as const,
          resource: r,
          action: "read",
          name: `读取：${r}`,
          status: 1,
        },
        {
          code: `${r}:write`,
          type: "action" as const,
          resource: r,
          action: "write",
          name: `写入：${r}`,
          status: 1,
        },
      ];
    }),
  ];

  const adminHash = await resolvePasswordHash("admin");
  const photographerHash = await resolvePasswordHash("photographer");
  const salesHash = await resolvePasswordHash("sales");
  const visitorHash = await resolvePasswordHash("visitor");

  const seedUsers: SeedUser[] = [
    { envType: "admin", account: "admin", passwordHash: adminHash, userType: "photographer", status: 1 },
    { envType: "photographer", account: "photographer", passwordHash: photographerHash, userType: "photographer", status: 1 },
    { envType: "sales", account: "sales", passwordHash: salesHash, userType: "sales", status: 1 },
    { envType: "visitor", account: "visitor", passwordHash: visitorHash, userType: "customer", status: 1 },
  ];

  const ds = buildDataSource();
  await ds.initialize();

  try {
    await ds.transaction(async (manager) => {
      const roleRepo = manager.getRepository(RbacRoleEntity);
      const permRepo = manager.getRepository(RbacPermissionEntity);
      const userRepo = manager.getRepository(RbacUserEntity);
      const userRoleRepo = manager.getRepository(RbacUserRoleEntity);
      const rolePermRepo = manager.getRepository(RbacRolePermissionEntity);
      const roleScopeRepo = manager.getRepository(RbacRoleDataScopeEntity);

      const roleByCode = new Map<string, RbacRoleEntity>();
      for (const r of roles) {
        const role = await upsertRole(roleRepo, r);
        roleByCode.set(r.code, role);
      }

      const permByCode = new Map<string, RbacPermissionEntity>();
      for (const p of permissions) {
        const perm = await upsertPermission(permRepo, p);
        permByCode.set(p.code, perm);
      }

      const userByAccount = new Map<string, RbacUserEntity>();
      for (const u of seedUsers) {
        const user = await upsertUser(userRepo, u);
        userByAccount.set(u.account.toLowerCase(), user);
      }

      // user_roles：先清空这些用户的关系，再写入
      for (const account of ["admin", "photographer", "sales", "visitor"]) {
        const user = userByAccount.get(account);
        if (user?.id) {
          await userRoleRepo.delete({ userId: user.id });
        }
      }
      const now = Date.now();
      await userRoleRepo.insert([
        { id: generateId34Safe(), userId: userByAccount.get("admin")!.id, roleId: roleByCode.get("admin")!.id, createdAt: now, updatedAt: now },
        { id: generateId34Safe(), userId: userByAccount.get("photographer")!.id, roleId: roleByCode.get("photographer")!.id, createdAt: now, updatedAt: now },
        { id: generateId34Safe(), userId: userByAccount.get("sales")!.id, roleId: roleByCode.get("sales")!.id, createdAt: now, updatedAt: now },
        { id: generateId34Safe(), userId: userByAccount.get("visitor")!.id, roleId: roleByCode.get("customer")!.id, createdAt: now, updatedAt: now },
      ] satisfies Array<Partial<RbacUserRoleEntity>>);

      const adminRoleId = roleByCode.get("admin")!.id;
      const photographerRoleId = roleByCode.get("photographer")!.id;
      const salesRoleId = roleByCode.get("sales")!.id;
      const customerRoleId = roleByCode.get("customer")!.id;

      const adminPermissionIds = Array.from(permByCode.values()).map((p) => p.id);
      const photographerPermissionIds = [
        permByCode.get("page:dashboard")?.id,
        permByCode.get("page:assets")?.id,
        permByCode.get("page:packages")?.id,
        permByCode.get("dashboard:view")?.id,
        permByCode.get("assets:read")?.id,
        permByCode.get("assets:write")?.id,
        permByCode.get("packages:read")?.id,
      ].filter((v): v is string => Boolean(v));

      const salesPermissionIds = [
        permByCode.get("page:dashboard")?.id,
        permByCode.get("page:users")?.id,
        permByCode.get("page:packages")?.id,
        permByCode.get("dashboard:view")?.id,
        permByCode.get("users:read")?.id,
        permByCode.get("users:write")?.id,
        permByCode.get("packages:read")?.id,
      ].filter((v): v is string => Boolean(v));

      const customerPermissionIds = [
        permByCode.get("page:dashboard")?.id,
        permByCode.get("page:packages")?.id,
        permByCode.get("page:assets")?.id,
        permByCode.get("dashboard:view")?.id,
        permByCode.get("packages:read")?.id,
        permByCode.get("assets:read")?.id,
      ].filter((v): v is string => Boolean(v));

      for (const roleId of [adminRoleId, photographerRoleId, salesRoleId, customerRoleId]) {
        await rolePermRepo.delete({ roleId });
      }

      await rolePermRepo.insert(
        adminPermissionIds.map((permissionId) => ({ id: generateId34Safe(), roleId: adminRoleId, permissionId, createdAt: now, updatedAt: now })),
      );
      await rolePermRepo.insert(
        photographerPermissionIds.map((permissionId) => ({ id: generateId34Safe(), roleId: photographerRoleId, permissionId, createdAt: now, updatedAt: now })),
      );
      await rolePermRepo.insert(
        salesPermissionIds.map((permissionId) => ({ id: generateId34Safe(), roleId: salesRoleId, permissionId, createdAt: now, updatedAt: now })),
      );
      await rolePermRepo.insert(
        customerPermissionIds.map((permissionId) => ({ id: generateId34Safe(), roleId: customerRoleId, permissionId, createdAt: now, updatedAt: now })),
      );

      const scopes: DataScopeSeed[] = [
        { roleCode: "admin", resource: "*", scopeType: "all" },
        { roleCode: "photographer", resource: "assets", scopeType: "self" },
        { roleCode: "photographer", resource: "packages", scopeType: "self" },
        { roleCode: "sales", resource: "users", scopeType: "self" },
        { roleCode: "sales", resource: "packages", scopeType: "self" },
        { roleCode: "customer", resource: "packages", scopeType: "self" },
        { roleCode: "customer", resource: "assets", scopeType: "self" },
      ];

      for (const roleId of [adminRoleId, photographerRoleId, salesRoleId, customerRoleId]) {
        await roleScopeRepo.delete({ roleId });
      }

      await roleScopeRepo.insert(
        scopes.map((s) => ({
          id: generateId34Safe(),
          roleId: roleByCode.get(s.roleCode)!.id,
          resource: s.resource,
          scopeType: s.scopeType,
          scopeValue: s.scopeValue ?? "",
          createdAt: now,
          updatedAt: now,
        })) satisfies Array<Partial<RbacRoleDataScopeEntity>>,
      );

    });

    console.log("[seed-rbac:mysql] ok");
  } finally {
    await ds.destroy();
  }
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[seed-rbac:mysql] failed: ${message}`);
  process.exit(1);
});
