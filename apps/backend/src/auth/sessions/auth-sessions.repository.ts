export type CreateSessionInput = {
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  ip?: string | null;
  userAgent?: string | null;
};

export type AuthSession = {
  id: string;
  userId: string;
  refreshTokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
};

export type AuthSessionsRepository = {
  create(input: CreateSessionInput): Promise<AuthSession>;
  findByRefreshTokenHash(refreshTokenHash: string): Promise<AuthSession | null>;
  rotateRefreshToken(sessionId: string, refreshTokenHash: string, expiresAt: Date): Promise<void>;
  touch(sessionId: string): Promise<void>;
  revoke(sessionId: string): Promise<void>;
  revokeByUserId(userId: string): Promise<number>;
  isActive(sessionId: string): Promise<boolean>;
};

export const AUTH_SESSIONS_REPOSITORY = Symbol("AUTH_SESSIONS_REPOSITORY");

