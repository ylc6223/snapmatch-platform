import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProjectEntity } from "../database/entities/project.entity";
import { PhotoEntity } from "../database/entities/photo.entity";

@Injectable()
export class ViewerService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @InjectRepository(PhotoEntity)
    private readonly photoRepository: Repository<PhotoEntity>,
  ) {}

  /**
   * 通过 Token 获取项目信息
   */
  async getProjectByToken(token: string): Promise<ProjectEntity> {
    const project = await this.projectRepository.findOne({ where: { token } });

    if (!project) {
      throw new NotFoundException("项目不存在");
    }

    // 检查项目状态
    if (project.status !== "active") {
      throw new ConflictException("该项目已不可用");
    }

    // 检查是否过期
    if (project.expiresAt && project.expiresAt < Date.now()) {
      throw new ConflictException("该项目已过期");
    }

    return project;
  }

  /**
   * 获取项目的所有照片
   */
  async getPhotosByProjectId(projectId: string): Promise<PhotoEntity[]> {
    return this.photoRepository.find({
      where: { projectId },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * 切换照片选中状态
   */
  async togglePhotoSelection(photoId: string): Promise<PhotoEntity> {
    const photo = await this.photoRepository.findOne({ where: { id: photoId } });

    if (!photo) {
      throw new NotFoundException("照片不存在");
    }

    // 切换选中状态
    photo.selected = !photo.selected;
    photo.selectedAt = photo.selected ? Date.now() : null;

    return this.photoRepository.save(photo);
  }

  /**
   * 提交选片（锁定项目）
   */
  async submitSelection(token: string): Promise<ProjectEntity> {
    const project = await this.projectRepository.findOne({ where: { token } });

    if (!project) {
      throw new NotFoundException("项目不存在");
    }

    if (project.status !== "active") {
      throw new ConflictException("项目已提交或不可用");
    }

    // 更新项目状态为已完成
    project.status = "completed";
    project.updatedAt = Date.now();

    return this.projectRepository.save(project);
  }

  /**
   * 获取选片统计
   */
  async getSelectionStats(projectId: string): Promise<{
    total: number;
    selected: number;
  }> {
    const [totalResult, selectedResult] = await Promise.all([
      this.photoRepository.count({ where: { projectId } }),
      this.photoRepository.count({ where: { projectId, selected: true } }),
    ]);

    return {
      total: totalResult,
      selected: selectedResult,
    };
  }
}
