# AI QuizVerse — frontend

Angular 21 (standalone components, signals, zoneless) with NgRx store, entity and effects,
Tailwind CSS and Socket.IO.

```bash
npm install
npm start                       # http://localhost:4200, proxies /api and /socket.io to :3000
npx ng build                    # production build
npx ng test --watch=false       # unit tests (Vitest)
```

- `src/app/core/` — singletons: typed API services, auth (tokens, guards, interceptor), sockets,
  sprites, sound, toasts, models
- `src/app/store/` — one NgRx slice per area (actions, reducer, effects)
- `src/app/features/` — routed pages (`*-page.component.ts`) and their presentational components
- `src/app/shared/` — reusable presentational components and pipes
- `src/app/layout/` — the app shell, top bar, bottom navigation and invite dialog
