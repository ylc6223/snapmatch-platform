import { Column, Entity, PrimaryColumn } from "typeorm";
import { bigintMsTransformer } from "./bigint-ms.transformer";

@Entity({ name: "auth_sessions" })
export class AuthSessionEntity {
  @PrimaryColumn({ name: "_id", type: "varchar", length: 34 })
  id!: string;

  @Column({ name: "userId", type: "varchar", length: 256, nullable: true })
  userId!: string | null;

  @Column({ name: "refreshTokenHash", type: "varchar", length: 256, nullable: true })
  refreshTokenHash!: string | null;

  @Column({ name: "expiresAt", type: "double", nullable: true })
  expiresAt!: number | null;

  @Column({ name: "ip", type: "varchar", length: 256, nullable: true })
  ip!: string | null;

  @Column({ name: "userAgent", type: "varchar", length: 256, nullable: true })
  userAgent!: string | null;

  @Column({ name: "createdAt", type: "bigint", nullable: true, transformer: bigintMsTransformer })
  createdAt!: number | null;

  @Column({ name: "updatedAt", type: "bigint", nullable: true, transformer: bigintMsTransformer })
  updatedAt!: number | null;
}

