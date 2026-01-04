import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigService } from "@nestjs/config";
import type { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { AuthSessionEntity } from "./entities/auth-session.entity";
import { ProjectEntity } from "./entities/project.entity";
import { PhotoEntity } from "./entities/photo.entity";
import { CustomerEntity } from "./entities/customer.entity";
import { PackageEntity } from "./entities/package.entity";
import { SelectionEntity } from "./entities/selection.entity";
import { RbacPermissionEntity } from "./entities/rbac-permission.entity";
import { RbacRoleDataScopeEntity } from "./entities/rbac-role-data-scope.entity";
import { RbacRolePermissionEntity } from "./entities/rbac-role-permission.entity";
import { RbacRoleEntity } from "./entities/rbac-role.entity";
import { RbacUserRoleEntity } from "./entities/rbac-user-role.entity";
import { RbacUserEntity } from "./entities/rbac-user.entity";

function normalizeBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  return ["1", "true", "yes", "y", "on"].includes(value.trim().toLowerCase());
}

function buildTypeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
  const host = config.get<string>("DB_HOST") ?? config.get<string>("MYSQL_HOST") ?? "localhost";
  const portValue = config.get<string>("DB_PORT") ?? config.get<string>("MYSQL_PORT") ?? "3306";
  const port = Number(portValue);

  const username = config.get<string>("DB_USERNAME") ?? config.get<string>("MYSQL_USERNAME") ?? "root";
  const password = config.get<string>("DB_PASSWORD") ?? config.get<string>("MYSQL_PASSWORD") ?? "";
  const database = config.get<string>("DB_DATABASE") ?? config.get<string>("MYSQL_DATABASE") ?? "snapmatch";

  const sslEnabled = normalizeBoolean(config.get<string>("DB_SSL"));

  return {
    type: "mysql",
    host,
    port: Number.isFinite(port) && port > 0 ? port : 3306,
    username,
    password,
    database,
    entities: [__dirname + "/**/*.entity{.ts,.js}"],
    synchronize: false,
    logging: (config.get<string>("NODE_ENV") ?? "").toLowerCase() === "development",
    autoLoadEntities: true,
    ...(sslEnabled ? { ssl: { rejectUnauthorized: true } } : {}),
  };
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => buildTypeOrmOptions(config),
    }),
    TypeOrmModule.forFeature([
      AuthSessionEntity,
      RbacUserEntity,
      RbacRoleEntity,
      RbacPermissionEntity,
      RbacUserRoleEntity,
      RbacRolePermissionEntity,
      RbacRoleDataScopeEntity,
      CustomerEntity,
      PackageEntity,
      ProjectEntity,
      PhotoEntity,
      SelectionEntity,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class MysqlModule {}
