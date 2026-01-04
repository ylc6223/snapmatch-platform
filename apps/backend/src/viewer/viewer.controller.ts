import { Controller, Get, Post, Param, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ViewerService } from "./viewer.service";
import { PhotoFlag } from "../database/entities/selection.entity";

@ApiTags("客户选片端")
@Controller("viewer")
export class ViewerController {
  constructor(private readonly viewerService: ViewerService) {}

  @Get(":token")
  @ApiOperation({ summary: "获取项目信息" })
  @ApiResponse({ status: 200, type: Object })
  async getProject(@Param("token") token: string) {
    const project = await this.viewerService.getProjectByToken(token);
    const stats = await this.viewerService.getSelectionStats(
      project.id,
      project.customerId,
    );

    return {
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        token: project.token,
        status: project.status,
        photoCount: project.photoCount,
        createdAt: project.createdAt,
      },
      stats,
    };
  }

  @Get(":token/photos")
  @ApiOperation({ summary: "获取项目照片列表" })
  @ApiResponse({ status: 200, type: [Object] })
  async getPhotos(@Param("token") token: string) {
    const project = await this.viewerService.getProjectByToken(token);
    const photos = await this.viewerService.getPhotosByProjectId(
      project.id,
      project.customerId,
    );

    return photos.map((photo) => ({
      id: photo.id,
      filename: photo.filename,
      previewKey: photo.previewKey,
      thumbKey: photo.thumbKey,
      liked: photo.liked || false,
      inAlbum: photo.inAlbum || false,
      retouch: photo.retouch || false,
      markedAt: photo.markedAt || null,
      createdAt: photo.createdAt,
    }));
  }

  @Post(":token/photos/:id/like")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "切换照片喜欢状态" })
  @ApiResponse({ status: 200 })
  async toggleLike(@Param("token") token: string, @Param("id") id: string) {
    return this.viewerService.togglePhotoFlag(token, id, PhotoFlag.LIKED);
  }

  @Post(":token/photos/:id/album")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "切换照片入册状态" })
  @ApiResponse({ status: 200 })
  async toggleAlbum(@Param("token") token: string, @Param("id") id: string) {
    return this.viewerService.togglePhotoFlag(token, id, PhotoFlag.IN_ALBUM);
  }

  @Post(":token/photos/:id/retouch")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "切换照片精修状态" })
  @ApiResponse({ status: 200 })
  async toggleRetouch(@Param("token") token: string, @Param("id") id: string) {
    return this.viewerService.togglePhotoFlag(token, id, PhotoFlag.RETOUCH);
  }

  @Post(":token/submit")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "提交选片" })
  @ApiResponse({ status: 200 })
  async submit(@Param("token") token: string) {
    const project = await this.viewerService.submitSelection(token);
    const stats = await this.viewerService.getSelectionStats(
      project.id,
      project.customerId,
    );

    return {
      projectId: project.id,
      status: project.status,
      likedCount: stats.likedCount,
      inAlbumCount: stats.inAlbumCount,
      retouchCount: stats.retouchCount,
    };
  }

  @Get(":token/stats")
  @ApiOperation({ summary: "获取选片统计" })
  @ApiResponse({ status: 200 })
  async getStats(@Param("token") token: string) {
    const project = await this.viewerService.getProjectByToken(token);
    return this.viewerService.getSelectionStats(project.id, project.customerId);
  }
}
