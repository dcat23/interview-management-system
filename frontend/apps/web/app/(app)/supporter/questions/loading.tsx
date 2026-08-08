import { Skeleton } from '@feature/ui/components/ui/common/skeleton';

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-10 w-full" />
      </div>

      <ul className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </li>
        ))}
      </ul>
    </div>
  );
}
