# Reconnect

Reconnect is a lightweight follow-up dashboard for non-clinical student-support teams. It helps coordinators identify unresolved requests for contact, notice overdue check-ins, and record completed outreach without losing the context behind each status.

I chose this idea because a missed support request is a small but meaningful workflow problem. It also creates a focused way to demonstrate persisted data, GraphQL mutations, temporal business rules, and an end-to-end React experience within the exercise's four-hour scope.

> All participants and notes in this repository are fictional. Reconnect is a workflow demonstration, not a clinical or medical system.

## Features

- Prioritized follow-up queue with plain-language status reasons
- Summary counts for requested contact, overdue check-ins, and current participants
- Name search and server-side status filtering
- Check-in form with an explicit contact-request option
- Outreach form that resolves earlier requests only when the outreach is later
- SQLite persistence across page reloads and server restarts
- Responsive desktop table and mobile card layout
- Loading, empty, validation, API error, and mutation progress states
- Accessible Radix-based dialogs, controls, focus states, and status labels

## Technology

| Area | Choice |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| Server state | TanStack Query and `graphql-request` |
| UI | Tailwind CSS, shadcn/ui patterns, Radix UI, Lucide icons |
| API | GraphQL Yoga |
| Persistence | SQLite with `better-sqlite3` |
| Tests | Vitest |

## Architecture

The UI treats the GraphQL API as the source of truth. It never recalculates a participant's follow-up status in the browser.

```text
React dashboard
      |
TanStack Query + graphql-request
      |
GraphQL Yoga resolvers
      |
ParticipantService (business rules and aggregation)
      |
ParticipantRepository
      |
SQLite
```

The backend is split into four small responsibilities:

- `db/` owns schema creation, seed data, parameterized SQL, and persistence.
- `services/follow-up.ts` contains the pure status calculation.
- `services/participant-service.ts` builds participant views, summaries, and mutations.
- `graphql/` exposes those capabilities without embedding business rules in resolvers.

For this deliberately small dataset, participant events are loaded per participant. A production version would batch those reads or use window queries before introducing pagination.

## Follow-up rule

Statuses are evaluated in this order:

1. **Contact requested** - the most recent contact-requesting check-in has no outreach recorded strictly after it.
2. **Check-in overdue** - there is no unresolved request, and the latest check-in is at least 72 hours old or missing.
3. **Up to date** - the latest check-in is less than 72 hours old and no request is unresolved.

An unresolved request has priority over an overdue check-in. A later check-in without a request does not silently erase an earlier request. The API also returns a human-readable reason so the coordinator does not have to interpret an opaque score.

The calculation receives the current time as a dependency instead of reading the system clock internally. That makes boundary cases, including exactly 72 hours, deterministic in tests.

## Data model

Reconnect uses three SQLite tables:

- `participants` stores the fictional participant identity.
- `check_ins` stores contact preferences, an optional note, and a UTC timestamp.
- `outreaches` stores completed contact attempts, an optional note, and a UTC timestamp.

Tables and indexes are created at startup. Four fictional participants are seeded only when the database is empty, with examples covering every follow-up state. Generated database and WAL files are ignored by Git.

## Run locally

### Requirements

- Node.js 20.19 or newer; Node 22 LTS is recommended
- npm 10 or newer

### Setup

```bash
git clone https://github.com/starglow-it/software-engineer-test.git
cd software-engineer-test
npm install
npm run dev
```

Open:

- Dashboard: <http://localhost:5173>
- GraphQL endpoint: <http://localhost:4000/graphql>

No environment configuration is required. The defaults are shown in `.env.example`. To override the frontend endpoint, place `VITE_GRAPHQL_URL` in `client/.env`. Server overrides such as `PORT`, `CLIENT_ORIGIN`, and `DATABASE_PATH` can be exported in the shell before running the command.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Compile/start the API and start Vite |
| `npm test` | Run server and client tests once |
| `npm run typecheck` | Type-check both workspaces |
| `npm run build` | Create production builds for both workspaces |
| `npm start -w server` | Start the previously built API |

## Tests

The test suite focuses on the highest-risk behavior:

- A request remains visible without later outreach.
- Earlier or equal-time outreach cannot resolve a request.
- Later outreach resolves a request.
- Unresolved requests outrank overdue status.
- Exactly 72 hours is overdue; just under 72 hours is current.
- A later non-requesting check-in cannot erase a request.
- Seed data is idempotent and repository writes are durable.
- A GraphQL integration test exercises request creation and later resolution.
- Client formatting fallbacks remain clear.

Run the full verification gate:

```bash
npm run typecheck
npm test
npm run build
```

## Assumptions

- All included participants and notes are fictional.
- This application organizes non-clinical follow-up work only.
- Timestamps are stored as UTC ISO 8601 values.
- Dates are displayed in the browser's local timezone.
- A check-in becomes overdue at 72 hours; exactly 72 hours is overdue.
- Only outreach strictly after a request resolves it.
- A request remains open until resolved, even if a later check-in does not request contact.
- The demo represents one coordinator and intentionally omits authentication.
- SQLite is appropriate for the requested local, durable demonstration.

## Scope and tradeoffs

The implementation is intentionally narrow so the core workflow is complete and explainable. I did not add authentication, multiple organizations, notification delivery, real-time subscriptions, clinical scoring, or deployment infrastructure. Styling uses a small set of local shadcn/ui-style components rather than a large custom design system.

The API calculates summary counts and filtered participant views on demand. This keeps the logic straightforward for a four-person demonstration; a larger dataset would need batched event queries, pagination, and database-level aggregation.

## With more time

I would prioritize:

1. Authentication, organization boundaries, and role-based access
2. An immutable audit trail for check-ins and outreach
3. Configurable follow-up cadences and participant timezones
4. Pagination and batched database queries
5. End-to-end browser and automated accessibility tests
6. PostgreSQL migrations, structured logging, and monitoring
7. Privacy, consent, retention, and security review
8. Workflow validation with actual support coordinators

## Privacy and safety

This repository contains no real personal or health information. A production version would require a formal security and privacy review, strict authorization, retention controls, audit logging, encryption, and careful operational policies. This demonstration does not claim HIPAA compliance and does not provide medical guidance.

