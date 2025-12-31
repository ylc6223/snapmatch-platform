// 角色定义：后续可根据业务扩展（如 studio_admin、ops 等）。
export enum Role {
  Admin = "admin",
  Photographer = "photographer",
  Sales = "sales",
  Customer = "customer",
}

// JWT 中携带的 payload：用于后端识别用户与执行 RBAC 校验。
export type JwtPayload = {
  sub: string;
  account: string;
  roles: Role[];
  permissions: string[];
  sid?: string;
};

// Controller 层使用的用户对象（由 JwtStrategy 注入到 request.user）。
export type AuthUser = {
  id: string;
  account: string;
  roles: Role[];
  permissions: string[];
};
