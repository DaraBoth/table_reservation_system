'use client'

import { useEffect, useRef } from "react"
import { motion, useInView, useMotionValue, useSpring, useTransform } from "framer-motion"
import { cn } from "@/lib/utils"

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
}: {
  value: number
  direction?: "up" | "down"
  delay?: number
  className?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === "down" ? value : 0)
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  })
  const isInView = useInView(ref, { margin: "200px", once: true })

  // ✨ Magic UI: Binding the spring to the display text
  const displayValue = useTransform(springValue, (latest) => 
    Intl.NumberFormat("en-US").format(Math.round(latest))
  )

  useEffect(() => {
    if (isInView) {
      setTimeout(() => {
        motionValue.set(direction === "down" ? 0 : value)
      }, delay * 1000)
    }
  }, [motionValue, isInView, delay, value, direction])

  return (
    <motion.span
      ref={ref}
      className={cn(
        "inline-block tabular-nums text-foreground tracking-tighter",
        className,
      )}
    >
      {displayValue}
    </motion.span>
  )
}
