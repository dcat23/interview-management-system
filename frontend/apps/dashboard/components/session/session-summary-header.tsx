import { Card, CardContent } from '@feature/ui/components/ui/common/card';
import { Building2, Calendar, ChevronRight, Clock, TableProperties } from 'lucide-react';
import Link from 'next/link';
import type { InterviewSession } from '@feature/base/server';

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

interface DetailItemProps {
  icon: typeof Calendar;
  label: string;
  value: string;
  href?: string;
}

function DetailItem({ icon: Icon, label, value, href }: DetailItemProps) {
  const content = (
    <>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium truncate">{value}</p>
      </div>
      {href && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 rounded-lg -m-2 p-2 transition-colors hover:bg-secondary/50"
      >
        {content}
      </Link>
    );
  }

  return <div className="flex items-center gap-3">{content}</div>;
}

interface Props {
  session: InterviewSession;
  clientId?: string;
}

export function SessionSummaryHeader({ session, clientId }: Props) {
  return (
    <Card className="bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <DetailItem icon={Calendar} label="Date" value={formatDate(session.scheduledAt)} />
          <DetailItem icon={Clock} label="Time" value={formatTime(session.scheduledAt, session.durationMinutes)} />
          <DetailItem
            icon={Building2}
            label="Company"
            value={session.clientName ?? 'Unknown client'}
            href={clientId ? `/clients/${clientId}` : undefined}
          />
          <DetailItem
            icon={TableProperties}
            label="Round"
            value={session.round}
            href={`/processes/${session.processId}`}
          />
        </div>
        {session.description && (
          <div className="pt-2 border-t border-border">
            <p className="text-muted-foreground">{session.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default SessionSummaryHeader;
