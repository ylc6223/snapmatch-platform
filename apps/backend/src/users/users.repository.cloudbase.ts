import type { ConfigService } from "@nestjs/config";
import type { CloudBase } from "@cloudbase/node-sdk";
import { Role } from "../auth/types";
import type { User, UsersRepository } from "./users.repository";

type CloudBaseModels = CloudBase["models"];

type SqlResult = {
  data?: {
    executeResultList?: Array<Record<string, unknown>>;
  };
};

function splitCsv(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

function toRoles(values: unknown): Role[] {
  const items = splitCsv(values);
  const allowed = new Set<string>(Object.values(Role));
  return items.filter((v): v is Role => allowed.has(v)) as Role[];
}

async function runSql(models: CloudBaseModels, sqlTemplate: string, params: Record<string, unknown>) {
  const client = models as unknown as {
    $runSQL?: (sql: string, args?: Record<string, unknown>) => Promise<SqlResult>;
  };
  if (!client.$runSQL) {
    throw new Error("CloudBase models.$runSQL not available");
  }
  const result = await client.$runSQL(sqlTemplate, params);
  const rows = result.data?.executeResultList ?? [];
  return rows;
}

export class CloudBaseUsersRepository implements UsersRepository {
  private readonly modelName: string;

  constructor(
    private readonly models: CloudBaseModels,
    config: ConfigService,
  ) {
    this.modelName =
      config.get<string>("CLOUDBASE_MODEL_USERS") ??
      config.get<string>("CLOUDBASE_MODEL_ADMIN_USERS") ??
      "rbac_users";
  }

  async findByAccount(account: string): Promise<User | null> {
    const normalized = account.toLowerCase();

    const rows = await runSql(
      this.models,
      `
      SELECT
        u._id AS id,
        u.account AS account,
        u.passwordHash AS passwordHash,
        u.status AS status,
        GROUP_CONCAT(DISTINCT r.code) AS roles,
        GROUP_CONCAT(DISTINCT p.code) AS permissions
      FROM ${this.modelName} u
      LEFT JOIN rbac_user_roles ur ON ur.userId = u._id
      LEFT JOIN rbac_roles r ON r._id = ur.roleId AND r.status = 1
      LEFT JOIN rbac_role_permissions rp ON rp.roleId = r._id
      LEFT JOIN rbac_permissions p ON p._id = rp.permissionId AND p.status = 1
      WHERE u.account = {{account}} AND u.status = 1
      GROUP BY u._id
      LIMIT 1
      `,
      { account: normalized },
    );

    const row = rows[0] ?? null;
    if (!row) return null;
    const id = typeof row.id === "string" ? row.id : "";
    const accountValue = typeof row.account === "string" ? row.account : "";
    const passwordHash = typeof row.passwordHash === "string" ? row.passwordHash : "";
    const status = typeof row.status === "number" ? row.status : Number(row.status ?? 0);
    if (!id || !accountValue || !passwordHash || status !== 1) return null;

    return {
      id,
      account: accountValue,
      passwordHash,
      roles: toRoles(row.roles),
      permissions: splitCsv(row.permissions),
    };
  }

  async findById(id: string): Promise<User | null> {
    const rows = await runSql(
      this.models,
      `
      SELECT
        u._id AS id,
        u.account AS account,
        u.passwordHash AS passwordHash,
        u.status AS status,
        GROUP_CONCAT(DISTINCT r.code) AS roles,
        GROUP_CONCAT(DISTINCT p.code) AS permissions
      FROM ${this.modelName} u
      LEFT JOIN rbac_user_roles ur ON ur.userId = u._id
      LEFT JOIN rbac_roles r ON r._id = ur.roleId AND r.status = 1
      LEFT JOIN rbac_role_permissions rp ON rp.roleId = r._id
      LEFT JOIN rbac_permissions p ON p._id = rp.permissionId AND p.status = 1
      WHERE u._id = {{id}} AND u.status = 1
      GROUP BY u._id
      LIMIT 1
      `,
      { id },
    );

    const row = rows[0] ?? null;
    if (!row) return null;
    const userId = typeof row.id === "string" ? row.id : "";
    const accountValue = typeof row.account === "string" ? row.account : "";
    const passwordHash = typeof row.passwordHash === "string" ? row.passwordHash : "";
    const status = typeof row.status === "number" ? row.status : Number(row.status ?? 0);
    if (!userId || !accountValue || !passwordHash || status !== 1) return null;

    return {
      id: userId,
      account: accountValue,
      passwordHash,
      roles: toRoles(row.roles),
      permissions: splitCsv(row.permissions),
    };
  }
}
