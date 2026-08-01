import { RiCompass3Line } from '@remixicon/react';

import { Button } from '@feature/ui/components/ui/common/button';
import Link from 'next/link';
import BackButton from '../components/back-button';

export default function ErrorBlock() {
  return (
    <section className="flex min-h-svh w-full flex-col items-center justify-center gap-6 bg-background px-6 py-12 text-center text-foreground">
      <p className="font-mono text-7xl font-bold tracking-tighter sm:text-8xl">
        404
      </p>

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Page not found
        </h1>
        <p className="max-w-md text-sm text-muted-foreground">
          The page you are looking for does not exist or has been moved. Check
          the URL, or head back to safety.
        </p>
      </div>

      <div className="flex flex-col items-center gap-2 sm:flex-row">
        <Link href={'/'}>
          <Button className="w-full sm:w-auto">
            <RiCompass3Line data-icon="inline-start" aria-hidden="true" />
            Go Home
          </Button>
        </Link>
        <BackButton />
      </div>
    </section>
  );
}
