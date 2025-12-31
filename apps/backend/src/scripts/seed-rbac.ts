import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { init, type CloudBase } from "@cloudbase/node-sdk";
import type { DataModelMethods, Model } from "@cloudbase/wx-cloud-client-sdk";

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

type RbacUserRecord = Model & {
  account: string;
  passwordHash: string;
  userType: string;
  status: number;
};

type RbacRoleRecord = Model & { code: string; name: string; status: number };
type RbacPermissionRecord = Model & {
  code: string;
  type: string;
  resource: string;
  action: string;
  name: string;
  status: number;
};

type RbacUserRoleRecord = Model & { userId: string; roleId: string };
type RbacRolePermissionRecord = Model & { roleId: string; permissionId: string };
type RbacRoleDataScopeRecord = Model & { roleId: string; resource: string; scopeType: string; scopeValue?: string };

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

function getModel<T extends Model>(models: CloudBase["models"], modelName: string): DataModelMethods<T> {
  const model = (models as unknown as Record<string, unknown>)[modelName] as DataModelMethods<T> | undefined;
  if (!model) throw new Error(`CloudBase model not found: ${modelName}`);
  return model;
}

async function findSingleByField<T extends Model>(
  model: DataModelMethods<T>,
  field: string,
  value: string,
): Promise<T | null> {
  const { data } = await model.list({
    filter: { where: { [field]: { $eq: value } } as unknown as Record<string, unknown> },
    pageSize: 1,
    pageNumber: 1,
  });
  return data.records[0] ?? null;
}

async function upsertByField<T extends Model>(
  model: DataModelMethods<T>,
  field: string,
  value: string,
  create: T,
  update: Partial<T>,
): Promise<void> {
  await model.upsert({
    create,
    update: update as T,
    filter: { where: { [field]: { $eq: value } } as unknown as Record<string, unknown> },
  });
}

async function ensureIdsByCode<T extends Model & { code: string }>(
  model: DataModelMethods<T>,
  items: Array<{ code: string; create: T; update: Partial<T> }>,
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const item of items) {
    await upsertByField(model, "code", item.code, item.create, item.update);
    const record = await findSingleByField(model, "code", item.code);
    if (!record?._id) throw new Error(`Failed to fetch model record _id for code=${item.code}`);
    map.set(item.code, record._id);
  }
  return map;
}

async function main() {
  loadEnvFiles(process.cwd(), [".env.local", ".env"]);

  const env = process.env.CLOUDBASE_ENV ?? process.env.TCB_ENV ?? process.env.ENV_ID;
  if (!env || env.trim().length === 0) {
    throw new Error(
      [
        "缺少 CloudBase 环境 ID：请在 apps/backend/.env.local 配置 CLOUDBASE_ENV=<环境ID>（或 TCB_ENV）。",
        "开发环境约定：PORT=3002，ADMIN_ORIGIN=http://localhost:3001。",
        "可参考 apps/backend/.env.example。",
      ].join(" "),
    );
  }
  const region = process.env.CLOUDBASE_REGION ?? "ap-shanghai";
  const secretId = requireEnv("CLOUDBASE_SECRET_ID");
  const secretKey = requireEnv("CLOUDBASE_SECRET_KEY");

  const usersModelName = process.env.CLOUDBASE_MODEL_USERS ?? process.env.CLOUDBASE_MODEL_ADMIN_USERS ?? "rbac_users";
  const rolesModelName = process.env.CLOUDBASE_MODEL_RBAC_ROLES ?? "rbac_roles";
  const permissionsModelName = process.env.CLOUDBASE_MODEL_RBAC_PERMISSIONS ?? "rbac_permissions";
  const userRolesModelName = process.env.CLOUDBASE_MODEL_RBAC_USER_ROLES ?? "rbac_user_roles";
  const rolePermsModelName = process.env.CLOUDBASE_MODEL_RBAC_ROLE_PERMISSIONS ?? "rbac_role_permissions";
  const roleScopesModelName = process.env.CLOUDBASE_MODEL_RBAC_ROLE_DATA_SCOPES ?? "rbac_role_data_scopes";

  const app = init({ env: env.trim(), region: region.trim(), secretId, secretKey });
  const models = app.models;

  const usersModel = getModel<RbacUserRecord>(models, usersModelName);
  const rolesModel = getModel<RbacRoleRecord>(models, rolesModelName);
  const permsModel = getModel<RbacPermissionRecord>(models, permissionsModelName);
  const userRolesModel = getModel<RbacUserRoleRecord>(models, userRolesModelName);
  const rolePermsModel = getModel<RbacRolePermissionRecord>(models, rolePermsModelName);
  const roleScopesModel = getModel<RbacRoleDataScopeRecord>(models, roleScopesModelName);

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

  // 1) 角色、权限点 upsert
  const roleIdByCode = await ensureIdsByCode(
    rolesModel,
    roles.map((r) => ({
      code: r.code,
      create: { code: r.code, name: r.name, status: r.status } as RbacRoleRecord,
      update: { name: r.name, status: r.status } satisfies Partial<RbacRoleRecord>,
    })),
  );

  const permissionIdByCode = await ensureIdsByCode(
    permsModel,
    permissions.map((p) => ({
      code: p.code,
      create: {
        code: p.code,
        type: p.type,
        resource: p.resource,
        action: p.action,
        name: p.name,
        status: p.status,
      } as RbacPermissionRecord,
      update: {
        type: p.type,
        resource: p.resource,
        action: p.action,
        name: p.name,
        status: p.status,
      } satisfies Partial<RbacPermissionRecord>,
    })),
  );

  // 2) 预置用户（admin / visitor）
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

  const userIdByAccount = new Map<string, string>();
  for (const user of seedUsers) {
    const account = user.account.toLowerCase();
    await upsertByField(
      usersModel,
      "account",
      account,
      {
        account,
        passwordHash: user.passwordHash,
        userType: user.userType,
        status: user.status,
      } as RbacUserRecord,
      {
        passwordHash: user.passwordHash,
        userType: user.userType,
        status: user.status,
      } satisfies Partial<RbacUserRecord>,
    );
    const record = await findSingleByField(usersModel, "account", account);
    if (!record?._id) throw new Error(`Failed to fetch user _id for account=${account}`);
    userIdByAccount.set(account, record._id);
  }

  // 3) user_roles
  const userRoleEdges: Array<{ userId: string; roleId: string }> = [
    { userId: userIdByAccount.get("admin")!, roleId: roleIdByCode.get("admin")! },
    { userId: userIdByAccount.get("photographer")!, roleId: roleIdByCode.get("photographer")! },
    { userId: userIdByAccount.get("sales")!, roleId: roleIdByCode.get("sales")! },
    { userId: userIdByAccount.get("visitor")!, roleId: roleIdByCode.get("customer")! },
  ];

  for (const edge of userRoleEdges) {
    await userRolesModel.deleteMany({ filter: { where: { userId: { $eq: edge.userId } } } });
  }
  await userRolesModel.createMany({ data: userRoleEdges as unknown as RbacUserRoleRecord[] });

  // 4) role_permissions
  const adminRoleId = roleIdByCode.get("admin")!;
  const photographerRoleId = roleIdByCode.get("photographer")!;
  const salesRoleId = roleIdByCode.get("sales")!;
  const customerRoleId = roleIdByCode.get("customer")!;

  const adminPermissionIds = Array.from(permissionIdByCode.values());
  const photographerPermissionIds = [
    permissionIdByCode.get("page:dashboard"),
    permissionIdByCode.get("page:assets"),
    permissionIdByCode.get("page:packages"),
    permissionIdByCode.get("dashboard:view"),
    permissionIdByCode.get("assets:read"),
    permissionIdByCode.get("assets:write"),
    permissionIdByCode.get("packages:read"),
  ].filter((v): v is string => Boolean(v));

  const salesPermissionIds = [
    permissionIdByCode.get("page:dashboard"),
    permissionIdByCode.get("page:users"),
    permissionIdByCode.get("page:packages"),
    permissionIdByCode.get("dashboard:view"),
    permissionIdByCode.get("users:read"),
    permissionIdByCode.get("users:write"),
    permissionIdByCode.get("packages:read"),
  ].filter((v): v is string => Boolean(v));

  const customerPermissionIds = [
    permissionIdByCode.get("page:dashboard"),
    permissionIdByCode.get("page:packages"),
    permissionIdByCode.get("page:assets"),
    permissionIdByCode.get("dashboard:view"),
    permissionIdByCode.get("packages:read"),
    permissionIdByCode.get("assets:read"),
  ].filter((v): v is string => Boolean(v));

  await rolePermsModel.deleteMany({ filter: { where: { roleId: { $eq: adminRoleId } } } });
  await rolePermsModel.deleteMany({ filter: { where: { roleId: { $eq: photographerRoleId } } } });
  await rolePermsModel.deleteMany({ filter: { where: { roleId: { $eq: salesRoleId } } } });
  await rolePermsModel.deleteMany({ filter: { where: { roleId: { $eq: customerRoleId } } } });

  await rolePermsModel.createMany({
    data: adminPermissionIds.map((permissionId) => ({ roleId: adminRoleId, permissionId })) as unknown as
      RbacRolePermissionRecord[],
  });
  await rolePermsModel.createMany({
    data: photographerPermissionIds.map((permissionId) => ({ roleId: photographerRoleId, permissionId })) as unknown as
      RbacRolePermissionRecord[],
  });
  await rolePermsModel.createMany({
    data: salesPermissionIds.map((permissionId) => ({ roleId: salesRoleId, permissionId })) as unknown as
      RbacRolePermissionRecord[],
  });
  await rolePermsModel.createMany({
    data: customerPermissionIds.map((permissionId) => ({ roleId: customerRoleId, permissionId })) as unknown as
      RbacRolePermissionRecord[],
  });

  // 5) data scopes
  const scopes: DataScopeSeed[] = [
    { roleCode: "admin", resource: "*", scopeType: "all" },
    { roleCode: "photographer", resource: "assets", scopeType: "self" },
    { roleCode: "photographer", resource: "packages", scopeType: "self" },
    { roleCode: "sales", resource: "users", scopeType: "self" },
    { roleCode: "sales", resource: "packages", scopeType: "self" },
    { roleCode: "customer", resource: "packages", scopeType: "self" },
    { roleCode: "customer", resource: "assets", scopeType: "self" },
  ];

  await roleScopesModel.deleteMany({ filter: { where: { roleId: { $eq: adminRoleId } } } });
  await roleScopesModel.deleteMany({ filter: { where: { roleId: { $eq: photographerRoleId } } } });
  await roleScopesModel.deleteMany({ filter: { where: { roleId: { $eq: salesRoleId } } } });
  await roleScopesModel.deleteMany({ filter: { where: { roleId: { $eq: customerRoleId } } } });

  await roleScopesModel.createMany({
    data: scopes.map((s) => ({
      roleId: roleIdByCode.get(s.roleCode)!,
      resource: s.resource,
      scopeType: s.scopeType,
      scopeValue: s.scopeValue ?? "",
    })) as unknown as RbacRoleDataScopeRecord[],
  });

  console.log("[seed-rbac] ok");
}

void main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[seed-rbac] failed: ${message}`);
  process.exit(1);
});
