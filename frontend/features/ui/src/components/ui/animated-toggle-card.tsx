"use client"

import * as React from "react"
import { motion, useReducedMotion } from "motion/react"

import { cn } from "@feature/ui/lib/ui/utils"

export type AnimatedToggleCardItem = {
  value: string
  title: string
  description?: string
  icon?: React.ReactNode
  tone?: "default" | "success" | "warning" | "destructive"
}

export function AnimatedToggleCard({
  items,
  value,
  onValueChange,
  className,
}: {
  items: AnimatedToggleCardItem[]
  value: string
  onValueChange: (value: string) => void
  className?: string
}) {
  const reduceMotion = useReducedMotion()

  return (
    <div className={cn("grid gap-2 sm:grid-cols-3", className)}>
      {items.map((item) => {
        const selected = item.value === value
        const tone = item.tone ?? "default"
        const toneClassName =
          tone === "success"
            ? "data-[selected=true]:border-emerald-500/40 data-[selected=true]:text-emerald-950 dark:data-[selected=true]:text-emerald-100"
            : tone === "warning"
              ? "data-[selected=true]:border-amber-500/45 data-[selected=true]:text-amber-950 dark:data-[selected=true]:text-amber-100"
              : tone === "destructive"
                ? "data-[selected=true]:border-destructive/45 data-[selected=true]:text-destructive"
                : "data-[selected=true]:border-primary"
        const activeClassName =
          tone === "success"
            ? "bg-emerald-500/10"
            : tone === "warning"
              ? "bg-amber-500/10"
              : tone === "destructive"
                ? "bg-destructive/10"
                : "bg-primary/8"

        return (
          <button
            key={item.value}
            type="button"
            data-selected={selected}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "relative overflow-hidden rounded-md border bg-card p-3 text-left transition-colors outline-none",
              "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
              toneClassName
            )}
          >
            {selected ? (
              <motion.div
                layoutId="animated-toggle-card-active"
                className={cn("absolute inset-0", activeClassName)}
                transition={{ duration: reduceMotion ? 0 : 0.18 }}
              />
            ) : null}
            <div className="relative flex items-start gap-3">
              {item.icon ? (
                <div className="mt-0.5 text-muted-foreground">{item.icon}</div>
              ) : null}
              <div>
                <div className="text-sm font-medium">{item.title}</div>
                {item.description ? (
                  <div className="mt-1 text-xs leading-5 text-muted-foreground">
                    {item.description}
                  </div>
                ) : null}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
