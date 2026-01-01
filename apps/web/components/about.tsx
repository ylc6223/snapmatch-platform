import { Badge } from "@/components/ui/badge"

const stats = [
  { value: "8+", label: "年摄影经验" },
  { value: "500+", label: "拍摄场次" },
  { value: "3000+", label: "作品数量" },
  { value: "100%", label: "用心对待" },
]

export function About() {
  return (
    <section id="about" className="py-16 lg:py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl">
              <img
                src="/placeholder.svg?height=500&width=650"
                alt="摄影师工作照"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 rounded-xl bg-card p-6 shadow-xl hidden sm:block">
              <div className="grid grid-cols-2 gap-4">
                {stats.slice(0, 2).map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className="text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <Badge variant="secondary" className="mb-4 rounded-full">
              关于我
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              用心创作，
              <br />
              专注品质
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                热爱摄影，用镜头记录生活已有八个年头。专注于个人写真、日常跟拍和婚礼摄影，用真诚的态度和独特的视角，为每一位客户留下值得珍藏的影像回忆。
              </p>
              <p>
                深信好的摄影作品不仅仅是技术的体现，更是情感与故事的传递。每一次拍摄都用心对待，努力捕捉那些不经意却最动人的瞬间，让照片有温度、有故事。
              </p>
              <p>
                这些年，拍摄过五百多场不同类型的活动，记录了数千个美好瞬间。无论是日常生活中的小事，还是人生中的重要时刻，都用镜头为你珍藏，让美好成为永恒。
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-8 sm:hidden">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-xl font-bold text-primary">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="hidden sm:grid grid-cols-2 gap-4 mt-8 lg:hidden">
              {stats.slice(2).map((stat) => (
                <div key={stat.label} className="text-center p-4 rounded-xl bg-card">
                  <div className="text-2xl font-bold text-primary">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
