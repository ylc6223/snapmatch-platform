import type { ConfigService } from "@nestjs/config";
import type { CloudBase } from "@cloudbase/node-sdk";
import type { DataModelMethods, Model } from "@cloudbase/wx-cloud-client-sdk";
import type { AuthSession, AuthSessionsRepository, CreateSessionInput } from "./auth-sessions.repository";

type CloudBaseModels = CloudBase["models"];

type AuthSessionRecord = Model & {
  userId: string;
  refreshTokenHash: string;
  expiresAt: number;
  ip?: string;
  userAgent?: string;
};

function getSingleRecord<T>(result: unknown): T | null {
  const records = (result as { data?: { records?: T[] } })?.data?.records;
  if (!Array.isArray(records) || records.length === 0) return null;
  return records[0] ?? null;
}

function toDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed);
  }
  return null;
}

export class CloudBaseAuthSessionsRepository implements AuthSessionsRepository {
  private readonly modelName: string;

  constructor(
    private readonly models: CloudBaseModels,
    config: ConfigService,
  ) {
    this.modelName = config.get<string>("CLOUDBASE_MODEL_AUTH_SESSIONS") ?? "auth_sessions";
  }

  private getModel(): DataModelMethods<AuthSessionRecord> {
    const model = (this.models as unknown as Record<string, unknown>)[this.modelName] as
      | DataModelMethods<AuthSessionRecord>
      | undefined;
    if (!model) {
      throw new Error(`CloudBase model not found: ${this.modelName}`);
    }
    return model;
  }

  async create(input: CreateSessionInput): Promise<AuthSession> {
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

    const createdId = (result as unknown as { data?: { id?: string } })?.data?.id;
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

  async findByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSession | null> {
    const model = this.getModel();
    const result = await model.list({
      filter: { where: { refreshTokenHash: { $eq: refreshTokenHash } } },
      pageSize: 1,
      pageNumber: 1,
      select: { $master: true },
    });
    const record = getSingleRecord<AuthSessionRecord>(result);
    if (!record) return null;

    if (!record._id) return null;
    const expiresAt = toDate(record.expiresAt);
    if (!expiresAt) return null;

    return {
      id: record._id,
      userId: record.userId,
      refreshTokenHash: record.refreshTokenHash,
      expiresAt,
      revokedAt: null,
    };
  }

  async rotateRefreshToken(sessionId: string, refreshTokenHash: string, expiresAt: Date): Promise<void> {
    const model = this.getModel();
    await model.update({
      // SDK 类型要求 data 为完整 T，这里按“部分更新”语义传参，因此做一次收窄转换。
      data: {
        refreshTokenHash,
        expiresAt: expiresAt.getTime(),
      } as unknown as AuthSessionRecord,
      filter: { where: { _id: { $eq: sessionId } } },
    });
  }

  async touch(sessionId: string): Promise<void> {
    // 精简模型字段：不记录 lastSeenAt，保持 noop
    void sessionId;
  }

  async revoke(sessionId: string): Promise<void> {
    const model = this.getModel();
    await model.delete({
      filter: { where: { _id: { $eq: sessionId } } },
    });
  }

  async revokeByUserId(userId: string): Promise<number> {
    const model = this.getModel();
    const { data } = await model.deleteMany({
      filter: { where: { userId: { $eq: userId } } },
    });
    const count = (data as unknown as { count?: number })?.count;
    return typeof count === "number" ? count : 0;
  }

  async isActive(sessionId: string): Promise<boolean> {
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
    return Boolean(getSingleRecord<AuthSessionRecord>(result));
  }
}
