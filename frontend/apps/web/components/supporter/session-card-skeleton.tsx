import { Card, CardContent } from '@feature/ui/components/ui/common/card';
import { Skeleton } from '@feature/ui/components/ui/common/skeleton';

export function SessionCardSkeleton() {
  return (
    <Card className="bg-card">
      <CardContent className="p-5 sm:p-6">
        <div className="space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-4 w-72" />
        </div>
      </CardContent>
    </Card>
  );
}
