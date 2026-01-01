"use client"

import Link from "next/link"
import { useState, useEffect, useRef, useCallback } from "react"
import { Menu, X, Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { ADMIN_LOGIN_URL } from "@/lib/urls"

const navigation = [
  { name: "首页", href: "/" },
  { name: "作品集", href: "#portfolio" },
  { name: "案例展示", href: "#cases" },
  { name: "关于我", href: "#about" },
  { name: "常见问题", href: "#faq" },
  { name: "联系我们", href: "#contact" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const indicatorRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const resizeTimerRef = useRef<NodeJS.Timeout>()

  // 使用 requestAnimationFrame 优化的更新函数
  const updateIndicator = useCallback((element: Element & HTMLElement) => {
    if (!navRef.current || !indicatorRef.current) return
    
    // 标记当前悬停的链接
    document.querySelectorAll('a[data-hovered]').forEach(el => {
      el.setAttribute('data-hovered', 'false')
    })
    element.setAttribute('data-hovered', 'true')
    
    requestAnimationFrame(() => {
      const navRect = navRef.current!.getBoundingClientRect()
      const linkRect = element.getBoundingClientRect()
      
      if (navRect && linkRect) {
        indicatorRef.current!.style.transform = `translateX(${linkRect.left - navRect.left}px)`
        indicatorRef.current!.style.width = `${linkRect.width}px`
        indicatorRef.current!.style.opacity = '1'
      }
    })
  }, [])

  // Memoized 事件处理器
  const handleLinkEnter = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    updateIndicator(e.currentTarget)
  }, [updateIndicator])

  const handleLinkLeave = useCallback(() => {
    if (indicatorRef.current) {
      indicatorRef.current.style.opacity = '0'
    }
  }, [])

  // 带防抖的 resize 处理
  useEffect(() => {
    const handleResize = () => {
      // 清除之前的定时器
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current)
      }
      
      // 防抖：100ms 后执行
      resizeTimerRef.current = setTimeout(() => {
        const hoveredLink = document.querySelector('a[data-hovered="true"]')
        if (hoveredLink) {
          updateIndicator(hoveredLink)
        }
      }, 100)
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimerRef.current) {
        clearTimeout(resizeTimerRef.current)
      }
    }
  }, [updateIndicator])

  // 锁定 body 滚动，防止背景滚动
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileMenuOpen])

  return (
    <header className={`sticky top-0 w-full border-b transition-all duration-300 ease-in-out ${
      mobileMenuOpen 
        ? 'bg-background border-border shadow-sm z-[70]' 
        : 'border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-40'
    }`}>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <div className="flex lg:flex-1">
          <Link href="/" className="flex items-center gap-2 -m-1.5 p-1.5">
            <Camera className="h-8 w-8" />
            <span className="text-xl font-bold">一拍即合</span>
          </Link>
        </div>

        <div className="flex lg:hidden">
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="ml-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
            <span className="sr-only">{mobileMenuOpen ? "关闭菜单" : "打开菜单"}</span>
          </Button>
        </div>

        <div className="hidden lg:flex lg:gap-x-8 relative" ref={navRef}>
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground relative py-1"
              onMouseEnter={handleLinkEnter}
              onMouseLeave={handleLinkLeave}
              data-hovered="false"
            >
              {item.name}
            </Link>
          ))}
          {/* 指示线 - 使用 ref 直接操作 DOM */}
          <div 
            ref={indicatorRef}
            className="absolute bottom-0 left-0 h-0.5 bg-primary opacity-0 transition-all duration-300 ease-out rounded-full"
            style={{
              transform: 'translateX(0px)',
              width: '0px',
            }}
          />
        </div>

        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
          <ThemeToggle />
          <a href={ADMIN_LOGIN_URL}>
            <Button
              variant="outline"
              className="rounded-full bg-transparent border-2 border-primary text-primary hover:bg-primary/10 dark:border-white dark:text-white dark:hover:bg-white/10"
            >
              Sign in
            </Button>
          </a>
        </div>
      </nav>

      {/* Mobile menu */}
      <div 
        className={`lg:hidden fixed top-[68px] left-0 right-0 z-[60] overflow-hidden bg-background border-b border-border shadow-lg duration-300 ease-in-out ${
          mobileMenuOpen 
            ? 'max-h-screen opacity-100' 
            : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        {/* 菜单内容 */}
        <div className="px-6 py-6">
          <div className="divide-y divide-border">
            <div className="space-y-2 py-6">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            <div className="py-6">
              <a href={ADMIN_LOGIN_URL} onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="outline"
                  className="w-full rounded-full bg-transparent border-2 border-primary text-primary hover:bg-primary/10 dark:border-white dark:text-white dark:hover:bg-white/10"
                >
                  Sign in
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 遮罩层，始终在DOM中，通过opacity和pointer-events控制 */}
      <div 
        className={`lg:hidden fixed top-[68px] left-0 right-0 bottom-0 z-50 bg-background/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMobileMenuOpen(false)}
      />
    </header>
  )
}
