import {
  Entity,
  Column,
  PrimaryColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { bigintMsTransformer } from "./bigint-ms.transformer";
import { PhotoEntity } from "./photo.entity";
import { CustomerEntity } from "./customer.entity";
import { PackageEntity } from "./package.entity";
import { ProjectStatus } from "@snapmatch/shared-types";

// 重新导出 ProjectStatus 以供其他模块使用
export { ProjectStatus } from "@snapmatch/shared-types";

@Entity({ name: "projects" })
export class ProjectEntity {
  @PrimaryColumn({ name: "_id", type: "varchar", length: 34 })
  id!: string;

  @Column({ name: "name", type: "varchar", length: 256 })
  name!: string;

  @Column({ name: "description", type: "text", nullable: true })
  description!: string | null;

  /**
   * 客户 ID
   */
  @Column({ name: "customerId", type: "varchar", length: 34 })
  customerId!: string;

  /**
   * 套餐 ID
   */
  @Column({ name: "packageId", type: "varchar", length: 34 })
  packageId!: string;

  /**
   * 拍摄日期（时间戳）
   */
  @Column({ name: "shootDate", type: "bigint", nullable: true })
  shootDate!: number | null;

  /**
   * Viewer 访问 Token
   */
  @Column({ name: "token", type: "varchar", length: 64, unique: true })
  token!: string;

  /**
   * Token 过期时间（时间戳，null 表示永不过期）
   */
  @Column({ name: "expiresAt", type: "bigint", nullable: true })
  expiresAt!: number | null;

  /**
   * 项目状态
   */
  @Column({
    name: "status",
    type: "enum",
    enum: ProjectStatus,
    default: ProjectStatus.PENDING,
  })
  status!: ProjectStatus;

  /**
   * 是否允许下载原图
   */
  @Column({ name: "allowDownloadOriginal", type: "boolean", default: false })
  allowDownloadOriginal!: boolean;

  /**
   * 是否开启水印（默认开启，可按项目关闭）
   */
  @Column({ name: "watermarkEnabled", type: "boolean", default: true })
  watermarkEnabled!: boolean;

  /**
   * 选片截止日期（时间戳）
   */
  @Column({ name: "selectionDeadline", type: "bigint", nullable: true })
  selectionDeadline!: number | null;

  /**
   * 照片总数
   */
  @Column({ name: "photoCount", type: "int", default: 0 })
  photoCount!: number;

  /**
   * 项目封面图（存储 Key，为空时使用第一张照片）
   */
  @Column({ name: "coverImage", type: "varchar", length: 512, nullable: true })
  coverImage!: string | null;

  /**
   * 创建时间（时间戳）
   */
  @Column({ name: "createdAt", type: "bigint", transformer: bigintMsTransformer })
  createdAt!: number;

  /**
   * 更新时间（时间戳）
   */
  @Column({ name: "updatedAt", type: "bigint", transformer: bigintMsTransformer })
  updatedAt!: number;

  @OneToMany(() => PhotoEntity, (photo) => photo.project)
  photos!: PhotoEntity[];

  @ManyToOne(() => CustomerEntity, (customer) => customer.projects)
  @JoinColumn({ name: "customerId" })
  customer!: CustomerEntity;

  @ManyToOne(() => PackageEntity, (pkg) => pkg.projects)
  @JoinColumn({ name: "packageId" })
  package!: PackageEntity;
}
