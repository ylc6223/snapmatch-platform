import { Entity, Column, PrimaryColumn, ManyToOne, JoinColumn } from "typeorm";
import { bigintMsTransformer } from "./bigint-ms.transformer";
import { ProjectEntity } from "./project.entity";
import { CustomerEntity } from "./customer.entity";

/**
 * 选片状态
 */
export enum SelectionStatus {
  DRAFT = "draft", // 草稿（可修改）
  SUBMITTED = "submitted", // 已提交（锁定）
  LOCKED = "locked", // 已锁定（最终确认）
}

/**
 * 照片标记类型
 */
export enum PhotoFlag {
  LIKED = "liked", // 喜欢
  IN_ALBUM = "in_album", // 入册
  RETOUCH = "retouch", // 精修
}

/**
 * 选片项
 */
export interface SelectionItem {
  photoId: string;
  flags: PhotoFlag[];
  markedAt: number; // 标记时间
}

@Entity({ name: "selections" })
export class SelectionEntity {
  @PrimaryColumn({ name: "_id", type: "varchar", length: 34 })
  id!: string;

  @Column({ name: "projectId", type: "varchar", length: 34 })
  projectId!: string;

  @Column({ name: "customerId", type: "varchar", length: 34 })
  customerId!: string;

  /**
   * 选片状态
   */
  @Column({
    name: "status",
    type: "enum",
    enum: SelectionStatus,
    default: SelectionStatus.DRAFT,
  })
  status!: SelectionStatus;

  /**
   * 选片项列表（JSON）
   */
  @Column({ name: "items", type: "json" })
  items!: SelectionItem[];

  /**
   * 统计：喜欢数量
   */
  @Column({ name: "likedCount", type: "int", default: 0 })
  likedCount!: number;

  /**
   * 统计：入册数量
   */
  @Column({ name: "inAlbumCount", type: "int", default: 0 })
  inAlbumCount!: number;

  /**
   * 统计：精修数量
   */
  @Column({ name: "retouchCount", type: "int", default: 0 })
  retouchCount!: number;

  /**
   * 提交时间（时间戳）
   */
  @Column({ name: "submittedAt", type: "bigint", nullable: true })
  submittedAt!: number | null;

  @Column({ name: "createdAt", type: "bigint", transformer: bigintMsTransformer })
  createdAt!: number;

  @Column({ name: "updatedAt", type: "bigint", transformer: bigintMsTransformer })
  updatedAt!: number;

  @ManyToOne(() => ProjectEntity)
  @JoinColumn({ name: "projectId" })
  project!: ProjectEntity;

  @ManyToOne(() => CustomerEntity)
  @JoinColumn({ name: "customerId" })
  customer!: CustomerEntity;
}
