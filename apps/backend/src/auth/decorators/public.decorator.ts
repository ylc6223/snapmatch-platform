import { SetMetadata } from "@nestjs/common";

// 标记公开接口：被标记后将跳过 JwtAuthGuard（无需携带 Bearer Token）。
export const IS_PUBLIC_KEY = "isPublic";
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
