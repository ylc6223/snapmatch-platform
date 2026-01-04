import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Role } from "../auth/types";
import { UserStatus } from "../database/entities/rbac-user.entity";
import { RbacPermissionEntity } from "../database/entities/rbac-permission.entity";
import { RbacRolePermissionEntity } from "../database/entities/rbac-role-permission.entity";
import { RbacRoleEntity } from "../database/entities/rbac-role.entity";
import { RbacUserRoleEntity } from "../database/entities/rbac-user-role.entity";
import { RbacUserEntity } from "../database/entities/rbac-user.entity";
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

/**
 * 将数据库值转换为 UserStatus 枚举
 * 数据库可能存储：字符串枚举值 ("active", "inactive", "pending") 或 数字 (0, 1)
 */
function toUserStatus(value: unknown): UserStatus {
  // 如果已经是 UserStatus 枚举，直接返回
  if (value === UserStatus.ACTIVE || value === UserStatus.INACTIVE || value === UserStatus.PENDING) {
    return value as UserStatus;
  }

  // 如果是数字，转换为枚举
  if (typeof value === "number") {
    return value === 1 ? UserStatus.ACTIVE : UserStatus.INACTIVE;
  }

  // 如果是字符串，尝试匹配枚举
  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    if (normalized === "active" || normalized === "1") return UserStatus.ACTIVE;
    if (normalized === "inactive" || normalized === "0") return UserStatus.INACTIVE;
    if (normalized === "pending") return UserStatus.PENDING;
  }

  // 默认返回 ACTIVE
  return UserStatus.ACTIVE;
}

function generateId34Safe(): string {
  // 表的 `_id` 为 varchar(34)，这里生成 32 位 hex（不含 "-"），保证不超长。
  return randomUUID().replaceAll("-", "");
}

@Injectable()
export class MySqlUsersRepository implements UsersRepository {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    @InjectRepository(RbacUserEntity) private readonly users: Repository<RbacUserEntity>,
    @InjectRepository(RbacRoleEntity) private readonly roles: Repository<RbacRoleEntity>,
  ) {}

  private async findAdminUserById(id: string): Promise<AdminUser | null> {
    const row = await this.users
      .createQueryBuilder("u")
      .select("u.id", "id")
      .addSelect("u.account", "account")
      .addSelect("u.status", "status")
      .addSelect("GROUP_CONCAT(DISTINCT r.code)", "roles")
      .addSelect("GROUP_CONCAT(DISTINCT p.code)", "permissions")
      .leftJoin(RbacUserRoleEntity, "ur", "ur.userId = u.id")
      .leftJoin(RbacRoleEntity, "r", "r.id = ur.roleId AND r.status = 1")
      .leftJoin(RbacRolePermissionEntity, "rp", "rp.roleId = r.id")
      .leftJoin(RbacPermissionEntity, "p", "p.id = rp.permissionId AND p.status = 1")
      .where("u.id = :id", { id })
      .groupBy("u.id")
      .getRawOne<Record<string, unknown>>();

    if (!row) return null;

    const userId = typeof row.id === "string" ? row.id : "";
    const accountValue = typeof row.account === "string" ? row.account : "";
    if (!userId || !accountValue) return null;

    const statusValue = toUserStatus(row.status);
    const roles = toRoles(row.roles);
    const permissions = splitCsv(row.permissions);

    return {
      id: userId,
      account: accountValue,
      status: statusValue,
      roles,
      permissions,
    };
  }

  async findByAccount(account: string): Promise<User | null> {
    const normalized = account.toLowerCase();
    const row = await this.users
      .createQueryBuilder("u")
      .select("u.id", "id")
      .addSelect("u.account", "account")
      .addSelect("u.passwordHash", "passwordHash")
      .addSelect("u.status", "status")
      .addSelect("GROUP_CONCAT(DISTINCT r.code)", "roles")
      .addSelect("GROUP_CONCAT(DISTINCT p.code)", "permissions")
      .leftJoin(RbacUserRoleEntity, "ur", "ur.userId = u.id")
      .leftJoin(RbacRoleEntity, "r", "r.id = ur.roleId AND r.status = 1")
      .leftJoin(RbacRolePermissionEntity, "rp", "rp.roleId = r.id")
      .leftJoin(RbacPermissionEntity, "p", "p.id = rp.permissionId AND p.status = 1")
      .where("u.account = :account AND u.status = :status", { account: normalized, status: UserStatus.ACTIVE })
      .groupBy("u.id")
      .getRawOne<Record<string, unknown>>();

    if (!row) return null;
    const id = typeof row.id === "string" ? row.id : "";
    const accountValue = typeof row.account === "string" ? row.account : "";
    const passwordHash = typeof row.passwordHash === "string" ? row.passwordHash : "";
    const status = toUserStatus(row.status);
    if (!id || !accountValue || !passwordHash || status !== UserStatus.ACTIVE) return null;

    return {
      id,
      account: accountValue,
      passwordHash,
      roles: toRoles(row.roles),
      permissions: splitCsv(row.permissions),
    };
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.users
      .createQueryBuilder("u")
      .select("u.id", "id")
      .addSelect("u.account", "account")
      .addSelect("u.passwordHash", "passwordHash")
      .addSelect("u.status", "status")
      .addSelect("GROUP_CONCAT(DISTINCT r.code)", "roles")
      .addSelect("GROUP_CONCAT(DISTINCT p.code)", "permissions")
      .leftJoin(RbacUserRoleEntity, "ur", "ur.userId = u.id")
      .leftJoin(RbacRoleEntity, "r", "r.id = ur.roleId AND r.status = 1")
      .leftJoin(RbacRolePermissionEntity, "rp", "rp.roleId = r.id")
      .leftJoin(RbacPermissionEntity, "p", "p.id = rp.permissionId AND p.status = 1")
      .where("u.id = :id AND u.status = :status", { id, status: UserStatus.ACTIVE })
      .groupBy("u.id")
      .getRawOne<Record<string, unknown>>();

    if (!row) return null;
    const userId = typeof row.id === "string" ? row.id : "";
    const accountValue = typeof row.account === "string" ? row.account : "";
    const passwordHash = typeof row.passwordHash === "string" ? row.passwordHash : "";
    const status = toUserStatus(row.status);
    if (!userId || !accountValue || !passwordHash || status !== UserStatus.ACTIVE) return null;

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

    const query = typeof input.query === "string" ? input.query.trim().toLowerCase() : "";
    const status = input.status ?? null;

    const allowedSortBy: Record<NonNullable<ListUsersInput["sortBy"]>, string> = {
      account: "u.account",
      status: "u.status",
    };
    const sortBy = input.sortBy ?? null;
    const sortOrder = (input.sortOrder ?? "asc").toLowerCase() === "desc" ? "DESC" : "ASC";
    const orderColumn = sortBy && allowedSortBy[sortBy] ? allowedSortBy[sortBy] : "u.account";

    const qb = this.users
      .createQueryBuilder("u")
      .select("u.id", "id")
      .addSelect("u.account", "account")
      .addSelect("u.status", "status")
      .addSelect("GROUP_CONCAT(DISTINCT r.code)", "roles")
      .addSelect("GROUP_CONCAT(DISTINCT p.code)", "permissions")
      .leftJoin(RbacUserRoleEntity, "ur", "ur.userId = u.id")
      .leftJoin(RbacRoleEntity, "r", "r.id = ur.roleId AND r.status = 1")
      .leftJoin(RbacRolePermissionEntity, "rp", "rp.roleId = r.id")
      .leftJoin(RbacPermissionEntity, "p", "p.id = rp.permissionId AND p.status = 1");

    const countQb = this.users.createQueryBuilder("u");

    if (query.length > 0) {
      qb.andWhere("LOWER(u.account) LIKE :accountLike", { accountLike: `%${query}%` });
      countQb.andWhere("LOWER(u.account) LIKE :accountLike", { accountLike: `%${query}%` });
    }
    if (status !== null) {
      qb.andWhere("u.status = :status", { status });
      countQb.andWhere("u.status = :status", { status });
    }

    const rows = await qb
      .groupBy("u.id")
      .orderBy(orderColumn, sortOrder)
      .limit(pageSize)
      .offset(offset)
      .getRawMany<Record<string, unknown>>();

    const total = await countQb.getCount();

    const items: AdminUser[] = rows
      .map((row: Record<string, unknown>) => {
        const id = typeof row.id === "string" ? row.id : "";
        const accountValue = typeof row.account === "string" ? row.account : "";
        if (!id || !accountValue) return null;
        const statusValue = toUserStatus(row.status);
        return {
          id,
          account: accountValue,
          status: statusValue,
          roles: toRoles(row.roles),
          permissions: splitCsv(row.permissions),
        } satisfies AdminUser;
      })
      .filter((v: AdminUser | null): v is AdminUser => Boolean(v));

    return { items, total, page, pageSize };
  }

  async listRoles(): Promise<UserRoleInfo[]> {
    return [
      { code: Role.Admin, name: "管理员" },
      { code: Role.Photographer, name: "摄影师" },
      { code: Role.Sales, name: "销售" },
      { code: Role.Customer, name: "客户" },
    ];
  }

  private async setUserRoles(userId: string, roleCodes: Role[]) {
    const allowed = new Set<string>(Object.values(Role));
    const normalizedCodes = Array.from(new Set(roleCodes.filter((code) => allowed.has(code))));
    const now = Date.now();

    await this.dataSource.transaction(async (manager) => {
      const roleRepo = manager.getRepository(RbacRoleEntity);
      const userRoleRepo = manager.getRepository(RbacUserRoleEntity);

      const roleRecords = await roleRepo.find({
        where: { status: 1 },
        order: { code: "ASC" },
      });

      const roleIdByCode = new Map<string, string>();
      for (const r of roleRecords) {
        if (typeof r.id === "string" && typeof r.code === "string") {
          roleIdByCode.set(r.code, r.id);
        }
      }

      const roleIds = normalizedCodes
        .map((code) => roleIdByCode.get(code))
        .filter((v): v is string => typeof v === "string" && v.length > 0);

      await userRoleRepo.delete({ userId });

      if (roleIds.length === 0) return;
      await userRoleRepo.insert(
        roleIds.map(
          (roleId) =>
            ({
              id: generateId34Safe(),
              userId,
              roleId,
              createdAt: now,
              updatedAt: now,
            }) satisfies Partial<RbacUserRoleEntity>,
        ),
      );
    });
  }

  async createUser(input: CreateUserInput): Promise<AdminUser> {
    const normalizedAccount = input.account.trim().toLowerCase();
    const existing = await this.users.findOne({ where: { account: normalizedAccount } });
    if (existing) throw new Error("ACCOUNT_EXISTS");

    const createdId = generateId34Safe();
    const now = Date.now();
    await this.users.insert({
      id: createdId,
      account: normalizedAccount,
      passwordHash: input.passwordHash,
      status: input.status,
      createdAt: now,
      updatedAt: now,
    });

    await this.setUserRoles(createdId, input.roleCodes);

    const created = await this.findAdminUserById(createdId);
    if (!created) throw new Error("创建用户失败：回读用户信息失败");
    return created;
  }

  async updateUser(input: UpdateUserInput): Promise<AdminUser | null> {
    const patch: Partial<Pick<RbacUserEntity, "passwordHash" | "status" | "updatedAt">> = {};
    if (typeof input.passwordHash === "string" && input.passwordHash.trim().length > 0) {
      patch.passwordHash = input.passwordHash;
    }
    if (input.status) {
      patch.status = input.status;
    }

    if (Object.keys(patch).length > 0) {
      patch.updatedAt = Date.now();
      await this.users.update({ id: input.id }, patch as object);
    }

    if (Array.isArray(input.roleCodes)) {
      await this.setUserRoles(input.id, input.roleCodes);
    }

    return this.findAdminUserById(input.id);
  }

  async disableUser(id: string): Promise<boolean> {
    const existing = await this.findAdminUserById(id);
    if (!existing) return false;
    await this.users.update({ id }, { status: UserStatus.INACTIVE, updatedAt: Date.now() });
    return true;
  }
}
