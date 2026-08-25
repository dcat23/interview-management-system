"use client"

import * as React from "react"
import { Check, Copy } from "lucide-react"

import { Button } from "@feature/ui/components/ui/common/button"
import { cn } from "@feature/ui/lib/ui/utils"

export function AnimatedCopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  resetDelay = 1200,
  icon,
  onCopy,
  className,
  variant = "outline",
  ...props
}: {
  value: string
  label?: string
  copiedLabel?: string
  resetDelay?: number
  icon?: React.ReactNode
  onCopy?: () => void
} & Omit<
  React.ComponentProps<typeof Button>,
  "children" | "onClick" | "type"
>) {
  const [copied, setCopied] = React.useState(false)

  async function copy() {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    onCopy?.()
    window.setTimeout(() => setCopied(false), resetDelay)
  }

  return (
    <Button
      type="button"
      variant={variant}
      onClick={copy}
      className={cn("min-w-24", className)}
      {...props}
    >
      <span className="inline-flex items-center gap-1.5">
        <span
          className="t-icon-swap inline-grid size-3.5 shrink-0 place-items-center"
          data-state={copied ? "b" : "a"}
          aria-hidden="true"
        >
          <span className="t-icon inline-flex size-3.5 items-center justify-center" data-icon="a">
            {icon ?? <Copy className="size-3.5" />}
          </span>
          <span className="t-icon inline-flex size-3.5 items-center justify-center" data-icon="b">
            <Check className="size-3.5" />
          </span>
        </span>
        {copied ? copiedLabel : label}
      </span>
    </Button>
  )
}
