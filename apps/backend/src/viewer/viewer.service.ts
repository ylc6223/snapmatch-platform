import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ProjectEntity, ProjectStatus } from "../database/entities/project.entity";
import { PhotoEntity } from "../database/entities/photo.entity";
import { SelectionsService } from "../selections/selections.service";
import { PhotoFlag } from "../database/entities/selection.entity";

@Injectable()
export class ViewerService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @InjectRepository(PhotoEntity)
    private readonly photoRepository: Repository<PhotoEntity>,
    private readonly selectionsService: SelectionsService,
  ) {}

  /**
   * 通过 Token 获取项目信息
   */
  async getProjectByToken(token: string): Promise<ProjectEntity> {
    const project = await this.projectRepository.findOne({ where: { token } });

    if (!project) {
      throw new NotFoundException("项目不存在");
    }

    // 检查项目状态：允许选片中的项目访问
    if (
      project.status !== ProjectStatus.PENDING &&
      project.status !== ProjectStatus.SELECTING
    ) {
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
  async getPhotosByProjectId(
    projectId: string,
    customerId: string,
  ): Promise<Array<PhotoEntity & {
      liked: boolean;
      inAlbum: boolean;
      retouch: boolean;
      markedAt: number | null;
    }>> {
    const photos = await this.photoRepository.find({
      where: { projectId },
      order: { createdAt: "DESC" },
    });

    // 获取选片信息
    const selection = await this.selectionsService.getSelection(
      projectId,
      customerId,
    );

    // 将选片信息附加到照片上（用于响应，不修改实体）
    const photoMap = new Map(selection?.items.map((item) => [item.photoId, item]) || []);

    return photos.map((photo) => {
      const selectionItem = photoMap.get(photo.id);
      return {
        ...photo,
        liked: selectionItem?.flags.includes(PhotoFlag.LIKED) || false,
        inAlbum: selectionItem?.flags.includes(PhotoFlag.IN_ALBUM) || false,
        retouch: selectionItem?.flags.includes(PhotoFlag.RETOUCH) || false,
        markedAt: selectionItem?.markedAt || null,
      };
    });
  }

  /**
   * 切换照片标记（喜欢）
   */
  async togglePhotoFlag(
    token: string,
    photoId: string,
    flag: PhotoFlag,
  ): Promise<{
    photoId: string;
    flag: PhotoFlag;
    likedCount: number;
    inAlbumCount: number;
    retouchCount: number;
  }> {
    const project = await this.getProjectByToken(token);
    const photo = await this.photoRepository.findOne({ where: { id: photoId } });

    if (!photo) {
      throw new NotFoundException("照片不存在");
    }

    if (photo.projectId !== project.id) {
      throw new NotFoundException("照片不属于该项目");
    }

    const selection = await this.selectionsService.togglePhotoFlag(
      project.id,
      project.customerId,
      photoId,
      flag,
    );

    return {
      photoId,
      flag,
      likedCount: selection.likedCount,
      inAlbumCount: selection.inAlbumCount,
      retouchCount: selection.retouchCount,
    };
  }

  /**
   * 提交选片（锁定项目）
   */
  async submitSelection(token: string): Promise<ProjectEntity> {
    const project = await this.getProjectByToken(token);

    if (project.status !== ProjectStatus.SELECTING) {
      throw new ConflictException("项目状态不允许提交选片");
    }

    // 提交选片记录
    await this.selectionsService.submitSelection(
      project.id,
      project.customerId,
    );

    // 更新项目状态为已提交
    project.status = ProjectStatus.SUBMITTED;
    project.updatedAt = Date.now();

    return this.projectRepository.save(project);
  }

  /**
   * 获取选片统计
   */
  async getSelectionStats(
    projectId: string,
    customerId: string,
  ): Promise<{
    total: number;
    likedCount: number;
    inAlbumCount: number;
    retouchCount: number;
  }> {
    return this.selectionsService.getSelectionStats(projectId, customerId);
  }
}
