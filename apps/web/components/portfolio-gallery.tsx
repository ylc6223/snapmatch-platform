"use client"

import { useState } from "react"
import { PortfolioFilter } from "./portfolio-filter"
import { Eye, Heart } from "lucide-react"

const portfolioItems = [
  {
    id: 1,
    title: "都市人像",
    category: "portrait",
    image: "/urban-portrait-photography-city-background.jpg",
    likes: 234,
    views: 1200,
  },
  {
    id: 2,
    title: "浪漫婚礼",
    category: "wedding",
    image: "/romantic-wedding-photography-bride-groom.jpg",
    likes: 456,
    views: 2100,
  },
  {
    id: 3,
    title: "奢侈腕表",
    category: "product",
    image: "/luxury-watch-product-photography-dark-background.jpg",
    likes: 189,
    views: 890,
  },
  {
    id: 4,
    title: "山川云海",
    category: "landscape",
    image: "/mountain-landscape-sunrise-clouds.jpg",
    likes: 567,
    views: 3200,
  },
  {
    id: 5,
    title: "时尚人像",
    category: "portrait",
    image: "/fashion-portrait-photography-model.jpg",
    likes: 312,
    views: 1500,
  },
  {
    id: 6,
    title: "海滨婚礼",
    category: "wedding",
    image: "/beach-wedding-photography-sunset.jpg",
    likes: 423,
    views: 1890,
  },
  {
    id: 7,
    title: "美食摄影",
    category: "product",
    image: "/food-photography-gourmet-dish.jpg",
    likes: 278,
    views: 1100,
  },
  {
    id: 8,
    title: "森林光影",
    category: "landscape",
    image: "/forest-sunlight-rays-photography.jpg",
    likes: 445,
    views: 2400,
  },
  {
    id: 9,
    title: "艺术人像",
    category: "portrait",
    image: "/artistic-portrait-photography-dramatic-lighting.jpg",
    likes: 389,
    views: 1750,
  },
  {
    id: 10,
    title: "珠宝首饰",
    category: "product",
    image: "/jewelry-photography-diamond-ring-elegant.jpg",
    likes: 245,
    views: 980,
  },
  {
    id: 11,
    title: "樱花季节",
    category: "landscape",
    image: "/cherry-blossom-spring-photography-japan.jpg",
    likes: 534,
    views: 2800,
  },
  {
    id: 12,
    title: "古风婚纱",
    category: "wedding",
    image: "/traditional-chinese-wedding-photography.jpg",
    likes: 398,
    views: 1650,
  },
]

export function PortfolioGallery() {
  const [activeFilter, setActiveFilter] = useState("all")

  const filteredItems =
    activeFilter === "all" ? portfolioItems : portfolioItems.filter((item) => item.category === activeFilter)

  return (
    <section id="portfolio" className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">作品展示</h2>
          <p className="mt-4 text-lg text-muted-foreground">探索我们的摄影作品集，每一张照片都承载着独特的故事</p>
        </div>

        <div className="flex justify-center mb-8">
          <PortfolioFilter onFilterChange={setActiveFilter} activeFilter={activeFilter} />
        </div>

        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filteredItems.map((item) => (
            <div key={item.id} className="break-inside-avoid group relative overflow-hidden rounded-xl bg-card">
              <img
                src={item.image || "/placeholder.svg"}
                alt={item.title}
                className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <div className="flex items-center gap-4 mt-2 text-white/80 text-sm">
                    <span className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      {item.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {item.views}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
