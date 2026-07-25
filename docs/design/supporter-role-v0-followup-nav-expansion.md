# Supporter Role — v0 Follow-up: Expanded Nav (Clients, Questions)

## Project context

Interview Management System (IMS) — an app for running technical interview processes. A
**candidate** goes through an **interview process** with a client company (an **end client**),
made up of one or more **interview sessions** (rounds). Each session has **questions** linked
from a shared question bank, and the interviewer submits **feedback** afterward.

Stack: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui components.

## What changed since the last round

The Supporter role previously only had one nav item ("My Sessions"). Supporter read access has
since been broadened — supporters can now view all end clients and the full question bank, not
just the sessions assigned to them. This follow-up adds two new top-level screens and updates the
nav accordingly. Everything from the previous round (`/supporter/sessions`,
`/supporter/sessions/[id]`, `/supporter/sessions/[id]/feedback`) stays as-is — this is additive.

## Nav update

Add two items to the existing single-item nav:

| Nav label | Route |
|---|---|
| Sessions | `/supporter/sessions` (existing) |
| Clients | `/supporter/clients` (new) |
| Questions | `/supporter/questions` (new) |

## New screen 1: `/supporter/clients` — end client directory

Base this on a person-directory-style grid layout (cards in a responsive grid, 3 columns on
desktop). Since clients are companies, not people, there's no avatar photo — use a simple
building/office icon in a circular or rounded-square badge instead of a headshot.

Each client card shows:
- Icon badge (building/office icon)
- Client name (prominent)
- Industry (subtitle, e.g. "Financial Services", "Healthcare Technology")
- Active/Inactive badge
- A "View Questions" link/button that goes to `/supporter/questions?client={id}`

Include a search input at the top (filters by name), an empty state, and a loading skeleton
version of the card.

Placeholder data — 6-8 clients across a few industries, one or two marked inactive.

## New screen 2: `/supporter/questions` — question bank browse

Base this on a filterable document-list layout: a row of topic filter pills at the top (All +
one pill per topic, e.g. "System Design", "Algorithms", "Behavioral", "Databases"), a search
input (debounced, matches against question text and topic), and a list of question rows below.

Each question row shows:
- Topic tag
- Round tag (e.g. "Technical Screen", "Final")
- Client name
- Truncated question body
- Active/Inactive badge (inactive questions shown muted, per the existing admin question-list
  convention — same visual treatment, reused here read-only)

This is a read-only browse view for the supporter — no "New Question" button, no edit action,
and no "Link to session" action (linking only happens from within a specific session's detail
page, which already exists). If a `client` query param is present (arriving from the Clients
page), pre-filter the list to that client and show an active filter chip with a way to clear it.

Include an empty state ("No questions match your search") and a loading skeleton.

Placeholder data — 10-12 questions spanning at least 3 clients and 4 topics, one or two inactive.

## Component list to generate

- `ClientCard` (grid item for the directory)
- `ClientSearchInput`
- `QuestionRow` (read-only browse variant — different from the existing session-linking row,
  which has a Link/Unlink action; this one has none)
- `TopicFilterPills`
- `ActiveFilterChip` (shows "Client: Acme Corp ✕" style clearable filter)
- Empty state and loading skeleton variants for both new screens (reuse the existing
  `EmptyState` shape from the previous round if regenerating in the same v0 project)

## Constraints

- Static/mock placeholder data only, no data fetching.
- Both new screens are read-only for the supporter — no create, edit, or delete affordances.
- Keep shadcn/ui component usage (Button, Badge, Card, Input, Skeleton).
- Don't add a Processes nav item or screen — not part of this round.
