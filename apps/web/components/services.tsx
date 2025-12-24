import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Heart, Package, Mountain, Users, Sparkles } from "lucide-react"

const services = [
  {
    icon: Camera,
    title: "商业摄影",
    description: "为企业提供专业的商业摄影服务，包括广告摄影、企业宣传片和品牌视觉设计。",
  },
  {
    icon: Heart,
    title: "婚礼摄影",
    description: "用镜头记录您人生中最重要的时刻，从求婚到婚礼，每一个瞬间都值得珍藏。",
  },
  {
    icon: Package,
    title: "产品摄影",
    description: "专业的产品拍摄服务，让您的产品在电商平台和营销材料中脱颖而出。",
  },
  {
    icon: Users,
    title: "人像摄影",
    description: "个人写真、证件照、职业形象照，展现最真实最美的您。",
  },
  {
    icon: Mountain,
    title: "风景摄影",
    description: "捕捉大自然的壮丽景色，为您的空间增添艺术气息。",
  },
  {
    icon: Sparkles,
    title: "活动摄影",
    description: "企业年会、产品发布、展览活动等各类活动的专业摄影服务。",
  },
]

export function Services() {
  return (
    <section id="services" className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">服务项目</h2>
          <p className="mt-4 text-lg text-muted-foreground">我们提供全方位的摄影服务，满足您的各种需求</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Card key={service.title} className="group border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <service.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">{service.description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
