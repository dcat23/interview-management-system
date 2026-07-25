export type ProcessStatus = 'In Progress' | 'On Hold' | 'Offer Extended';

export type Process = {
  id: string;
  candidateName: string;
  technology: string;
  clientId: string;
  clientName: string;
  currentRound: string;
  status: ProcessStatus;
  sessionCount: number;
};

export type ProcessUpdate = {
  id: string;
  processId: string;
  message: string;
  timestamp: string;
};

// Interview processes across ALL clients — supporters have the same
// visibility as marketers/admins here, they just cannot edit.
export const processes: Process[] = [
  {
    id: 'p1',
    candidateName: 'Priya Nair',
    technology: 'Backend Engineer',
    clientId: 'c1',
    clientName: 'Acme Corp',
    currentRound: 'Round 2 - Technical',
    status: 'In Progress',
    sessionCount: 2,
  },
  {
    id: 'p2',
    candidateName: 'Marcus Chen',
    technology: 'Frontend Engineer',
    clientId: 'c2',
    clientName: 'Globex Media',
    currentRound: 'Round 1 - Screen',
    status: 'In Progress',
    sessionCount: 1,
  },
  {
    id: 'p3',
    candidateName: 'Sofia Ramirez',
    technology: 'Platform Engineer',
    clientId: 'c3',
    clientName: 'Initech Systems',
    currentRound: 'Round 3 - System Design',
    status: 'Offer Extended',
    sessionCount: 3,
  },
  {
    id: 'p4',
    candidateName: 'James Okoro',
    technology: 'Data Engineer',
    clientId: 'c4',
    clientName: 'Northwind Health',
    currentRound: 'Round 2 - Technical',
    status: 'In Progress',
    sessionCount: 2,
  },
  {
    id: 'p5',
    candidateName: 'Elena Novak',
    technology: 'Mobile Engineer',
    clientId: 'c5',
    clientName: 'Umbrella Retail',
    currentRound: 'Round 1 - Screen',
    status: 'On Hold',
    sessionCount: 1,
  },
  {
    id: 'p6',
    candidateName: 'Daniel Osei',
    technology: 'DevOps Engineer',
    clientId: 'c6',
    clientName: 'Stark Robotics',
    currentRound: 'Round 1 - Screen',
    status: 'In Progress',
    sessionCount: 1,
  },
];

// "Active" = currently moving through the pipeline (not paused).
export const activeProcesses = processes.filter((p) => p.status !== 'On Hold');

// Recent status changes across the same unscoped processes, newest first.
export const processUpdates: ProcessUpdate[] = [
  {
    id: 'u1',
    processId: 'p3',
    message: 'Sofia Ramirez — Platform Engineer Round 3 marked In Review',
    timestamp: '2026-07-21T13:05:00Z',
  },
  {
    id: 'u2',
    processId: 'p1',
    message: 'New session scheduled for Priya Nair — Backend Engineer Round 2',
    timestamp: '2026-07-20T09:30:00Z',
  },
  {
    id: 'u3',
    processId: 'p4',
    message: 'James Okoro — Data Engineer Round 2 marked Passed',
    timestamp: '2026-07-14T10:10:00Z',
  },
  {
    id: 'u4',
    processId: 'p3',
    message: 'Offer extended to Sofia Ramirez — Platform Engineer',
    timestamp: '2026-07-10T16:45:00Z',
  },
  {
    id: 'u5',
    processId: 'p2',
    message: 'Marcus Chen — Frontend Engineer process created',
    timestamp: '2026-07-08T10:15:00Z',
  },
];

export function getProcessById(id: string): Process | undefined {
  return processes.find((p) => p.id === id);
}
