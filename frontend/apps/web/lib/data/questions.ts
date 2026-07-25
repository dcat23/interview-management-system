import { getClientById } from '@app/web/lib/data/clients';

export type BankQuestionTopic = 'System Design' | 'Algorithms' | 'Behavioral' | 'Databases';

export type BankQuestion = {
  id: string;
  clientId: string;
  topic: BankQuestionTopic;
  round: string;
  text: string;
  active: boolean;
};

export const bankTopics: BankQuestionTopic[] = ['System Design', 'Algorithms', 'Behavioral', 'Databases'];

// Full question bank across all clients — separate from the simplified
// per-session linking bank in lib/data/sessions.ts (Question/questionBank),
// which only carries topic+text. This mirrors the real schema shape
// (questions: end_client_id, topic, round, body, is_active).
export const bankQuestions: BankQuestion[] = [
  {
    id: 'bq1',
    clientId: 'c1',
    topic: 'System Design',
    round: 'Technical Screen',
    text: 'Design a real-time fraud detection pipeline for high-volume card transactions.',
    active: true,
  },
  {
    id: 'bq2',
    clientId: 'c1',
    topic: 'Databases',
    round: 'Final',
    text: 'How would you model a double-entry ledger to guarantee balance consistency?',
    active: true,
  },
  {
    id: 'bq3',
    clientId: 'c1',
    topic: 'Behavioral',
    round: 'Technical Screen',
    text: 'Tell me about a time you had to make a tradeoff between speed and correctness.',
    active: false,
  },
  {
    id: 'bq4',
    clientId: 'c4',
    topic: 'System Design',
    round: 'Onsite',
    text: 'Design a HIPAA-compliant service for ingesting and querying patient vitals.',
    active: true,
  },
  {
    id: 'bq5',
    clientId: 'c4',
    topic: 'Algorithms',
    round: 'Technical Screen',
    text: 'Given appointment intervals, find the minimum number of exam rooms required.',
    active: true,
  },
  {
    id: 'bq6',
    clientId: 'c4',
    topic: 'Databases',
    round: 'Final',
    text: 'Explain how you would index a table of time-series sensor readings for range queries.',
    active: true,
  },
  {
    id: 'bq7',
    clientId: 'c2',
    topic: 'System Design',
    round: 'Onsite',
    text: 'Design a video transcoding queue that scales with unpredictable upload spikes.',
    active: true,
  },
  {
    id: 'bq8',
    clientId: 'c2',
    topic: 'Algorithms',
    round: 'Technical Screen',
    text: 'Implement a function to merge overlapping ad-scheduling windows.',
    active: true,
  },
  {
    id: 'bq9',
    clientId: 'c2',
    topic: 'Behavioral',
    round: 'Final',
    text: 'Describe how you handled a disagreement with a product manager over scope.',
    active: false,
  },
  {
    id: 'bq10',
    clientId: 'c3',
    topic: 'Databases',
    round: 'Technical Screen',
    text: 'How would you migrate a large multi-tenant schema with zero downtime?',
    active: true,
  },
  {
    id: 'bq11',
    clientId: 'c3',
    topic: 'System Design',
    round: 'Final',
    text: 'Design a feature-flagging service that supports gradual rollouts and instant kill switches.',
    active: true,
  },
  {
    id: 'bq12',
    clientId: 'c6',
    topic: 'Algorithms',
    round: 'Onsite',
    text: "Plan a robot's shortest collision-free path across a warehouse grid with obstacles.",
    active: true,
  },
];

export function getBankQuestionClientName(question: BankQuestion): string | undefined {
  return getClientById(question.clientId)?.name;
}
