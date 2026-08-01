import { Card, CardContent } from '@feature/ui/components/card';
import { Building2, Calendar, Clock, TableProperties } from "lucide-react";
import type { SessionCardData } from './session-card';

function formatDate(scheduledAt: string) {
  return new Date(scheduledAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(scheduledAt: string, durationMinutes: number) {
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  const timeFormat: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit' };
  return `${start.toLocaleTimeString('en-US', timeFormat)} - ${end.toLocaleTimeString('en-US', timeFormat)}`;
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

export function SessionSummaryHeader({ session }: { session: SessionCardData }) {
  return (
    <Card className="bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailItem icon={Calendar} label="Date" value={formatDate(session.scheduledAt)} />
          <DetailItem icon={Clock} label="Time" value={formatTime(session.scheduledAt, session.durationMinutes)} />
          <DetailItem icon={Building2} label="Company" value={session.clientName ?? 'Unknown client'} />
          <DetailItem icon={TableProperties} label="Round" value={session.round} />
        </div>
        {session.description && (
          <div className="pt-2 border-t border-border">
            <p className="text-muted-foreground">{session.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
