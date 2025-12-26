export type Role = "admin" | "photographer" | "customer";

export type AuthUser = {
  id: string;
  account: string;
  roles: Role[];
  permissions: string[];
};

