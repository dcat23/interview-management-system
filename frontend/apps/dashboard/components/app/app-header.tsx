'use client';

import { Separator } from '@app/dashboard/components/ui/common/separator';
import { SidebarTrigger } from '@app/dashboard/components/ui/common/sidebar';
import { capitalize, DASHBOARD } from '@feature/base/server';
import { usePathname } from 'next/navigation';
import { Fragment, useMemo } from 'react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '../ui/common/breadcrumb';
import CommandButton from './command-button';


interface Crumb {
  segment: string;
  href:  string;
}

const DEFAULT_CRUMB: Crumb = {
  segment: DASHBOARD.name,
  href: DASHBOARD.href
}

interface Props {
}

export function AppHeader({}: Props) {
  const pathname = usePathname();

  const breadcrumbs: Crumb[] = useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const crumbs = segments.map((segment, i) => ({
      segment: capitalize(segment),
      href: '/' + segments.slice(0, i + 1).join('/'),
    }));

    return crumbs.length === 0 ? [DEFAULT_CRUMB] : crumbs;
  }, [pathname])
  
  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <Fragment key={crumb.href}>
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{crumb.segment}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild href={crumb.href}>{crumb.segment}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
                {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <CommandButton />
    </header>
  );
}

export default AppHeader;
