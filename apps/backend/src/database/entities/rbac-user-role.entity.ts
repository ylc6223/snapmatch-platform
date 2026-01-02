import { Column, Entity, PrimaryColumn } from "typeorm";
import { bigintMsTransformer } from "./bigint-ms.transformer";

@Entity({ name: "rbac_user_roles" })
export class RbacUserRoleEntity {
  @PrimaryColumn({ name: "_id", type: "varchar", length: 34 })
  id!: string;

  @Column({ name: "userId", type: "varchar", length: 256, nullable: true })
  userId!: string | null;

  @Column({ name: "roleId", type: "varchar", length: 256, nullable: true })
  roleId!: string | null;

  @Column({ name: "createdAt", type: "bigint", nullable: true, transformer: bigintMsTransformer })
  createdAt!: number | null;

  @Column({ name: "updatedAt", type: "bigint", nullable: true, transformer: bigintMsTransformer })
  updatedAt!: number | null;
}

