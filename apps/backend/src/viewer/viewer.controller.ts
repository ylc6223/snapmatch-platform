import { Controller, Get, Post, Param, HttpCode, HttpStatus } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ViewerService } from "./viewer.service";

@ApiTags("客户选片端")
@Controller("viewer")
export class ViewerController {
  constructor(private readonly viewerService: ViewerService) {}

  @Get(":token")
  @ApiOperation({ summary: "获取项目信息" })
  @ApiResponse({ status: 200, type: Object })
  async getProject(@Param("token") token: string) {
    const project = await this.viewerService.getProjectByToken(token);
    const stats = await this.viewerService.getSelectionStats(project.id);

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
    const photos = await this.viewerService.getPhotosByProjectId(project.id);

    return photos.map((photo) => ({
      id: photo.id,
      filename: photo.filename,
      previewKey: photo.previewKey,
      thumbKey: photo.thumbKey,
      selected: photo.selected,
      selectedAt: photo.selectedAt,
      createdAt: photo.createdAt,
    }));
  }

  @Post(":token/photos/:id/toggle")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "切换照片选中状态" })
  @ApiResponse({ status: 200 })
  async togglePhoto(@Param("token") token: string, @Param("id") id: string) {
    // 验证项目可访问
    await this.viewerService.getProjectByToken(token);

    const photo = await this.viewerService.togglePhotoSelection(id);

    return {
      id: photo.id,
      selected: photo.selected,
      selectedAt: photo.selectedAt,
    };
  }

  @Post(":token/submit")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "提交选片" })
  @ApiResponse({ status: 200 })
  async submit(@Param("token") token: string) {
    const project = await this.viewerService.submitSelection(token);
    const stats = await this.viewerService.getSelectionStats(project.id);

    return {
      projectId: project.id,
      status: project.status,
      selectedCount: stats.selected,
    };
  }

  @Get(":token/stats")
  @ApiOperation({ summary: "获取选片统计" })
  @ApiResponse({ status: 200 })
  async getStats(@Param("token") token: string) {
    const project = await this.viewerService.getProjectByToken(token);
    return this.viewerService.getSelectionStats(project.id);
  }
}
