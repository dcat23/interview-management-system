import { Skeleton } from '@feature/ui/components/skeleton';
import { SessionCardSkeleton } from '@app/web/components/supporter/session-card-skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SessionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
