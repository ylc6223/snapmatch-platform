import type { ConfigService } from "@nestjs/config";
import type { CloudBase } from "@cloudbase/node-sdk";
import type { DataModelMethods, Model } from "@cloudbase/wx-cloud-client-sdk";
import { Role } from "../auth/types";
import { runSql } from "../database/run-sql";
import type {
  AdminUser,
  CreateUserInput,
  ListUsersInput,
  ListUsersResult,
  UpdateUserInput,
  User,
  UserRoleInfo,
  UsersRepository,
} from "./users.repository";

type CloudBaseModels = CloudBase["models"];

type UserRecord = Model & {
  account: string;
  passwordHash: string;
  userType?: string;
  status: number;
};

type UserRoleRecord = Model & {
  userId: string;
  roleId: string;
};

type RoleRecord = Model & {
  code: string;
  name: string;
  status: number;
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

function getSingleRecord<T>(result: unknown): T | null {
  const records = (result as { data?: { records?: T[] } })?.data?.records;
  if (!Array.isArray(records) || records.length === 0) return null;
  return records[0] ?? null;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return Number(value ?? 0);
}

export class CloudBaseUsersRepository implements UsersRepository {
  private readonly modelName: string;
  private readonly rolesModelName: string;
  private readonly userRolesModelName: string;

  constructor(
    private readonly models: CloudBaseModels,
    config: ConfigService,
  ) {
    this.modelName =
      config.get<string>("CLOUDBASE_MODEL_USERS") ??
      config.get<string>("CLOUDBASE_MODEL_ADMIN_USERS") ??
      "rbac_users";
    this.rolesModelName = config.get<string>("CLOUDBASE_MODEL_RBAC_ROLES") ?? "rbac_roles";
    this.userRolesModelName = config.get<string>("CLOUDBASE_MODEL_RBAC_USER_ROLES") ?? "rbac_user_roles";
  }

  private getModel<T extends Model>(modelName: string): DataModelMethods<T> {
    const model = (this.models as unknown as Record<string, unknown>)[modelName] as DataModelMethods<T> | undefined;
    if (!model) throw new Error(`CloudBase model not found: ${modelName}`);
    return model;
  }

  private getUsersModel(): DataModelMethods<UserRecord> {
    return this.getModel<UserRecord>(this.modelName);
  }

  private getRolesModel(): DataModelMethods<RoleRecord> {
    return this.getModel<RoleRecord>(this.rolesModelName);
  }

  private getUserRolesModel(): DataModelMethods<UserRoleRecord> {
    return this.getModel<UserRoleRecord>(this.userRolesModelName);
  }

  private async findAdminUserById(id: string): Promise<AdminUser | null> {
    const rows = await runSql(
      this.models,
      `
      SELECT
        u._id AS id,
        u.account AS account,
        u.userType AS userType,
        u.status AS status,
        GROUP_CONCAT(DISTINCT r.code) AS roles,
        GROUP_CONCAT(DISTINCT p.code) AS permissions
      FROM ${this.modelName} u
      LEFT JOIN rbac_user_roles ur ON ur.userId = u._id
      LEFT JOIN rbac_roles r ON r._id = ur.roleId AND r.status = 1
      LEFT JOIN rbac_role_permissions rp ON rp.roleId = r._id
      LEFT JOIN rbac_permissions p ON p._id = rp.permissionId AND p.status = 1
      WHERE u._id = {{id}}
      GROUP BY u._id
      LIMIT 1
      `,
      { id },
    );

    const row = rows[0] ?? null;
    if (!row) return null;

    const userId = typeof row.id === "string" ? row.id : "";
    const accountValue = typeof row.account === "string" ? row.account : "";
    if (!userId || !accountValue) return null;

    const userType = typeof row.userType === "string" ? row.userType : "";
    const statusValue = toNumber(row.status) === 1 ? 1 : 0;

    return {
      id: userId,
      account: accountValue,
      userType,
      status: statusValue,
      roles: toRoles(row.roles),
      permissions: splitCsv(row.permissions),
    };
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

  async listUsers(input: ListUsersInput): Promise<ListUsersResult> {
    const page = Number.isFinite(input.page) && input.page > 0 ? Math.floor(input.page) : 1;
    const pageSize = Number.isFinite(input.pageSize) && input.pageSize > 0 ? Math.floor(input.pageSize) : 20;
    const offset = (page - 1) * pageSize;

    const where: string[] = [];
    const params: Record<string, unknown> = { limit: pageSize, offset };

    const query = typeof input.query === "string" ? input.query.trim().toLowerCase() : "";
    if (query.length > 0) {
      where.push("LOWER(u.account) LIKE {{accountLike}}");
      params.accountLike = `%${query}%`;
    }

    const status = input.status ?? null;
    if (status !== null && (status === 0 || status === 1)) {
      where.push("u.status = {{status}}");
      params.status = status;
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const rows = await runSql(
      this.models,
      `
      SELECT
        u._id AS id,
        u.account AS account,
        u.userType AS userType,
        u.status AS status,
        GROUP_CONCAT(DISTINCT r.code) AS roles,
        GROUP_CONCAT(DISTINCT p.code) AS permissions
      FROM ${this.modelName} u
      LEFT JOIN rbac_user_roles ur ON ur.userId = u._id
      LEFT JOIN rbac_roles r ON r._id = ur.roleId AND r.status = 1
      LEFT JOIN rbac_role_permissions rp ON rp.roleId = r._id
      LEFT JOIN rbac_permissions p ON p._id = rp.permissionId AND p.status = 1
      ${whereSql}
      GROUP BY u._id
      ORDER BY u.account ASC
      LIMIT {{limit}} OFFSET {{offset}}
      `,
      params,
    );

    const countRows = await runSql(
      this.models,
      `
      SELECT COUNT(1) AS total
      FROM ${this.modelName} u
      ${whereSql}
      `,
      params,
    );
    const total = toNumber(countRows[0]?.total);

    const items: AdminUser[] = rows
      .map((row) => {
        const id = typeof row.id === "string" ? row.id : "";
        const accountValue = typeof row.account === "string" ? row.account : "";
        if (!id || !accountValue) return null;
        const userType = typeof row.userType === "string" ? row.userType : "";
        const statusValue = toNumber(row.status) === 1 ? 1 : 0;
        return {
          id,
          account: accountValue,
          userType,
          status: statusValue,
          roles: toRoles(row.roles),
          permissions: splitCsv(row.permissions),
        } satisfies AdminUser;
      })
      .filter((v): v is AdminUser => Boolean(v));

    return { items, total, page, pageSize };
  }

  async listRoles(): Promise<UserRoleInfo[]> {
    const model = this.getRolesModel();
    const result = await model.list({
      filter: { where: { status: { $eq: 1 } } },
      pageNumber: 1,
      pageSize: 100,
      select: { $master: true },
    });

    const records = (result as { data?: { records?: RoleRecord[] } })?.data?.records ?? [];
    const allowed = new Set<string>(Object.values(Role));
    return records
      .map((record) => {
        const code = record.code;
        const name = record.name;
        if (typeof code !== "string" || typeof name !== "string") return null;
        if (!allowed.has(code)) return null;
        return { code: code as Role, name } satisfies UserRoleInfo;
      })
      .filter((v): v is UserRoleInfo => Boolean(v));
  }

  private async setUserRoles(userId: string, roleCodes: Role[]) {
    const roleIdByCode = new Map<string, string>();

    const rolesModel = this.getRolesModel();
    const rolesResult = await rolesModel.list({
      filter: { where: { status: { $eq: 1 } } },
      pageNumber: 1,
      pageSize: 100,
      select: { $master: true },
    });
    const roleRecords = (rolesResult as { data?: { records?: RoleRecord[] } })?.data?.records ?? [];
    for (const r of roleRecords) {
      if (typeof r._id === "string" && typeof r.code === "string") {
        roleIdByCode.set(r.code, r._id);
      }
    }

    const allowed = new Set<string>(Object.values(Role));
    const normalizedCodes = Array.from(
      new Set(roleCodes.filter((code) => allowed.has(code))),
    );

    const ids = normalizedCodes
      .map((code) => roleIdByCode.get(code))
      .filter((v): v is string => typeof v === "string" && v.length > 0);

    const userRolesModel = this.getUserRolesModel();
    await userRolesModel.deleteMany({ filter: { where: { userId: { $eq: userId } } } });

    if (ids.length === 0) return;
    await userRolesModel.createMany({
      data: ids.map((roleId) => ({ userId, roleId })) as unknown as UserRoleRecord[],
    });
  }

  async createUser(input: CreateUserInput): Promise<AdminUser> {
    const normalizedAccount = input.account.trim().toLowerCase();
    const usersModel = this.getUsersModel();

    const existing = await usersModel.list({
      filter: { where: { account: { $eq: normalizedAccount } } },
      pageNumber: 1,
      pageSize: 1,
      select: { $master: true },
    });
    const existingRecord = getSingleRecord<UserRecord>(existing);
    if (existingRecord?._id) throw new Error("ACCOUNT_EXISTS");

    const result = await usersModel.create({
      data: {
        account: normalizedAccount,
        passwordHash: input.passwordHash,
        userType: input.userType,
        status: input.status,
      } as unknown as UserRecord,
    });
    const createdId = (result as unknown as { data?: { id?: string } })?.data?.id;
    if (!createdId) throw new Error("创建用户失败：缺少 id");

    await this.setUserRoles(createdId, input.roleCodes);

    const created = await this.findAdminUserById(createdId);
    if (!created) throw new Error("创建用户失败：回读用户信息失败");
    return created;
  }

  async updateUser(input: UpdateUserInput): Promise<AdminUser | null> {
    const usersModel = this.getUsersModel();

    const patch: Partial<UserRecord> = {};
    if (typeof input.passwordHash === "string" && input.passwordHash.trim().length > 0) {
      patch.passwordHash = input.passwordHash;
    }
    if (typeof input.userType === "string") patch.userType = input.userType;
    if (input.status === 0 || input.status === 1) patch.status = input.status;

    if (Object.keys(patch).length > 0) {
      await usersModel.update({
        data: patch as unknown as UserRecord,
        filter: { where: { _id: { $eq: input.id } } },
      });
    }

    if (Array.isArray(input.roleCodes)) {
      await this.setUserRoles(input.id, input.roleCodes);
    }

    return this.findAdminUserById(input.id);
  }

  async disableUser(id: string): Promise<boolean> {
    const existing = await this.findAdminUserById(id);
    if (!existing) return false;
    const usersModel = this.getUsersModel();
    await usersModel.update({
      data: { status: 0 } as unknown as UserRecord,
      filter: { where: { _id: { $eq: id } } },
    });
    return true;
  }
}
