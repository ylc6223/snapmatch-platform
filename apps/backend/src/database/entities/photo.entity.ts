import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { bigintMsTransformer } from "./bigint-ms.transformer";
import { ProjectEntity } from "./project.entity";

/**
 * 照片处理状态
 */
export enum PhotoStatus {
  PROCESSING = "processing", // 处理中
  READY = "ready", // 就绪
  FAILED = "failed", // 失败
}

@Entity({ name: "photos" })
export class PhotoEntity {
  @PrimaryColumn({ name: "_id", type: "varchar", length: 34 })
  id!: string;

  @Column({ name: "projectId", type: "varchar", length: 34 })
  projectId!: string;

  @Column({ name: "filename", type: "varchar", length: 512 })
  filename!: string;

  /**
   * 原图存储 Key
   */
  @Column({ name: "originalKey", type: "varchar", length: 512 })
  originalKey!: string;

  /**
   * 预览图存储 Key（带水印）
   */
  @Column({ name: "previewKey", type: "varchar", length: 512 })
  previewKey!: string;

  /**
   * 缩略图存储 Key
   */
  @Column({ name: "thumbKey", type: "varchar", length: 512, nullable: true })
  thumbKey!: string | null;

  /**
   * 精修图存储 Key（修图师上传后填充）
   */
  @Column({ name: "retouchedKey", type: "varchar", length: 512, nullable: true })
  retouchedKey!: string | null;

  /**
   * 精修预览图存储 Key（带水印）
   */
  @Column({
    name: "retouchedPreviewKey",
    type: "varchar",
    length: 512,
    nullable: true,
  })
  retouchedPreviewKey!: string | null;

  @Column({ name: "fileSize", type: "bigint", nullable: true })
  fileSize!: number | null;

  @Column({ name: "width", type: "int", nullable: true })
  width!: number | null;

  @Column({ name: "height", type: "int", nullable: true })
  height!: number | null;

  /**
   * EXIF 信息（JSON 存储）
   */
  @Column({ name: "exif", type: "json", nullable: true })
  exif!: Record<string, unknown> | null;

  /**
   * 照片处理状态
   */
  @Column({
    name: "status",
    type: "enum",
    enum: PhotoStatus,
    default: PhotoStatus.PROCESSING,
  })
  status!: PhotoStatus;

  @Column({ name: "createdAt", type: "bigint", transformer: bigintMsTransformer })
  createdAt!: number;

  @ManyToOne(() => ProjectEntity, (project) => project.photos)
  @JoinColumn({ name: "projectId" })
  project!: ProjectEntity;
}
