"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudBaseUsersRepository = void 0;
const types_1 = require("../auth/types");
function splitCsv(value) {
    if (typeof value !== "string")
        return [];
    return value
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
}
function toRoles(values) {
    const items = splitCsv(values);
    const allowed = new Set(Object.values(types_1.Role));
    return items.filter((v) => allowed.has(v));
}
async function runSql(models, sqlTemplate, params) {
    const client = models;
    if (!client.$runSQL) {
        throw new Error("CloudBase models.$runSQL not available");
    }
    const result = await client.$runSQL(sqlTemplate, params);
    const rows = result.data?.executeResultList ?? [];
    return rows;
}
class CloudBaseUsersRepository {
    constructor(models, config) {
        this.models = models;
        this.modelName =
            config.get("CLOUDBASE_MODEL_USERS") ??
                config.get("CLOUDBASE_MODEL_ADMIN_USERS") ??
                "rbac_users";
    }
    async findByAccount(account) {
        const normalized = account.toLowerCase();
        const rows = await runSql(this.models, `
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
      `, { account: normalized });
        const row = rows[0] ?? null;
        if (!row)
            return null;
        const id = typeof row.id === "string" ? row.id : "";
        const accountValue = typeof row.account === "string" ? row.account : "";
        const passwordHash = typeof row.passwordHash === "string" ? row.passwordHash : "";
        const status = typeof row.status === "number" ? row.status : Number(row.status ?? 0);
        if (!id || !accountValue || !passwordHash || status !== 1)
            return null;
        return {
            id,
            account: accountValue,
            passwordHash,
            roles: toRoles(row.roles),
            permissions: splitCsv(row.permissions),
        };
    }
    async findById(id) {
        const rows = await runSql(this.models, `
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
      `, { id });
        const row = rows[0] ?? null;
        if (!row)
            return null;
        const userId = typeof row.id === "string" ? row.id : "";
        const accountValue = typeof row.account === "string" ? row.account : "";
        const passwordHash = typeof row.passwordHash === "string" ? row.passwordHash : "";
        const status = typeof row.status === "number" ? row.status : Number(row.status ?? 0);
        if (!userId || !accountValue || !passwordHash || status !== 1)
            return null;
        return {
            id: userId,
            account: accountValue,
            passwordHash,
            roles: toRoles(row.roles),
            permissions: splitCsv(row.permissions),
        };
    }
}
exports.CloudBaseUsersRepository = CloudBaseUsersRepository;
//# sourceMappingURL=users.repository.cloudbase.js.map