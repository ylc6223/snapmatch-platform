"use client"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const categories = [
  { id: "all", name: "全部", count: 128 },
  { id: "portrait", name: "人像", count: 45 },
  { id: "wedding", name: "婚礼", count: 32 },
  { id: "product", name: "产品", count: 28 },
  { id: "landscape", name: "风景", count: 23 },
]

interface PortfolioFilterProps {
  onFilterChange: (category: string) => void
  activeFilter: string
}

export function PortfolioFilter({ onFilterChange, activeFilter }: PortfolioFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onFilterChange(category.id)}
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
            activeFilter === category.id
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80",
          )}
        >
          {category.name}
          <Badge
            variant="secondary"
            className={cn(
              "rounded-full text-xs",
              activeFilter === category.id && "bg-primary-foreground/20 text-primary-foreground",
            )}
          >
            {category.count}
          </Badge>
        </button>
      ))}
    </div>
  )
}
