import { type ClassValue, clsx } from "clsx";
import { Metadata } from "next";
import { twMerge } from "tailwind-merge";

/**
 * 样式类名合并工具
 *
 * - `clsx`：条件 class
 * - `tailwind-merge`：合并 Tailwind 冲突（例如 `p-2` 覆盖 `p-4`）
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 头像占位符：将姓名拆分并取首字母（例如 "Jerry Chen" -> "JC"）
 */
export function generateAvatarFallback(string: string) {
  const names = string.split(" ").filter((name: string) => name);
  const mapped = names.map((name: string) => name.charAt(0).toUpperCase());

  return mapped.join("");
}

/**
 * 生成页面 Meta（SEO / OpenGraph）
 *
 * 注意：这里的默认标题文案来自模板，可按项目需要替换。
 */
export function generateMeta({
  title,
  description,
}: {
  title: string;
  description: string;
}): Metadata {
  return {
    title: `${title} - Shadcn UI Kit Free Dashboard Template`,
    description: description,
    openGraph: {
      images: [`/seo.jpg`]
    }
  };
}
