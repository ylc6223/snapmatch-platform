"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function HeroActions() {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <>
      <Button
        size="lg"
        className="rounded-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 dark:bg-white dark:text-background dark:hover:bg-white/90"
        onClick={() => scrollToSection("portfolio")}
      >
        查看作品集
        <ArrowRight className="h-4 w-4" />
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="rounded-full bg-transparent border-2 border-primary text-primary hover:bg-primary/10 dark:border-white dark:text-white dark:hover:bg-white/10"
        onClick={() => scrollToSection("contact")}
      >
        预约咨询
      </Button>
    </>
  )
}
