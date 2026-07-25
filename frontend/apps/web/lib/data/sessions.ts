export type SessionMode = 'Online' | 'In Person' | 'Hybrid';
export type SessionStatus = 'Scheduled' | 'In Review' | 'Passed' | 'Rejected' | 'No Show';
export type SessionTiming = 'upcoming' | 'past';

export type Question = {
  id: string;
  topic: string;
  text: string;
};

export type FeedbackState = {
  submitted: boolean;
  content: string;
  submittedAt: string | null;
};

export type Session = {
  id: string;
  technology: string;
  round: number;
  mode: SessionMode;
  status: SessionStatus;
  timing: SessionTiming;
  date: string;
  time: string;
  candidateName: string;
  linkedQuestionIds: string[];
  feedback: FeedbackState;
};

// Shared question bank across all sessions
export const questionBank: Question[] = [
  {
    id: 'q1',
    topic: 'System Design',
    text: 'Design a URL shortening service like Bitly. Walk through the data model, API surface, and how you would handle read-heavy traffic at scale.',
  },
  {
    id: 'q2',
    topic: 'System Design',
    text: 'How would you design a rate limiter that works across a distributed fleet of API servers?',
  },
  {
    id: 'q3',
    topic: 'Algorithms',
    text: 'Given a list of intervals, merge all overlapping intervals and return the resulting non-overlapping set.',
  },
  {
    id: 'q4',
    topic: 'Algorithms',
    text: 'Find the k-th largest element in an unsorted array. Discuss the time/space tradeoffs of your approach.',
  },
  {
    id: 'q5',
    topic: 'Algorithms',
    text: 'Implement an LRU cache with O(1) get and put operations. Explain the data structures involved.',
  },
  {
    id: 'q6',
    topic: 'Behavioral',
    text: 'Tell me about a time you disagreed with a technical decision made by your team. How did you handle it?',
  },
  {
    id: 'q7',
    topic: 'Behavioral',
    text: 'Describe a project where you had to balance shipping quickly against long-term code quality.',
  },
  {
    id: 'q8',
    topic: 'Databases',
    text: 'When would you reach for a message queue instead of a direct synchronous call between services?',
  },
];

export function getQuestionById(id: string): Question | undefined {
  return questionBank.find((q) => q.id === id);
}

export const sessions: Session[] = [
  {
    id: '1',
    technology: 'Backend Engineer',
    round: 2,
    mode: 'Online',
    status: 'Scheduled',
    timing: 'upcoming',
    date: '2026-08-04',
    time: '10:00 AM - 11:00 AM EST',
    candidateName: 'Priya Nair',
    linkedQuestionIds: ['q1', 'q3', 'q6'],
    feedback: { submitted: false, content: '', submittedAt: null },
  },
  {
    id: '2',
    technology: 'Frontend Engineer',
    round: 1,
    mode: 'In Person',
    status: 'Scheduled',
    timing: 'upcoming',
    date: '2026-08-06',
    time: '2:00 PM - 3:00 PM EST',
    candidateName: 'Marcus Chen',
    linkedQuestionIds: [],
    feedback: { submitted: false, content: '', submittedAt: null },
  },
  {
    id: '3',
    technology: 'Platform Engineer',
    round: 3,
    mode: 'Hybrid',
    status: 'In Review',
    timing: 'past',
    date: '2026-07-21',
    time: '11:00 AM - 12:30 PM EST',
    candidateName: 'Sofia Ramirez',
    linkedQuestionIds: ['q2', 'q5'],
    feedback: {
      submitted: true,
      content:
        'Strong systems fundamentals. The candidate reasoned clearly about the rate limiter design, correctly identifying the token bucket approach and the need for a shared store like Redis to coordinate across nodes. On the LRU cache they arrived at the hashmap + doubly linked list solution with only a small hint. Communication was crisp and they asked good clarifying questions before diving in. Leaning toward advance.',
      submittedAt: '2026-07-21T13:05:00Z',
    },
  },
  {
    id: '4',
    technology: 'Data Engineer',
    round: 2,
    mode: 'Online',
    status: 'Passed',
    timing: 'past',
    date: '2026-07-14',
    time: '9:00 AM - 10:00 AM EST',
    candidateName: 'James Okoro',
    linkedQuestionIds: ['q4', 'q8'],
    feedback: {
      submitted: true,
      content:
        'Excellent interview. Solved the k-th largest problem with a heap and cleanly discussed the quickselect alternative including average vs worst case. Their answer on when to introduce a message queue showed real production experience — they brought up backpressure, retries, and decoupling deploy cycles. Clear hire.',
      submittedAt: '2026-07-14T10:10:00Z',
    },
  },
  {
    id: '5',
    technology: 'Mobile Engineer',
    round: 1,
    mode: 'In Person',
    status: 'No Show',
    timing: 'past',
    date: '2026-07-09',
    time: '3:30 PM - 4:30 PM EST',
    candidateName: 'Elena Novak',
    linkedQuestionIds: [],
    feedback: { submitted: false, content: '', submittedAt: null },
  },
];

export function getSessionById(id: string): Session | undefined {
  return sessions.find((s) => s.id === id);
}

export function sessionTitle(session: Session): string {
  return `${session.technology} — Round ${session.round}`;
}