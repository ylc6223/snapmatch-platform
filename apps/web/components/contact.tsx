"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react"

const contactInfo = [
  {
    icon: MapPin,
    title: "地址",
    content: "北京市朝阳区建国路88号SOHO现代城A座1208",
  },
  {
    icon: Phone,
    title: "电话",
    content: "+86 10 8888 8888",
  },
  {
    icon: Mail,
    title: "邮箱",
    content: "hello@guangying.studio",
  },
  {
    icon: Clock,
    title: "营业时间",
    content: "周一至周六 9:00 - 18:00",
  },
]

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
    console.log(formData)
  }

  return (
    <section id="contact" className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">联系我们</h2>
          <p className="mt-4 text-lg text-muted-foreground">有任何问题或合作意向？欢迎随时与我们联系</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {contactInfo.map((info) => (
                <Card key={info.title} className="border-border/50">
                  <CardContent className="flex items-start gap-4 p-6">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <info.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-medium">{info.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{info.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-8 overflow-hidden rounded-xl">
              <img
                src="/placeholder.svg?height=300&width=600"
                alt="工作室环境"
                className="h-48 w-full object-cover lg:h-64"
              />
            </div>
          </div>

          <Card className="border-border/50">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-6">发送消息</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Input
                      placeholder="您的姓名"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="rounded-lg"
                    />
                  </div>
                  <div>
                    <Input
                      type="tel"
                      placeholder="联系电话"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="rounded-lg"
                    />
                  </div>
                </div>
                <Input
                  type="email"
                  placeholder="电子邮箱"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="rounded-lg"
                />
                <Textarea
                  placeholder="请描述您的需求..."
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="rounded-lg resize-none"
                />
                <Button type="submit" className="w-full rounded-full gap-2">
                  <Send className="h-4 w-4" />
                  发送消息
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )
}
