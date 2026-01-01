import { HeroActions } from "./hero-actions"
import { ArrowRight } from "lucide-react"

export function Hero() {
  return (
    <section className="relative overflow-hidden mt-0">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="max-w-xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-balance">
              用镜头
              <span className="text-muted-foreground">捕捉</span>
              <br />
              每一个珍贵瞬间
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed">
              热爱摄影，专注于记录生活中的美好瞬间。用独特的视角和真挚的情感，为你留下值得珍藏的影像回忆。
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <HeroActions />
            </div>
          </div>
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src="/photography-studio.png"
                    alt="人像摄影作品"
                    className="h-auto w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src="/wedding-photography-romantic-couple.jpg"
                    alt="婚礼摄影作品"
                    className="h-auto w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src="/product-photography-elegant-watch.jpg"
                    alt="产品摄影作品"
                    className="h-auto w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="overflow-hidden rounded-2xl">
                  <img
                    src="/nature-landscape-photography-mountains.jpg"
                    alt="风景摄影作品"
                    className="h-auto w-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
