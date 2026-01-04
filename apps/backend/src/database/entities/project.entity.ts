import { Entity, Column, PrimaryColumn, OneToMany } from "typeorm";
import { bigintMsTransformer } from "./bigint-ms.transformer";
import { PhotoEntity } from "./photo.entity";

@Entity({ name: "projects" })
export class ProjectEntity {
  @PrimaryColumn({ name: "_id", type: "varchar", length: 34 })
  id!: string;

  @Column({ name: "name", type: "varchar", length: 256 })
  name!: string;

  @Column({ name: "description", type: "text", nullable: true })
  description!: string | null;

  @Column({ name: "token", type: "varchar", length: 64, unique: true })
  token!: string;

  @Column({ name: "expiresAt", type: "bigint", nullable: true })
  expiresAt!: number | null;

  @Column({ name: "status", type: "varchar", length: 50, default: "active" })
  status!: string;

  @Column({ name: "photoCount", type: "int", default: 0 })
  photoCount!: number;

  @Column({ name: "createdAt", type: "bigint", transformer: bigintMsTransformer })
  createdAt!: number;

  @Column({ name: "updatedAt", type: "bigint", transformer: bigintMsTransformer })
  updatedAt!: number;

  @OneToMany(() => PhotoEntity, (photo) => photo.project)
  photos!: PhotoEntity[];
}
