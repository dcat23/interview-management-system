import { Fragment, ReactNode } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@app/dashboard/components/ui/common/breadcrumb"
import { Badge, badgeVariants } from '@app/dashboard/components/ui/common/badge';
import type { VariantProps } from 'class-variance-authority';

interface Crumb {
  label: string
  href: string
}

interface Props {
  title?: string;
  badge?: string;
  badgeVariant?: VariantProps<typeof badgeVariants>;
  breadcrumbs: Crumb[];
  children?: ReactNode;
}

export default function AppPageHeader({ title, breadcrumbs, badge, badgeVariant = "secondary", children }: Props) {
  const heading = title ?? breadcrumbs[breadcrumbs.length - 1]?.label

  return (
    <section className="w-full flex-col justify-start gap-6 bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={crumb.href}>
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={crumb.href}>
                      {crumb.label}
                    </BreadcrumbLink>
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
            {badge && <Badge variant={badgeVariant}>{badge}</Badge>}
          </div>
          {children}
        </div>
      </div>
    </section>
  );
}
