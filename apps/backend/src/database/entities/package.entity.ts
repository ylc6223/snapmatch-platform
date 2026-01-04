import { Entity, Column, PrimaryColumn, OneToMany } from "typeorm";
import { bigintMsTransformer } from "./bigint-ms.transformer";
import { ProjectEntity } from "./project.entity";

@Entity({ name: "packages" })
export class PackageEntity {
  @PrimaryColumn({ name: "_id", type: "varchar", length: 34 })
  id!: string;

  @Column({ name: "name", type: "varchar", length: 128 })
  name!: string;

  @Column({ name: "description", type: "text", nullable: true })
  description!: string | null;

  /**
   * 包含的精修张数
   */
  @Column({ name: "includedRetouchCount", type: "int", default: 0 })
  includedRetouchCount!: number;

  /**
   * 包含的入册张数
   */
  @Column({ name: "includedAlbumCount", type: "int", default: 0 })
  includedAlbumCount!: number;

  /**
   * 是否底片全送
   */
  @Column({ name: "includeAllOriginals", type: "boolean", default: false })
  includeAllOriginals!: boolean;

  /**
   * 套餐价格（分）
   */
  @Column({ name: "price", type: "int", nullable: true })
  price!: number | null;

  /**
   * 超额精修单价（分/张）
   */
  @Column({ name: "extraRetouchPrice", type: "int", default: 0 })
  extraRetouchPrice!: number;

  /**
   * 超额入册单价（分/张）
   */
  @Column({ name: "extraAlbumPrice", type: "int", default: 0 })
  extraAlbumPrice!: number;

  @Column({ name: "isActive", type: "boolean", default: true })
  isActive!: boolean;

  @Column({ name: "sort", type: "int", default: 0 })
  sort!: number;

  @Column({ name: "createdAt", type: "bigint", transformer: bigintMsTransformer })
  createdAt!: number;

  @Column({ name: "updatedAt", type: "bigint", transformer: bigintMsTransformer })
  updatedAt!: number;

  @OneToMany(() => ProjectEntity, (project) => project.package)
  projects!: ProjectEntity[];
}
