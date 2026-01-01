"use client"

import { HeroActions } from "./hero-actions"
import { MotionWrapper } from "./motion-wrapper"

export function Hero() {
  return (
    <section className="relative overflow-hidden mt-0">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
          <div className="max-w-xl space-y-6">
            <MotionWrapper type="fadeUp" delay={0}>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl text-balance">
                用镜头
                <span className="text-muted-foreground">捕捉</span>
                <br />
                每一个珍贵瞬间
              </h1>
            </MotionWrapper>

            <MotionWrapper type="fadeUp" delay={0.15}>
              <p className="text-lg text-muted-foreground leading-relaxed">
                热爱摄影，专注于记录生活中的美好瞬间。用独特的视角和真挚的情感，为你留下值得珍藏的影像回忆。
              </p>
            </MotionWrapper>

            <MotionWrapper type="fadeUp" delay={0.3}>
              <div className="flex flex-wrap gap-4">
                <HeroActions />
              </div>
            </MotionWrapper>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <MotionWrapper type="scale" delay={0.1}>
                  <div className="overflow-hidden rounded-2xl">
                    <img
                      src="/photography-studio.png"
                      alt="人像摄影作品"
                      className="h-auto w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                </MotionWrapper>
                <MotionWrapper type="scale" delay={0.25}>
                  <div className="overflow-hidden rounded-2xl">
                    <img
                      src="/wedding-photography-romantic-couple.jpg"
                      alt="婚礼摄影作品"
                      className="h-auto w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                </MotionWrapper>
              </div>
              <div className="space-y-4 pt-8">
                <MotionWrapper type="scale" delay={0.4}>
                  <div className="overflow-hidden rounded-2xl">
                    <img
                      src="/product-photography-elegant-watch.jpg"
                      alt="产品摄影作品"
                      className="h-auto w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                </MotionWrapper>
                <MotionWrapper type="scale" delay={0.55}>
                  <div className="overflow-hidden rounded-2xl">
                    <img
                      src="/nature-landscape-photography-mountains.jpg"
                      alt="风景摄影作品"
                      className="h-auto w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                </MotionWrapper>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
