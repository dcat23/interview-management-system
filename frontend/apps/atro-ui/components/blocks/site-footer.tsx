import Link from 'next/link';
import { PROJECT_NAME } from '@app/atro-ui/lib/constants/metadata';

const FOOTER_LINKS = [
  { name: 'Roles', href: '#roles' },
  { name: 'How it works', href: '#how-it-works' },
  { name: 'Sign in', href: '/login' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30">
            <span className="font-mono text-xs font-semibold text-primary">A</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">{PROJECT_NAME}</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.name}
            </a>
          ))}
        </nav>

        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} {PROJECT_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default SiteFooter;
