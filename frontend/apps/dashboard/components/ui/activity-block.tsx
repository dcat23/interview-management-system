import {
  RiErrorWarningLine,
  RiGitMergeLine,
  RiKey2Line,
  RiUploadCloud2Line,
  RiUserAddLine,
} from '@remixicon/react';

import { Badge } from '@app/dashboard/components/ui/common/badge';

type Event = {
  icon: typeof RiGitMergeLine;
  title: string;
  detail: string;
  tag: string;
  time: string;
};

const events: Event[] = [
  {
    icon: RiGitMergeLine,
    title: 'feat/auth-refresh merged',
    detail: 'Mara Ellis merged 12 commits into main.',
    tag: 'Deploy',
    time: '12 Min Ago',
  },
  {
    icon: RiUploadCloud2Line,
    title: 'Production deploy v2.4.1',
    detail: 'Build passed and shipped in 4m 12s.',
    tag: 'Deploy',
    time: '1 Hour Ago',
  },
  {
    icon: RiKey2Line,
    title: 'API key rotated',
    detail: 'Leo Tanaka revoked and reissued the production key.',
    tag: 'Security',
    time: '3 Hours Ago',
  },
  {
    icon: RiUserAddLine,
    title: 'Two members invited',
    detail: 'Owen Brooks invited design@acme.com and one other.',
    tag: 'Team',
    time: '5 Hours Ago',
  },
  {
    icon: RiErrorWarningLine,
    title: 'Usage limit warning',
    detail: 'Workspace reached 85% of the monthly API quota.',
    tag: 'Alert',
    time: 'Yesterday',
  },
];

export default function ActivityBlock() {
  return (
    <section className="flex w-full items-center justify-center bg-background px-6 py-16 text-foreground">
      <div className="w-full max-w-lg border border-border bg-background">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Audit Log</h2>
          <Badge variant="secondary">Last 24 Hours</Badge>
        </div>

        <ul className="flex flex-col divide-y divide-border">
          {events.map((event) => (
            <li key={event.title} className="flex items-start gap-3 px-5 py-4">
              <span className="flex size-9 shrink-0 items-center justify-center border border-border bg-muted/40 text-muted-foreground">
                <event.icon className="size-4.5" aria-hidden="true" />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold">
                    {event.title}
                  </h3>
                  <Badge variant="outline" className="shrink-0">
                    {event.tag}
                  </Badge>
                </div>
                <p className="text-xs/relaxed text-muted-foreground">
                  {event.detail}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {event.time}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
