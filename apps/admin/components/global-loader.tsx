"use client"

import { useAppStore } from "@/lib/store/app-store"

/**
 * 全局 Loader 组件
 *
 * 基于 bouncing box 动画，使用 Tailwind CSS 实现
 * 支持深色模式，遵循设计系统颜色主题
 */
export function GlobalLoader() {
  const { loading } = useAppStore()

  if (!loading.global) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6">
        {/* Bouncing Box Loader */}
        <div className="relative size-12">
          {/* Shadow */}
          <div className="absolute -bottom-8 left-0 h-1 w-12 animate-loader-shadow rounded-[50%] bg-primary/50 dark:bg-primary-foreground/50" />

          {/* Bouncing Box */}
          <div className="size-full animate-loader-jump rounded bg-primary dark:bg-primary-foreground" />
        </div>

        {/* Optional Loading Message */}
        {loading.message && (
          <p className="text-sm text-muted-foreground animate-pulse">
            {loading.message}
          </p>
        )}
      </div>
    </div>
  )
}
