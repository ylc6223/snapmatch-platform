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

/**
 * 项目状态枚举
 */
export enum ProjectStatus {
  PENDING = "pending", // 待选片
  SELECTING = "selecting", // 选片中
  SUBMITTED = "submitted", // 已提交
  RETOUCHING = "retouching", // 修图中
  PENDING_CONFIRMATION = "pending_confirmation", // 待确认
  DELIVERED = "delivered", // 已交付
  CANCELLED = "cancelled", // 已取消
}

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
