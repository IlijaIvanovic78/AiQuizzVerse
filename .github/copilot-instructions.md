# 🤖 COPILOT INSTRUCTIONS — AI-QuizVerse

## 📌 Pregled Projekta

**AI-QuizVerse** je gamifikovana kviz platforma sa AI generisanjem pitanja, real-time multiplayer modovima, avatar sistemom i in-app ekonomijom.

---

## 🏗️ Tech Stack

| Layer             | Tehnologija                                      |
|-------------------|--------------------------------------------------|
| Frontend          | Angular 17+, NgRx (Store, Effects, Entities), RxJS, Tailwind CSS |
| Backend           | NestJS, Socket.io, Passport.js, Multer           |
| Baza podataka     | PostgreSQL + pgvector (za RAG embeddings)         |
| ORM               | Prisma                                           |
| AI Orchestration  | LangChain + LangGraph (Node.js/TS)               |
| Infrastruktura    | Docker & Docker Compose                          |
| Eksterni servisi  | Stripe API, OpenAI API (LLM & Embeddings)        |

---

## 📂 Referentni Projekat — `gamehosting-master`

U root-u ovog repozitorijuma nalazi se folder **`gamehosting-master/`** koji sadrži referentni projekat (game hosting platforma). Taj projekat koristi sličan stek (Angular + NestJS) i ima dobru organizaciju koda.

### ⚠️ VAŽNO — Kako koristiti referentni projekat

Pre nego što počneš da pišeš bilo koji modul za AI-QuizVerse, **OBAVEZNO** pogledaj odgovarajuće delove u `gamehosting-master/` za:

1. **Strukturu foldera** — Prati istu konvenciju organizacije modula (feature-based structure).
2. **Auth modul (Login, Registracija, JWT, Guards)** — Pogledaj kako je implementiran u `gamehosting-master/` i primeni isti obrazac, ali prilagođen AI-QuizVerse zahtevima (dodaj 2FA).
3. **API komunikacija** — Kako su organizovani servisi, interceptori, error handling.
4. **NestJS module organizacija** — Kako su moduli, kontroleri, servisi i provideri strukturirani.
5. **Angular komponente i servise** — Naming konvencije, lazy loading, standalone komponente.
6. **Environment konfiguracija** — Kako su env varijable organizovane.
7. **Docker setup** — Ako postoji Dockerfile/docker-compose, koristi ga kao polaznu tačku.

### 📍 Konkretni delovi za referencu:

| AI-QuizVerse modul        | Gde gledati u `gamehosting-master/`                        | Šta preuzeti / adaptirati                              |
|---------------------------|-------------------------------------------------------------|--------------------------------------------------------|
| Auth (Login/Register/JWT) | `gamehosting-master/backend/src/auth/`                     | JWT strategija, Guards, Decoratori, Auth module setup  |
| User modul                | `gamehosting-master/backend/src/user/`                     | CRUD pattern, DTO validacija, Prisma servis            |
| Angular Auth              | `gamehosting-master/frontend/src/app/auth/`                | Login/Register komponente, Auth interceptor, Guards    |
| Angular servisi           | `gamehosting-master/frontend/src/app/services/`            | HTTP servisi, error handling, token refresh            |
| NestJS struktura          | `gamehosting-master/backend/src/`                          | Module organizacija, main.ts bootstrap, app.module     |
| Angular struktura         | `gamehosting-master/frontend/src/app/`                     | App routing, lazy loading, shared module               |
| Docker                    | `gamehosting-master/docker-compose.yml`                    | Multi-container setup, network, volumes                |
| Prisma                    | `gamehosting-master/backend/prisma/`                       | Schema organizacija, migracije, seed                   |

> **NAPOMENA:** `gamehosting-master` je hosting platforma — NIJE kviz aplikacija. Koristi ga SAMO za arhitekturalne obrasce, stil koda i organizaciju. Sva biznis logika (kvizovi, AI, matchmaking, itd.) se piše od nule prema specifikaciji ispod.

---

## 📐 Projektna Struktura (AI-QuizVerse)

```
AI-QuizVerse/
├── gamehosting-master/          # ⚠️ REFERENTNI projekat (NE MENJATI)
├── backend/                     # NestJS API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── main.ts
│   │   ├── app.module.ts
│   │   ├── auth/                # Passport JWT + 2FA (speakeasy)
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── two-factor.guard.ts
│   │   │   └── dto/
│   │   ├── user/                # User CRUD, profil, XP, coins, level
│   │   ├── friendship/          # Friend requests, lista, status
│   │   ├── quiz/                # Quiz CRUD, Question management
│   │   ├── ai/                  # LangChain + LangGraph integracija
│   │   │   ├── ai.module.ts
│   │   │   ├── ai.service.ts
│   │   │   ├── rag/
│   │   │   │   ├── embeddings.service.ts
│   │   │   │   └── retriever.service.ts
│   │   │   └── graph/
│   │   │       ├── quiz-generator.graph.ts
│   │   │       ├── nodes/
│   │   │       │   ├── retriever.node.ts
│   │   │       │   ├── generator.node.ts
│   │   │       │   └── critic.node.ts
│   │   │       └── state.ts
│   │   ├── game/                # Match logic, scoring, game modes
│   │   │   ├── game.module.ts
│   │   │   ├── game.gateway.ts  # Socket.io Gateway
│   │   │   ├── game.service.ts
│   │   │   ├── modes/
│   │   │   │   ├── pvp.service.ts
│   │   │   │   ├── coop.service.ts
│   │   │   │   └── ranked.service.ts
│   │   │   └── dto/
│   │   ├── shop/                # Item shop, coins, boostovi
│   │   ├── avatar/              # Avatar, equipped items
│   │   ├── payment/             # Stripe integracija
│   │   │   ├── payment.module.ts
│   │   │   ├── payment.controller.ts
│   │   │   ├── payment.service.ts
│   │   │   └── stripe-webhook.controller.ts
│   │   ├── leaderboard/         # Rangiranje, friend leaderboard
│   │   ├── upload/              # Multer — PDF upload
│   │   ├── common/              # Shared: filters, pipes, decorators
│   │   └── config/              # Environment, constants
│   ├── test/
│   ├── Dockerfile
│   └── package.json
├── frontend/                    # Angular 17+ App
│   ├── src/
│   │   ├── app/
│   │   │   ├── app.component.ts
│   │   │   ├── app.routes.ts
│   │   │   ├── core/            # Interceptors, Guards, Auth logic
│   │   │   │   ├── interceptors/
│   │   │   │   │   ├── auth.interceptor.ts
│   │   │   │   │   └── error.interceptor.ts
│   │   │   │   ├── guards/
│   │   │   │   │   └── auth.guard.ts
│   │   │   │   └── services/
│   │   │   │       ├── auth.service.ts
│   │   │   │       ├── socket.service.ts
│   │   │   │       └── theme.service.ts
│   │   │   ├── features/
│   │   │   │   ├── auth/        # Login, Register, 2FA komponente
│   │   │   │   ├── dashboard/   # Početna strana, input za kviz temu
│   │   │   │   ├── quiz/        # Quiz creation, quiz play
│   │   │   │   ├── game/        # PvP, Co-op, Ranked igra
│   │   │   │   ├── profile/     # Profil strana, avatar editor
│   │   │   │   ├── friends/     # Friend lista, search, zahtevi
│   │   │   │   ├── shop/        # Item shop, coins kupovina
│   │   │   │   ├── leaderboard/ # Rang lista
│   │   │   │   └── ranked/      # Ranked journey mapa
│   │   │   ├── shared/          # Shared komponente, pipes, directives
│   │   │   │   ├── components/
│   │   │   │   │   ├── avatar-display/
│   │   │   │   │   ├── timer/
│   │   │   │   │   ├── progress-bar/
│   │   │   │   │   └── dynamic-background/
│   │   │   │   └── directives/
│   │   │   │       └── theme-background.directive.ts
│   │   │   └── store/           # NgRx Store
│   │   │       ├── auth/
│   │   │       │   ├── auth.actions.ts
│   │   │       │   ├── auth.reducer.ts
│   │   │       │   ├── auth.effects.ts
│   │   │       │   └── auth.selectors.ts
│   │   │       ├── game/
│   │   │       ├── user-assets/  # NgRx Entities za avatar items
│   │   │       ├── friends/
│   │   │       ├── quiz/
│   │   │       └── leaderboard/
│   │   ├── assets/
│   │   │   ├── avatars/         # Base body + equipment PNGs
│   │   │   ├── backgrounds/     # Theme backgrounds (space, history, code...)
│   │   │   └── icons/
│   │   ├── environments/
│   │   └── styles/
│   │       └── themes/          # Tailwind theme klase
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
├── COPILOT_INSTRUCTIONS.md      # ← OVAJ FAJL
└── README.md
```

---

## 🗄️ Baza Podataka — Prisma Schema

Definiši schema u `backend/prisma/schema.prisma`. Koristi PostgreSQL sa pgvector ekstenzijom.

### Glavni entiteti:

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [pgvector(map: "vector")]
}

model User {
  id            String       @id @default(uuid())
  email         String       @unique
  username      String       @unique
  password      String
  twoFaSecret   String?
  twoFaEnabled  Boolean      @default(false)
  avatarUrl     String?
  xp            Int          @default(0)
  coins         Int          @default(0)
  level         Int          @default(1)
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  quizzes       Quiz[]
  userItems     UserItem[]
  sentRequests  Friendship[] @relation("SentRequests")
  receivedRequests Friendship[] @relation("ReceivedRequests")
  matchPlayers  MatchPlayer[]
  rankedJourneys RankedJourney[]
}

enum FriendshipStatus {
  PENDING
  ACCEPTED
}

model Friendship {
  id         String           @id @default(uuid())
  senderId   String
  receiverId String
  status     FriendshipStatus @default(PENDING)
  createdAt  DateTime         @default(now())

  sender     User @relation("SentRequests", fields: [senderId], references: [id])
  receiver   User @relation("ReceivedRequests", fields: [receiverId], references: [id])

  @@unique([senderId, receiverId])
}

enum ItemType {
  HAT
  ARMOR
  WEAPON
  SHIELD
  BADGE
  PET
}

model Item {
  id        String   @id @default(uuid())
  name      String
  type      ItemType
  imagePath String
  price     Int
  minLevel  Int      @default(1)

  userItems UserItem[]
}

model UserItem {
  id         String  @id @default(uuid())
  userId     String
  itemId     String
  isEquipped Boolean @default(false)

  user User @relation(fields: [userId], references: [id])
  item Item @relation(fields: [itemId], references: [id])

  @@unique([userId, itemId])
}

enum QuizTheme {
  SPACE
  HISTORY
  PROGRAMMING
  SCIENCE
  GEOGRAPHY
  LITERATURE
  MATH
  GENERAL
  CUSTOM
}

enum Difficulty {
  EASY
  MEDIUM
  HARD
  EXPERT
}

model Quiz {
  id          String     @id @default(uuid())
  title       String
  theme       QuizTheme
  difficulty  Difficulty
  numQuestions Int
  timePerQuestion Int    // u sekundama
  createdById String
  sourceType  String     @default("prompt") // "prompt" | "pdf"
  createdAt   DateTime   @default(now())

  createdBy   User       @relation(fields: [createdById], references: [id])
  questions   Question[]
  matches     Match[]
  rankedStages RankedStage[]
}

model Question {
  id            String @id @default(uuid())
  quizId        String
  text          String
  options       Json   // ["A", "B", "C", "D"]
  correctAnswer Int    // index: 0-3
  explanation   String?

  quiz Quiz @relation(fields: [quizId], references: [id], onDelete: Cascade)
}

// ---- RAG: Document chunks sa embeddings-ima ----
model DocumentChunk {
  id        String                      @id @default(uuid())
  content   String
  embedding Unsupported("vector(1536)")  // OpenAI ada-002 dimenzija
  sourceFile String
  userId    String
  createdAt DateTime                    @default(now())
}

enum MatchType {
  PVP
  COOP
  RANKED
}

enum MatchStatus {
  WAITING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model Match {
  id        String      @id @default(uuid())
  type      MatchType
  status    MatchStatus @default(WAITING)
  quizId    String
  inviteCode String?    @unique
  createdAt DateTime    @default(now())
  endedAt   DateTime?

  quiz      Quiz          @relation(fields: [quizId], references: [id])
  players   MatchPlayer[]
}

model MatchPlayer {
  id        String  @id @default(uuid())
  matchId   String
  userId    String
  score     Int     @default(0)
  isWinner  Boolean @default(false)
  answers   Json?   // [{questionId, answer, timeMs, correct}]

  match Match @relation(fields: [matchId], references: [id], onDelete: Cascade)
  user  User  @relation(fields: [userId], references: [id])

  @@unique([matchId, userId])
}

model RankedJourney {
  id         String   @id @default(uuid())
  userId     String
  topic      String
  totalStages Int
  currentStage Int    @default(0)
  isCompleted Boolean @default(false)
  createdAt  DateTime @default(now())

  user   User          @relation(fields: [userId], references: [id])
  stages RankedStage[]
}

model RankedStage {
  id              String     @id @default(uuid())
  journeyId       String
  stageNumber     Int
  quizId          String
  difficulty      Difficulty
  isCompleted     Boolean    @default(false)
  score           Int?
  earnedReward    Json?      // {type: "HINT" | "TIME_BOOST" | "COINS", amount: 1}

  journey RankedJourney @relation(fields: [journeyId], references: [id], onDelete: Cascade)
  quiz    Quiz          @relation(fields: [quizId], references: [id])
}

enum BoostType {
  HINT
  EXTRA_TIME
  FIFTY_FIFTY
  DOUBLE_POINTS
  SHIELD         // Zaštita od gubitka poena
  STREAK_FREEZE  // Ne prekida win streak
}

model UserBoost {
  id       String    @id @default(uuid())
  userId   String
  type     BoostType
  quantity Int       @default(1)

  @@unique([userId, type])
}
```

---

## 🔐 A. Autentifikacija — Detaljna Specifikacija

### Referenca: `gamehosting-master/backend/src/auth/`

Pogledaj kako je auth modul organizovan u referentnom projektu i primeni iste obrasce:

### Backend (NestJS):

1. **JWT Strategy** sa Passport.js — Access Token (kratko traje: 15min) + Refresh Token (7 dana).
2. **2FA (Two-Factor Auth)**:
   - Koristi `speakeasy` za TOTP generisanje.
   - Koristi `qrcode` paket za generisanje QR koda za Authenticator app.
   - Flow: User omogući 2FA → Dobije QR kod → Skenira → Potvrdi sa kodom → `twoFaEnabled = true`.
   - Login flow sa 2FA: email+pass → ako je 2FA enabled, traži TOTP kod → tek tada izdaj JWT.
3. **Password hashing**: `bcrypt` (min 10 rounds).
4. **Guards**: `JwtAuthGuard`, `TwoFactorGuard`.
5. **DTO Validacija**: Koristi `class-validator` i `class-transformer`.

### Frontend (Angular):

1. **Auth Interceptor**: Dodaje `Authorization: Bearer <token>` na svaki request.
2. **Auth Guard**: CanActivate za zaštićene rute.
3. **NgRx Auth Store**:
   - Actions: `login`, `loginSuccess`, `loginFailure`, `register`, `logout`, `verify2FA`.
   - State: `{ user, token, refreshToken, isAuthenticated, is2FARequired, loading, error }`.
   - Effects: Pozivaju AuthService koji komunicira sa API-jem.
4. **RxJS `switchMap`**: Za proveru dostupnosti username-a u realnom vremenu (debounceTime → switchMap → API).

---

## 👥 B. Friendship Sistem

### Backend:
- `FriendshipController`: send-request, accept-request, reject-request, get-friends, remove-friend.
- **Socket.io**: Kad se user uloguje, emituj `friend-online` event svim prijateljima. Kad se diskonektuje — `friend-offline`.
- Pretraga korisnika po username-u (ILIKE za case-insensitive PostgreSQL pretragu).

### Frontend:
- **NgRx Entities** (`@ngrx/entity`): `EntityAdapter<Friend>` za efikasnu listu prijatelja.
- **RxJS `switchMap`**: Za search bar pretrage korisnika.
- Real-time status: Socket listener koji ažurira `isOnline` property u Entities store-u.

---

## 🧠 C. AI Quiz Engine (RAG + LangGraph)

### PDF Upload & RAG Pipeline:
1. User upload-uje PDF → Multer ga čuva.
2. PDF se parsira (`pdf-parse` paket) → tekst se deli na chunkove (500-1000 tokena).
3. Svaki chunk se šalje OpenAI Embeddings API (`text-embedding-ada-002`) → vektor 1536 dimenzija.
4. Vektori se čuvaju u `DocumentChunk` tabeli (pgvector).

### LangGraph Quiz Generation Flow:
```
[User Input: topic/prompt + settings]
        │
        ▼
┌─────────────────┐
│  Retriever Node  │ ← Izvlači relevantne chunkove iz pgvector (similarity search)
└────────┬────────┘
         │ context
         ▼
┌─────────────────┐
│  Generator Node  │ ← LLM generiše pitanja na osnovu konteksta
└────────┬────────┘
         │ questions[]
         ▼
┌─────────────────┐
│   Critic Node    │ ← LLM ocenjuje kvalitet, težinu, duplikate
└────────┬────────┘
         │
    ┌────┴────┐
    │ PASS?   │
    ├── YES ──→ Sačuvaj Quiz + Questions u bazu → Vrati korisniku
    └── NO ───→ Vrati na Generator Node (sa feedback-om od Critic-a)
```

### Frontend:
- Progress bar tokom generisanja: `HttpClient` poziv + `RxJS map` za transformaciju statusnih poruka.
- Settings UI: broj pitanja, vreme po pitanju, težina, tema.

---

## 🎮 D. Game Modes

### PvP (1v1):
- **Socket.io Gateway** (`game.gateway.ts`):
  - Events: `create-match`, `join-match`, `submit-answer`, `next-question`, `match-end`.
  - Invite sistem: generisanje `inviteCode` → share link ili in-app invite prijatelju.
- **RxJS `zip`**: Na serveru — čekaj oba odgovora pre nego što procesuiraš turn i pošalješ sledeće pitanje.
- **RxJS `takeUntil`**: Čišćenje socket subskripcija kad se napusti meč.
- Scoring: Tačnost + brzina (brži odgovor = više poena).

### Co-op (Duo):
- Dva igrača dele skor.
- Turn-based: Server prati `currentTurnPlayerId`.
- Socket event: `your-turn` / `partner-turn`.
- Zajednički tajmer.

### Ranked Journey:
- AI generiše kompletnu "mapu" od N nivoa (zavisno od teme/dokumenta).
- Svaki nivo = 1 Quiz sa rastućom težinom (EASY → MEDIUM → HARD → EXPERT).
- Po završetku nivoa, igrač dobija reward (boost, coins, item).
- Vizualno: Mapa sa nodovima (kao RPG progression map).
- Čuva progres u `RankedJourney` + `RankedStage` tabelama.

---

## 🎭 E. Avatar Sistem

- **Layered rendering**: CSS `z-index` slojeviti prikaz.
  - Layer 0: Base body.
  - Layer 1: Armor.
  - Layer 2: Weapon.
  - Layer 3: Hat.
  - Layer 4: Shield.
  - Layer 5: Badge.
  - Layer 6: Pet.
- Slike: PNG sa transparencijom, iste dimenzije za sve slojeve.
- **NgRx**: `UserAssetsState` koristi `@ngrx/entity` za `UserItem[]`, selector `selectEquippedItems` filtrira i mapira na aktivne slojeve.
- Avatar se prikazuje na profilu, tokom meča, na leaderboard-u.

---

## 🌌 F. Dinamičke Pozadine

- Prilikom generisanja kviza, AI vraća `theme: QuizTheme` enum vrednost.
- Angular `ThemeService` sluša trenutnu temu i ažurira `currentTheme$` observable.
- Tailwind klase za teme:
  ```css
  .bg-space-theme { /* dark gradient + stars animation */ }
  .bg-history-theme { /* parchment/sepia tones */ }
  .bg-programming-theme { /* matrix/code rain */ }
  .bg-science-theme { /* molecule/atom patterns */ }
  /* itd. za svaku QuizTheme */
  ```
- Koristi `[ngClass]="currentTheme$ | async"` na glavnom layout kontejneru.
- Animirani prelazi između tema (CSS transitions).

---

## 💰 G. Ekonomija i Plaćanja

### Stripe Integration:
1. Frontend poziva `POST /payment/create-checkout` → Backend kreira Stripe Checkout Session.
2. Korisnik se šalje na Stripe Checkout stranicu.
3. Po uplati: Stripe šalje webhook → `POST /payment/webhook` → ažuriraj `user.coins`.
4. Koristi `stripe` NPM paket na backendu.
5. Verifikuj webhook signature (`stripe.webhooks.constructEvent`).

### Coins Economy:
- Zarađivanje: Pobeda u PvP (+50), Ranked stage clear (+30 * stageNumber), Dnevni login (+10).
- Trošenje: Shop items, Boostovi tokom igre.
- **RxJS `merge`**: Spajanje real-time coin zarađivanja (socket) + manuelne kupovine radi instant UI ažuriranja.

### Boostovi (Power-ups):
| Boost          | Efekat                                    | Cena (coins) |
|----------------|-------------------------------------------|--------------|
| HINT           | Prikazuje hint za pitanje                  | 20           |
| EXTRA_TIME     | +10 sekundi za to pitanje                  | 15           |
| FIFTY_FIFTY    | Eliminiše 2 netačna odgovora              | 25           |
| DOUBLE_POINTS  | 2x poeni za to pitanje                    | 30           |
| SHIELD         | Zaštita od gubitka poena ako se pogreši    | 35           |
| STREAK_FREEZE  | Čuva win streak čak i ako se izgubi       | 40           |

---

## 🔧 RxJS Operatori — Gde se koriste

| Operator     | Gde                                                        |
|-------------|-------------------------------------------------------------|
| `map`       | Transformisanje socket poruka, API odgovora, score kalkulacija |
| `filter`    | Filtriranje socket poruka za trenutni meč/sobu              |
| `reduce`    | Kalkulacija ukupnog skora na kraju meča                     |
| `switchMap` | Username availability check, Friend search, AI request cancel |
| `takeUntil` | Čišćenje subskripcija na `ngOnDestroy`, izlaz iz kviza       |
| `zip`       | Sinhronizacija odgovora oba igrača u PvP modu              |
| `merge`     | Global Event Feed (friend events + coin events + notifications) |
| `debounceTime` | Search inputi pre slanja API poziva                      |
| `distinctUntilChanged` | Sprečava ponovljene emisije istog stanja           |
| `combineLatest` | Kombinovanje timer-a + score-a za live prikaz u igri   |
| `tap`       | Side effects (logging, analytics, sound effects trigger)    |
| `catchError` | Error handling u Effects i servisima                       |
| `retry`     | Retry logika za nestabilnu Socket konekciju                 |

---

## 🏪 NgRx Store — Struktura

### Auth State
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  is2FARequired: boolean;
  loading: boolean;
  error: string | null;
}
```

### Game State
```typescript
interface GameState {
  currentMatch: Match | null;
  currentQuestionIndex: number;
  questions: Question[];
  playerScore: number;
  opponentScore: number;
  timeRemaining: number;
  mode: 'PVP' | 'COOP' | 'RANKED';
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED';
  activeBooosts: BoostType[];
}
```

### User Assets State (NgRx Entities)
```typescript
// Koristi EntityState<UserItem> iz @ngrx/entity
interface UserAssetsState extends EntityState<UserItem> {
  loading: boolean;
  error: string | null;
}
```

### Friends State (NgRx Entities)
```typescript
interface FriendsState extends EntityState<Friend> {
  pendingRequests: FriendRequest[];
  searchResults: UserSearchResult[];
  loading: boolean;
}
```

---

## 🐳 Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    env_file: .env
    depends_on:
      - db
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "4200:4200"
    volumes:
      - ./frontend:/app
      - /app/node_modules

  db:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

---

## 📏 Kodne Konvencije i Pravila

1. **UVEK pogledaj `gamehosting-master/` pre pisanja novog modula** — pronađi ekvivalentan modul i prati isti stil.
2. **NestJS**:
   - Svaki feature je zaseban NestJS modul.
   - Koristi DTO klase sa `class-validator` dekoratorima za svaki endpoint.
   - Koristi Custom Decorators gde ima smisla (npr. `@CurrentUser()`).
   - Exception Filters za centralizovano rukovanje greškama.
   - Swagger dekoratori za API dokumentaciju (`@nestjs/swagger`).
3. **Angular**:
   - Koristi standalone komponente (Angular 17+ standard).
   - Lazy loading za svaki feature modul.
   - Smart/Dumb komponenta pattern: Smart komponente komuniciraju sa Store-om, Dumb primaju `@Input()` i emituju `@Output()`.
   - Sve subskripcije čistiti sa `takeUntil(destroy$)` ili `DestroyRef`.
4. **Prisma**:
   - Jedan `schema.prisma` fajl.
   - Koristi `PrismaService` koji extends `PrismaClient` (pogledaj pattern u `gamehosting-master`).
5. **Naming**:
   - Backend: `camelCase` za varijable/metode, `PascalCase` za klase, `kebab-case` za fajlove.
   - Frontend: isto + Angular konvencije (`*.component.ts`, `*.service.ts`, `*.guard.ts`, itd.).
6. **Git Commits**: Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`).

---

## 🚀 Redosled Implementacije (Preporučeni)

### Faza 1 — Temelj
1. Docker Compose setup (backend + frontend + db).
2. Prisma schema + migracije.
3. Auth modul (register, login, JWT, 2FA) — **REFERENCIRA `gamehosting-master` auth**.
4. User modul (CRUD, profil).

### Faza 2 — Core AI
5. PDF Upload (Multer).
6. RAG pipeline (chunking, embeddings, pgvector).
7. LangGraph Quiz Generator (retriever → generator → critic ciklus).
8. Quiz API (CRUD, settings).

### Faza 3 — Igra
9. Socket.io setup + Game Gateway.
10. PvP mod (matchmaking, invite, real-time gameplay).
11. Co-op mod (turn-based shared score).
12. Ranked Journey (map generation, progression).

### Faza 4 — Gamifikacija & Ekonomija
13. Avatar sistem (shop, equip, layered rendering).
14. Leaderboard (friend-based + global).
15. Stripe integration (coins kupovina).
16. Boost sistem (hint, extra time, itd.).
17. Dinamičke pozadine.
18. XP/Level sistem.

### Faza 5 — Polish
19. Animacije i tranzicije.
20. Sound effects.
21. Responsive design.
22. Error handling i edge cases.
23. Testing.

---

## 🎨 Dodatne Ideje za Gamifikaciju

- **Daily Challenges**: Svaki dan novi mini-kviz sa bonus nagradama.
- **Achievements/Trofeje**: "Odgovori 100 pitanja tačno", "Pobedi 10 PvP mečeva", itd.
- **Win Streak Bonus**: Uzastopne pobede daju sve veći coin bonus.
- **Quiz of the Day**: Jedan featured kviz dnevno sa globalnim leaderboard-om.
- **Spectator Mode**: Prijatelji mogu da gledaju PvP meč uživo.
- **Chat u igri**: Emoji reactions tokom meča (Socket.io).
- **Custom Avatars**: Unlock-uju se kompletni setovi opreme za specifične achievement-e.
- **Seasonal Events**: Tematski kvizovi za praznike sa ekskluzivnim nagradama.
- **Experience Bar Animation**: XP bar se puni sa animacijom nakon svakog meča.
- **Sound Effects**: Correct answer ding, wrong answer buzz, timer ticking, victory fanfare.

---

## ⚠️ Česte Greške — Izbegavaj

1. **NE kopiraj biznis logiku iz `gamehosting-master`** — koristi samo arhitekturalne obrasce.
2. **NE čuvaj JWT tokene u localStorage** — koristi HttpOnly cookies ili in-memory sa refresh token rotacijom.
3. **NE zaboravi Stripe webhook signature verification** — inače je ranjiv na spoofing.
4. **NE ostavljaj OpenAI API ključ u kodu** — koristi environment varijable.
5. **NE koristi `subscribe()` u Angular komponentama bez cleanup-a** — uvek `takeUntil` ili `async` pipe.
6. **NE šalji ceo quiz objekat kroz socket** — šalji samo `questionId` i preuzmi iz store-a.
7. **NE zaboravi CORS konfiguraciju** za frontend ↔ backend komunikaciju.
8. **NE preskači DTO validaciju** — svaki endpoint mora imati DTO sa validacijom.