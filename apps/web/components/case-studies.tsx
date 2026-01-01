import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "lucide-react"

const caseStudies = [
  {
    id: 1,
    title: "三亚海边婚礼纪实",
    date: "2024年10月",
    location: "海南三亚",
    description:
      "一对新人选择在三亚举办海边婚礼，我们有幸记录下这场浪漫的婚礼。从晨间准备的温馨时刻，到交换戒指的感动瞬间，再到夜晚派对的欢声笑语，每一张照片都承载着他们的幸福回忆。",
    image: "/placeholder.svg?height=400&width=600",
    tags: ["婚礼摄影", "纪实", "海岛"],
    highlight: "精选照片 800+",
  },
  {
    id: 2,
    title: "秋日城市人像写真",
    date: "2024年11月",
    location: "上海外滩",
    description:
      "以城市秋色为背景，为客户打造一套温暖而富有文艺气息的个人写真。金黄的落叶、复古的建筑、柔和的阳光，与客户的气质完美融合，呈现出独特的都市文艺风格。",
    image: "/placeholder.svg?height=400&width=600",
    tags: ["人像摄影", "写真", "城市"],
    highlight: "室内外双场景",
  },
  {
    id: 3,
    title: "校园毕业季拍摄",
    date: "2024年6月",
    location: "北京大学",
    description:
      "为即将毕业的学子们记录下青春最美好的时光。从图书馆的专注瞬间，到操场的自由奔跑，再到未名湖畔的深情凝望，用镜头定格他们的青春记忆与同窗情谊。",
    image: "/placeholder.svg?height=400&width=600",
    tags: ["毕业季", "纪实", "校园"],
    highlight: "4人团体拍摄",
  },
]

export function CaseStudies() {
  return (
    <section id="cases" className="py-16 lg:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">客户案例</h2>
          <p className="mt-4 text-lg text-muted-foreground">每一次拍摄都是一段独特的故事，用心记录每个珍贵的瞬间</p>
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
                    {study.highlight}
                  </Badge>
                </div>
              </div>
              <CardHeader>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{study.title}</CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-2">
                      <span>{study.date}</span>
                      <span>·</span>
                      <span>{study.location}</span>
                    </CardDescription>
                  </div>
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
