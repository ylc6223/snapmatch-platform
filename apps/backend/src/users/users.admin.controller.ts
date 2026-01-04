import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../auth/types";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { ListUsersQuery } from "./dto/list-users.query";
import { UpdateUserDto } from "./dto/update-user.dto";

@ApiTags("users")
@ApiBearerAuth()
@Controller("users")
@Roles(Role.Admin)
export class UsersAdminController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: "用户列表（管理端）" })
  listUsers(@Query() query: ListUsersQuery) {
    const page = Number.isFinite(query.page) && (query.page ?? 0) > 0 ? Math.floor(query.page!) : 1;
    const pageSize =
      Number.isFinite(query.pageSize) && (query.pageSize ?? 0) > 0
        ? Math.min(100, Math.floor(query.pageSize!))
        : 20;

    return this.users.listUsers({
      page,
      pageSize,
      query: query.q ?? null,
      status: query.status ?? null,
      sortBy: query.sortBy ?? null,
      sortOrder: query.sortOrder ?? null,
    });
  }

  @Get("roles")
  @ApiOperation({ summary: "角色列表（用于账号分配）" })
  listRoles() {
    return this.users.listRoles();
  }

  @Post()
  @ApiOperation({ summary: "创建用户（管理端）" })
  createUser(@Body() dto: CreateUserDto) {
    return this.users.createUser({
      account: dto.account,
      password: dto.password,
      roleCodes: dto.roleCodes,
      status: dto.status ?? 1,
    });
  }

  @Patch(":id")
  @ApiOperation({ summary: "更新用户（管理端）" })
  async updateUser(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    const updated = await this.users.updateUser({
      id,
      password: dto.password ?? null,
      roleCodes: dto.roleCodes ?? null,
      status: dto.status ?? null,
    });
    if (!updated) throw new NotFoundException({ code: 404, message: "用户不存在" });
    return updated;
  }

  @Delete(":id")
  @ApiOperation({ summary: "禁用用户（管理端）" })
  async disableUser(@Param("id") id: string) {
    const ok = await this.users.disableUser(id);
    if (!ok) throw new NotFoundException({ code: 404, message: "用户不存在" });
    return { ok: true };
  }
}
