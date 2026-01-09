import { BadRequestException, Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { nanoid } from "nanoid";
import { ProjectEntity, ProjectStatus } from "../database/entities/project.entity";
import { CustomerEntity } from "../database/entities/customer.entity";
import { PackageEntity } from "../database/entities/package.entity";
import { CreateProjectDto } from "./dto/create-project.dto";
import { UpdateProjectDto } from "./dto/update-project.dto";
import { ProjectResponseDto } from "./dto/project-response.dto";
import { SearchProjectDto, SearchResponseDto, SearchResultItemDto } from "./dto/search-project.dto";

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly projectRepository: Repository<ProjectEntity>,
    @InjectRepository(CustomerEntity)
    private readonly customerRepository: Repository<CustomerEntity>,
    @InjectRepository(PackageEntity)
    private readonly packageRepository: Repository<PackageEntity>,
  ) {}

  /**
   * 创建新项目
   */
  async create(
    createProjectDto: CreateProjectDto,
    viewerBaseUrl: string,
  ): Promise<ProjectResponseDto> {
    const customer = await this.customerRepository.findOne({
      where: { id: createProjectDto.customerId },
      select: ["id"],
    });
    if (!customer) {
      throw new BadRequestException({
        code: 400,
        message: "客户不存在",
        errors: [{ field: "customerId", reason: "not found" }],
      });
    }

    const pkg = await this.packageRepository.findOne({
      where: { id: createProjectDto.packageId },
      select: ["id"],
    });
    if (!pkg) {
      throw new BadRequestException({
        code: 400,
        message: "套餐不存在",
        errors: [{ field: "packageId", reason: "not found" }],
      });
    }

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
      relations: ["photos"], // 加载照片关系
    });

    // 为每个项目查找第一张照片用于封面
    const result: ProjectResponseDto[] = [];
    for (const project of projects) {
      const firstPhoto = project.photos && project.photos.length > 0
        ? project.photos.sort((a, b) => a.createdAt - b.createdAt)[0]
        : undefined;

      result.push(ProjectResponseDto.fromEntity(project, viewerBaseUrl, firstPhoto));
    }

    return result;
  }

  /**
   * 查询单个项目
   */
  async findOne(
    id: string,
    viewerBaseUrl: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ["photos"], // 加载照片关系
    });

    if (!project) {
      throw new NotFoundException(`项目 ${id} 不存在`);
    }

    // 获取第一张照片用于封面
    const firstPhoto = project.photos && project.photos.length > 0
      ? project.photos.sort((a, b) => a.createdAt - b.createdAt)[0]
      : undefined;

    return ProjectResponseDto.fromEntity(project, viewerBaseUrl, firstPhoto);
  }

  /**
   * 通过 Token 查询项目（用于 Viewer）
   */
  async findByToken(
    token: string,
    viewerBaseUrl: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({
      where: { token },
      relations: ["photos"], // 加载照片关系
    });

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

    // 获取第一张照片用于封面
    const firstPhoto = project.photos && project.photos.length > 0
      ? project.photos.sort((a, b) => a.createdAt - b.createdAt)[0]
      : undefined;

    return ProjectResponseDto.fromEntity(project, viewerBaseUrl, firstPhoto);
  }

  /**
   * 更新项目
   */
  async update(
    id: string,
    updateProjectDto: UpdateProjectDto,
    viewerBaseUrl: string,
  ): Promise<ProjectResponseDto> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ["photos"], // 加载照片关系
    });

    if (!project) {
      throw new NotFoundException(`项目 ${id} 不存在`);
    }

    // 更新字段
    Object.assign(project, updateProjectDto, { updatedAt: Date.now() });

    const saved = await this.projectRepository.save(project);

    // 获取第一张照片用于封面
    const firstPhoto = saved.photos && saved.photos.length > 0
      ? saved.photos.sort((a, b) => a.createdAt - b.createdAt)[0]
      : undefined;

    return ProjectResponseDto.fromEntity(saved, viewerBaseUrl, firstPhoto);
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

  /**
   * 搜索项目（按项目名称或客户名称）
   */
  async search(
    searchDto: SearchProjectDto,
    viewerBaseUrl: string,
  ): Promise<SearchResponseDto> {
    const { query, limit = 10 } = searchDto;

    // 使用 QueryBuilder 实现模糊搜索
    const queryBuilder = this.projectRepository
      .createQueryBuilder("project")
      .leftJoinAndSelect("project.customer", "customer")
      .where("(project.name LIKE :query OR customer.name LIKE :query)", {
        query: `%${query}%`,
      })
      .orderBy("project.createdAt", "DESC")
      .limit(limit);

    const [projects, total] = await queryBuilder.getManyAndCount();

    const results: SearchResultItemDto[] = projects.map((project) => ({
      id: project.id,
      name: project.name,
      customerName: project.customer?.name,
      status: project.status,
      viewerUrl: `${viewerBaseUrl}/viewer/${project.token}`,
    }));

    return {
      results,
      total,
    };
  }
}
