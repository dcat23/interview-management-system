'use client';

import moment from 'moment';
import { TriangleAlertIcon } from 'lucide-react';
import { useProcesses } from '@feature/backend/hooks/process/use-processes';
import { useSessions } from '@feature/backend/hooks/session/use-sessions';
import type { SessionStatus } from '@feature/base/server';
import { StatTile } from '@app/atro-ui/components/ui/common/stat-tile';

const DATE = 'YYYY-MM-DD';
// An in-review session older than this is flagged on the awaiting tile.
const STALE_DECISION_HOURS = 48;

// Every tile reads only `total` from a one-row page — no stats endpoint needed.
function useSessionCount(params: { status?: SessionStatus; scheduledFrom?: string; scheduledTo?: string }) {
  const query = useSessions({ page: 0, limit: 1, ...params });
  return { count: query.data?.total ?? 0, isLoading: query.isLoading };
}

function passRate(passed: number, rejected: number) {
  const decided = passed + rejected;
  return decided === 0 ? null : Math.round((passed / decided) * 100);
}

export function MarketerKpis() {
  const today = moment();
  const weekStart = today.clone().startOf('isoWeek');
  const lastWeekStart = weekStart.clone().subtract(1, 'week');
  const windowStart = today.clone().subtract(29, 'days');
  const prevWindowStart = windowStart.clone().subtract(30, 'days');
  const prevWindowEnd = windowStart.clone().subtract(1, 'day');

  const activeProcesses = useProcesses({ page: 0, limit: 1, status: 'ACTIVE' });
  const recentProcesses = useProcesses({ page: 0, limit: 1, startedFrom: windowStart.format(DATE) });

  const thisWeek = useSessionCount({
    scheduledFrom: weekStart.format(DATE),
    scheduledTo: weekStart.clone().endOf('isoWeek').format(DATE),
  });
  const lastWeek = useSessionCount({
    scheduledFrom: lastWeekStart.format(DATE),
    scheduledTo: lastWeekStart.clone().endOf('isoWeek').format(DATE),
  });

  // Same params as AwaitingDecision's first page, so both share one cached request.
  const awaiting = useSessions({ page: 0, limit: 10, status: 'IN_REVIEW', sort: 'statusChangedAt,asc' });
  const oldestChangedAt = awaiting.data?.data[0]?.statusChangedAt;
  const oldestIsStale =
    !!oldestChangedAt && moment().diff(moment(oldestChangedAt), 'hours') >= STALE_DECISION_HOURS;

  const recent = { scheduledFrom: windowStart.format(DATE), scheduledTo: today.format(DATE) };
  const prior = { scheduledFrom: prevWindowStart.format(DATE), scheduledTo: prevWindowEnd.format(DATE) };
  const passed = useSessionCount({ status: 'PASSED', ...recent });
  const rejected = useSessionCount({ status: 'REJECTED', ...recent });
  const prevPassed = useSessionCount({ status: 'PASSED', ...prior });
  const prevRejected = useSessionCount({ status: 'REJECTED', ...prior });

  const rate = passRate(passed.count, rejected.count);
  const prevRate = passRate(prevPassed.count, prevRejected.count);
  const rateLoading = passed.isLoading || rejected.isLoading || prevPassed.isLoading || prevRejected.isLoading;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <StatTile
        label="Active processes"
        value={activeProcesses.data?.total ?? 0}
        hint={`${recentProcesses.data?.total ?? 0} started in the last 30 days`}
        isLoading={activeProcesses.isLoading || recentProcesses.isLoading}
      />

      <StatTile
        label="Sessions this week"
        value={thisWeek.count}
        delta={{ value: thisWeek.count - lastWeek.count, period: 'last week' }}
        isLoading={thisWeek.isLoading || lastWeek.isLoading}
      />

      <StatTile
        label="Awaiting decision"
        value={awaiting.data?.total ?? 0}
        hint={
          oldestChangedAt ? (
            <span className={oldestIsStale ? 'inline-flex items-center gap-1 text-amber-700 dark:text-amber-400' : undefined}>
              {oldestIsStale && <TriangleAlertIcon className="size-3.5" aria-hidden />}
              Oldest waiting {moment(oldestChangedAt).fromNow(true)}
            </span>
          ) : (
            'All caught up'
          )
        }
        isLoading={awaiting.isLoading}
      />

      <StatTile
        label="Pass rate (30 days)"
        value={rate === null ? null : `${rate}%`}
        delta={
          rate !== null && prevRate !== null
            ? { value: rate - prevRate, unit: ' pts', period: 'prior 30 days' }
            : undefined
        }
        hint={
          rate === null
            ? 'No decisions in the last 30 days'
            : `${passed.count} passed of ${passed.count + rejected.count} decided`
        }
        isLoading={rateLoading}
      />
    </div>
  );
}

export default MarketerKpis;
