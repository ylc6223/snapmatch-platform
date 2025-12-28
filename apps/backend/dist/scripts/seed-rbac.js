"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const node_sdk_1 = require("@cloudbase/node-sdk");
function parseEnvLine(line) {
    const trimmed = line.trim();
    if (trimmed.length === 0)
        return null;
    if (trimmed.startsWith("#"))
        return null;
    const index = trimmed.indexOf("=");
    if (index <= 0)
        return null;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (value.startsWith("\"") && value.endsWith("\""))
        value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'"))
        value = value.slice(1, -1);
    return { key, value };
}
function loadEnvFiles(cwd, filenames) {
    for (const filename of filenames) {
        const fullPath = node_path_1.default.join(cwd, filename);
        if (!node_fs_1.default.existsSync(fullPath))
            continue;
        const content = node_fs_1.default.readFileSync(fullPath, "utf8");
        for (const line of content.split(/\r?\n/)) {
            const parsed = parseEnvLine(line);
            if (!parsed)
                continue;
            if (process.env[parsed.key] === undefined) {
                process.env[parsed.key] = parsed.value;
            }
        }
    }
}
function requireEnv(name) {
    const value = process.env[name];
    if (!value || value.trim().length === 0) {
        throw new Error(`Missing env: ${name}`);
    }
    return value.trim();
}
async function resolvePasswordHash(which) {
    const prefix = which.toUpperCase();
    const hash = process.env[`SEED_${prefix}_PASSWORD_HASH`]?.trim();
    if (hash)
        return hash;
    const password = process.env[`SEED_${prefix}_PASSWORD`]?.trim();
    if (!password) {
        throw new Error(`Missing seed password for ${which}. Set SEED_${prefix}_PASSWORD_HASH (recommended) or SEED_${prefix}_PASSWORD.`);
    }
    return bcryptjs_1.default.hash(password, 10);
}
function getModel(models, modelName) {
    const model = models[modelName];
    if (!model)
        throw new Error(`CloudBase model not found: ${modelName}`);
    return model;
}
async function findSingleByField(model, field, value) {
    const { data } = await model.list({
        filter: { where: { [field]: { $eq: value } } },
        pageSize: 1,
        pageNumber: 1,
    });
    return data.records[0] ?? null;
}
async function upsertByField(model, field, value, create, update) {
    await model.upsert({
        create,
        update: update,
        filter: { where: { [field]: { $eq: value } } },
    });
}
async function ensureIdsByCode(model, items) {
    const map = new Map();
    for (const item of items) {
        await upsertByField(model, "code", item.code, item.create, item.update);
        const record = await findSingleByField(model, "code", item.code);
        if (!record?._id)
            throw new Error(`Failed to fetch model record _id for code=${item.code}`);
        map.set(item.code, record._id);
    }
    return map;
}
async function main() {
    loadEnvFiles(process.cwd(), [".env.local", ".env"]);
    const env = process.env.CLOUDBASE_ENV ?? process.env.TCB_ENV;
    if (!env || env.trim().length === 0)
        throw new Error("Missing CLOUDBASE_ENV (or TCB_ENV)");
    const region = process.env.CLOUDBASE_REGION ?? "ap-shanghai";
    const secretId = requireEnv("CLOUDBASE_SECRET_ID");
    const secretKey = requireEnv("CLOUDBASE_SECRET_KEY");
    const usersModelName = process.env.CLOUDBASE_MODEL_USERS ?? process.env.CLOUDBASE_MODEL_ADMIN_USERS ?? "rbac_users";
    const rolesModelName = process.env.CLOUDBASE_MODEL_RBAC_ROLES ?? "rbac_roles";
    const permissionsModelName = process.env.CLOUDBASE_MODEL_RBAC_PERMISSIONS ?? "rbac_permissions";
    const userRolesModelName = process.env.CLOUDBASE_MODEL_RBAC_USER_ROLES ?? "rbac_user_roles";
    const rolePermsModelName = process.env.CLOUDBASE_MODEL_RBAC_ROLE_PERMISSIONS ?? "rbac_role_permissions";
    const roleScopesModelName = process.env.CLOUDBASE_MODEL_RBAC_ROLE_DATA_SCOPES ?? "rbac_role_data_scopes";
    const app = (0, node_sdk_1.init)({ env: env.trim(), region: region.trim(), secretId, secretKey });
    const models = app.models;
    const usersModel = getModel(models, usersModelName);
    const rolesModel = getModel(models, rolesModelName);
    const permsModel = getModel(models, permissionsModelName);
    const userRolesModel = getModel(models, userRolesModelName);
    const rolePermsModel = getModel(models, rolePermsModelName);
    const roleScopesModel = getModel(models, roleScopesModelName);
    const roles = [
        { code: "admin", name: "管理员(摄影师)", status: 1 },
        { code: "customer", name: "访客(客户)", status: 1 },
    ];
    const resources = ["dashboard", "packages", "assets", "users", "settings"];
    const permissions = [
        ...resources.map((r) => ({
            code: `page:${r}`,
            type: "page",
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
                        type: "action",
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
                    type: "action",
                    resource: r,
                    action: "read",
                    name: `读取：${r}`,
                    status: 1,
                },
                {
                    code: `${r}:write`,
                    type: "action",
                    resource: r,
                    action: "write",
                    name: `写入：${r}`,
                    status: 1,
                },
            ];
        }),
    ];
    const roleIdByCode = await ensureIdsByCode(rolesModel, roles.map((r) => ({
        code: r.code,
        create: { code: r.code, name: r.name, status: r.status },
        update: { name: r.name, status: r.status },
    })));
    const permissionIdByCode = await ensureIdsByCode(permsModel, permissions.map((p) => ({
        code: p.code,
        create: {
            code: p.code,
            type: p.type,
            resource: p.resource,
            action: p.action,
            name: p.name,
            status: p.status,
        },
        update: {
            type: p.type,
            resource: p.resource,
            action: p.action,
            name: p.name,
            status: p.status,
        },
    })));
    const adminHash = await resolvePasswordHash("admin");
    const visitorHash = await resolvePasswordHash("visitor");
    const seedUsers = [
        { envType: "admin", account: "admin", passwordHash: adminHash, userType: "photographer", status: 1 },
        { envType: "visitor", account: "visitor", passwordHash: visitorHash, userType: "customer", status: 1 },
    ];
    const userIdByAccount = new Map();
    for (const user of seedUsers) {
        const account = user.account.toLowerCase();
        await upsertByField(usersModel, "account", account, {
            account,
            passwordHash: user.passwordHash,
            userType: user.userType,
            status: user.status,
        }, {
            passwordHash: user.passwordHash,
            userType: user.userType,
            status: user.status,
        });
        const record = await findSingleByField(usersModel, "account", account);
        if (!record?._id)
            throw new Error(`Failed to fetch user _id for account=${account}`);
        userIdByAccount.set(account, record._id);
    }
    const userRoleEdges = [
        { userId: userIdByAccount.get("admin"), roleId: roleIdByCode.get("admin") },
        { userId: userIdByAccount.get("visitor"), roleId: roleIdByCode.get("customer") },
    ];
    for (const edge of userRoleEdges) {
        await userRolesModel.deleteMany({ filter: { where: { userId: { $eq: edge.userId } } } });
    }
    await userRolesModel.createMany({ data: userRoleEdges });
    const adminRoleId = roleIdByCode.get("admin");
    const customerRoleId = roleIdByCode.get("customer");
    const adminPermissionIds = Array.from(permissionIdByCode.values());
    const customerPermissionIds = [
        permissionIdByCode.get("page:dashboard"),
        permissionIdByCode.get("page:packages"),
        permissionIdByCode.get("page:assets"),
        permissionIdByCode.get("dashboard:view"),
        permissionIdByCode.get("packages:read"),
        permissionIdByCode.get("assets:read"),
    ].filter((v) => Boolean(v));
    await rolePermsModel.deleteMany({ filter: { where: { roleId: { $eq: adminRoleId } } } });
    await rolePermsModel.deleteMany({ filter: { where: { roleId: { $eq: customerRoleId } } } });
    await rolePermsModel.createMany({
        data: adminPermissionIds.map((permissionId) => ({ roleId: adminRoleId, permissionId })),
    });
    await rolePermsModel.createMany({
        data: customerPermissionIds.map((permissionId) => ({ roleId: customerRoleId, permissionId })),
    });
    const scopes = [
        { roleCode: "admin", resource: "*", scopeType: "all" },
        { roleCode: "customer", resource: "packages", scopeType: "self" },
        { roleCode: "customer", resource: "assets", scopeType: "self" },
    ];
    await roleScopesModel.deleteMany({ filter: { where: { roleId: { $eq: adminRoleId } } } });
    await roleScopesModel.deleteMany({ filter: { where: { roleId: { $eq: customerRoleId } } } });
    await roleScopesModel.createMany({
        data: scopes.map((s) => ({
            roleId: roleIdByCode.get(s.roleCode),
            resource: s.resource,
            scopeType: s.scopeType,
            scopeValue: s.scopeValue ?? "",
        })),
    });
    console.log("[seed-rbac] ok");
}
void main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[seed-rbac] failed: ${message}`);
    process.exit(1);
});
//# sourceMappingURL=seed-rbac.js.map