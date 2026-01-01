"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { StaticMap } from "@/components/static-map"
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react"

const contactInfo = [
  {
    icon: MapPin,
    title: "服务地区",
    content: "广西南宁 | 全国可约",
  },
  {
    icon: Phone,
    title: "联系电话",
    content: "+86 771 8888 8888",
  },
  {
    icon: Mail,
    title: "邮箱",
    content: "hello@yipaigehe.com",
  },
  {
    icon: Clock,
    title: "工作时间",
    content: "工作日 9:00-18:00",
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
          <p className="mt-4 text-lg text-muted-foreground">有任何问题或合作意向？欢迎随时与我联系</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="flex flex-col">
            <div className="grid gap-3 sm:grid-cols-2">
              {contactInfo.map((info) => (
                <Card key={info.title} className="border-border/50">
                  <CardContent className="flex items-start gap-3 p-4">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                      <info.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-medium">{info.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{info.content}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-4">
              <StaticMap
                lat={23.39}
                lng={110.08}
                zoom={14}
                width={800}
                height={500}
                className="aspect-[16/10]"
              />
            </div>
          </div>

          <Card className="border-border/50 h-full">
            <CardContent className="p-6 h-full flex flex-col">
              <h3 className="text-xl font-semibold mb-6">发送消息</h3>
              <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
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
                <div className="flex-1 min-h-[120px]">
                  <Textarea
                    placeholder="请描述您的需求..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="rounded-lg resize-none h-full"
                  />
                </div>
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
