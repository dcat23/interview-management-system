import { Skeleton } from '@feature/ui/components/skeleton';
import { ClientCardSkeleton } from '@app/web/components/supporter/client-card-skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>

      <Skeleton className="h-10 w-full max-w-md" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ClientCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
