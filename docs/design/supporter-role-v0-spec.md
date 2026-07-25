# Supporter Role — v0 Translation Spec

## Project context

Interview Management System (IMS) — an app for running technical interview processes. A
**candidate** goes through an **interview process** with a client company, made up of one or more
**interview sessions** (rounds). Each session has a **question bank** of questions asked, and the
interviewer submits **feedback** afterward.

Stack: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui components.

## Role: Interview Supporter

The Supporter is the interviewer. They only see sessions assigned to them. Their job:

1. See their upcoming/assigned interview sessions
2. During/after a session, link the questions they actually asked from a shared question bank
3. Write and submit feedback for the session (locks once submitted)

They cannot create sessions, edit process data, or see other supporters' sessions.

## Routes to build

| Route | Screen |
|---|---|
| `/supporter/sessions` | List of the supporter's assigned sessions |
| `/supporter/sessions/[id]` | Session detail + link/unlink questions asked |
| `/supporter/sessions/[id]/feedback` | Write, autosave, and submit feedback |

## Terminology mapping (template → this app)

| Template concept | Becomes |
|---|---|
| Meeting | Interview session |
| Meeting category pill (e.g. "Board Meeting") | Session mode: `Online` / `In Person` / `Hybrid` |
| Document | Question (from the question bank) |
| Document category filter | Question topic filter |
| Person / board member | Not used on Supporter screens |
| AI agent / chat | Not used on Supporter screens — remove that nav item and page entirely |

Nav should only contain one item for this role: **"My Sessions"**, linking to `/supporter/sessions`.

## Screen 1: `/supporter/sessions` — session list

Base this on the template's meetings list screen (card list, optionally with an
Upcoming/Past toggle).

Each session card shows:
- Title: `{technology} — Round {n}` e.g. "Backend Engineer — Round 2"
- Mode pill: `Online` / `In Person` / `Hybrid`
- Status badge: `Scheduled` / `In Review` / `Passed` / `Rejected` / `No Show`
- Date + time row (calendar icon)
- Whole card links to `/supporter/sessions/[id]`

Include an empty state ("No sessions assigned yet") and a loading skeleton version of the card.

Placeholder data — 4-5 sessions, mixed statuses/modes, dates spread across past and future.

## Screen 2: `/supporter/sessions/[id]` — session detail + question linking

Top: session summary header — technology, round, mode, status badge, date/time, candidate name.

Below, a two-column panel (stacks on mobile):

- **Left — "Questions Asked"**: list of questions already linked to this session. Each row:
  order number, question topic tag, truncated question text, an unlink/remove button.
- **Right — "Question Bank"**: search input at top, list of matching questions below (topic tag +
  truncated text + a "Link" button to add it to the left list).

Base the list-row styling on the template's document-list rows (icon, title, tag chip).

Add a small link/button to `/supporter/sessions/[id]/feedback` near the header.

Placeholder data — 3 linked questions, 6-8 searchable question-bank results across a couple of
topics (e.g. "System Design", "Algorithms", "Behavioral").

## Screen 3: `/supporter/sessions/[id]/feedback` — feedback editor

Header: same condensed session summary as screen 2.

**Two states, build both:**

- **Draft (editable)**: large textarea for feedback content, a muted "Saving…" / "Saved"
  indicator near it, and a primary "Submit Feedback" button. Clicking submit opens a confirmation
  dialog ("Submit feedback? This can't be edited afterward." — Cancel / Confirm).
- **Submitted (read-only)**: feedback content shown as static locked text in a card, a
  "Submitted" badge, and a timestamp. No editable controls, no submit button.

## Component list to generate

- `SessionCard` (list item)
- `SessionSummaryHeader` (used on detail + feedback screens)
- `LinkedQuestionRow` / `QuestionSearchResultRow`
- `FeedbackEditor` (draft state) / `FeedbackSubmitted` (locked state)
- `ConfirmDialog`
- `EmptyState`, loading skeleton for `SessionCard`

## Constraints

- Static/mock placeholder data only, no data fetching.
- Only build the "My Sessions" nav item — no dashboard, people, documents, or agent/chat screens.
- Keep shadcn/ui component usage (Button, Badge, Card, Dialog, Input, Textarea, Tabs if used).
