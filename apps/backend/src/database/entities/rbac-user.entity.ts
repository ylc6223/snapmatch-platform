import { Column, Entity, PrimaryColumn } from "typeorm";
import { bigintMsTransformer } from "./bigint-ms.transformer";

@Entity({ name: "rbac_users" })
export class RbacUserEntity {
  @PrimaryColumn({ name: "_id", type: "varchar", length: 34 })
  id!: string;

  @Column({ name: "account", type: "varchar", length: 256, nullable: true })
  account!: string | null;

  @Column({ name: "passwordHash", type: "varchar", length: 256, nullable: true })
  passwordHash!: string | null;

  @Column({ name: "userType", type: "varchar", length: 256, nullable: true })
  userType!: string | null;

  @Column({ name: "status", type: "double", nullable: true })
  status!: number | null;

  @Column({ name: "createdAt", type: "bigint", nullable: true, transformer: bigintMsTransformer })
  createdAt!: number | null;

  @Column({ name: "updatedAt", type: "bigint", nullable: true, transformer: bigintMsTransformer })
  updatedAt!: number | null;
}

