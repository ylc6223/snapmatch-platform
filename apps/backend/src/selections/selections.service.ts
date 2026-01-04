import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SelectionEntity, SelectionItem, PhotoFlag, SelectionStatus } from "../database/entities/selection.entity";

@Injectable()
export class SelectionsService {
  constructor(
    @InjectRepository(SelectionEntity)
    private readonly selectionRepository: Repository<SelectionEntity>,
  ) {}

  /**
   * 获取或创建项目的选片记录
   */
  async getOrCreateSelection(
    projectId: string,
    customerId: string,
  ): Promise<SelectionEntity> {
    let selection = await this.selectionRepository.findOne({
      where: { projectId, customerId },
    });

    if (!selection) {
      const selectionId = `sel_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 11)}`;
      const now = Date.now();

      selection = this.selectionRepository.create({
        id: selectionId,
        projectId,
        customerId,
        status: SelectionStatus.DRAFT,
        items: [],
        likedCount: 0,
        inAlbumCount: 0,
        retouchCount: 0,
        submittedAt: null,
        createdAt: now,
        updatedAt: now,
      });

      selection = await this.selectionRepository.save(selection);
    }

    return selection;
  }

  /**
   * 切换照片标记
   */
  async togglePhotoFlag(
    projectId: string,
    customerId: string,
    photoId: string,
    flag: PhotoFlag,
  ): Promise<SelectionEntity> {
    const selection = await this.getOrCreateSelection(projectId, customerId);

    if (selection.status !== SelectionStatus.DRAFT) {
      throw new NotFoundException("选片已提交，无法修改");
    }

    const existingItemIndex = selection.items.findIndex(
      (item) => item.photoId === photoId,
    );

    if (existingItemIndex >= 0) {
      const item = selection.items[existingItemIndex];
      const flagIndex = item.flags.indexOf(flag);

      if (flagIndex >= 0) {
        // 移除标记
        item.flags = item.flags.filter((f) => f !== flag);
        if (item.flags.length === 0) {
          selection.items = selection.items.filter((i) => i.photoId !== photoId);
        }
      } else {
        // 添加标记
        item.flags = [...item.flags, flag];
        item.markedAt = Date.now();
      }
    } else {
      // 创建新标记项
      const newItem: SelectionItem = {
        photoId,
        flags: [flag],
        markedAt: Date.now(),
      };
      selection.items = [...selection.items, newItem];
    }

    // 更新统计
    selection.likedCount = selection.items.filter((item) =>
      item.flags.includes(PhotoFlag.LIKED),
    ).length;
    selection.inAlbumCount = selection.items.filter((item) =>
      item.flags.includes(PhotoFlag.IN_ALBUM),
    ).length;
    selection.retouchCount = selection.items.filter((item) =>
      item.flags.includes(PhotoFlag.RETOUCH),
    ).length;
    selection.updatedAt = Date.now();

    return this.selectionRepository.save(selection);
  }

  /**
   * 提交选片
   */
  async submitSelection(
    projectId: string,
    customerId: string,
  ): Promise<SelectionEntity> {
    const selection = await this.getOrCreateSelection(projectId, customerId);

    if (selection.status !== SelectionStatus.DRAFT) {
      throw new NotFoundException("选片已提交或已锁定");
    }

    selection.status = SelectionStatus.SUBMITTED;
    selection.submittedAt = Date.now();
    selection.updatedAt = Date.now();

    return this.selectionRepository.save(selection);
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
    const selection = await this.getOrCreateSelection(projectId, customerId);

    return {
      total: selection.items.length,
      likedCount: selection.likedCount,
      inAlbumCount: selection.inAlbumCount,
      retouchCount: selection.retouchCount,
    };
  }

  /**
   * 获取选片记录详情
   */
  async getSelection(
    projectId: string,
    customerId: string,
  ): Promise<SelectionEntity | null> {
    return this.selectionRepository.findOne({
      where: { projectId, customerId },
    });
  }
}
