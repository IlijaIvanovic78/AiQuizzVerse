# Odbrana projekta: AI QuizVerse

Ovaj dokument je podsetnik za odbranu. Svaki link vodi na tačan fajl i liniju u kodu, pa možeš
da ga otvoriš u editoru dok objašnjavaš. Redosled prati tok kojim ćeš verovatno pričati: šta je
aplikacija, kako se pokreće, gde su zahtevi predmeta, kako rade glavni tokovi, a onda recepti za
izmene uživo i moguća pitanja.

Opšti pregled arhitekture je u [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 1. Ukratko o aplikaciji

AI QuizVerse je pixel-art igra za učenje. Korisnik upiše temu ili otpremi PDF lekciju, a AI
(OpenAI preko LangChain-a) napravi kviz sa pitanjima, hintovima i objašnjenjima. Kviz može da se
napiše i ručno. Postoje četiri načina igre: **SOLO** (sam protiv sanduka sa blagom), **DUEL**
(dvoje igrača jedan protiv drugog, bez pojačanja), **TEAM** (dvoje igrača u timu, pobeđuju ako
zajedno imaju bar 60% tačnih) i **PARTY** "Ko zna zna" (2-4 igrača, prvi tačan odgovor nosi
rundu, pogrešan odgovor izbacuje iz runde i oduzima 25 poena, a igrači mogu da sabotiraju jedni
druge mastilom, zamrzavanjem, mešanjem odgovora, maglom, zemljotresom ili ogledalom, ili da
podignu štit). **Learning path** je putanja od 5 koraka, od lakog do teškog: svaki korak ima
kratku karticu za učenje i kviz, zvezdice se dobijaju za 60/80/100% tačnih, nagrada stiže pri
prvom prelasku, a sledeći korak se otključava tek kad se pređe prethodni. Svako pogrešno pitanje
ide u **Mistakes notebook** i vraća se na ponavljanje posle 1, 3 i 7 dana, dok se ne odgovori
tačno tri puta zaredom (spaced repetition). Igrač skuplja XP, nivoe, dnevni niz (streak) i
novčiće, kojima u **prodavnici** kupuje heroje, ljubimce i pojačanja (hint, 50/50, dodatno
vreme, druga šansa).

**Kovčezi** (drveni, srebrni, zlatni) se ne mogu kupiti ni novčićima ni pravim novcem, nego se
zarađuju igrom i učenjem: prvi dobar meč u danu, pobeda u duelu ili partiji, prelazak koraka
putanje, novi nivo i svakih 7 dana niza. Otvaraju se u "Treasure room" i daju novčiće,
pojačanja ili, retko, heroja ili ljubimca; neki heroji i ljubimci postoje samo u kovčezima, a
predmet koji igrač već ima pretvara se u novčiće. Šanse za svaki kovčeg su javne i prikazane na
istoj stranici. (Kovčeg nije isto što i "sanduk sa blagom" u SOLO, TEAM i meču na putanji; to
je samo traka koja se puni tačnim odgovorima.)

Novčići mogu i da se kupe, ali samo iza "grown-ups only" pitanja i sa mesečnim limitom od 10 EUR,
preko demo checkout-a ili Stripe-a u test modu (pravi novac se nikad ne naplaćuje). Mečevi rade
u realnom vremenu preko Socket.IO, a ceo sistem se diže jednom Docker komandom.

---

## 2. Kako se pokreće

### Prvo pokretanje

```bash
cp .env.example .env          # OPENAI_API_KEY je opcioni
docker compose up --build
```

- Aplikacija: http://localhost:4200
- Swagger (svi REST endpointi, može i da se testira): http://localhost:3000/api/docs
- Health provera baze: http://localhost:3000/health

Šta se dešava pri startu:

- `db` je Postgres 16 sa healthcheck-om ([docker-compose.yml:2-18](../docker-compose.yml#L2-L18)).
- `backend` čeka da baza bude zdrava ([docker-compose.yml:46-48](../docker-compose.yml#L46-L48)), pa
  pokrene `prisma generate`, `migrate deploy`, `db seed` i Nest u watch modu
  ([backend/Dockerfile.dev:15](../backend/Dockerfile.dev#L15)).
- `frontend` je `ng serve` sa proxy-jem: `/api` i `/socket.io` idu na backend
  ([frontend/proxy.conf.js:4-16](../frontend/proxy.conf.js#L4-L16)). Zato frontend i backend za
  browser izgledaju kao isti origin i nema CORS problema.

Bez OpenAI ključa sve radi osim AI generisanja (dobije se poruka "The quiz master is resting",
[quiz-writer.service.ts:115-120](../backend/src/modules/ai/quiz-writer.service.ts#L115-L120)).
Demo kvizovi iz seed-a su uvek igrivi.

### Demo nalozi

| Email                  | Lozinka    | Napomena                                                                          |
| ---------------------- | ---------- | --------------------------------------------------------------------------------- |
| `demo@quizverse.dev`   | `demo1234` | ima novčiće, pojačanja, heroja, ljubimca, kvizove i tri neotvorena kovčega (drveni, srebrni, zlatni) |
| `friend@quizverse.dev` | `demo1234` | već je prijatelj sa demo nalogom, ima jedan drveni kovčeg                        |

Kovčezi iz seed-a se dodaju samo dok nalog nema nijedan, pa ih restart ne vraća posle otvaranja
([seed.ts:117-124](../backend/prisma/seed.ts#L117-L124)).

### Trik: dva igrača u istom browseru

Tokeni se čuvaju u `localStorage`
([token-storage.service.ts:5-14](../frontend/src/app/core/auth/token-storage.service.ts#L5-L14)).
`localStorage` je odvojen po originu (protokol + host + port). `http://localhost:4200` i
`http://127.0.0.1:4200` su za browser **dva različita origina**, pa svaki ima svoje tokene, a oba
gađaju isti Angular dev server i isti backend.

1. Prozor A: `http://localhost:4200` → login kao `demo@quizverse.dev`.
2. Prozor B: `http://127.0.0.1:4200` → login kao `friend@quizverse.dev`.
3. U A: Library → neki kviz → Play → "Duel a friend" (ili Team/Party).
4. U lobiju A klikne Invite pored prijatelja. B dobije `duel:invite` dijalog i prihvati ga
   (dugme Accept, za Team "Team up", za Party "Join the party").
   Druga mogućnost: B otvori `/join` i ukuca kod sa ekrana A.
5. Kad su oba povezana, host (A) klikne dugme za start u lobiju.

Dva taba na istom originu su isti korisnik (deli se `localStorage`), zato je trik potreban.
Može i privatni prozor. Napomena: Stripe se posle plaćanja vraća na `FRONTEND_URL`
(`localhost`), pa kupovinu novčića pokazuj u `localhost` prozoru.

### Korisne komande

```bash
docker compose logs -f backend                         # logovi servera
docker compose exec backend npx jest                   # backend unit testovi
docker compose exec frontend npx ng test --watch=false # frontend testovi (Vitest)
docker compose exec backend npx tsc --noEmit -p tsconfig.json
docker compose exec db psql -U quizverse -d quizverse  # SQL konzola baze
docker compose down -v                                 # obriši bazu i kreni od nule
```

Prisma Studio ne radi kroz `docker compose exec backend`, jer port 5555 kontejnera nije
objavljen. Pokreni ga sa hosta: `cd backend && npx prisma studio`, uz `backend/.env` kopiran iz
root `.env` (tamo `DATABASE_URL` gađa `localhost:5432`). Korisnik i ime baze u `psql` komandi su
podrazumevani iz `docker-compose.yml`; ako ih menjaš u `.env`, promeni ih i ovde.

Izmene koda se same učitavaju: backend radi `nest start --watch`, frontend `ng serve --poll`.
Posle izmene `schema.prisma` uradi migraciju i restart backenda (vidi recept 2 u odeljku 5).

---

## 3. Zahtevi predmeta — gde su u kodu

### RxJS

| Zahtev | Gde | Zašto baš tu |
| --- | --- | --- |
| `map` | [realtime.effects.ts:19-21](../frontend/src/app/store/realtime/realtime.effects.ts#L19-L21), [quizzes.effects.ts:47-50](../frontend/src/app/store/quizzes/quizzes.effects.ts#L47-L50) | Socket događaj ili HTTP odgovor pretvara u NgRx akciju, jer reducer razume samo akcije. |
| `reduce` | [path-page.component.ts:76-78](../frontend/src/app/features/paths/path-page.component.ts#L76-L78), [quiz-filters.ts:10-13](../frontend/src/app/features/library/quiz-filters.ts#L10-L13), backend [scoring.ts:46-49](../backend/src/modules/matches/scoring.ts#L46-L49) | Od niza napravi jednu vrednost: ukupno zvezdica na putanji, broj kvizova po temi za filter, ukupno tačnih u timu. RxJS "reduce kroz vreme" je `scan` u [mistake-list.component.ts:24](../frontend/src/app/features/play/components/mistake-list.component.ts#L24). |
| `filter` | backend [match-session.ts:288](../backend/src/modules/matches/match-session.ts#L288), [match.effects.ts:401-404](../frontend/src/app/store/match/match.effects.ts#L401-L404), [auth.guard.ts:13](../frontend/src/app/core/auth/auth.guard.ts#L13) | Server propušta samo odgovore na trenutno pitanje od igrača koji još smeju da odgovore. Frontend odbacuje zakasnele događaje prethodnog meča. Guard čeka da auth status prestane da bude `unknown`. |
| `forEach` | [sound.service.ts:59-63](../frontend/src/app/core/sound/sound.service.ts#L59-L63), backend [matches.service.ts:143-145](../backend/src/modules/matches/matches.service.ts#L143-L145) | Svaku notu melodije zakaže sa malim razmakom (level-up džingl). Posle rematch-a pošalje pozivnicu svakom drugom igraču. |
| fetch API | [sprite-manifest.service.ts:41](../frontend/src/app/core/sprites/sprite-manifest.service.ts#L41), [app.config.ts:46](../frontend/src/app/app.config.ts#L46) | Manifest sprajtova je statičan fajl, pa se čita direktno sa `fetch` i ne prolazi kroz auth interceptor. `HttpClient` je podešen sa `withFetch()`. |
| Promise | [sprite-manifest.service.ts:9-16](../frontend/src/app/core/sprites/sprite-manifest.service.ts#L9-L16), [sprite-manifest.service.ts:54](../frontend/src/app/core/sprites/sprite-manifest.service.ts#L54), [auth-bootstrap.service.ts:18-30](../frontend/src/app/core/auth/auth-bootstrap.service.ts#L18-L30), backend [path-generation.service.ts:75-83](../backend/src/modules/learning-paths/path-generation.service.ts#L75-L83) | `new Promise` čeka da se slika učita, `Promise.all` učitava sve sprajtove odjednom. `restore()` vraća Promise koji Angular čeka pre prvog rutiranja ([app.config.ts:74](../frontend/src/app/app.config.ts#L74)). Backend paralelno piše 5 koraka putanje. |
| `switchMap` | [register-page.component.ts:111-118](../frontend/src/app/features/auth/register-page.component.ts#L111-L118), [friends.effects.ts:41-48](../frontend/src/app/store/friends/friends.effects.ts#L41-L48), [match-clock.service.ts:61-67](../frontend/src/app/features/play/match-clock.service.ts#L61-L67), backend [match-session.ts:112-114](../backend/src/modules/matches/match-session.ts#L112-L114) | Nova vrednost otkazuje prethodni posao: staru proveru imena, staru pretragu, stari tajmer, stari rok runde (posle EXTRA_TIME). |
| `take` | [auth.guard.ts:14](../frontend/src/app/core/auth/auth.guard.ts#L14), [match-clock.service.ts:85](../frontend/src/app/features/play/match-clock.service.ts#L85), backend [match-session.ts:291](../backend/src/modules/matches/match-session.ts#L291) | Guard uzme prvi poznat status i završi. Tajmer zna koliko tikova ima do roka. Runda se završi kad stigne onoliko odgovora koliko ima igrača. |
| `takeUntil` | backend [match-session.ts:292](../backend/src/modules/matches/match-session.ts#L292), [match-session.ts:742-744](../backend/src/modules/matches/match-session.ts#L742-L744), [match-clock.service.ts:87](../frontend/src/app/features/play/match-clock.service.ts#L87), [match.effects.ts:144](../frontend/src/app/store/match/match.effects.ts#L144) | Runda staje kad istekne rok. Svi tajmeri meča staju kad se sesija uništi. Traka tajmera staje kad igrač odgovori. Socket događaji prestaju da ulaze u store kad se napusti stranica meča. |
| `zip` | [match-clock.service.ts:74-79](../frontend/src/app/features/play/match-clock.service.ts#L74-L79), [mistake-list.component.ts:18-29](../frontend/src/app/features/play/components/mistake-list.component.ts#L18-L29) | Upari svaku labelu `3, 2, 1, GO!` sa tikom tajmera, pa izlaze jedna po jedna na 750 ms. Isto za redove "pogrešnih" pitanja na rezultatima. |
| `merge` | [realtime.effects.ts:50-61](../frontend/src/app/store/realtime/realtime.effects.ts#L50-L61), [match.effects.ts:286-292](../frontend/src/app/store/match/match.effects.ts#L286-L292), [match-clock.service.ts:87](../frontend/src/app/features/play/match-clock.service.ts#L87) | Više socket tokova spaja u jedan tok akcija (jedan efekat umesto deset). Tajmer staje na prvi od dva događaja (odgovor ili kraj runde). |

### Angular

| Zahtev | Gde | Zašto baš tu |
| --- | --- | --- |
| Komponente i servisi | [answer-grid.component.ts:32-40](../frontend/src/app/features/play/components/answer-grid.component.ts#L32-L40), [match-page.component.ts:70-109](../frontend/src/app/features/play/match-page.component.ts#L70-L109), [quizzes-api.service.ts:15-18](../frontend/src/app/core/api/quizzes-api.service.ts#L15-L18), [token-storage.service.ts:6-7](../frontend/src/app/core/auth/token-storage.service.ts#L6-L7) | Prezentaciona komponenta (AnswerGrid) samo crta i javlja klik. Stranica (MatchPage) čita store i šalje akcije. Servis drži ono što nije prikaz: HTTP pozive, tokene. |
| Ulazni i izlazni parametri | [answer-grid.component.ts:41-57](../frontend/src/app/features/play/components/answer-grid.component.ts#L41-L57), [match-page.component.html:169-182](../frontend/src/app/features/play/match-page.component.html#L169-L182), [quiz-card.component.ts:42-46](../frontend/src/app/shared/components/quiz-card.component.ts#L42-L46), [library-page.component.html:56](../frontend/src/app/features/library/library-page.component.html#L56) | `input()` donosi podatke od roditelja, `output()` šalje događaj nazad. AnswerGrid ne zna ništa o socketima, samo emituje indeks kliknutog odgovora. |
| Dependency injection | [match-page.component.ts:99-105](../frontend/src/app/features/play/match-page.component.ts#L99-L105), [match-page.component.ts:112-118](../frontend/src/app/features/play/match-page.component.ts#L112-L118), [token-refresh.service.ts:9-13](../frontend/src/app/core/auth/token-refresh.service.ts#L9-L13) | `inject()` uzima zavisnost. `providers` na komponenti pravi novi `MatchClockService` za svaku stranicu meča, pa tajmeri nestaju sa stranicom. `providedIn: 'root'` je jedan primerak za celu aplikaciju. |
| NgRx store | [app.config.ts:47-58](../frontend/src/app/app.config.ts#L47-L58), [auth.reducer.ts:28-92](../frontend/src/app/store/auth/auth.reducer.ts#L28-L92), [path-page.component.ts:60](../frontend/src/app/features/paths/path-page.component.ts#L60) | Globalno stanje (korisnik, kvizovi, meč, prijatelji) na jednom mestu. Slice se pravi sa `createFeature`, a komponenta ga čita kao signal (`selectSignal`). |
| NgRx entity | [quizzes.reducer.ts:23-26](../frontend/src/app/store/quizzes/quizzes.reducer.ts#L23-L26), [quizzes.reducer.ts:139-147](../frontend/src/app/store/quizzes/quizzes.reducer.ts#L139-L147), [friends.reducer.ts:23-24](../frontend/src/app/store/friends/friends.reducer.ts#L23-L24), [friends.reducer.ts:104](../frontend/src/app/store/friends/friends.reducer.ts#L104), [shop.reducer.ts:21-23](../frontend/src/app/store/shop/shop.reducer.ts#L21-L23), kovčezi [chests.reducer.ts:20-23](../frontend/src/app/store/chests/chests.reducer.ts#L20-L23), [chests.reducer.ts:60](../frontend/src/app/store/chests/chests.reducer.ts#L60), [chests.reducer.ts:80](../frontend/src/app/store/chests/chests.reducer.ts#L80), [chests.reducer.ts:67-70](../frontend/src/app/store/chests/chests.reducer.ts#L67-L70) | Liste koje se menjaju element po element: obrisan kviz (`removeOne`), promenjen online status prijatelja (`updateOne`), kupljen predmet. Prijatelji imaju `selectId`, jer im je ključ `friendshipId`. Neotvoreni kovčezi su najbolji primer: `chest:earned` doda jedan (`addOne`), otvaranje ga skine (`removeOne`), a `selectTotal` daje broj na ikonici u gornjoj traci bez ručnog brojanja. |
| NgRx effects | [quizzes.effects.ts:44-54](../frontend/src/app/store/quizzes/quizzes.effects.ts#L44-L54), [match.effects.ts:139-147](../frontend/src/app/store/match/match.effects.ts#L139-L147), [realtime.effects.ts:18-62](../frontend/src/app/store/realtime/realtime.effects.ts#L18-L62) | Sve što izlazi napolje (HTTP, socket, navigacija, toast) je u efektima, pa reducer ostaje čista funkcija. Registracija: [app.config.ts:59-72](../frontend/src/app/app.config.ts#L59-L72). |
| Rutiranje | [app.routes.ts:29-33](../frontend/src/app/app.routes.ts#L29-L33), [app.routes.ts:53-67](../frontend/src/app/app.routes.ts#L53-L67), [app.config.ts:44](../frontend/src/app/app.config.ts#L44), [match-page.component.ts:110](../frontend/src/app/features/play/match-page.component.ts#L110) | Lazy `loadComponent`, guardovi (`authGuard`, `heroGuard`, `guestGuard`), child rute ispod shell-a, `canDeactivate` pita pre izlaska iz meča. Zbog `withComponentInputBinding()` parametar `:matchId` stiže kao `input`. |

### NestJS, Docker, baza

| Zahtev | Gde | Zašto baš tu |
| --- | --- | --- |
| Povezivanje na bazu | [prisma.service.ts:6-21](../backend/src/prisma/prisma.service.ts#L6-L21), [prisma.module.ts:4-9](../backend/src/prisma/prisma.module.ts#L4-L9), [prisma.config.ts:10-12](../backend/prisma.config.ts#L10-L12) | `PrismaService` nasleđuje `PrismaClient` sa Postgres adapterom, a URL čita iz `ConfigService`. Modul je `@Global`, pa svaki servis može da ga injektuje. `prisma.config.ts` daje isti `DATABASE_URL` Prisma CLI-ju (migracije, seed). |
| Baza kroz Docker | [docker-compose.yml:2-18](../docker-compose.yml#L2-L18), [docker-compose.yml:33](../docker-compose.yml#L33), [docker-compose.yml:46-48](../docker-compose.yml#L46-L48), [Dockerfile.dev:15](../backend/Dockerfile.dev#L15) | Postgres kontejner sa healthcheck-om; backend čeka zdravu bazu; migracije i seed se rade pri startu. U Docker mreži host baze je `db`, ne `localhost`. |
| CRUD operacije | [quizzes.controller.ts:36-103](../backend/src/modules/quizzes/quizzes.controller.ts#L36-L103), [quizzes.service.ts:71-135](../backend/src/modules/quizzes/quizzes.service.ts#L71-L135) | Kviz i pitanja: POST (create), GET (read), PATCH/PUT (update), DELETE. Kviz se briše "meko" (`deletedAt`), da istorija mečeva ostane. Prijatelji imaju zahtev, listu, prihvatanje i brisanje; dokumenti i putanje imaju create, read i delete. |
| Min. tri entiteta sa relacijama | [schema.prisma:105-137](../backend/prisma/schema.prisma#L105-L137) User, [schema.prisma:170-195](../backend/prisma/schema.prisma#L170-L195) Quiz, [schema.prisma:197-213](../backend/prisma/schema.prisma#L197-L213) Question, [schema.prisma:232-249](../backend/prisma/schema.prisma#L232-L249) PathStep, [schema.prisma:273-293](../backend/prisma/schema.prisma#L273-L293) MatchPlayer | 1:N User→Quiz i Quiz→Question; 1:1 PathStep↔Quiz (`quizId @unique`); M:N User↔Match preko MatchPlayer (spojna tabela sa podacima: score, answers, nagrade); M:N User↔User preko Friendship. |
| Passport.js | [local.strategy.ts:9-21](../backend/src/modules/auth/strategies/local.strategy.ts#L9-L21), [jwt.strategy.ts:8-22](../backend/src/modules/auth/strategies/jwt.strategy.ts#L8-L22), [jwt-refresh.strategy.ts:10-30](../backend/src/modules/auth/strategies/jwt-refresh.strategy.ts#L10-L30), [local-auth.guard.ts:4-5](../backend/src/modules/auth/guards/local-auth.guard.ts#L4-L5) | Tri strategije: email + lozinka (bcrypt), access JWT i refresh JWT. Guardovi samo nasleđuju `AuthGuard('ime')` i stavljaju se na rute, npr. [auth.controller.ts:46](../backend/src/modules/auth/auth.controller.ts#L46). |

Dodatno, ako pita: globalna validacija [main.ts:23-25](../backend/src/main.ts#L23-L25), Swagger
[main.ts:35-44](../backend/src/main.ts#L35-L44), WebSocket gateway
[match.gateway.ts:36-42](../backend/src/modules/matches/match.gateway.ts#L36-L42), factory provider
[payments.module.ts:30](../backend/src/modules/payments/payments.module.ts#L30) i
[auth.module.ts:29-38](../backend/src/modules/auth/auth.module.ts#L29-L38).

---

## 4. Ključni tokovi, korak po korak

### a) Login: Passport LocalStrategy, JWT i refresh token

1. Frontend šalje `POST /auth/login { email, password }`.
2. Na ruti stoje `ThrottlerGuard` (5 pokušaja u minuti) i `LocalAuthGuard`
   ([auth.controller.ts:43-50](../backend/src/modules/auth/auth.controller.ts#L43-L50)):

```ts
  // The throttler runs first, so wrong passwords count towards the limit too.
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard, LocalAuthGuard)
  @ApiBody({ type: LoginDto })
  login(@CurrentUserId() userId: string): Promise<LoginResult> {
    return this.auth.login(userId);
  }
```

3. `LocalAuthGuard` pokreće `LocalStrategy`. Ona čita `email` umesto podrazumevanog `username`
   i proverava lozinku ([local.strategy.ts:9-22](../backend/src/modules/auth/strategies/local.strategy.ts#L9-L22)):

```ts
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly auth: AuthService) {
    super({ usernameField: 'email' });
  }

  // The guard runs before the ValidationPipe, so the raw JSON body may hold any type here.
  validate(email: unknown, password: unknown): Promise<AuthUser> {
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new UnauthorizedException(WRONG_CREDENTIALS_MESSAGE);
    }
    return this.auth.validateCredentials(normalizeEmail(email), password);
  }
}
```

   `validateCredentials` radi `bcrypt.compare`
   ([auth.service.ts:50-56](../backend/src/modules/auth/auth.service.ts#L50-L56)). Šta `validate`
   vrati, Passport stavi u `request.user`, a dekorator `@CurrentUserId()` odatle čita id
   ([current-user-id.decorator.ts:5-8](../backend/src/modules/auth/decorators/current-user-id.decorator.ts#L5-L8)).
4. Ako korisnik ima 2FA, dobija privremeni `twoFactorToken` umesto sesije
   ([auth.service.ts:58-64](../backend/src/modules/auth/auth.service.ts#L58-L64)). Inače se pravi
   sesija ([auth.service.ts:105-111](../backend/src/modules/auth/auth.service.ts#L105-L111)):

```ts
  private async createSession(userId: string): Promise<AuthResponse> {
    const accessToken = await this.signAccessToken(userId);
    const refreshToken = await this.signRefreshToken(userId);
    await this.users.setRefreshTokenHash(userId, sha256(refreshToken));
    const user = await this.users.findCurrentUser(userId);
    return { user, accessToken, refreshToken };
  }
```

   Access token: `{ sub, type: 'access' }`, traje 15 minuta. Refresh token:
   `{ sub, type: 'refresh', jti }`, drugi secret, traje 7 dana
   ([auth.service.ts:113-124](../backend/src/modules/auth/auth.service.ts#L113-L124)). U bazi se
   čuva samo **sha256 hash** refresh tokena, nikad sam token.
5. Zaštićene rute imaju `JwtAuthGuard` → `JwtStrategy` proverava potpis i da je `type === 'access'`
   ([jwt.strategy.ts:17-22](../backend/src/modules/auth/strategies/jwt.strategy.ts#L17-L22)).
6. `POST /auth/refresh` šalje refresh token kao Bearer. `JwtRefreshStrategy` proverava potpis,
   tip i da li je to **poslednji izdati** token
   ([jwt-refresh.strategy.ts:23-30](../backend/src/modules/auth/strategies/jwt-refresh.strategy.ts#L23-L30)):

```ts
  async validate(request: Request, payload: TokenPayload): Promise<AuthUser> {
    const refreshToken = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
    if (payload.type !== 'refresh' || !refreshToken) {
      throw new UnauthorizedException(SESSION_EXPIRED_MESSAGE);
    }
    await this.auth.assertRefreshTokenIsCurrent(payload.sub, refreshToken);
    return { userId: payload.sub };
  }
```

   Poređenje hash-eva ide preko `timingSafeEqual`
   ([auth.service.ts:74-79](../backend/src/modules/auth/auth.service.ts#L74-L79),
   [auth.service.ts:144-148](../backend/src/modules/auth/auth.service.ts#L144-L148)). Refresh pravi
   novu sesiju i prepisuje hash, pa stari refresh token više ne važi (rotacija).

Na frontendu login je efekat sa `exhaustMap` (dupli klik ne šalje dva zahteva)
([auth.effects.ts:43-53](../frontend/src/app/store/auth/auth.effects.ts#L43-L53)); tokeni se
snime u `TokenStorageService`, a posle `signedIn` se poveže socket
([auth.effects.ts:84-91](../frontend/src/app/store/auth/auth.effects.ts#L84-L91)).

### b) Kako interceptor obnavlja token

Interceptor dodaje `Authorization: Bearer <access>` svakom `/api` zahtevu osim javnih auth ruta
([auth.constants.ts:4-10](../frontend/src/app/core/auth/auth.constants.ts#L4-L10)). Kad server
vrati 401, interceptor obnovi token i ponovi isti zahtev **jednom**
([auth.interceptor.ts:24-33](../frontend/src/app/core/auth/auth.interceptor.ts#L24-L33)):

```ts
  return next(withAccessToken(request, accessToken)).pipe(
    catchError((error: unknown) => {
      if (!isUnauthorized(error)) {
        return throwError(() => error);
      }
      return tokenRefresh
        .refresh()
        .pipe(switchMap((newToken) => next(withAccessToken(request, newToken))));
    }),
  );
```

Problem: ako tri zahteva dobiju 401 u isto vreme, ne smemo da pošaljemo tri refresh-a, jer server
rotira token i drugi bi pao. Zato svi dele **jedan** refresh
([token-refresh.service.ts:19-27](../frontend/src/app/core/auth/token-refresh.service.ts#L19-L27)):

```ts
  refresh(): Observable<string> {
    this.refresh$ ??= this.requestNewAccessToken().pipe(
      finalize(() => {
        this.refresh$ = null;
      }),
      shareReplay(1),
    );
    return this.refresh$;
  }
```

- `??=` napravi novi tok samo ako trenutno nijedan ne postoji.
- `shareReplay(1)` znači da svi koji se pretplate dobiju isti rezultat jednog HTTP poziva.
- `finalize` oslobodi mesto kad se zahtev završi, pa sledeći 401 posle 15 min pravi novi refresh.

Ako refresh padne, a u `localStorage` već stoji noviji refresh token (drugi tab je bio brži),
koristi se taj ([token-refresh.service.ts:46-54](../frontend/src/app/core/auth/token-refresh.service.ts#L46-L54)).
Inače se tokeni brišu i šalje se `AuthActions.sessionExpired` → `/login`. Socketi rade isto: na
grešku `unauthorized` obnove token i ponovo se povežu
([authorized-socket.ts:18-30](../frontend/src/app/core/realtime/authorized-socket.ts#L18-L30)).

### c) Jedna runda meča na serveru (take, takeUntil, takeWhile, rok sa switchMap)

Server je jedini sudija. Svaki meč ima svoj `MatchSession` objekat u memoriji. Odgovori stižu
preko `Subject`-a, a rok runde je `BehaviorSubject`
([match-session.ts:108-114](../backend/src/modules/matches/match-session.ts#L108-L114)):

```ts
  private readonly answers$ = new Subject<PlayerAnswer>();
  private readonly nextPresses$ = new Subject<NextPress>();
  private readonly destroy$ = new Subject<void>();
  private readonly deadlineAt$ = new BehaviorSubject<number>(0);
  private readonly deadline$ = this.deadlineAt$.pipe(
    switchMap((deadlineAt) => timer(Math.max(0, deadlineAt - Date.now()))),
  );
```

`deadline$` emituje kad istekne vreme. Kad neko iskoristi EXTRA_TIME, u `deadlineAt$` se upiše
novo, kasnije vreme, a `switchMap` **otkaže stari tajmer** i pokrene novi
([match-session.ts:481-486](../backend/src/modules/matches/match-session.ts#L481-L486)).

Gateway primi `match:answer` i preda ga sesiji
([match.gateway.ts:131-135](../backend/src/modules/matches/match.gateway.ts#L131-L135)). Sesija
sama izračuna koliko je vremena ostalo, ne veruje klijentu
([match-session.ts:160-170](../backend/src/modules/matches/match-session.ts#L160-L170)):

```ts
  submitAnswer(userId: string, questionIndex: number, optionIndex: number): void {
    if (this.isFrozen(userId)) {
      throw new WsException('You are frozen!');
    }
    const answer = { userId, questionIndex, optionIndex, remainingMs: this.remainingMs() };
    if (this.secondChanceCovers(answer)) {
      this.offerSecondTry(userId, optionIndex);
      return;
    }
    this.answers$.next(answer);
  }
```

Ako je igrač uključio drugu šansu, prvi pogrešan odgovor ne ulazi u `answers$`: igrač dobije
`match:second-chance` i može još jednom da odgovori pre roka.

Runda počinje u `playRound`. Bitan redosled: **prvo se pretplati** na odgovore, pa tek onda
pošalje pitanje, da nijedan brzi odgovor ne promakne
([match-session.ts:270-282](../backend/src/modules/matches/match-session.ts#L270-L282)):

```ts
  private playRound(index: number): void {
    this.phase = 'question';
    this.index = index;
    this.roundPlayerIds = new Set(this.activePlayerIds());
    this.answeredUserIds.clear();
    this.players.forEach((player) => resetRoundState(player));
    this.deadlineAt$.next(Date.now() + this.timeLimitMs());

    this.collectAnswers(index)
      .pipe(takeUntil(this.destroy$))
      .subscribe((answers) => this.endRound(index, answers));
    this.emitToRoom('match:question', this.questionPayload(index, this.optionOrders.shared(index)));
  }
```

Srce runde ([match-session.ts:284-295](../backend/src/modules/matches/match-session.ts#L284-L295)):

```ts
  // take() ends the round once everyone has answered and takeUntil() when the time is up.
  // In a party takeWhile() ends it on the first correct answer; `true` keeps that answer.
  private collectAnswers(index: number): Observable<PlayerAnswer[]> {
    return this.answers$.pipe(
      filter((answer) => answer.questionIndex === index && this.canAnswer(answer.userId)),
      tap((answer) => this.recordAnswer(answer)),
      takeWhile((answer) => !this.winsPartyRound(answer), true),
      take(this.expectedAnswers()),
      takeUntil(this.deadline$),
      toArray(),
    );
  }
```

Čitaj odozgo nadole:

- `filter` pušta samo odgovore na **ovo** pitanje, od igrača koji su u rundi i još nisu odgovorili.
  Zato dupli klik ili zakasneli odgovor ne mogu da "potroše" mesto u `take`.
- `tap` zabeleži odgovor i javi sobi `match:answered` (drugi vide "Opponent answered").
- `takeWhile(..., true)` važi samo za PARTY: prvi tačan odgovor završava rundu, a `true` znači da i
  taj odgovor ulazi u rezultat.
- `take(n)`: kad stigne onoliko odgovora koliko ima igrača, runda je gotova odmah.
- `takeUntil(deadline$)`: ako vreme istekne pre toga, runda se završi sa onim što je stiglo.
- `toArray()` skupi sve odgovore u niz i emituje ga tek kad se tok završi (bilo kojim od tri
  razloga gore). Tada se zove `endRound`.

`endRound` boduje (100 + bonus za brzinu do 50,
[scoring.ts:22-28](../backend/src/modules/matches/scoring.ts#L22-L28)), pošalje svakom igraču
`match:round-result` i čeka da svi pritisnu Next, istim RxJS oblikom: `filter`, `distinct`, `tap`,
`take`, `takeUntil(timer(...))`, `toArray`
([match-session.ts:415-424](../backend/src/modules/matches/match-session.ts#L415-L424)). Posle
poslednjeg pitanja `finish` u jednoj transakciji snimi rezultate, nagrade, Mistakes notebook i
korak putanje ([match-results.service.ts:79-102](../backend/src/modules/matches/match-results.service.ts#L79-L102)).
Odložene akcije sesije idu kroz `after()` sa `takeUntil(this.destroy$)`
([match-session.ts:742-744](../backend/src/modules/matches/match-session.ts#L742-L744)), a
pretplate na odgovore i na Next takođe imaju `takeUntil(this.destroy$)`, pa `stop()` gasi sve
odjednom
([match-session.ts:265-268](../backend/src/modules/matches/match-session.ts#L265-L268)).

### d) Kako socket događaji ulaze u NgRx (merge u efektu)

1. Servis pretvara socket događaj u Observable sa `fromEvent`
   ([match-socket.service.ts:35-37](../frontend/src/app/core/realtime/match-socket.service.ts#L35-L37)):

```ts
  readonly lobby$ = fromEvent<MatchView>(this.socket, 'match:lobby');
  readonly starting$ = fromEvent<MatchStartingEvent>(this.socket, 'match:starting');
  readonly question$ = fromEvent<MatchQuestionEvent>(this.socket, 'match:question');
```

2. Efekat svaki tok mapira u akciju i sve ih spaja sa `merge`. Primer iz globalnih notifikacija
   ([realtime.effects.ts:43-61](../frontend/src/app/store/realtime/realtime.effects.ts#L43-L61)):

```ts
    const quizProgress$ = this.socket.quizProgress$.pipe(
      map((progress) => QuizzesActions.progressReceived({ progress })),
    );
    const chestEarned$ = this.socket.chestEarned$.pipe(
      map(({ chest }) => ChestsActions.earned({ chest })),
    );

    return merge(
      friendRequest$,
      friendAccepted$,
      requestRemoved$,
      friendRemoved$,
      friendOnline$,
      friendOffline$,
      duelInvite$,
      coinsUpdated$,
      quizProgress$,
      chestEarned$,
    );
```

   Efekat koji vraća Observable akcija → NgRx ih automatski dispatch-uje. Reducer onda menja stanje,
   npr. `presenceChanged` radi `updateOne` u entity adapteru prijatelja
   ([friends.reducer.ts:99-105](../frontend/src/app/store/friends/friends.reducer.ts#L99-L105)).

3. Za meč, događaji teku samo dok je stranica meča otvorena
   ([match.effects.ts:139-147](../frontend/src/app/store/match/match.effects.ts#L139-L147)):

```ts
  // Socket events reach the store only while the match page is open.
  readonly socketEvents$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MatchActions.entered),
      switchMap(({ matchId }) =>
        this.matchEvents(matchId).pipe(takeUntil(this.actions$.pipe(ofType(MatchActions.left)))),
      ),
    ),
  );
```

   `entered` se šalje kad se stranica otvori, `left` kad se uništi
   ([match-page.component.ts:267-279](../frontend/src/app/features/play/match-page.component.ts#L267-L279)).
   `switchMap` za novi meč otkaže tokove starog, `takeUntil(left)` ih gasi pri izlasku. Unutra,
   `forMatch(matchId)` filtrira događaje drugog meča
   ([match.effects.ts:401-404](../frontend/src/app/store/match/match.effects.ts#L401-L404)), a
   `merge` spaja grupe događaja ([match.effects.ts:286-292](../frontend/src/app/store/match/match.effects.ts#L286-L292)).
   Server šalje "koliko je ostalo", a frontend od toga izračuna rok po svom satu
   ([match.effects.ts:406-409](../frontend/src/app/store/match/match.effects.ts#L406-L409)).

### e) Odbrojavanje sa zip i tajmer sa takeUntil (frontend)

Sve je u `MatchClockService`, koji je provider stranice meča, pa živi koliko i stranica
([match-clock.service.ts:74-89](../frontend/src/app/features/play/match-clock.service.ts#L74-L89)):

```ts
  private countdownLabels(): Observable<string> {
    const finalWord = this.mode() === 'DUEL' ? 'FIGHT!' : 'GO!';
    return zip(from([...COUNTDOWN_NUMBERS, finalWord]), timer(0, COUNTDOWN_STEP_MS)).pipe(
      map(([label]) => label),
    );
  }

  // The bar freezes when the player answers, which shows how fast they were.
  private timeLeftUntil(deadlineAt: number): Observable<number> {
    const ticks = Math.ceil(msUntil(deadlineAt) / TIMER_TICK_MS);
    return timer(0, TIMER_TICK_MS).pipe(
      take(ticks + 1),
      map(() => msUntil(deadlineAt)),
      takeUntil(merge(this.answered$, this.roundEnded$)),
    );
  }
```

- **zip**: `from([...])` bi odmah izbacio sve četiri labele. `timer(0, 750)` kuca na 750 ms.
  `zip` čeka po jednu vrednost iz oba toka i pravi par, pa labele izlaze tempom tajmera:
  `3` (0 ms), `2` (750), `1` (1500), `GO!` (2250). Kad se `from` isprazni, `zip` se završi i
  tajmer staje sam. Ukupno 3 s, isto koliko server čeka pre prvog pitanja.
- **take**: unapred se zna koliko tikova od 250 ms ima do roka, pa se tok sam završi na nuli.
- **takeUntil(merge(...))**: traka se zamrzne čim igrač odgovori (`MatchActions.answer`, osim u
  partiji, gde ostali i dalje jure) ili stigne kraj runde ([match-clock.service.ts:40-46](../frontend/src/app/features/play/match-clock.service.ts#L40-L46)).
- **switchMap** ([match-clock.service.ts:61-67](../frontend/src/app/features/play/match-clock.service.ts#L61-L67)):
  novi rok (sledeće pitanje ili EXTRA_TIME) otkaže stari tajmer.
- `toSignal` pretvara rezultat u signal koji čita šablon (zoneless).

### f) Generisanje putanje: Promise.all i transakcija

`POST /paths` → `PathGenerationService.createPath`
([path-generation.service.ts:34-45](../backend/src/modules/learning-paths/path-generation.service.ts#L34-L45)).
Sve ide kroz `runWithLimits`: jedno generisanje po korisniku u isto vreme i 15 AI kvizova dnevno
([generation-limits.service.ts:13-24](../backend/src/modules/quizzes/generation-limits.service.ts#L13-L24)).
Plan od 5 koraka je u [learning-paths.constants.ts:4-40](../backend/src/modules/learning-paths/learning-paths.constants.ts#L4-L40).

Korak 1: svih 5 koraka piše AI **paralelno**
([path-generation.service.ts:75-83](../backend/src/modules/learning-paths/path-generation.service.ts#L75-L83)):

```ts
    return Promise.all(
      requests.map(async (request) => {
        const goals = earlierStepGoals(request.position);
        const step = await this.quizWriter.writePathStep(request, context, goals);
        done += 1;
        this.reportProgress(userId, done);
        return { ...step, title: specificStepTitle(step.title, request.goal, subject) };
      }),
    );
```

- `map` od 5 zahteva napravi 5 Promise-a, `Promise.all` čeka sve i vraća niz u **istom redosledu**.
- Posle svakog gotovog koraka šalje se `quiz:progress { step: 'writing', done, total: 5 }`, pa ekran pokazuje
  "Step 3 of 5 ready".
- Ako jedan korak padne, `Promise.all` odmah odbije i ništa se ne snima.

Korak 2: tek kad su svi gotovi, sve se snima u **jednoj transakciji**
([path-generation.service.ts:92-106](../backend/src/modules/learning-paths/path-generation.service.ts#L92-L106)):

```ts
    return this.prisma.$transaction(async (tx) => {
      const path = await tx.learningPath.create({
        data: {
          ownerId: userId,
          topic: subject,
          documentId: dto.documentId ?? null,
          audience: dto.audience,
          language: dto.language,
        },
      });
      for (const [index, step] of steps.entries()) {
        await this.saveStep(tx, path, PATH_PLAN[index], step);
      }
      return path.id;
    });
```

Za svaki korak se pravi PATH_STEP kviz sa pitanjima i `PathStep` red. `saveGeneratedQuiz` prima
`tx`, pa radi u istoj transakciji
([quizzes.service.ts:137-144](../backend/src/modules/quizzes/quizzes.service.ts#L137-L144)). Ako
bilo šta pukne, Postgres vrati sve nazad: ne postoji putanja sa 3 od 5 koraka.

### g) Plaćanje: factory provider, demo i Stripe

Ostatak koda zna samo za interfejs
([payment-provider.ts:4-17](../backend/src/modules/payments/providers/payment-provider.ts#L4-L17)).
Koja implementacija se koristi, odlučuje fabrika pri startu
([payments.module.ts:12-23](../backend/src/modules/payments/payments.module.ts#L12-L23)):

```ts
function createPaymentProvider(config: ConfigService): PaymentProvider {
  const secretKey = config.get<string>('STRIPE_SECRET_KEY') ?? '';
  if (secretKey.startsWith(STRIPE_TEST_KEY_PREFIX)) {
    return new StripePaymentProvider(secretKey, config.getOrThrow<string>('FRONTEND_URL'));
  }
  if (secretKey !== '') {
    new Logger('PaymentsModule').warn(
      'STRIPE_SECRET_KEY is not a Stripe test key, so coin packs use the demo checkout.',
    );
  }
  return new DemoPaymentProvider();
}
```

Registracija ([payments.module.ts:30](../backend/src/modules/payments/payments.module.ts#L30)):
`{ provide: PAYMENT_PROVIDER, inject: [ConfigService], useFactory: createPaymentProvider }`, a
servis ga dobija sa `@Inject(PAYMENT_PROVIDER)`
([payments.service.ts:28-32](../backend/src/modules/payments/payments.service.ts#L28-L32)).
Samo `sk_test_` ključ uključuje Stripe; live ključ se namerno ignoriše.

Tok kupovine:

1. Frontend: "Buy" na paketu otvara grown-up pitanje (množenje); tek tačan odgovor šalje checkout
   ([grown-up-gate.component.ts:33-43](../frontend/src/app/features/shop/components/grown-up-gate.component.ts#L33-L43)).
2. `POST /payments/checkout`: zatvori stare otvorene kupovine, u transakciji sa zaključanim redom
   korisnika proveri mesečni limit i napravi PENDING kupovinu, pa traži checkout link od
   providera ([payments.service.ts:51-66](../backend/src/modules/payments/payments.service.ts#L51-L66)).
3. Demo vraća link na našu stranicu `/shop/checkout/:id`
   ([demo-payment.provider.ts:7-9](../backend/src/modules/payments/providers/demo-payment.provider.ts#L7-L9));
   Stripe pravi Checkout Session i vraća svoj URL
   ([stripe-payment.provider.ts:17-40](../backend/src/modules/payments/providers/stripe-payment.provider.ts#L17-L40)).
   Frontend za Stripe radi `window.location.assign`, a za demo router navigaciju
   ([payments.effects.ts:109-116](../frontend/src/app/store/shop/payments.effects.ts#L109-L116)).
4. `POST /payments/:id/confirm` pita providera da li je plaćeno
   ([payments.service.ts:68-82](../backend/src/modules/payments/payments.service.ts#L68-L82)) i
   isplati novčiće u `payOut`
   ([payments.service.ts:118-138](../backend/src/modules/payments/payments.service.ts#L118-L138)):

```ts
  private async payOut(purchase: Purchase): Promise<void> {
    const coins = await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.purchase.updateMany({
        where: { id: purchase.id, status: 'PENDING' },
        data: { status: 'PAID', paidAt: new Date() },
      });
      if (count === 0) {
        return null;
      }
      const user = await tx.user.update({
        where: { id: purchase.userId },
        data: { coins: { increment: purchase.coins } },
        select: { coins: true },
      });
      return user.coins;
    });

    if (coins !== null) {
      this.notifications.emitToUser(purchase.userId, 'coins:updated', { coins });
    }
  }
```

   `updateMany ... where status: 'PENDING'` je zaštita od duple isplate: samo jedan poziv može da
   prebaci PENDING u PAID. Posle toga ide `coins:updated` preko socketa, pa se broj novčića u
   gornjoj traci osveži sam.

### h) Otvaranje kovčega: transakcija, updateMany i ubačena random funkcija

1. Frontend: dugme Open na stranici "Treasure room" šalje `ChestsActions.open({ chestId })`
   ([chests-page.component.ts:68-71](../frontend/src/app/features/chests/chests-page.component.ts#L68-L71)).
   Reducer zapamti kovčeg koji se otvara (`opening`), da dijalog može da ga crta
   ([chests.reducer.ts:46-54](../frontend/src/app/store/chests/chests.reducer.ts#L46-L54)).
2. Efekat `open$` koristi `exhaustMap`: dok prvi zahtev traje, drugi klik se ignoriše
   ([chests.effects.ts:54-64](../frontend/src/app/store/chests/chests.effects.ts#L54-L64)).
   Zahtev je `POST /chests/:id/open`
   ([chests-api.service.ts:20-22](../frontend/src/app/core/api/chests-api.service.ts#L20-L22)).
3. Kontroler: `ParseUUIDPipe` proverava id, a `@CurrentUserId()` daje korisnika iz JWT-a
   ([chests.controller.ts:34-41](../backend/src/modules/chests/chests.controller.ts#L34-L41)).
4. Servis ([chests.service.ts:51-76](../backend/src/modules/chests/chests.service.ts#L51-L76)):

```ts
  async open(userId: string, chestId: string): Promise<OpenedChest> {
    const chest = await this.findOwnChest(userId, chestId);
    if (chest.openedAt) {
      throw new ConflictException(CHEST_ALREADY_OPEN_MESSAGE);
    }
    const reward = await this.rollReward(userId, chest.type);
    const openedAt = new Date();

    const coins = await this.prisma.$transaction(async (tx) => {
      // Only the request that still finds the chest closed opens it, so a double click
      // pays the reward once.
      const { count } = await tx.userChest.updateMany({
        where: { id: chestId, openedAt: null },
        data: { openedAt, reward },
      });
      if (count === 0) {
        throw new ConflictException(CHEST_ALREADY_OPEN_MESSAGE);
      }
      return this.payReward(tx, userId, reward);
    });

    if (reward.coins > 0) {
      this.notifications.emitToUser(userId, 'coins:updated', { coins });
    }
    return { chest: { ...toChestView(chest), openedAt, reward }, reward, coins };
  }
```

   - `findOwnChest` traži kovčeg po id-ju **i** vlasniku, pa tuđi kovčeg daje 404
     ([chests.service.ts:143-149](../backend/src/modules/chests/chests.service.ts#L143-L149)).
     Već otvoren kovčeg odmah daje 409.
   - `rollReward` učita predmete i šta igrač već ima, pa pozove čistu funkciju
     `rollChest(..., Math.random)`
     ([chests.service.ts:101-108](../backend/src/modules/chests/chests.service.ts#L101-L108)).
     Izvlačenje samo čita, zato je pre transakcije, koja ostaje kratka.
   - **Idempotentnost**: `updateMany` sa `openedAt: null` u `where` je provera i upis u jednom
     SQL upitu. Ako dva zahteva stignu u isto vreme, baza pusti samo jedan da promeni red; drugi
     dobije `count === 0`, baci 409 i transakcija se vrati, pa se ništa ne isplati dvaput.
     `update` po id-ju to ne bi sprečio, jer ne gleda da li je kovčeg već otvoren.
   - `payReward` u istoj transakciji doda pojačanja (`upsert` sa `increment`), novi predmet
     (`userItem.create`, osim za duplikat) i novčiće
     ([chests.service.ts:110-131](../backend/src/modules/chests/chests.service.ts#L110-L131)).
     Ili prođe sve (kovčeg otvoren i nagrada isplaćena), ili ništa.
   - Posle commit-a, ako je nagrada donela novčiće (i duplikat ih donosi), ide `coins:updated`,
     isto kao kod plaćanja.
5. Izvlačenje je čista funkcija `rollChest`
   ([chests.rules.ts:71-91](../backend/src/modules/chests/chests.rules.ts#L71-L91)): prvo izbaci
   red za skin ako nema nijednog takvog predmeta, pa bira red iz tabele po težini
   ([chests.rules.ts:125-135](../backend/src/modules/chests/chests.rules.ts#L125-L135)):

```ts
function pickDrop(drops: ChestDrop[], random: RandomFn): ChestDrop {
  let roll = random() * totalWeight(drops);
  for (const drop of drops) {
    if (roll < drop.weight) {
      return drop;
    }
    roll -= drop.weight;
  }
  // Only rounding can get here.
  return drops[drops.length - 1];
}
```

   Primer za drveni kovčeg (težine 70, 27, 3, ukupno 100): `random()` = 0.5 daje 50, što je
   manje od 70, pa ispadaju novčići. 0.8 daje 80: nije manje od 70, ostaje 10, što je manje od
   27, pa ispada pojačanje. 0.98 daje 98, posle oduzimanja 70 i 27 ostaje 1, pa ispada skin.
   Predmet koji igrač već ima postaje novčići (njegova cena, ili 150 za predmet koji postoji samo
   u kovčezima)
   ([chests.rules.ts:93-96](../backend/src/modules/chests/chests.rules.ts#L93-L96),
   [chests.rules.ts:161-165](../backend/src/modules/chests/chests.rules.ts#L161-L165)).
6. **Ubačena random funkcija zbog testova.** `rollChest` ne zove `Math.random` sam, nego ga dobija
   kao parametar tipa `RandomFn`
   ([chests.rules.ts:26-27](../backend/src/modules/chests/chests.rules.ts#L26-L27)). Servis
   prosledi `Math.random`, a test funkciju koja vraća zadate brojeve redom
   ([chests.rules.spec.ts:25-34](../backend/src/modules/chests/chests.rules.spec.ts#L25-L34)),
   pa je rezultat uvek isti
   ([chests.rules.spec.ts:57-61](../backend/src/modules/chests/chests.rules.spec.ts#L57-L61)):

```ts
  it('gives one power-up from a wooden chest', () => {
    const reward = rollChest('WOODEN', POOLS, NOTHING_OWNED, randomSequence(0.7, 0.99));
    expect(reward).toMatchObject({ kind: 'BOOSTS', coins: 0, item: null });
    expect(reward.boosts).toEqual([{ type: 'SECOND_CHANCE', quantity: 1 }]);
  });
```

   Prvi broj (0.7) bira red: 70 nije manje od 70, pa to nisu novčići nego pojačanje. Drugi broj
   (0.99) bira pojačanje: `Math.floor(0.99 * 4)` = 3, četvrto u listi `CHEST_BOOSTS`, a to je
   SECOND_CHANCE. Isti trik koristi grown-up pitanje
   ([gate-question.ts:10](../frontend/src/app/features/shop/gate-question.ts#L10)).
7. Frontend posle odgovora: `opened` skida kovčeg iz entity adaptera sa `removeOne` i stavlja ga
   na početak liste nedavnih
   ([chests.reducer.ts:74-85](../frontend/src/app/store/chests/chests.reducer.ts#L74-L85)), a
   `auth` reducer upiše nove novčiće
   ([auth.reducer.ts:79-86](../frontend/src/app/store/auth/auth.reducer.ts#L79-L86)). Dijalog
   pusti animaciju (trese se, poklopac se otvara, nagrada iskoči). Ako zahtev padne (npr. 409 jer
   je drugi tab bio brži), efekat pokaže grešku i ponovo učita listu.

---

## 5. Live coding — šta i gde da menjaš

Pre izmene: otvori fajl iz recepta, pokaži liniju, pa menjaj. Backend i frontend se sami
ponovo učitaju. Ako menjaš tip koji se deli (npr. `QuizSummary`), TypeScript će sam pokazati sva mesta
koja treba popraviti. Mnoge mape su `Record<Tip, ...>`, pa kompajler javlja ako dodaš novu vrednost
u tip, a zaboraviš mapu.

Za izmenu baze uvek isto:

```bash
docker compose exec backend npx prisma migrate dev --name ime_izmene
docker compose restart backend      # start ponovo radi prisma generate
```

### 1. Promeni broj XP po tačnom odgovoru

1. [progression.constants.ts:5](../backend/src/modules/progression/progression.constants.ts#L5):
   `export const XP_PER_CORRECT = 15;`
2. Koristi se u `answerReward`
   ([progression.rules.ts:117-123](../backend/src/modules/progression/progression.rules.ts#L117-L123));
   HARD kvizovi množe sa 1.5.
3. Testovi očekuju stare brojeve
   ([progression.rules.spec.ts:147](../backend/src/modules/progression/progression.rules.spec.ts#L147)
   i dalje): `docker compose exec backend npx jest progression`, pa ispravi očekivane vrednosti.

Frontend ne treba menjati: XP stiže sa servera u rezultatu meča. Slično: novčići po tačnom
(`COINS_PER_CORRECT`, linija 6), bonus za pobedu u duelu (`DUEL_WIN_BONUS`, linija 11), dnevni
limit novčića (`DAILY_MATCH_COIN_CAP`, linija 23).

### 2. Dodaj novo polje u kviz (npr. `description`)

1. Šema, u `model Quiz` posle `timePerQuestion`
   ([schema.prisma:180](../backend/prisma/schema.prisma#L180)):
   `description String @default("")` (default da postojeći redovi ne puknu).
2. Migracija: `docker compose exec backend npx prisma migrate dev --name add_quiz_description`,
   pa `docker compose restart backend`.
3. DTO ([create-quiz.dto.ts:29-71](../backend/src/modules/quizzes/dto/create-quiz.dto.ts#L29-L71)):

```ts
  @ApiPropertyOptional({ example: 'Planets for beginners' })
  @IsOptional()
  @Transform(trimText)
  @IsString()
  @MaxLength(300)
  description?: string;
```

   (`ApiPropertyOptional`, `IsOptional`, `MaxLength` dodaj u importe.)
4. Tip odgovora: `description: string;` u `QuizSummary`
   ([quizzes.types.ts:11-24](../backend/src/modules/quizzes/quizzes.types.ts#L11-L24)).
5. Mapper ([quiz.mapper.ts](../backend/src/modules/quizzes/quiz.mapper.ts)): u `toQuizSummary`
   (linije 36-51) `description: quiz.description,`; u `toManualQuizData` (linije 71-88)
   `description: dto.description ?? '',`.
6. Frontend model ([quiz.model.ts:25-38](../frontend/src/app/core/models/quiz.model.ts#L25-L38)):
   `description: string;` u `QuizSummary` i `description?: string;` u `CreateQuizRequest`
   (linije 62-71).
7. Store mapper ([store/quizzes/quiz.mapper.ts:3-18](../frontend/src/app/store/quizzes/quiz.mapper.ts#L3-L18)):
   `description: quiz.description,` (TypeScript će tražiti ovo sam).
8. Prikaz u kartici, ispod naslova, odmah posle `</h3>`
   ([quiz-card.component.html:16](../frontend/src/app/shared/components/quiz-card.component.html#L16)):
   `<p class="text-sm">{{ quiz().description }}</p>`
9. Da se šalje iz forme: dodaj ga u `QuizzesActions.create` request
   ([create-page.component.ts:235-248](../frontend/src/app/features/create/create-page.component.ts#L235-L248)).

### 3. Dodaj novi endpoint u Nest (npr. broj mojih kvizova)

1. Servis ([quizzes.service.ts](../backend/src/modules/quizzes/quizzes.service.ts), npr. posle
   `findFeatured`, linija 64):

```ts
  async countMine(userId: string): Promise<{ count: number }> {
    const count = await this.prisma.quiz.count({
      where: { ownerId: userId, kind: 'STANDARD', deletedAt: null },
    });
    return { count };
  }
```

2. Kontroler, **pre** `@Get(':id')`
   ([quizzes.controller.ts:41-44](../backend/src/modules/quizzes/quizzes.controller.ts#L41-L44) je
   `featured`, ubaci posle njega):

```ts
  @Get('count')
  countMine(@CurrentUserId() userId: string): Promise<{ count: number }> {
    return this.quizzes.countMine(userId);
  }
```

   Zašto pre `:id`: Nest gleda rute redom, pa bi `GET /quizzes/count` inače upao u `:id` sa
   `id = 'count'`. Guard (`JwtAuthGuard`) i Swagger tag već stoje na klasi
   ([quizzes.controller.ts:26-29](../backend/src/modules/quizzes/quizzes.controller.ts#L26-L29)).
3. Proba: Swagger → Authorize sa access tokenom → `GET /quizzes/count`.
4. Frontend API ([quizzes-api.service.ts](../frontend/src/app/core/api/quizzes-api.service.ts)):

```ts
  count(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.baseUrl}/count`);
  }
```

Za POST/PATCH sa telom: napravi DTO klasu u `dto/` sa class-validator dekoratorima i stavi
`@Body() dto: MojDto` — globalni `ValidationPipe` ga sam proverava.

### 4. Dodaj novu stranicu u Angular (ruta + komponenta + link)

1. Komponenta `frontend/src/app/features/help/help-page.component.ts`:

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-help-page',
  template: `
    <section class="panel p-6">
      <h1 class="text-2xl">Help</h1>
      <p class="mt-2">Answer with keys 1-4 and press Enter for the next question.</p>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HelpPageComponent {}
```

2. Ruta, unutar `children` shell-a, pre `],` na
   [app.routes.ts:150](../frontend/src/app/app.routes.ts#L150) (tako dobija `authGuard`, top bar i
   donju navigaciju):

```ts
      {
        path: 'help',
        title: 'Help',
        loadComponent: () =>
          import('./features/help/help-page.component').then((m) => m.HelpPageComponent),
      },
```

3. Link: dodaj `{ path: '/help', label: 'Help' }` u `MAIN_LINKS`
   ([layout.constants.ts:8-17](../frontend/src/app/layout/layout.constants.ts#L8-L17)). Na telefonu
   se sam pojavi u meniju naloga, jer `PHONE_MENU_LINKS` uzima sve linkove koji nemaju tab
   ([layout.constants.ts:33-35](../frontend/src/app/layout/layout.constants.ts#L33-L35)).
4. Sa parametrom: `path: 'help/:topic'` i u komponenti `readonly topic = input.required<string>();`
   (radi zbog `withComponentInputBinding()`).

### 5. Dodaj novu akciju i efekat u NgRx (nastavak recepta 3)

1. Akcije ([quizzes.actions.ts:15-39](../frontend/src/app/store/quizzes/quizzes.actions.ts#L15-L39)):

```ts
    'Load Count': emptyProps(),
    'Count Loaded': props<{ count: number }>(),
```

   `createActionGroup` od toga napravi `QuizzesActions.loadCount` i `QuizzesActions.countLoaded`.
2. Reducer ([quizzes.reducer.ts](../frontend/src/app/store/quizzes/quizzes.reducer.ts)): u
   `QuizzesState` (linije 10-21) `count: number;`, u početno stanje (linije 28-39) `count: 0,`, i
   novi `on`:

```ts
    on(QuizzesActions.countLoaded, (state, { count }): QuizzesState => ({ ...state, count })),
```

3. Efekat ([quizzes.effects.ts](../frontend/src/app/store/quizzes/quizzes.effects.ts), isti oblik
   kao `load$` na linijama 20-30):

```ts
  readonly loadCount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(QuizzesActions.loadCount),
      switchMap(() =>
        this.quizzesApi.count().pipe(
          map(({ count }) => QuizzesActions.countLoaded({ count })),
          catchError((error: unknown) => of(this.failed(error))),
        ),
      ),
    ),
  );
```

4. Komponenta: `createFeature` sam pravi selektor za svako polje, pa
   `protected readonly count = this.store.selectSignal(quizzesFeature.selectCount);` i u
   konstruktoru `this.store.dispatch(QuizzesActions.loadCount());`. U šablonu `{{ count() }}`.

Kada koji operator: učitavanje → `switchMap`; izmene koje sve moraju da prođu, jedna za drugom →
`concatMap`; dugme koje ne sme da se pošalje dva puta → `exhaustMap`.

### 6. Dodaj novi socket događaj (npr. `quiz:deleted` za druge tabove)

Backend:

1. Tip događaja u `ServerToClientEvents`
   ([realtime.types.ts:23-34](../backend/src/modules/realtime/realtime.types.ts#L23-L34)):
   `'quiz:deleted': (payload: { quizId: string }) => void;`
2. `QuizzesService` dobija `private readonly notifications: NotificationsService` u konstruktoru
   ([quizzes.service.ts:35](../backend/src/modules/quizzes/quizzes.service.ts#L35); `QuizzesModule`
   već uvozi `RealtimeModule`, [quizzes.module.ts:11](../backend/src/modules/quizzes/quizzes.module.ts#L11)),
   a u `remove` posle `update`
   ([quizzes.service.ts:88-92](../backend/src/modules/quizzes/quizzes.service.ts#L88-L92)):
   `this.notifications.emitToUser(userId, 'quiz:deleted', { quizId });`
   (`emitToUser` šalje u sobu `user:<id>`, [notifications.service.ts:10-16](../backend/src/modules/realtime/notifications.service.ts#L10-L16)).

Frontend:

3. Model: `export interface QuizDeletedEvent { quizId: string; }` u
   [realtime-events.model.ts](../frontend/src/app/core/models/realtime-events.model.ts).
4. Tok u servisu ([realtime-socket.service.ts:26-35](../frontend/src/app/core/realtime/realtime-socket.service.ts#L26-L35)):
   `readonly quizDeleted$ = fromEvent<QuizDeletedEvent>(this.socket, 'quiz:deleted');`
5. Akcija: `'Removed Elsewhere': props<{ quizId: string }>(),` u `QuizzesActions`.
6. Efekat ([realtime.effects.ts:18-62](../frontend/src/app/store/realtime/realtime.effects.ts#L18-L62)):

```ts
    const quizDeleted$ = this.socket.quizDeleted$.pipe(
      map(({ quizId }) => QuizzesActions.removedElsewhere({ quizId })),
    );
```

   i dodaj `quizDeleted$` u `merge(...)`.
7. Reducer: dodaj `QuizzesActions.removedElsewhere` u postojeći `on(QuizzesActions.deleted, ...)`
   ([quizzes.reducer.ts:139-147](../frontend/src/app/store/quizzes/quizzes.reducer.ts#L139-L147)).
   Nova akcija umesto `deleted` zato što `deleted` pokreće efekat koji navigira na `/library` i
   pokazuje toast ([quizzes.effects.ts:168-178](../frontend/src/app/store/quizzes/quizzes.effects.ts#L168-L178)),
   a to ne želimo u drugom tabu.

Proba: dva taba istog korisnika na Library, obriši kviz u jednom, nestane i u drugom.

Događaj u meču (namespace `/game`) ide istim putem, samo kroz druge fajlove:
[matches.types.ts:245-262](../backend/src/modules/matches/matches.types.ts#L245-L262) →
`emitToRoom` u `MatchSession` →
[match-socket.service.ts:35-53](../frontend/src/app/core/realtime/match-socket.service.ts#L35-L53) →
[match-socket.actions.ts](../frontend/src/app/store/match/match-socket.actions.ts) →
`roundEvents`/`lifecycleEvents` u [match.effects.ts:294-349](../frontend/src/app/store/match/match.effects.ts#L294-L349) →
[match.reducer.ts](../frontend/src/app/store/match/match.reducer.ts).

### 7. Promeni broj pitanja u koraku putanje

1. `questionCount` u `PATH_PLAN`
   ([learning-paths.constants.ts:10](../backend/src/modules/learning-paths/learning-paths.constants.ts#L10),
   17, 24, 31, 38). Npr. korak 1: `questionCount: 3,`.
2. Broj ide u prompt ("exactly N questions",
   [write-path.prompt.ts:17](../backend/src/modules/ai/prompts/write-path.prompt.ts#L17)). Ako AI
   vrati neispravna pitanja, ona se odbacuju: najviše 2 smeju da otpadnu i nikad ne sme ostati
   manje od 3, inače zahtev vraća 503
   ([ai.constants.ts:7-8](../backend/src/modules/ai/ai.constants.ts#L7-L8),
   [ai.rules.ts:13-17](../backend/src/modules/ai/ai.rules.ts#L13-L17)).
3. Frontend ne treba menjati: broj pitanja stiže kao `questionCount` u `StepView`.

Važi samo za nove putanje. Isto mesto: težina koraka (`difficulty`), nagrade
([learning-paths.constants.ts:55-61](../backend/src/modules/learning-paths/learning-paths.constants.ts#L55-L61)),
vreme po pitanju na putanji (linije 48-52).

### 8. Dodaj novo pojačanje (npr. `REMOVE_ONE`, uklanja jedan pogrešan odgovor)

Backend:

1. Enum `BoostType` ([schema.prisma:77-83](../backend/prisma/schema.prisma#L77-L83)) dodaj
   `REMOVE_ONE`, pa migracija i restart.
2. [matches.constants.ts:32-37](../backend/src/modules/matches/matches.constants.ts#L32-L37):
   dodaj `'REMOVE_ONE'` u `MATCH_BOOST_TYPES` (posle `'SECOND_CHANCE'`). Tip `MatchBoostType` je
   `Exclude<BoostType, 'STREAK_FREEZE'>`, pa ga ne diraš; `UseBoostDto` validira preko ove liste.
3. Efekat u `applyBoost`
   ([match-session.ts:464-479](../backend/src/modules/matches/match-session.ts#L464-L479)), pre
   poslednjeg `return`:

```ts
    if (type === 'REMOVE_ONE') {
      const order = this.optionOrderFor(player.userId, this.index);
      return { eliminatedOptions: pickWrongOptions(order, question.correctIndex, 1) };
    }
```

4. Prodavnica: novi unos u `BOOST_CATALOG`
   ([shop.constants.ts:3-34](../backend/src/modules/shop/shop.constants.ts#L3-L34)), npr.
   `{ type: 'REMOVE_ONE', name: 'Remove one', description: 'Removes one wrong answer.', price: 5 }`.
   Trošenje je već atomično ([match-play.service.ts:58-64](../backend/src/modules/matches/match-play.service.ts#L58-L64)).

Frontend:

5. [shop.model.ts:3](../frontend/src/app/core/models/shop.model.ts#L3): dodaj `'REMOVE_ONE'` u `BoostType`.
6. [boost-icon.component.ts:12-26](../frontend/src/app/shared/components/boost-icon.component.ts#L12-L26):
   labela i slika (npr. `itemIconUrl('sword')`).
7. Dugme u meču: unos u `BOOSTS`
   ([boosts-bar.component.ts:13-26](../frontend/src/app/features/play/components/boosts-bar.component.ts#L13-L26)).
8. Brojači: `REMOVE_ONE: 0` u `STARTING_BOOST_USES`
   ([store/match/match.constants.ts:5-10](../frontend/src/app/store/match/match.constants.ts#L5-L10))
   i `REMOVE_ONE: ownedCount(offers, 'REMOVE_ONE')` u `usesFromOwned`
   ([match.reducer.ts:381-391](../frontend/src/app/store/match/match.reducer.ts#L381-L391)).

`withBoost` u reduceru već prikazuje `eliminatedOptions`
([match.reducer.ts:362-377](../frontend/src/app/store/match/match.reducer.ts#L362-L377)), pa za
prikaz ne treba ništa više.

### 9. Promeni vreme odbrojavanja (3-2-1) i vreme po pitanju

Odbrojavanje je zadato na dva mesta, koja moraju da se slažu:

1. Server čeka pre prvog pitanja: `COUNTDOWN_SECONDS`
   ([matches.constants.ts:26](../backend/src/modules/matches/matches.constants.ts#L26)), koristi se u
   [match-session.ts:144](../backend/src/modules/matches/match-session.ts#L144).
2. Animacija na frontendu ([play.constants.ts:8-10](../frontend/src/app/features/play/play.constants.ts#L8-L10)):
   labele + završna reč, svaka po `COUNTDOWN_STEP_MS`.

Primer za 5 sekundi: server `COUNTDOWN_SECONDS = 5`; frontend
`COUNTDOWN_NUMBERS = ['4', '3', '2', '1']` i `COUNTDOWN_STEP_MS = 1000` (4 broja + GO = 5 × 1000 ms).

Vreme po pitanju:

- podrazumevano pri pravljenju kviza po uzrastu:
  [create.constants.ts:19-23](../frontend/src/app/features/create/create.constants.ts#L19-L23);
- dozvoljeni opseg (15-120 s):
  [quizzes.constants.ts:11-12](../backend/src/modules/quizzes/quizzes.constants.ts#L11-L12);
- koraci putanje: [learning-paths.constants.ts:48-52](../backend/src/modules/learning-paths/learning-paths.constants.ts#L48-L52);
- Mistakes review: [review.constants.ts:8](../backend/src/modules/review/review.constants.ts#L8);
- dodatno vreme (+15 s): [matches.constants.ts:40](../backend/src/modules/matches/matches.constants.ts#L40)
  i tekst na dugmetu [play.constants.ts:22](../frontend/src/app/features/play/play.constants.ts#L22).

### 10. Dodaj novu temu kviza (enum)

1. `enum QuizTheme` ([schema.prisma:26-39](../backend/prisma/schema.prisma#L26-L39)): dodaj npr.
   `MOVIES`. Migracija + restart.
2. Backend ostalo radi samo: DTO koristi `@IsEnum(QuizTheme)`
   ([create-quiz.dto.ts:42-44](../backend/src/modules/quizzes/dto/create-quiz.dto.ts#L42-L44)), a
   AI šema `z.enum(QuizTheme)` ([ai.schemas.ts:21](../backend/src/modules/ai/ai.schemas.ts#L21)),
   pa i AI odmah sme da bira novu temu.
3. Frontend tip: [quiz.model.ts:7-19](../frontend/src/app/core/models/quiz.model.ts#L7-L19) `| 'MOVIES'`.
4. Kompajler će tražiti dve mape (`Record<QuizTheme, string>`): labela
   [theme-label.pipe.ts:4-17](../frontend/src/app/shared/pipes/theme-label.pipe.ts#L4-L17) i boja
   trake [quiz-card.component.ts:11-24](../frontend/src/app/shared/components/quiz-card.component.ts#L11-L24).
5. Da bude u izboru pri ručnom pravljenju:
   [create.constants.ts:116-129](../frontend/src/app/features/create/create.constants.ts#L116-L129).

### 11. Dodaj validaciju u DTO

Primer: naslov kviza mora da ima bar jedno slovo (ne može "12345").

1. [create-quiz.dto.ts:30-34](../backend/src/modules/quizzes/dto/create-quiz.dto.ts#L30-L34), ispod
   `@Length(...)`:

```ts
  @Matches(/\p{L}/u, { message: 'The title needs at least one letter.' })
```

   (`Matches` dodaj u import iz `class-validator`.) Isto u
   [update-quiz.dto.ts:13-18](../backend/src/modules/quizzes/dto/update-quiz.dto.ts#L13-L18).
2. Radi zbog globalnog `ValidationPipe`
   ([main.ts:23-25](../backend/src/main.ts#L23-L25)): neispravan body → 400 sa listom poruka.
   `whitelist` izbacuje polja kojih nema u DTO-u, `forbidNonWhitelisted` vraća grešku ako ih ima,
   `transform` pravi pravu instancu klase (pa rade `@Transform` i tipovi).
3. Frontend već prikazuje prvu poruku sa servera
   ([api-error.ts:35-38](../frontend/src/app/core/api/api-error.ts#L35-L38)). Za proveru pre slanja
   na `quizTitle`
   ([create-page.component.ts:106-109](../frontend/src/app/features/create/create-page.component.ts#L106-L109))
   stavi niz validatora:
   `validators: [textLength(QUIZ_TITLE_MIN_LENGTH, QUIZ_TITLE_MAX_LENGTH), Validators.pattern(/\p{L}/u)]`
   (`Validators` dodaj u import iz `@angular/forms`). Tada neispravan naslov ne prolazi proveru
   `this.quizTitle.invalid` pre slanja (linija 227).
4. Proba u Swagger-u: `POST /quizzes` sa `"title": "12345"` → 400.

Drugi česti dekoratori: `@IsEmail`, `@Length(min, max)`, `@Min/@Max`, `@IsEnum`, `@IsOptional`,
`@ValidateNested({ each: true })` + `@Type(() => X)` za niz objekata (kao pitanja,
[create-quiz.dto.ts:64-70](../backend/src/modules/quizzes/dto/create-quiz.dto.ts#L64-L70)).

### 12. Promeni boju ili stil dugmeta (Tailwind tema)

- Samo glavno dugme: `.btn-primary`
  ([styles.css:199-203](../frontend/src/styles.css#L199-L203)), npr. zeleno:

```css
  .btn-primary {
    --btn-bg: var(--jade-400);
    --btn-text: var(--night-950);
    --btn-ledge: var(--jade-600);
  }
```

- Oblik svih dugmića (okvir, senka, visina 44px, pritisak): `.btn`
  ([styles.css:153-197](../frontend/src/styles.css#L153-L197)).
- Boja svuda u aplikaciji: paleta u
  [tailwind.config.js:6-46](../frontend/tailwind.config.js#L6-L46) (npr. `torch.400`); CSS
  promenljive se prave iz nje ([styles.css:21-58](../frontend/src/styles.css#L21-L58)), pa se
  promena vidi i u Tailwind klasama (`bg-torch-400`) i u CSS-u.
- U šablonu: `class="btn btn-primary"`, npr.
  [quiz-card.component.html:32-39](../frontend/src/app/shared/components/quiz-card.component.html#L32-L39).
  Možeš staviti i `btn-danger`, `btn-success`, `btn-secondary`, `btn-ghost`.

### 13. Promeni šanse u kovčegu

Primer: drveni kovčeg češće daje pojačanje, a ređe novčiće.

1. Tabela je `DROP_TABLES`
   ([chests.constants.ts:5-23](../backend/src/modules/chests/chests.constants.ts#L5-L23)). Za
   drveni kovčeg:

```ts
  WOODEN: [
    { kind: 'COINS', weight: 60, minCoins: 20, maxCoins: 40 },
    { kind: 'BOOSTS', weight: 35, boostCount: 1, streakFreezes: 0 },
    { kind: 'SKIN', weight: 5, pool: 'BASIC' },
  ],
```

   `weight` je težina, ne procenat: šansa reda je njegova težina podeljena zbirom težina
   ([chests.rules.ts:106-112](../backend/src/modules/chests/chests.rules.ts#L106-L112)). Drži
   zbir na 100, pa su težine isto što i procenti. U istom redu menjaš i opseg novčića
   (`minCoins`, `maxCoins`), broj pojačanja (`boostCount`) i zamrzavanja niza (`streakFreezes`).
2. Isto mesto, ako treba: koja pojačanja mogu da ispadnu (`CHEST_BOOSTS`, linija 26), najveća
   cena "običnog" skina (`BASIC_SKIN_MAX_PRICE`, linija 29), koliko novčića vredi duplikat
   predmeta koji postoji samo u kovčezima (linija 31), i kada se kovčezi dobijaju (linije 33-42).
   Kovčezi za korake putanje su u `STEP_REWARDS`
   ([learning-paths.constants.ts:55-61](../backend/src/modules/learning-paths/learning-paths.constants.ts#L55-L61)).
3. Testovi: `docker compose exec backend npx jest chests`. Pašće provera procenata
   ([chests.rules.spec.ts:117-121](../backend/src/modules/chests/chests.rules.spec.ts#L117-L121),
   sada 60 / 35 / 5) i test koji sa `randomSequence(0.69, ...)` očekuje novčiće
   ([chests.rules.spec.ts:47-50](../backend/src/modules/chests/chests.rules.spec.ts#L47-L50)):
   69 više nije manje od 60, pa sada ispada pojačanje. Stavi 0.59. Testovi znaju tačan ishod
   baš zato što se random funkcija ubacuje spolja (odeljak 4h).
4. Frontend ne treba menjati: panel "Chances" crta ono što vrati `GET /chests/odds`, a to se
   računa iz iste tabele. Proba: Swagger → `GET /chests/odds`. Ako menjaš pravila zarade, promeni
   i tekst "How to earn" na stranici
   ([features/chests/chests.constants.ts:17-24](../frontend/src/app/features/chests/chests.constants.ts#L17-L24)).

### 14. Dodaj novu sabotažu (npr. `SHRINK`: sitna slova odgovora 4 s)

Sabotaža koju samo klijent crta (kao FOG, QUAKE, MIRROR) ne treba nikakvu logiku na serveru:
server je proveri, skine naboj i javi sobi `match:sabotaged` sa trajanjem.

Backend:

1. Tip: `| 'SHRINK'` u `SabotageType`
   ([matches.types.ts:25](../backend/src/modules/matches/matches.types.ts#L25)).
2. Konstante ([matches.constants.ts:50-73](../backend/src/modules/matches/matches.constants.ts#L50-L73)):
   `'SHRINK'` u `SABOTAGE_TYPES`, nova `export const SHRINK_DURATION_MS = 4_000;` i
   `SHRINK: SHRINK_DURATION_MS,` u `SABOTAGE_DURATION_MS`. Ovo poslednje kompajler sam traži, jer
   je to `Record<SabotageType, number>`. DTO već pušta novi tip, jer proverava listu
   `SABOTAGE_TYPES` ([sabotage.dto.ts:12-13](../backend/src/modules/matches/dto/sabotage.dto.ts#L12-L13)).
3. Ništa više: `sabotage()`
   ([match-session.ts:198-217](../backend/src/modules/matches/match-session.ts#L198-L217))
   proveri pravila preko `sabotageError`
   ([party-rules.ts:30-44](../backend/src/modules/matches/party-rules.ts#L30-L44)), štit radi
   sam, a `applySabotage` ([match-session.ts:544-555](../backend/src/modules/matches/match-session.ts#L544-L555))
   menjaš samo ako server mora nešto da sprovede (kao FREEZE i SCRAMBLE). Za test dodaj
   `SHRINK` u postojeći test
   ([match-session.spec.ts:606-626](../backend/src/modules/matches/match-session.spec.ts#L606-L626)).

Frontend:

4. Tip: `| 'SHRINK'` u `SabotageType`
   ([match.model.ts:12-15](../frontend/src/app/core/models/match.model.ts#L12-L15)); `AttackType`
   ga dobije sam.
5. Tekstovi u `SABOTAGES` (kompajler traži, jer je `Record<AttackType, ...>`)
   ([play.constants.ts:48-103](../frontend/src/app/features/play/play.constants.ts#L48-L103)):

```ts
  SHRINK: {
    label: 'Shrink',
    pastVerb: 'shrank',
    onMe: 'your answers',
    promptVerb: 'shrink',
    description: 'Make their answers tiny',
    status: 'Shrunk',
    badgeColor: 'var(--jade-400)',
  },
```

6. Ikonica: `SHRINK: 'mirror'` u `ICON_FILES`
   ([sabotage-icon.component.ts:17-22](../frontend/src/app/features/play/components/sabotage-icon.component.ts#L17-L22)),
   ili nova slika 16x16 `assets/images/icons/shrink.png` i `| 'shrink'` u `PixelIconName`
   ([pixel-icon.component.ts:4-22](../frontend/src/app/shared/components/pixel-icon.component.ts#L4-L22)).
7. Dugme: `'SHRINK'` na kraj liste `ATTACKS`
   ([sabotage-bar.component.ts:7](../frontend/src/app/features/play/components/sabotage-bar.component.ts#L7)).
8. Da li sam pogođen, kao signal, pored ostalih
   ([party-round.service.ts:111-114](../frontend/src/app/features/play/party-round.service.ts#L111-L114)):
   `readonly shrunk = computed(() => this.isUnder(this.meId(), 'SHRINK'));`
9. Efekat na ekranu, isto kao MIRROR: u `AnswerGridComponent`
   ([answer-grid.component.ts:54-56](../frontend/src/app/features/play/components/answer-grid.component.ts#L54-L56))
   `readonly shrunk = input(false);`, u šablonu
   ([answer-grid.component.html:4-5](../frontend/src/app/features/play/components/answer-grid.component.html#L4-L5))
   `[class.answers-shrunk]="shrunk()"`, u CSS-u
   ([answer-grid.component.css:146-150](../frontend/src/app/features/play/components/answer-grid.component.css#L146-L150))
   `.answers-shrunk .answer-text { font-size: 0.6rem; }`, i na stranici meča
   ([match-page.component.html:179-180](../frontend/src/app/features/play/match-page.component.html#L179-L180))
   `[shrunk]="party.shrunk()"`.

Proba: party sa dva prozora (trik iz odeljka 2). Svaki igrač počinje sa jednim nabojem, pa
odmah na prvom pitanju izaberi Shrink i klikni na heroja drugog igrača.

### 15. Dodaj novog heroja ili ljubimca

Ključ (npr. `hero-ice-queen`) mora biti isti na dva mesta: id predmeta u bazi i `key` u
manifestu. Prodavnica dobija predmete iz baze, a sliku nalazi u manifestu po tom ključu. Po
dogovoru se i slika zove isto.

1. Slika: traka u jednom redu, kadrovi 32x32 (4 kadra = 128x32 px), u
   `frontend/src/assets/sprites/heroes/hero-ice-queen.png` (ljubimci idu u `sprites/pets/`).
2. Manifest: novi objekat na kraju niza u
   [manifest.json](../frontend/src/assets/sprites/manifest.json) (posle poslednjeg objekta na
   linijama 512-521 stavi zarez):

```json
  {
    "key": "hero-ice-queen",
    "type": "hero",
    "name": "Ice Queen",
    "sheet": "heroes/hero-ice-queen.png",
    "frameWidth": 32,
    "frameHeight": 32,
    "frames": 4,
    "fps": 8
  }
```

3. Seed: red u `SEED_ITEMS`
   ([seed-data/items.ts:30-83](../backend/prisma/seed-data/items.ts#L30-L83)), preko pomoćnih
   funkcija sa linija 13-28:
   `hero('hero-ice-queen', 'Ice Queen', 210, 4),` (cena 210, od nivoa 4), za ljubimca
   `pet('pet-...', 'Ime', 60, 2),`, a za predmet koji postoji samo u kovčezima
   `chestOnly('hero-ice-queen', 'Ice Queen', 'AVATAR'),`.
4. `docker compose restart backend`. Migracija ne treba, jer je to red u tabeli, a ne izmena
   šeme; seed pri startu radi `upsert` za svaki predmet
   ([seed.ts:85-89](../backend/prisma/seed.ts#L85-L89)).
5. Proba: Shop → Heroes. Predmet do 150 novčića sam ulazi u "običan" skin iz kovčega, a
   `chestOnly` u ređi red srebrnog i zlatnog kovčega
   ([chests.rules.ts:62-69](../backend/src/modules/chests/chests.rules.ts#L62-L69)); u
   prodavnici umesto cene piše "Found in chests".

### 16. Brzi brojevi koje profesor može da traži

| Šta | Gde |
| --- | --- |
| Besplatni hintovi po meču | [matches.constants.ts:38](../backend/src/modules/matches/matches.constants.ts#L38) i [store/match/match.constants.ts:3](../frontend/src/app/store/match/match.constants.ts#L3) |
| Poeni za tačan / bonus za brzinu | [matches.constants.ts:28-29](../backend/src/modules/matches/matches.constants.ts#L28-L29) |
| Procenat za pobedu tima | [matches.constants.ts:30](../backend/src/modules/matches/matches.constants.ts#L30) i [play.constants.ts:21](../frontend/src/app/features/play/play.constants.ts#L21) |
| Koliko najduže čeka da svi kliknu Next | [matches.constants.ts:75-81](../backend/src/modules/matches/matches.constants.ts#L75-L81) |
| Koliko čeka igrača koji je otišao | [matches.constants.ts:83-90](../backend/src/modules/matches/matches.constants.ts#L83-L90) |
| Mesečni limit kupovine | [payments.constants.ts:1-3](../backend/src/modules/payments/payments.constants.ts#L1-L3) |
| Paketi novčića | [coin-packages.ts:3-7](../backend/src/modules/payments/coin-packages.ts#L3-L7) |
| Dnevni limit AI generisanja | [quizzes.constants.ts:26](../backend/src/modules/quizzes/quizzes.constants.ts#L26) i [create.constants.ts:28](../frontend/src/app/features/create/create.constants.ts#L28) |
| Intervali ponavljanja grešaka | [review.constants.ts:4](../backend/src/modules/review/review.constants.ts#L4) |
| Zvezdice 60/80/100% | [progression.constants.ts:25-27](../backend/src/modules/progression/progression.constants.ts#L25-L27) |
| Kriva nivoa | [progression.rules.ts:31-37](../backend/src/modules/progression/progression.rules.ts#L31-L37) |
| Šanse u kovčezima | [chests.constants.ts:5-23](../backend/src/modules/chests/chests.constants.ts#L5-L23) |
| Kada se dobija kovčeg (60%, dve pobede dnevno, svakih 7 dana) | [chests.constants.ts:33-42](../backend/src/modules/chests/chests.constants.ts#L33-L42) |
| Poeni za tačan odgovor iz druge šanse | [matches.constants.ts:41-42](../backend/src/modules/matches/matches.constants.ts#L41-L42) |
| Cene pojačanja (druga šansa 20) | [shop.constants.ts:3-34](../backend/src/modules/shop/shop.constants.ts#L3-L34) |
| Trajanje sabotaža | [matches.constants.ts:59-73](../backend/src/modules/matches/matches.constants.ts#L59-L73) |

---

## 6. Pitanja koja profesor može da postavi

**1. Zašto server meri vreme, a ne klijent?**
Klijentu se ne veruje: sat može da se namesti, a poruka putuje mrežom. Server sam upiše
`remainingMs` kad odgovor stigne
([match-session.ts:160-170](../backend/src/modules/matches/match-session.ts#L160-L170)) i iz toga
računa bonus za brzinu ([scoring.ts:22-28](../backend/src/modules/matches/scoring.ts#L22-L28)).
Rok je na serveru (`deadlineAt$`), a klijent dobija samo "koliko je ostalo" i crta traku.

**2. Zašto i signali i RxJS?**
Signal je vrednost koju šablon čita sada (stanje). RxJS je za stvari koje se dešavaju kroz vreme:
HTTP, socket, tajmeri, kucanje. Na granici se pretvara sa `toSignal`/`toObservable`
([match-clock.service.ts:48-67](../frontend/src/app/features/play/match-clock.service.ts#L48-L67)).
U zoneless Angularu šablon se osvežava kad se promeni signal, zato sve što šablon čita mora biti
signal (`store.selectSignal`, `computed`, `input`).

**3. Šta je entity adapter?**
Pomoćnik iz `@ngrx/entity`. Listu čuva kao `{ ids: [...], entities: { id: objekat } }` i daje
gotove funkcije `setAll`, `addOne`, `updateOne`, `removeOne` i selektor `selectAll`. Nalaženje po
id-ju je brzo i nema ručnog kopiranja nizova. Kvizovi su sortirani `sortComparer`-om
([quizzes.reducer.ts:23-26](../frontend/src/app/store/quizzes/quizzes.reducer.ts#L23-L26)), a
prijatelji koriste `selectId`, jer im je ključ `friendshipId`. Neotvoreni kovčezi: `addOne` kad
stigne `chest:earned`, `removeOne` posle otvaranja, a `selectTotal` je broj na ikonici u gornjoj
traci ([chests.reducer.ts:60-70](../frontend/src/app/store/chests/chests.reducer.ts#L60-L70)).

**4. Razlika switchMap / concatMap / exhaustMap i gde se koristi?**

- `switchMap`: novi poziv otkazuje stari. Učitavanja i pretraga, važi samo poslednji
  ([quizzes.effects.ts:44-54](../frontend/src/app/store/quizzes/quizzes.effects.ts#L44-L54),
  [friends.effects.ts:41-48](../frontend/src/app/store/friends/friends.effects.ts#L41-L48)).
- `concatMap`: red, jedan po jedan, ništa se ne gubi. Izmene pitanja, zahtevi za prijateljstvo
  ([quizzes.effects.ts:104-114](../frontend/src/app/store/quizzes/quizzes.effects.ts#L104-L114),
  [friends.effects.ts:50-60](../frontend/src/app/store/friends/friends.effects.ts#L50-L60)).
- `exhaustMap`: dok traje prvi, novi se ignorišu. Login, kreiranje meča, generisanje, dupli klik
  ne pravi dva zahteva ([auth.effects.ts:43-53](../frontend/src/app/store/auth/auth.effects.ts#L43-L53),
  [match.effects.ts:41-51](../frontend/src/app/store/match/match.effects.ts#L41-L51)).
- `mergeMap` (sve paralelno) nije bio potreban.

**5. Kako radi rotacija refresh tokena?**
Svaki `/auth/refresh` izda novi par tokena i u bazu upiše hash novog refresh tokena
([auth.service.ts:105-111](../backend/src/modules/auth/auth.service.ts#L105-L111)).
`jti: randomUUID()` garantuje da je svaki token drugačiji. Stari refresh token više ne prolazi
poređenje hash-a ([auth.service.ts:74-79](../backend/src/modules/auth/auth.service.ts#L74-L79)).
Logout briše hash, pa nijedan refresh token više ne važi. Ako lopov iskoristi ukradeni token,
pravi korisnik ostaje bez sesije i mora ponovo da se uloguje, umesto da obojica tiho rade.

**6. Šta su relacije u bazi?**
Veze između tabela preko stranog ključa. 1:N: jedan korisnik ima više kvizova (`Quiz.ownerId`).
1:1: jedan korak putanje ima tačno jedan kviz (`PathStep.quizId @unique`). M:N: korisnik igra više
mečeva, meč ima više igrača, pa postoji spojna tabela `MatchPlayer` koja čuva i score, odgovore i
nagrade ([schema.prisma:273-293](../backend/prisma/schema.prisma#L273-L293)). `onDelete: Cascade`
briše decu kad se obriše roditelj.

**7. Zašto Docker?**
Isto okruženje kod svih (Node 22, Postgres 16), jedna komanda diže bazu, backend i frontend,
migracije i seed se rade sami, a baza čuva podatke u volumenu. Nema "kod mene radi".

**8. Kako se sprečava varanje?**

- Tačan odgovor ne ide klijentu dok runda traje: pitanje nosi samo tekst i opcije
  ([match-session.ts:701-712](../backend/src/modules/matches/match-session.ts#L701-L712)).
- Opcije se mešaju po meču, a server ih vraća u originalni redosled pre bodovanja
  ([option-order.ts:10-32](../backend/src/modules/matches/option-order.ts#L10-L32)).
- Vreme meri server; jedan odgovor po rundi (`canAnswer`,
  [match-session.ts:297-303](../backend/src/modules/matches/match-session.ts#L297-L303)).
- Socket poruke prolaze DTO validaciju ([match.gateway.ts:36](../backend/src/modules/matches/match.gateway.ts#L36),
  [answer.dto.ts:5-14](../backend/src/modules/matches/dto/answer.dto.ts#L5-L14)).
- Novčići i pojačanja se troše jednim uslovnim upitom (`updateMany ... gte`), pa ne mogu u minus
  ([shop.service.ts:130-144](../backend/src/modules/shop/shop.service.ts#L130-L144),
  [match-play.service.ts:58-64](../backend/src/modules/matches/match-play.service.ts#L58-L64)).
- U duelu i partiji pojačanja su isključena
  ([match-session.ts:439-449](../backend/src/modules/matches/match-session.ts#L439-L449)).
- Nagrada iz kovčega se izvlači na serveru, a sabotaže proverava server
  ([party-rules.ts:30-44](../backend/src/modules/matches/party-rules.ts#L30-L44)); klijent samo
  javi nameru i nacrta rezultat.

**9. Šta se dešava ako se igrač diskonektuje?**
Gateway proverava da li je igraču ostao ijedan socket u sobi meča (više tabova, reconnect)
([match.gateway.ts:207-223](../backend/src/modules/matches/match.gateway.ts#L207-L223)). Ako ne,
`playerDisconnected` ([match-session.ts:233-249](../backend/src/modules/matches/match-session.ts#L233-L249)):
SOLO ide dalje (propuštena pitanja 0 poena) i posle 60 s bez povratka postaje ABANDONED; u
DUEL/TEAM ostali dobiju `match:player-left`, runde čekaju samo povezane, a posle 30 s duel se
završava pobedom onoga ko je ostao, a tim postaje ABANDONED; PARTY ide dalje dok su bar dvojica.
Kad se vrati, klijent sam pošalje `match:join` na reconnect
([match-socket.service.ts:55-58](../frontend/src/app/core/realtime/match-socket.service.ts#L55-L58)),
a server mu pošalje trenutno pitanje sa preostalim vremenom
([match-session.ts:672-686](../backend/src/modules/matches/match-session.ts#L672-L686)).

**10. Kako radi grown-up provera i limit potrošnje?**
Frontend: modal sa množenjem dvocifrenog i jednocifrenog broja
([gate-question.ts:10-19](../frontend/src/app/features/shop/gate-question.ts#L10-L19)), posle
pogrešnog odgovora novo pitanje
([grown-up-gate.component.ts:33-43](../frontend/src/app/features/shop/components/grown-up-gate.component.ts#L33-L43));
tek tačan odgovor šalje checkout
([shop-page.component.html:169-175](../frontend/src/app/features/shop/shop-page.component.html#L169-L175)).
Backend: zbir PAID i otvorenih PENDING kupovina u poslednjih 30 dana + novi paket ne sme preći
1000 centi ([payments.service.ts:159-179](../backend/src/modules/payments/payments.service.ts#L159-L179),
[payments.rules.ts:8-10](../backend/src/modules/payments/payments.rules.ts#L8-L10)). Red korisnika
se zaključa sa `SELECT ... FOR UPDATE`, da dva brza klika ne prođu oba
([payments.service.ts:140-157](../backend/src/modules/payments/payments.service.ts#L140-L157)).
Gate je zaštita za decu u interfejsu; pravo pravilo o novcu je na serveru.

**11. Zašto `Promise.all` za putanju?**
Pet koraka ne zavise jedan od drugog, pa paralelno traje koliko najsporiji, a ne zbir svih pet.
Ako jedan padne, `Promise.all` odmah odbije i ništa se ne snima. Snimanje je posle toga u jednoj
transakciji.

**12. Šta je zoneless?**
Angular bez `zone.js`. Ranije je zone.js posle svakog klika, tajmera ili HTTP odgovora proveravao
celu aplikaciju. Sada Angular osvežava prikaz samo kad se promeni signal, `input` ili se desi
događaj iz šablona. U projektu nema `zone.js` u `package.json` ni `provideZoneChangeDetection` u
[app.config.ts](../frontend/src/app/app.config.ts) (Angular 21 je zoneless podrazumevano), a sve
komponente su `OnPush`. Zato se nikad ne menja obično polje u `subscribe`, nego signal.

**13. Kako socket zna ko je korisnik?**
Klijent šalje access token u handshake-u
([authorized-socket.ts:11-16](../frontend/src/app/core/realtime/authorized-socket.ts#L11-L16)).
Middleware na serveru proveri potpis i `type === 'access'` i upiše `userId` u `socket.data`
([ws-auth.service.ts:15-34](../backend/src/modules/realtime/ws-auth.service.ts#L15-L34)). Svaki
socket uđe u sobu `user:<id>`, pa se poruka jednom korisniku šalje na sve njegove tabove.

**14. Zašto je `MatchSession` obična klasa, a ne `@Injectable` servis?**
Nest servisi su singletoni, jedan za celu aplikaciju. Svaki meč treba svoj objekat sa svojim
igračima, Subject-ima i tajmerima. Pravi ga `MatchSessionRegistry` i čuva u `Map`
([match-session-registry.service.ts:22-37](../backend/src/modules/matches/match-session-registry.service.ts#L22-L37)).

**15. Šta ako host i gost istovremeno kliknu Start, ili se meč završi dva puta?**
Start: `updateMany where status 'WAITING'` — samo jedan dobije `count === 1`
([match-play.service.ts:36-43](../backend/src/modules/matches/match-play.service.ts#L36-L43)).
Kraj: `updateMany where status 'IN_PROGRESS'` u transakciji, pa se nagrade dele samo jednom
([match-results.service.ts:79-89](../backend/src/modules/matches/match-results.service.ts#L79-L89)).

**16. Šta se desi sa mečevima kad se server restartuje?**
Sesije su u memoriji, pa ne mogu da se nastave. Pri startu se svi WAITING/IN_PROGRESS mečevi
označe kao ABANDONED ([matches.service.ts:50-59](../backend/src/modules/matches/matches.service.ts#L50-L59)).

**17. Kako radi Mistakes notebook?**
Pogrešan odgovor napravi ili ažurira karticu sa rokom sutra (1 dan) i vrati niz tačnih na 0. Tačan
odgovor na dan roka ili kasnije pomera rok na 3, pa na 7 dana
([review.constants.ts:4](../backend/src/modules/review/review.constants.ts#L4)); posle tri tačna
zaredom kartica se briše
([review.service.ts:133-157](../backend/src/modules/review/review.service.ts#L133-L157)). Tačan
odgovor pre roka se ne broji, da se pitanje ne bi "naučilo" ponavljanjem istog kviza za minut.

**18. Šta je factory provider i zašto?**
Provider čiju vrednost pravi funkcija (`useFactory`), sa zavisnostima iz `inject`. Koristi se kad
odluka zavisi od konfiguracije u trenutku pokretanja: Stripe ili demo
([payments.module.ts:12-30](../backend/src/modules/payments/payments.module.ts#L12-L30)), JWT
secret iz `.env` ([auth.module.ts:29-38](../backend/src/modules/auth/auth.module.ts#L29-L38)).
Ostatak koda radi sa interfejsom i ne zna koja je implementacija.

**19. Razlika između guarda u Angularu i u Nest-u?**
Angular guard odlučuje da li se ruta otvara, to je za korisničko iskustvo
([auth.guard.ts:8-17](../frontend/src/app/core/auth/auth.guard.ts#L8-L17)). Nest guard odlučuje
da li zahtev prolazi, to je bezbednost (`JwtAuthGuard` na kontrolerima). Frontend guard može da se
zaobiđe, backend ne.

**20. Zašto se kviz briše "meko"?**
Mečevi pokazuju na kviz sa `onDelete: Cascade`. Pravo brisanje bi obrisalo i istoriju mečeva i XP
na rang listi. Zato se upiše `deletedAt` i svi upiti filtriraju `deletedAt: null`
([quizzes.service.ts:88-92](../backend/src/modules/quizzes/quizzes.service.ts#L88-L92)).

**21. Zašto je u `collectAnswers` `filter` pre `take`?**
Da `take(n)` broji samo važeće odgovore. Da je obrnuto, dupli ili zakasneli odgovor bi "potrošio"
jedno mesto i runda bi se završila pre nego što svi odgovore.

**22. Kako se dva zahteva za novi token ne sudaraju?**
`TokenRefreshService` drži jedan zajednički Observable sa `shareReplay(1)`, pa svi koji dobiju 401
u isto vreme čekaju isti refresh poziv (vidi 4b).

**23. Gde je rate limiting?**
`ThrottlerGuard` na registraciji, loginu, 2FA koraku logina i uključivanju/isključivanju 2FA, 5
pokušaja u minuti po IP adresi
([auth.module.ts:25-28](../backend/src/modules/auth/auth.module.ts#L25-L28),
[auth.constants.ts:12-14](../backend/src/modules/auth/auth.constants.ts#L12-L14)).

**24. Zašto se kovčezi ne mogu kupiti?**
Aplikacija je za decu. Nasumična nagrada koja se plaća je "loot box": radi kao kockanje, a u
nekim zemljama je zabranjena ili ograničena. Zato je pravilo jasno: novac kupuje samo tačan broj
novčića (iza grown-up pitanja i mesečnog limita), novčići kupuju samo predmet koji si izabrao, a
slučajnost postoji samo u kovčezima koji se zarađuju. U kodu:

- Nema rute koja pravi kovčeg. `ChestsController` ima samo listu, šanse i otvaranje
  ([chests.controller.ts:24-41](../backend/src/modules/chests/chests.controller.ts#L24-L41)).
  Kovčeg se upisuje samo u transakciji koja snima meč
  ([match-results.service.ts:132-152](../backend/src/modules/matches/match-results.service.ts#L132-L152))
  ili prvi prelazak koraka putanje
  ([learning-paths.service.ts:169-184](../backend/src/modules/learning-paths/learning-paths.service.ts#L169-L184)),
  plus seed za demo naloge.
- Predmet koji postoji samo u kovčezima ne može da se kupi: 400
  ([shop.service.ts:159-161](../backend/src/modules/shop/shop.service.ts#L159-L161)). Zamrzavanje
  niza nema cenu (`price: null`), pa i ono vraća 400
  ([shop.constants.ts:28-33](../backend/src/modules/shop/shop.constants.ts#L28-L33),
  [shop.service.ts:87-91](../backend/src/modules/shop/shop.service.ts#L87-L91)).
- Šanse su javne: `GET /chests/odds` ih računa iz iste tabele po kojoj se izvlači
  ([chests.rules.ts:98-112](../backend/src/modules/chests/chests.rules.ts#L98-L112)), a stranica
  ih prikazuje u panelu "Chances".

**25. Kako se sprečava duplo otvaranje kovčega?**
Na dva nivoa (ceo tok je u odeljku 4h):

- Frontend: efekat koristi `exhaustMap`, pa se drugi klik ignoriše dok prvi zahtev traje
  ([chests.effects.ts:54-64](../frontend/src/app/store/chests/chests.effects.ts#L54-L64)). To je
  samo udobnost, jer dva taba ili ručni zahtev zaobilaze frontend.
- Server, prava zaštita: u transakciji ide
  `updateMany({ where: { id, openedAt: null }, data: { openedAt, reward } })`. Provera "još je
  zatvoren" i upis su jedan SQL upit, pa ga baza pusti samo jednom: prvi zahtev dobije
  `count === 1` i isplati nagradu, drugi dobije `count === 0`, baca 409 i transakcija se vrati
  ([chests.service.ts:59-70](../backend/src/modules/chests/chests.service.ts#L59-L70)). Isti trik
  kao kod plaćanja (`purchase.updateMany` sa `status: 'PENDING'`) i starta meča (`WAITING`).

Slična zaštita postoji i kod dobijanja: `grantForMatch` prvo zaključa red korisnika
(`SELECT ... FOR UPDATE`), pa tek onda broji današnje kovčege, da dva meča koja se završe u isto
vreme ne dobiju oba poslednji dnevni kovčeg
([chests.service.ts:78-91](../backend/src/modules/chests/chests.service.ts#L78-L91)).

**26. Kako radi Second chance?**
Pojačanje za SOLO i TEAM (u duelu i partiji su pojačanja isključena), košta 20 novčića ili
ispadne iz kovčega.

1. Igrač klikne dugme pre odgovora. Server proveri da sme (`assertCanUseBoost`), skine jedno
   pojačanje atomičnim `updateMany ... gte: 1` i postavi `secondChance = 'armed'`
   ([match-session.ts:474-477](../backend/src/modules/matches/match-session.ts#L474-L477)).
2. Kad stigne odgovor, `submitAnswer` pre slanja u `answers$` pita `secondChanceCovers`
   ([match-session.ts:488-496](../backend/src/modules/matches/match-session.ts#L488-L496)):
   uključena, ovo pitanje, igrač još sme da odgovori i odgovor je **pogrešan**. Tada odgovor
   uopšte ne ulazi u rundu (pa ga `take(n)` ne broji i runda ne staje), stanje postaje
   `'spent'`, a igrač dobije `match:second-chance { wrongOption }`
   ([match-session.ts:498-505](../backend/src/modules/matches/match-session.ts#L498-L505)).
3. Drugi odgovor ide normalnim putem kroz `answers$`. `pointsFor` vidi `'spent'` i daje
   `secondTryPoints`: 50 za tačan (pola osnovnih poena, bez bonusa za brzinu), 0 za pogrešan
   ([match-session.ts:380-394](../backend/src/modules/matches/match-session.ts#L380-L394),
   [scoring.ts:30-33](../backend/src/modules/matches/scoring.ts#L30-L33)). Ako je prvi odgovor
   tačan, boduje se normalno, a pojačanje je potrošeno.
4. Stanje važi samo za jedno pitanje; `resetRoundState` ga vraća na `'unused'`
   ([session-player.ts:45-52](../backend/src/modules/matches/session-player.ts#L45-L52)).
5. Frontend: reducer obriše moj odgovor i zapamti pogrešnu opciju
   ([match.reducer.ts:354-360](../frontend/src/app/store/match/match.reducer.ts#L354-L360)),
   `AnswerGrid` je precrta, pojavi se "Second chance! Try again", a tajmer, koji je stao na prvom
   odgovoru, ponovo krene ([match-clock.service.ts:55-59](../frontend/src/app/features/play/match-clock.service.ts#L55-L59)).

Server je i ovde sudija: klijent nikad ne kaže "ovo je druga šansa", server sam zna stanje
igrača i sam računa poene.

---

## 7. Rečnik

| Pojam | Značenje |
| --- | --- |
| Observable | Tok vrednosti kroz vreme (klikovi, HTTP odgovor, socket događaji). Ne radi ništa dok se neko ne pretplati (`subscribe`). |
| Subscribe | Pretplata na Observable; tada tok počinje. U Angular šablonu umesto toga koristimo `toSignal`. |
| Subject | Observable u koji možeš sam da guraš vrednosti sa `next()`. Na serveru u njega ulaze odgovori igrača (`answers$`). |
| BehaviorSubject | Subject koji pamti poslednju vrednost i odmah je daje novom pretplatniku (`deadlineAt$`). |
| Operator | Funkcija u `pipe(...)` koja menja tok: `map`, `filter`, `take`, `switchMap`... |
| `pipe` | Lanac operatora, čita se odozgo nadole. |
| Signal | Angular vrednost koja javlja kad se promeni; šablon se osvežava samo zbog njih (zoneless). |
| `computed` | Signal izračunat iz drugih signala; sam se preračuna kad se oni promene. |
| Store (NgRx) | Jedan objekat sa celim globalnim stanjem aplikacije. Menja se samo preko akcija. |
| Akcija | Poruka "nešto se desilo", npr. `[Quizzes] Load Detail`. Pravi se sa `createActionGroup`. |
| Reducer | Čista funkcija `(staro stanje, akcija) => novo stanje`. Bez HTTP-a i bez mutiranja. |
| Selector | Funkcija koja iz store-a čita deo stanja; `createFeature` ih pravi sam za svako polje. |
| Effect (NgRx) | Klasa koja sluša akcije i radi sporedne poslove (HTTP, socket, navigacija), pa šalje nove akcije. |
| Entity adapter | NgRx pomoćnik za liste po id-ju (`addOne`, `updateOne`, `removeOne`...). |
| Komponenta | Deo ekrana: klasa + šablon. `input()` prima podatke, `output()` šalje događaje. |
| Servis | Klasa sa logikom bez prikaza, deli se preko DI (`inject()`). |
| Dependency injection | Okvir sam pravi i daje zavisnosti (servise) klasi koja ih traži; ne praviš ih sa `new`. |
| Provider | Pravilo kako DI pravi neku zavisnost (`useClass`, `useFactory`, `providedIn: 'root'`). |
| Interceptor | Funkcija kroz koju prolazi svaki HTTP zahtev; ovde dodaje token i obnavlja ga na 401. |
| Guard | Angular: da li sme da se otvori ruta. Nest: da li sme da prođe zahtev. |
| Lazy loading | Kod stranice se učitava tek kad se ona otvori (`loadComponent`). |
| Zoneless | Angular bez `zone.js`; prikaz se osvežava na promenu signala, ne posle svakog događaja. |
| OnPush | Komponenta se proverava samo kad joj se promene ulazi, signali ili desi događaj u njoj. |
| Modul (Nest) | Grupa kontrolera i servisa jedne celine (`QuizzesModule`), sa `imports` i `exports`. |
| Kontroler | Nest klasa sa REST rutama (`@Get`, `@Post`...). |
| DTO | Klasa koja opisuje telo zahteva; class-validator dekoratori proveravaju svako polje. |
| ValidationPipe | Globalni Nest pipe koji pokreće proveru DTO-a i vraća 400 ako nešto ne valja. |
| Strategy (Passport) | Način provere identiteta: `local` (email + lozinka), `jwt`, `jwt-refresh`. |
| JWT | Potpisan token sa podacima (`sub` = id korisnika, `type`). Server ga proverava potpisom, bez baze. |
| Access / refresh token | Kratki token za svaki zahtev (15 min) / dugi token samo za dobijanje novog para (7 dana). |
| Gateway | Nest klasa za WebSocket (Socket.IO): `@SubscribeMessage` je kao ruta za socket poruku. |
| Namespace / soba | Socket.IO: `/game` je poseban kanal za mečeve; soba `match:<id>` ili `user:<id>` je grupa soketa kojoj se šalje poruka. |
| Prisma | ORM: šema u `schema.prisma`, iz nje se generiše tipiziran klijent za upite. |
| Migracija | SQL fajl koji menja strukturu baze; pravi se iz razlike šeme i baze (`migrate dev`), primenjuje sa `migrate deploy`. |
| Seed | Skripta koja ubaci početne podatke (demo korisnici, kvizovi, predmeti u prodavnici); idempotentna, pa sme da se pusti više puta. |
| Transakcija | Više upita koji uspeju svi ili nijedan (`$transaction`). |
| Idempotentno | Ponovljen zahtev ne menja ništa više od prvog: dupli klik ne otvori kovčeg dvaput i ne isplati kupovinu dvaput (uslovni `updateMany`). |
| Težinsko izvlačenje | Svaki red tabele ima težinu, a šansa reda je težina podeljena zbirom svih težina (`DROP_TABLES`). |
| Ubačena zavisnost (random) | Funkcija ne zove `Math.random` sama, nego ga dobija kao parametar, pa test može da pošalje zadate brojeve. |
| Soft delete | Umesto brisanja upiše se `deletedAt`, a upiti preskaču takve redove. |
| Swagger | Automatska dokumentacija REST API-ja na `/api/docs`, iz dekoratora kontrolera i DTO-a. |
| Healthcheck | Provera da li servis radi; Docker po njoj zna kad je baza spremna. |
