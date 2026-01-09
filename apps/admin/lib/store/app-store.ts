import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

export type TabbarState = {
  order: string[]
  closed: string[]
  pinned: string[]
}

export type LoadingState = {
  global: boolean
  message?: string
}

export type AppState = {
  tabbar: TabbarState
  loading: LoadingState
}

const STORAGE_KEY = "snapmatch-admin:app-store:v1"

const DEFAULT_STATE: AppState = {
  tabbar: {
    order: [],
    closed: [],
    pinned: [],
  },
  loading: {
    global: false,
    message: undefined,
  },
}

function uniq(list: string[]) {
  return Array.from(new Set(list))
}

export type AppStore = AppState & {
  tabbarSet: (next: Partial<TabbarState> | ((prev: TabbarState) => Partial<TabbarState>)) => void
  tabbarReset: () => void
  loadingShow: (message?: string) => void
  loadingHide: () => void
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_STATE,
      tabbarSet: (next) => {
        set((prev) => {
          const patch = typeof next === "function" ? next(prev.tabbar) : next
          const merged = {
            ...prev.tabbar,
            ...patch,
          }

          return {
            ...prev,
            tabbar: {
              order: uniq(merged.order),
              closed: uniq(merged.closed),
              pinned: uniq(merged.pinned),
            },
          }
        })
      },
      tabbarReset: () => {
        set({ ...get(), ...DEFAULT_STATE })
      },
      loadingShow: (message) => {
        set((prev) => ({
          ...prev,
          loading: {
            global: true,
            message,
          },
        }))
      },
      loadingHide: () => {
        set((prev) => ({
          ...prev,
          loading: {
            global: false,
            message: undefined,
          },
        }))
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      partialize: (state) => ({ tabbar: state.tabbar }),
      // 注意：loading 状态不会被持久化，因为它是临时的 UI 状态
    }
  )
)

export const appActions = {
  tabbarSet: (next: Parameters<AppStore["tabbarSet"]>[0]) => useAppStore.getState().tabbarSet(next),
  tabbarReset: () => useAppStore.getState().tabbarReset(),
  loadingShow: (message?: string) => useAppStore.getState().loadingShow(message),
  loadingHide: () => useAppStore.getState().loadingHide(),
}
