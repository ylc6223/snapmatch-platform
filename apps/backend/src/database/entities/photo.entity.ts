import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { bigintMsTransformer } from "./bigint-ms.transformer";
import { ProjectEntity } from "./project.entity";

@Entity({ name: "photos" })
export class PhotoEntity {
  @PrimaryColumn({ name: "_id", type: "varchar", length: 34 })
  id!: string;

  @Column({ name: "projectId", type: "varchar", length: 34 })
  projectId!: string;

  @Column({ name: "filename", type: "varchar", length: 512 })
  filename!: string;

  @Column({ name: "originalKey", type: "varchar", length: 512 })
  originalKey!: string;

  @Column({ name: "previewKey", type: "varchar", length: 512 })
  previewKey!: string;

  @Column({ name: "thumbKey", type: "varchar", length: 512, nullable: true })
  thumbKey!: string | null;

  @Column({ name: "fileSize", type: "bigint", nullable: true })
  fileSize!: number | null;

  @Column({ name: "width", type: "int", nullable: true })
  width!: number | null;

  @Column({ name: "height", type: "int", nullable: true })
  height!: number | null;

  @Column({ name: "status", type: "varchar", length: 50, default: "processing" })
  status!: string;

  @Column({ name: "selected", type: "boolean", default: false })
  selected!: boolean;

  @Column({ name: "selectedAt", type: "bigint", nullable: true })
  selectedAt!: number | null;

  @Column({ name: "createdAt", type: "bigint", transformer: bigintMsTransformer })
  createdAt!: number;

  @ManyToOne(() => ProjectEntity, (project) => project.photos)
  @JoinColumn({ name: "projectId" })
  project!: ProjectEntity;
}
