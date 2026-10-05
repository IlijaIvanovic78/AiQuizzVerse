# AI QuizVerse

A pixel-art study game. Type a topic or upload a lesson (PDF) and the app turns it into a quiz or a
five-step learning path with short study cards. Play alone, duel a friend or team up, and every
question you miss goes into your mistakes notebook so it comes back for review until you know it.

Built for the RWA course: **Angular 21 + NgRx**, **NestJS 11 + Prisma + PostgreSQL**, **RxJS** and
**Socket.IO**, everything started with Docker.

## Running it

Requirements: Docker Desktop.

```bash
cp .env.example .env        # then put your OpenAI key into OPENAI_API_KEY
docker compose up --build
```

- App: http://localhost:4200
- API + Swagger: http://localhost:3000/api/docs

The backend container applies migrations and seeds the database on every start (the seed is
idempotent). Without an OpenAI key everything works except AI generation; the seeded demo quizzes
are always playable.

### Demo accounts

| Email                  | Password   | Notes                         |
| ---------------------- | ---------- | ----------------------------- |
| `demo@quizverse.dev`   | `demo1234` | has coins, items and quizzes  |
| `friend@quizverse.dev` | `demo1234` | already friends with the demo |

Open the second account in a private window to try duels and team matches.

### Coin purchases

Coin packs use a payment provider chosen at startup:

- no `STRIPE_SECRET_KEY` → a built-in demo checkout (no money involved),
- a Stripe **test** key (`sk_test_...`) → real Stripe Checkout in test mode
  (pay with card `4242 4242 4242 4242`, any future date, any CVC).

Live keys are ignored on purpose. Purchases are behind a "grown-ups only" question and a monthly
spending limit.

### Useful commands

```bash
docker compose up --build -V              # after changing package.json (fresh node_modules)
docker compose down -v                    # wipe the database (needed once when upgrading from v1)
docker compose exec backend npx jest      # backend unit tests
docker compose exec backend npx prisma studio
```

Running without Docker: start only the database (`docker compose up -d db`), copy `.env` to
`backend/.env`, then `npm install && npm run start:dev` in `backend/` and `npm install && npm start`
in `frontend/`.

## Project layout

```
backend/    NestJS API, Socket.IO gateways, Prisma schema, migrations and seed
frontend/   Angular app (standalone components, signals, NgRx store)
docs/       architecture notes and the defense guide
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the pieces fit together.
