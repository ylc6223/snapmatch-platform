import { createHash, randomBytes } from "node:crypto";
import { Injectable, Inject } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AUTH_SESSIONS_REPOSITORY,
  type AuthSessionsRepository,
} from "./auth-sessions.repository";

function sha256Hex(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function base64Url(bytes: Buffer): string {
  return bytes
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

@Injectable()
export class AuthSessionsService {
  constructor(
    @Inject(AUTH_SESSIONS_REPOSITORY) private readonly repo: AuthSessionsRepository,
    private readonly config: ConfigService,
  ) {}

  private getRefreshTtlDays(): number {
    const days = Number(this.config.get<string>("AUTH_REFRESH_TOKEN_TTL_DAYS") ?? "30");
    return Number.isFinite(days) && days > 0 ? days : 30;
  }

  generateRefreshToken(): string {
    // 只返回给客户端明文 token；数据库仅存 hash。
    return `rt_${base64Url(randomBytes(32))}`;
  }

  hashRefreshToken(refreshToken: string): string {
    return sha256Hex(refreshToken);
  }

  computeExpiresAt(): Date {
    const days = this.getRefreshTtlDays();
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  async createSession(input: { userId: string; ip?: string | null; userAgent?: string | null }) {
    const refreshToken = this.generateRefreshToken();
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const expiresAt = this.computeExpiresAt();
    const session = await this.repo.create({
      userId: input.userId,
      refreshTokenHash,
      expiresAt,
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
    });
    return { sessionId: session.id, refreshToken, expiresAt };
  }

  async rotateByRefreshToken(refreshToken: string) {
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const session = await this.repo.findByRefreshTokenHash(refreshTokenHash);
    if (!session) return null;

    const now = Date.now();
    if (session.revokedAt) return null;
    if (new Date(session.expiresAt).getTime() <= now) return null;

    const nextRefreshToken = this.generateRefreshToken();
    const nextRefreshTokenHash = this.hashRefreshToken(nextRefreshToken);
    const nextExpiresAt = this.computeExpiresAt();

    await this.repo.rotateRefreshToken(session.id, nextRefreshTokenHash, nextExpiresAt);
    await this.repo.touch(session.id);

    return {
      sessionId: session.id,
      userId: session.userId,
      refreshToken: nextRefreshToken,
      expiresAt: nextExpiresAt,
    };
  }

  async revokeByRefreshToken(refreshToken: string): Promise<boolean> {
    const refreshTokenHash = this.hashRefreshToken(refreshToken);
    const session = await this.repo.findByRefreshTokenHash(refreshTokenHash);
    if (!session) return false;
    await this.repo.revoke(session.id);
    return true;
  }

  revokeBySessionId(sessionId: string): Promise<void> {
    return this.repo.revoke(sessionId);
  }

  revokeAllByUserId(userId: string): Promise<number> {
    return this.repo.revokeByUserId(userId);
  }

  isSessionActive(sessionId: string): Promise<boolean> {
    return this.repo.isActive(sessionId);
  }
}

