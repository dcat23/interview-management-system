import { Card, CardContent } from '@feature/ui/components/card';
import { Skeleton } from '@feature/ui/components/skeleton';

export function ClientCardSkeleton() {
  return (
    <Card className="bg-card">
      <CardContent className="flex flex-col p-6">
        <div className="flex items-start justify-between">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="mt-4 h-5 w-3/4" />
        <Skeleton className="mt-2 h-4 w-1/2" />
        <Skeleton className="mt-4 h-8 w-full" />
      </CardContent>
    </Card>
  );
}
