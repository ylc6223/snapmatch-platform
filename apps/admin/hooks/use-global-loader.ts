import { appActions, useAppStore } from "@/lib/store/app-store"
import { useCallback } from "react"

/**
 * 全局 Loader Hook
 *
 * 提供便捷的方法来控制全局 Loader 的显示和隐藏
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { show, hide } = useGlobalLoader()
 *
 *   const handleSubmit = async () => {
 *     show('提交中...')
 *     try {
 *       await submitForm()
 *     } finally {
 *       hide()
 *     }
 *   }
 *
 *   return <button onClick={handleSubmit}>提交</button>
 * }
 * ```
 */
export function useGlobalLoader() {
  const loading = useAppStore((state) => state.loading)

  const show = useCallback((message?: string) => {
    appActions.loadingShow(message)
  }, [])

  const hide = useCallback(() => {
    appActions.loadingHide()
  }, [])

  return {
    loading,
    show,
    hide,
  }
}
