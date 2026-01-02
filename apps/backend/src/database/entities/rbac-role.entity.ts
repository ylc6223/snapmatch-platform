import { Column, Entity, PrimaryColumn } from "typeorm";
import { bigintMsTransformer } from "./bigint-ms.transformer";

@Entity({ name: "rbac_roles" })
export class RbacRoleEntity {
  @PrimaryColumn({ name: "_id", type: "varchar", length: 34 })
  id!: string;

  @Column({ name: "code", type: "varchar", length: 256, nullable: true })
  code!: string | null;

  @Column({ name: "name", type: "varchar", length: 256, nullable: true })
  name!: string | null;

  @Column({ name: "status", type: "double", nullable: true })
  status!: number | null;

  @Column({ name: "createdAt", type: "bigint", nullable: true, transformer: bigintMsTransformer })
  createdAt!: number | null;

  @Column({ name: "updatedAt", type: "bigint", nullable: true, transformer: bigintMsTransformer })
  updatedAt!: number | null;
}

