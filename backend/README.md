# AI QuizVerse — backend

NestJS 11 API with Prisma 7 on PostgreSQL and two Socket.IO gateways
(`/` for presence and notifications, `/game` for matches).

```bash
npm install
npm run start:dev          # needs backend/.env (copy the root .env.example)
npx prisma migrate dev     # after changing prisma/schema.prisma
npx prisma db seed         # demo users, shop items and demo quizzes
npx jest                   # unit tests
```

Swagger docs: http://localhost:3000/api/docs

Each feature lives in its own module under `src/modules/` (controller, service, DTOs, types and
constants next to each other). Shared database access is `src/prisma/`, pure helpers are in
`src/common/utils/`. See `../docs/ARCHITECTURE.md` for the bigger picture.
