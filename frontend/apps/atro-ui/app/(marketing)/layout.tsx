import { ReactNode } from 'react';
import { SiteHeader } from '@app/atro-ui/components/blocks/site-header';
import { SiteFooter } from '@app/atro-ui/components/blocks/site-footer';

interface Props {
  children: ReactNode;
}

export default function MarketingLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
