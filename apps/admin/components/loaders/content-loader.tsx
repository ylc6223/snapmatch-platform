import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"

/**
 * ContentLoader 组件
 *
 * 内容区加载状态，全容器遮罩 + 居中 Spinner
 *
 * @example
 * ```tsx
 * <ContentLoader loading={isLoading}>
 *   <YourContent />
 * </ContentLoader>
 * ```
 */
export function ContentLoader({
  loading,
  children,
  text,
  className,
  blur = false,
}: {
  loading: boolean
  children: ReactNode
  text?: string
  className?: string
  blur?: boolean
}) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {loading && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-background/60",
            blur && "backdrop-blur-sm"
          )}
        >
          <div className="flex flex-col items-center gap-3">
            <Spinner className="size-8" />
            {text && (
              <p className="text-sm text-muted-foreground animate-pulse">
                {text}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
