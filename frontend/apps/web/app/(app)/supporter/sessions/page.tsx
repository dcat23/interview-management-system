import { Tabs, TabsContent, TabsList, TabsTrigger } from '@feature/ui/components/tabs';
import { CalendarX } from 'lucide-react';
import { SessionCard } from '@app/web/components/supporter/session-card';
import { EmptyState } from '@app/web/components/supporter/empty-state';
import { getInterviewSessions } from '@feature/backend/server';

// No pagination UI on this page yet — fetch a generously large page so the
// "all sessions" read-only view is effectively complete for current data volumes.
const MAX_SESSIONS = 100;

export default async function SessionsPage() {
  const { data: sessionPage } = await getInterviewSessions({ limit: MAX_SESSIONS });
  const sessionCards = sessionPage.data;

  const now = Date.now();
  const upcoming = sessionCards.filter((s) => new Date(s.scheduledAt).getTime() >= now);
  const past = sessionCards.filter((s) => new Date(s.scheduledAt).getTime() < now);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Interview Sessions</h1>
        <p className="mt-1 text-muted-foreground">All interview sessions across clients</p>
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="mt-6">
          {upcoming.length > 0 ? (
            <div className="space-y-4">
              {upcoming.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={CalendarX}
              title="No upcoming sessions"
              description="Upcoming interview sessions will appear here."
            />
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          {past.length > 0 ? (
            <div className="space-y-4">
              {past.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          ) : (
            <EmptyState icon={CalendarX} title="No past sessions" description="Completed sessions will appear here." />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
