import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { ProjectsService } from "./projects.service";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { ProjectResponseDto } from "./dto/project-response.dto";
import { SearchProjectDto, SearchResponseDto } from "./dto/search-project.dto";

@ApiTags("项目管理")
@Controller("projects")
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: "创建项目" })
  @ApiResponse({ status: 201, type: ProjectResponseDto })
  create(@Body() createProjectDto: CreateProjectDto): Promise<ProjectResponseDto> {
    const viewerBaseUrl = process.env.VIEWER_BASE_URL || "http://localhost:3000";
    return this.projectsService.create(createProjectDto, viewerBaseUrl);
  }

  @Get()
  @ApiOperation({ summary: "查询所有项目" })
  @ApiResponse({ status: 200, type: [ProjectResponseDto] })
  findAll(): Promise<ProjectResponseDto[]> {
    const viewerBaseUrl = process.env.VIEWER_BASE_URL || "http://localhost:3000";
    return this.projectsService.findAll(viewerBaseUrl);
  }

  @Get("search")
  @ApiOperation({ summary: "搜索项目" })
  @ApiResponse({ status: 200, type: SearchResponseDto })
  async search(@Query() query: Record<string, string>): Promise<SearchResponseDto> {
    const searchDto = new SearchProjectDto();
    searchDto.query = query.query || "";
    searchDto.limit = parseInt(query.limit || "10", 10);
    const viewerBaseUrl = process.env.VIEWER_BASE_URL || "http://localhost:3000";
    return this.projectsService.search(searchDto, viewerBaseUrl);
  }

  @Get(":id")
  @ApiOperation({ summary: "查询单个项目" })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  findOne(@Param("id") id: string): Promise<ProjectResponseDto> {
    const viewerBaseUrl = process.env.VIEWER_BASE_URL || "http://localhost:3000";
    return this.projectsService.findOne(id, viewerBaseUrl);
  }

  @Patch(":id")
  @ApiOperation({ summary: "更新项目" })
  @ApiResponse({ status: 200, type: ProjectResponseDto })
  update(
    @Param("id") id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const viewerBaseUrl = process.env.VIEWER_BASE_URL || "http://localhost:3000";
    return this.projectsService.update(id, updateProjectDto, viewerBaseUrl);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "删除项目" })
  @ApiResponse({ status: 204 })
  remove(@Param("id") id: string): Promise<void> {
    return this.projectsService.remove(id);
  }
}
