"use client"

import { motion, useInView, type Variants } from "motion/react"
import { useRef } from "react"
import { fadeIn, fadeInUp, fadeInLeft, fadeInRight, scaleIn } from "@/lib/animations"

interface MotionWrapperProps {
  children: React.ReactNode
  className?: string
  type?: "fade" | "fadeUp" | "fadeLeft" | "fadeRight" | "scale"
  delay?: number
  duration?: number
  once?: boolean
  amount?: number
}

export function MotionWrapper({
  children,
  className = "",
  type = "fadeUp",
  delay = 0,
  duration = 0.6,
  once = true,
  amount = 0.3,
}: MotionWrapperProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, {
    once,
    amount,
  })

  const variantsMap: Record<string, Variants> = {
    fade: fadeIn,
    fadeUp: fadeInUp,
    fadeLeft: fadeInLeft,
    fadeRight: fadeInRight,
    scale: scaleIn,
  }

  const variants = variantsMap[type]

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
