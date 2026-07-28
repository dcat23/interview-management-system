"use client"

import { RiErrorWarningLine, RiRefreshLine } from "@remixicon/react"

import { Button } from "@app/dashboard/components/ui/common/button"
import Link from "next/link"
import { useEffect } from "react"
import { logger } from "@next-feature/logging"

const DEFAULT_ERROR_MESSAGE = "An unexpected error occurred while processing your request. Please try again, and contact support if the problem persists."

export default function ErrorBlock({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    if (error) {
      logger.error(error.message);
    }
  },[error])
  return (
    <section className="flex min-h-svh w-full flex-col items-center justify-center gap-6 bg-background px-6 py-12 text-center text-foreground">
      <div className="flex size-16 items-center justify-center border border-border bg-muted/30">
        <RiErrorWarningLine
          className="size-8 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Something went wrong
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          {error.message ?? DEFAULT_ERROR_MESSAGE}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 sm:flex-row">
        <Button className="w-full sm:w-auto" onClick={reset}>
          <RiRefreshLine data-icon="inline-start" aria-hidden="true" />
          Try Again
        </Button>
        <Link href={"/contact-support"}>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
          >
            Contact Support
          </Button>
        </Link>
      </div>

      <p className="font-mono text-xs text-muted-foreground">
        {error.message}
      </p>
    </section>
  )
}
