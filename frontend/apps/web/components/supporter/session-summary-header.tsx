import { type Session } from '@app/web/lib/data/sessions';
import { Card, CardContent } from '@feature/ui/components/card';
import { Building2, Calendar, Clock, TableProperties } from "lucide-react";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function DetailItem({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium truncate">{value}</p>
      </div>
    </div>
  )
}

export function SessionSummaryHeader({ session }: { session: Session }) {
  return (
    <Card className="bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailItem icon={Calendar} label="Date" value={formatDate(session.date)} />
          <DetailItem icon={Clock} label="Time" value={session.time} />
          <DetailItem icon={Building2} label="Company" value={session.clientName} />
          <DetailItem icon={TableProperties} label="Round" value={session.round} />
        </div>
        <div className="pt-2 border-t border-border">
          <p className="text-muted-foreground">{session.description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
