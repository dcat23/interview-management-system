import { Tabs, TabsContent, TabsList, TabsTrigger } from '@feature/ui/components/tabs';
import { CalendarX } from 'lucide-react';
import { SessionCard } from '@app/web/components/supporter/session-card';
import { EmptyState } from '@app/web/components/supporter/empty-state';
import { sessions } from '@app/web/lib/data/sessions';

export default function SessionsPage() {
  const upcoming = sessions.filter((s) => s.timing === 'upcoming');
  const past = sessions.filter((s) => s.timing === 'past');

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">My Sessions</h1>
        <p className="mt-1 text-muted-foreground">Interview sessions assigned to you</p>
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
              title="No sessions assigned yet"
              description="Upcoming sessions assigned to you will appear here."
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
