import { Fragment, ReactNode } from "react"
import { RiDownloadLine } from "@remixicon/react"

import { Badge } from "@app/dashboard/components/ui/common/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@app/dashboard/components/ui/common/breadcrumb"
import { Button } from "@app/dashboard/components/ui/common/button"

interface Crumb {
  label: string
  href: string
}

interface Props {
  title?: string
  breadcrumbs: Crumb[]
  children?: ReactNode
}

export default function PageHeaderBlock({ title, breadcrumbs, children }: Props) {
  const heading = title ?? breadcrumbs[breadcrumbs.length - 1]?.label

  return (
    <section className="min-h-svh w-full bg-background px-4 py-12 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={crumb.href}>
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {heading}
            </h1>
            {/* <Badge variant="secondary">Active</Badge> */}
          </div>
          {children}
        </div>

        {/* <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 border border-border bg-muted/30" />
          ))}
        </div> */}
      </div>
    </section>
  )
}
