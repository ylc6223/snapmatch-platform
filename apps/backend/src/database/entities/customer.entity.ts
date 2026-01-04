import { Entity, Column, PrimaryColumn, OneToMany } from "typeorm";
import { bigintMsTransformer } from "./bigint-ms.transformer";
import { ProjectEntity } from "./project.entity";

@Entity({ name: "customers" })
export class CustomerEntity {
  @PrimaryColumn({ name: "_id", type: "varchar", length: 34 })
  id!: string;

  @Column({ name: "name", type: "varchar", length: 128 })
  name!: string;

  @Column({ name: "phone", type: "varchar", length: 20, unique: true })
  phone!: string;

  @Column({ name: "wechatOpenId", type: "varchar", length: 64, nullable: true })
  wechatOpenId!: string | null;

  @Column({ name: "email", type: "varchar", length: 256, nullable: true })
  email!: string | null;

  @Column({ name: "notes", type: "text", nullable: true })
  notes!: string | null;

  @Column({ name: "tags", type: "json", nullable: true })
  tags!: string[] | null;

  @Column({ name: "createdAt", type: "bigint", transformer: bigintMsTransformer })
  createdAt!: number;

  @Column({ name: "updatedAt", type: "bigint", transformer: bigintMsTransformer })
  updatedAt!: number;

  @OneToMany(() => ProjectEntity, (project) => project.customer)
  projects!: ProjectEntity[];
}
