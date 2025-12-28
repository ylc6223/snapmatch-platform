"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudBaseAuthSessionsRepository = void 0;
function getSingleRecord(result) {
    const records = result?.data?.records;
    if (!Array.isArray(records) || records.length === 0)
        return null;
    return records[0] ?? null;
}
function toDate(value) {
    if (value === null || value === undefined)
        return null;
    if (value instanceof Date)
        return value;
    if (typeof value === "number")
        return new Date(value);
    if (typeof value === "string") {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? null : new Date(parsed);
    }
    return null;
}
class CloudBaseAuthSessionsRepository {
    constructor(models, config) {
        this.models = models;
        this.modelName = config.get("CLOUDBASE_MODEL_AUTH_SESSIONS") ?? "auth_sessions";
    }
    getModel() {
        const model = this.models[this.modelName];
        if (!model) {
            throw new Error(`CloudBase model not found: ${this.modelName}`);
        }
        return model;
    }
    async create(input) {
        const model = this.getModel();
        const result = await model.create({
            data: {
                userId: input.userId,
                refreshTokenHash: input.refreshTokenHash,
                expiresAt: input.expiresAt.getTime(),
                ip: input.ip ?? "",
                userAgent: input.userAgent ?? "",
            },
        });
        const createdId = result?.data?.id;
        if (!createdId) {
            throw new Error("CloudBase create session failed: missing id");
        }
        return {
            id: createdId,
            userId: input.userId,
            refreshTokenHash: input.refreshTokenHash,
            expiresAt: input.expiresAt,
            revokedAt: null,
        };
    }
    async findByRefreshTokenHash(refreshTokenHash) {
        const model = this.getModel();
        const result = await model.list({
            filter: { where: { refreshTokenHash: { $eq: refreshTokenHash } } },
            pageSize: 1,
            pageNumber: 1,
            select: { $master: true },
        });
        const record = getSingleRecord(result);
        if (!record)
            return null;
        if (!record._id)
            return null;
        const expiresAt = toDate(record.expiresAt);
        if (!expiresAt)
            return null;
        return {
            id: record._id,
            userId: record.userId,
            refreshTokenHash: record.refreshTokenHash,
            expiresAt,
            revokedAt: null,
        };
    }
    async rotateRefreshToken(sessionId, refreshTokenHash, expiresAt) {
        const model = this.getModel();
        await model.update({
            data: {
                refreshTokenHash,
                expiresAt: expiresAt.getTime(),
            },
            filter: { where: { _id: { $eq: sessionId } } },
        });
    }
    async touch(sessionId) {
        void sessionId;
    }
    async revoke(sessionId) {
        const model = this.getModel();
        await model.delete({
            filter: { where: { _id: { $eq: sessionId } } },
        });
    }
    async revokeByUserId(userId) {
        const model = this.getModel();
        const { data } = await model.deleteMany({
            filter: { where: { userId: { $eq: userId } } },
        });
        const count = data?.count;
        return typeof count === "number" ? count : 0;
    }
    async isActive(sessionId) {
        const model = this.getModel();
        const result = await model.list({
            filter: {
                where: {
                    expiresAt: { $gt: Date.now() },
                    _id: { $eq: sessionId },
                },
            },
            pageSize: 1,
            pageNumber: 1,
            select: { $master: true },
        });
        return Boolean(getSingleRecord(result));
    }
}
exports.CloudBaseAuthSessionsRepository = CloudBaseAuthSessionsRepository;
//# sourceMappingURL=auth-sessions.repository.cloudbase.js.map