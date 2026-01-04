import {
  Column,
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { bigintMsTransformer } from "./bigint-ms.transformer";
import { CustomerEntity } from "./customer.entity";

/**
 * 用户角色枚举
 */
export enum UserRole {
  ADMIN = "admin", // 管理员/摄影师
  CUSTOMER = "customer", // 客户
}

/**
 * 用户状态枚举
 */
export enum UserStatus {
  ACTIVE = "active", // 正常
  INACTIVE = "inactive", // 禁用
  PENDING = "pending", // 待激活
}

@Entity({ name: "rbac_users" })
export class RbacUserEntity {
  @PrimaryColumn({ name: "_id", type: "varchar", length: 34 })
  id!: string;

  /**
   * 登录账号（管理员使用，如：xiaowang）
   */
  @Column({ name: "account", type: "varchar", length: 128, nullable: true })
  account!: string | null;

  /**
   * 手机号（客户使用，如：13800138000）
   */
  @Column({ name: "phone", type: "varchar", length: 20, nullable: true, unique: true })
  phone!: string | null;

  /**
   * 密码哈希
   */
  @Column({ name: "passwordHash", type: "varchar", length: 256, nullable: true })
  passwordHash!: string | null;

  /**
   * 关联的客户 ID（仅客户角色有值）
   */
  @Column({ name: "customerId", type: "varchar", length: 34, nullable: true })
  customerId!: string | null;

  /**
   * 用户状态
   */
  @Column({
    name: "status",
    type: "enum",
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;

  @Column({ name: "createdAt", type: "bigint", transformer: bigintMsTransformer })
  createdAt!: number;

  @Column({ name: "updatedAt", type: "bigint", transformer: bigintMsTransformer })
  updatedAt!: number;

  @ManyToOne(() => CustomerEntity, { nullable: true })
  @JoinColumn({ name: "customerId" })
  customer!: CustomerEntity | null;
}

