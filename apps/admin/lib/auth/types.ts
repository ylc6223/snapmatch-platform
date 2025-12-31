export type Role = "admin" | "photographer" | "sales" | "customer";

export type AuthUser = {
  id: string;
  account: string;
  roles: Role[];
  permissions: string[];
};
