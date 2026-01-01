import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Heart, Package, Mountain, Users, Sparkles } from "lucide-react"

const services = [
  {
    icon: Users,
    title: "个人写真",
    description: "个人写真、形象照、情侣照，用镜头记录最真实美好的你，展现独特个人魅力。",
  },
  {
    icon: Camera,
    title: "日常跟拍",
    description: "生活记录、旅行跟拍、街拍风格，捕捉日常中不经意的美好瞬间。",
  },
  {
    icon: Heart,
    title: "婚礼摄影",
    description: "求婚、婚礼、纪念日，用镜头记录人生中最重要的时刻，让美好永恒。",
  },
  {
    icon: Sparkles,
    title: "活动记录",
    description: "生日派对、朋友聚会、小型活动，记录聚会中的欢乐时光和珍贵回忆。",
  },
  {
    icon: Package,
    title: "静物摄影",
    description: "美食拍摄、手作产品、物品写真，为日常物品赋予艺术感和温度。",
  },
  {
    icon: Mountain,
    title: "旅行摄影",
    description: "旅途记录、城市风光、自然景观，用镜头记录旅行路上的所见所感。",
  },
]

export function Services() {
  return (
    <section id="services" className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">服务项目</h2>
          <p className="mt-4 text-lg text-muted-foreground">用心记录生活中的美好瞬间，为你留下值得珍藏的影像</p>
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
