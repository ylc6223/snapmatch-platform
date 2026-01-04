import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { nanoid } from "nanoid";
import { ProjectEntity, ProjectStatus } from "../database/entities/project.entity";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { ProjectResponseDto } from "./dto/project-response.dto";

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
  ) {}

  /**
   * 创建新项目
   */
  async create(
    createProjectDto: CreateProjectDto,
    viewerBaseUrl: string,
  ): Promise<ProjectResponseDto> {
    // 生成唯一的项目 ID 和 Token
    const projectId = `set_${nanoid(16)}`;
    const token = nanoid(32);

    const now = Date.now();

    const project = this.projectRepository.create({
      id: projectId,
      name: createProjectDto.name,
      description: createProjectDto.description || null,
      customerId: createProjectDto.customerId,
      packageId: createProjectDto.packageId,
      shootDate: createProjectDto.shootDate || null,
      token,
      expiresAt: createProjectDto.expiresAt || null,
      status: ProjectStatus.PENDING,
      photoCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    const saved = await this.projectRepository.save(project);

    return ProjectResponseDto.fromEntity(saved, viewerBaseUrl);
  }

  /**
   * 查询所有项目
   */
  async findAll(viewerBaseUrl: string): Promise<ProjectResponseDto[]> {
    const projects = await this.projectRepository.find({
      order: { createdAt: "DESC" },
    });

    return projects.map((p) => ProjectResponseDto.fromEntity(p, viewerBaseUrl));
  }

  /**
   * 查询单个项目
   */
  async findOne(
    id: string,
    viewerBaseUrl: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException(`项目 ${id} 不存在`);
    }

    return ProjectResponseDto.fromEntity(project, viewerBaseUrl);
  }

  /**
   * 通过 Token 查询项目（用于 Viewer）
   */
  async findByToken(
    token: string,
    viewerBaseUrl: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({ where: { token } });

    if (!project) {
      throw new NotFoundException(`项目不存在`);
    }

    // 检查项目状态：允许待选片和选片中的项目访问
    if (
      project.status !== ProjectStatus.PENDING &&
      project.status !== ProjectStatus.SELECTING
    ) {
      throw new ConflictException(`该项目已不可用`);
    }

    // 检查是否过期
    if (project.expiresAt && project.expiresAt < Date.now()) {
      throw new ConflictException(`该项目已过期`);
    }

    return ProjectResponseDto.fromEntity(project, viewerBaseUrl);
  }

  /**
   * 更新项目
   */
  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    viewerBaseUrl: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException(`项目 ${id} 不存在`);
    }

    // 更新字段
    Object.assign(project, updateProjectDto, { updatedAt: Date.now() });

    const saved = await this.projectRepository.save(project);

    return ProjectResponseDto.fromEntity(saved, viewerBaseUrl);
  }

  /**
   * 删除项目
   */
  async remove(id: string): Promise<void> {
    const project = await this.projectRepository.findOne({ where: { id } });

    if (!project) {
      throw new NotFoundException(`项目 ${id} 不存在`);
    }

    await this.projectRepository.remove(project);
  }

  /**
   * 增加照片计数
   */
  async incrementPhotoCount(projectId: string): Promise<void> {
    await this.projectRepository.increment({ id: projectId }, "photoCount", 1);
  }

  /**
   * 减少照片计数
   */
  async decrementPhotoCount(projectId: string): Promise<void> {
    await this.projectRepository.decrement({ id: projectId }, "photoCount", 1);
  }
}
