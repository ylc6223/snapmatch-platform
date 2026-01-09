import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

/**
 * InlineLoader 组件
 *
 * 行内小区域加载，居中显示 Spinner
 *
 * @example
 * ```tsx
 * <InlineLoader size="sm" />
 * <InlineLoader size="md" text="加载中..." />
 * ```
 */
export function InlineLoader({
  size = "md",
  text,
  className,
}: {
  size?: "sm" | "md" | "lg"
  text?: string
  className?: string
}) {
  const sizeClasses = {
    sm: "size-4",
    md: "size-8",
    lg: "size-12",
  }

  return (
    <div className={cn("flex items-center justify-center gap-3", className)}>
      <Spinner className={sizeClasses[size]} />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  )
}
