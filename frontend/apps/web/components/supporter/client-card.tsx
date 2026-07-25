import Link from 'next/link';
import { Building2, ArrowUpRight } from 'lucide-react';
import { Card, CardContent } from '@feature/ui/components/card';
import { Badge } from '@feature/ui/components/badge';
import { Button } from '@feature/ui/components/button';
import type { Client } from '@app/web/lib/data/clients';

interface Props {
  client: Client;
}

export function ClientCard(props: Props) {
  const { client } = props;

  return (
    <Card className="bg-card hover:border-primary/30 transition-colors">
      <CardContent className="flex h-full flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <Badge variant={client.active ? 'secondary' : 'outline'} className={client.active ? '' : 'text-muted-foreground'}>
            {client.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>

        <div className="mt-4 flex-1">
          <h3 className="font-medium leading-tight text-pretty">{client.name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{client.industry}</p>
        </div>

        <Button asChild variant="secondary" size="sm" className="mt-4 w-full">
          <Link href={`/supporter/questions?client=${client.id}`}>
            View Questions
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
