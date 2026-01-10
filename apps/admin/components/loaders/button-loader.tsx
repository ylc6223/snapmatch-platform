import { Spinner } from "@/components/ui/spinner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ReactNode, ComponentProps } from "react"

/**
 * ButtonLoader 组件
 *
 * 按钮内嵌加载状态，结合 Button + Spinner
 *
 * @example
 * ```tsx
 * <ButtonLoader loading={isPending} loadingText="提交中...">
 *   提交
 * </ButtonLoader>
 * ```
 */
export function ButtonLoader({
  loading,
  loadingText = "加载中...",
  children,
  disabled,
  className,
  ...props
}: ComponentProps<typeof Button> & {
  loading?: boolean
  loadingText?: string
  children?: ReactNode
}) {
  return (
    <Button disabled={disabled || loading} className={cn(className)} {...props}>
      {loading && <Spinner className="mr-2 size-4" />}
      {loading ? loadingText : children}
    </Button>
  )
}
