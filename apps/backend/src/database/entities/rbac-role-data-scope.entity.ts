import { Column, Entity, PrimaryColumn } from "typeorm";
import { bigintMsTransformer } from "./bigint-ms.transformer";

@Entity({ name: "rbac_role_data_scopes" })
export class RbacRoleDataScopeEntity {
  @PrimaryColumn({ name: "_id", type: "varchar", length: 34 })
  id!: string;

  @Column({ name: "roleId", type: "varchar", length: 256, nullable: true })
  roleId!: string | null;

  @Column({ name: "resource", type: "varchar", length: 256, nullable: true })
  resource!: string | null;

  @Column({ name: "scopeType", type: "varchar", length: 256, nullable: true })
  scopeType!: string | null;

  @Column({ name: "scopeValue", type: "varchar", length: 256, nullable: true })
  scopeValue!: string | null;

  @Column({ name: "createdAt", type: "bigint", nullable: true, transformer: bigintMsTransformer })
  createdAt!: number | null;

  @Column({ name: "updatedAt", type: "bigint", nullable: true, transformer: bigintMsTransformer })
  updatedAt!: number | null;
}

