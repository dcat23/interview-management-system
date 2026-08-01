import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@feature/ui/components/card';
import { Skeleton } from '@feature/ui/components/skeleton';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function NextSessionCardSkeleton() {
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl font-medium">Next Session</CardTitle>
          <CardDescription className="font-mono text-xs uppercase tracking-wide">
            Your soonest upcoming interview
          </CardDescription>
        </div>
        <div
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors group"
        >
          <span className="font-mono text-xs uppercase tracking-wide">
            View all
          </span>
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-32 w-full rounded-xl" />
      </CardContent>
    </Card>
  );
}
