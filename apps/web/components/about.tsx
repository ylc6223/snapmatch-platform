import { Badge } from "@/components/ui/badge"

const stats = [
  { value: "10+", label: "年行业经验" },
  { value: "500+", label: "服务客户" },
  { value: "2000+", label: "完成项目" },
  { value: "98%", label: "客户满意度" },
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
                alt="工作室团队"
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
              关于我们
            </Badge>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
              用心创作，
              <br />
              专注品质
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                光影工作室成立于2014年，是一家专注于高端摄影服务的专业工作室。我们的团队由多位资深摄影师组成，每一位都拥有丰富的拍摄经验和独特的艺术视角。
              </p>
              <p>
                我们相信，好的摄影作品不仅仅是技术的体现，更是情感与故事的传递。无论是商业项目还是个人拍摄，我们都以最专业的态度和最真诚的心去对待每一次创作。
              </p>
              <p>
                十年来，我们服务过数百家企业客户和数千位个人客户，积累了丰富的行业经验。我们始终坚持品质至上的原则，用镜头记录生活中的美好瞬间。
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
