"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Camera, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import { ADMIN_DASHBOARD_URL } from "@/lib/urls"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    account: "",
    password: "",
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (formData.account === "admin" && formData.password === "admin") {
      router.push(ADMIN_DASHBOARD_URL)
      return
    }

    setErrorMessage("账号或密码错误")
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="p-4 flex justify-between items-center">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>返回首页</span>
        </Link>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-border/50 shadow-lg">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Camera className="h-7 w-7 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">管理员登录</CardTitle>
              <CardDescription className="mt-2">登录后台管理系统，管理您的作品和客户信息</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account">账号</Label>
                <Input
                  id="account"
                  type="text"
                  placeholder="admin"
                  value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: e.target.value })}
                  className="rounded-lg"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">密码</Label>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    忘记密码？
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="admin"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="rounded-lg pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="sr-only">{showPassword ? "隐藏密码" : "显示密码"}</span>
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full rounded-full">
                登录
              </Button>
            </form>

            {errorMessage && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {errorMessage}
              </div>
            )}

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>如需开通管理员账号，请联系</p>
              <a href="mailto:admin@guangying.studio" className="text-primary hover:underline">
                admin@guangying.studio
              </a>
            </div>
          </CardContent>
        </Card>
      </main>

      <footer className="p-4 text-center text-sm text-muted-foreground">© 2025 光影工作室. 保留所有权利.</footer>
    </div>
  )
}
