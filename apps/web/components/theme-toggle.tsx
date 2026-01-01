"use client"

import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/components/theme-provider"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  // 调试：在控制台打印当前主题
  const handleClick = () => {
    console.log('当前主题:', theme)
    const newTheme = theme === "light" ? "dark" : "light"
    console.log('切换到:', newTheme)
    setTheme(newTheme)
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="rounded-full"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">切换主题</span>
    </Button>
  )
}
