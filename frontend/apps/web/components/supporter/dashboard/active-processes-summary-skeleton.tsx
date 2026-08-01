import { Card, CardContent } from '@feature/ui/components/card';
import { Skeleton } from '@feature/ui/components/skeleton';

export function ActiveProcessesSummarySkeleton() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-5 sm:w-64 sm:shrink-0">
          <Skeleton className="h-14 w-14 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-10" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
        <div className="flex flex-1 flex-wrap gap-2">
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}