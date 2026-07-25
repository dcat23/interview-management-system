import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@feature/ui/components/card';

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <Card className="bg-card">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mt-4 font-medium">{title}</h3>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </CardContent>
    </Card>
  );
}
