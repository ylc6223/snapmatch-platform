import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight } from "lucide-react"

const caseStudies = [
  {
    id: 1,
    title: "某奢侈品牌2024春季广告",
    client: "国际奢侈品牌",
    description:
      "为品牌打造全系列产品视觉，包括平面广告、社交媒体素材和线下展示图。通过细腻的光影处理，展现产品的精致工艺。",
    image: "/placeholder.svg?height=400&width=600",
    tags: ["商业摄影", "产品", "广告"],
    results: "曝光量提升 320%",
  },
  {
    id: 2,
    title: "王先生 & 李女士 婚礼纪实",
    client: "私人客户",
    description:
      "一场在三亚海边举办的梦幻婚礼。我们用镜头记录下每一个感动瞬间，从晨间准备到晚间派对，完整呈现这场浪漫的爱情故事。",
    image: "/placeholder.svg?height=400&width=600",
    tags: ["婚礼摄影", "纪实", "海外"],
    results: "精选照片 800+",
  },
  {
    id: 3,
    title: "《城市光影》个人写真集",
    client: "知名演员",
    description:
      "以城市为背景，融合时尚与艺术元素，打造独具个人特色的写真作品集。每一张照片都展现了模特独特的气质与魅力。",
    image: "/placeholder.svg?height=400&width=600",
    tags: ["人像摄影", "时尚", "艺术"],
    results: "社交媒体互动 50万+",
  },
]

export function CaseStudies() {
  return (
    <section id="cases" className="py-16 lg:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">客户案例</h2>
          <p className="mt-4 text-lg text-muted-foreground">我们与众多品牌和个人客户合作，创造令人惊叹的视觉作品</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {caseStudies.map((study) => (
            <Card
              key={study.id}
              className="group overflow-hidden border-0 bg-card shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="relative overflow-hidden">
                <img
                  src={study.image || "/placeholder.svg"}
                  alt={study.title}
                  className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute top-4 right-4">
                  <Badge variant="secondary" className="bg-background/90 backdrop-blur">
                    {study.results}
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{study.title}</CardTitle>
                    <CardDescription className="mt-1">{study.client}</CardDescription>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{study.description}</p>
                <div className="flex flex-wrap gap-2">
                  {study.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="rounded-full">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
