import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuthSessionEntity } from "../../database/entities/auth-session.entity";
import type { AuthSession, AuthSessionsRepository, CreateSessionInput } from "./auth-sessions.repository";

function generateId34Safe(): string {
  return randomUUID().replaceAll("-", "");
}

@Injectable()
export class MySqlAuthSessionsRepository implements AuthSessionsRepository {
  constructor(@InjectRepository(AuthSessionEntity) private readonly sessions: Repository<AuthSessionEntity>) {}

  async create(input: CreateSessionInput): Promise<AuthSession> {
    const createdId = generateId34Safe();
    const now = Date.now();

    await this.sessions.insert({
      id: createdId,
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      expiresAt: input.expiresAt.getTime(),
      ip: input.ip ?? "",
      userAgent: input.userAgent ?? "",
      createdAt: now,
      updatedAt: now,
    } satisfies Partial<AuthSessionEntity>);

    return {
      id: createdId,
      userId: input.userId,
      refreshTokenHash: input.refreshTokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
    };
  }

  async findByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSession | null> {
    const record = await this.sessions.findOne({ where: { refreshTokenHash } });
    if (!record?.id) return null;
    if (typeof record.userId !== "string" || record.userId.length === 0) return null;
    if (typeof record.refreshTokenHash !== "string" || record.refreshTokenHash.length === 0) return null;
    if (typeof record.expiresAt !== "number" || !Number.isFinite(record.expiresAt)) return null;

    return {
      id: record.id,
      userId: record.userId,
      refreshTokenHash: record.refreshTokenHash,
      expiresAt: new Date(record.expiresAt),
      revokedAt: null,
    };
  }

  async rotateRefreshToken(sessionId: string, refreshTokenHash: string, expiresAt: Date): Promise<void> {
    await this.sessions.update(
      { id: sessionId },
      { refreshTokenHash, expiresAt: expiresAt.getTime(), updatedAt: Date.now() },
    );
  }

  async touch(sessionId: string): Promise<void> {
    // 精简模型字段：不记录 lastSeenAt，保持 noop
    void sessionId;
  }

  async revoke(sessionId: string): Promise<void> {
    await this.sessions.delete({ id: sessionId });
  }

  async revokeByUserId(userId: string): Promise<number> {
    const result = await this.sessions.delete({ userId });
    return typeof result.affected === "number" ? result.affected : 0;
  }

  async isActive(sessionId: string): Promise<boolean> {
    const count = await this.sessions
      .createQueryBuilder("s")
      .where("s.id = :id", { id: sessionId })
      .andWhere("s.expiresAt > :now", { now: Date.now() })
      .getCount();
    return count > 0;
  }
}
