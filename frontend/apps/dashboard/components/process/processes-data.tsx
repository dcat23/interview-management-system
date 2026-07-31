'use client';

import { useState } from 'react';
import moment from 'moment';

import { useProcesses } from '@app/dashboard/hooks/process/use-processes';
import { cn } from '@app/dashboard/lib/ui/utils';
import { InterviewProcess, ProcessStatus } from '@feature/base/server';
import { Badge } from '../ui/common/badge';
import { DataTableColumn, ProcessDataTable } from './process-data-table';
import { DataTable } from '../ui/data-table';

const DEFAULT_PAGE_SIZE = 10;


const statusConfig: Record<ProcessStatus, { label: string; className: string }> = {
  ACTIVE: {
    label: "Active",
    className: "bg-blue-500/15 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  },
  WITHDRAWN: {
    label: "Withdrawn",
    className: "bg-amber-500/15 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-rose-500/15 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  },
};

function StatusBadge({ status }: { status: ProcessStatus }) {
  const config = statusConfig[status];
  return (
    <Badge variant="outline" className={cn("border-0", config.className)}>
      {config.label}
    </Badge>
  );
}

const columns: DataTableColumn<InterviewProcess>[] = [
  {
    id: "candidateName",
    header: "Candidate",
    cell: (process) => process.candidateName ?? "Unknown candidate",
    sortValue: (process) => process.candidateName ?? "",
    sortable: true,
  },
  {
    id: "status",
    header: "Status",
    cell: (process) => <StatusBadge status={process.status} />,
    sortValue: (process) => process.status,
    sortable: true,
  },
  {
    id: "clientName",
    header: "Client",
    cell: (process) => process.clientName ?? "Unknown client",
    sortValue: (process) => process.clientName ?? "",
    sortable: true,
  },

  {
    id: "startedAt",
    header: "Started at",
    cell: (process) => moment(process.startedAt).format("MMM D, YYYY"),
    sortValue: (process) => moment(process.startedAt).valueOf(),
    sortable: true,
  },
];

export function ProcessesData() {
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(DEFAULT_PAGE_SIZE);

  const { data: pageResponse, isLoading } = useProcesses({ page, limit });

  return (
    <section className="min-h-svh w-full bg-background px-4 py-6 text-foreground">
      <div className="mx-auto w-full max-w-5xl">
        <ProcessDataTable
          pageResponse={pageResponse}
          isLoading={isLoading}
          onPageChange={setPage}
          onPageSizeChange={(nextLimit) => {
            setLimit(nextLimit);
            setPage(0);
          }}
          columns={columns}
          getRowId={(row) => row.id}
          enableRowSelection
          enableSorting
          searchPlaceholder="Search processes"
          searchableText={(process) => [
            process.candidateName,
            process.clientName,
            process.status,
            process.technology,
            moment(process.startedAt).format("MMM D, YYYY"),
          ]
            .filter(Boolean)
            .join(" ")}
          emptyMessage="No processes yet."
        />
      </div>
    </section>
  );
}

export default ProcessesData;
