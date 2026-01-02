import { Column, Entity, PrimaryColumn } from "typeorm";
import { bigintMsTransformer } from "./bigint-ms.transformer";

@Entity({ name: "rbac_permissions" })
export class RbacPermissionEntity {
  @PrimaryColumn({ name: "_id", type: "varchar", length: 34 })
  id!: string;

  @Column({ name: "code", type: "varchar", length: 256, nullable: true })
  code!: string | null;

  @Column({ name: "resource", type: "varchar", length: 256, nullable: true })
  resource!: string | null;

  @Column({ name: "type", type: "varchar", length: 256, nullable: true })
  type!: string | null;

  @Column({ name: "name", type: "varchar", length: 256, nullable: true })
  name!: string | null;

  @Column({ name: "action", type: "varchar", length: 256, nullable: true })
  action!: string | null;

  @Column({ name: "status", type: "double", nullable: true })
  status!: number | null;

  @Column({ name: "createdAt", type: "bigint", nullable: true, transformer: bigintMsTransformer })
  createdAt!: number | null;

  @Column({ name: "updatedAt", type: "bigint", nullable: true, transformer: bigintMsTransformer })
  updatedAt!: number | null;
}

