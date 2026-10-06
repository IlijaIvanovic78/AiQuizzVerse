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
napiše i ručno. Postoje tri načina igre: **SOLO** (sam protiv sanduka sa blagom), **TEAM**
(dvoje igrača u timu, pobeđuju ako zajedno imaju bar 60% tačnih) i **PARTY** "Ko zna zna" (2-4
igrača; dvoje prijatelja koji hoće da igraju jedan protiv drugog igraju partiju za dvoje). U
partiji prvi tačan odgovor nosi rundu, pogrešan odgovor izbacuje iz runde i oduzima 25 poena, a
igrači mogu da sabotiraju jedni druge mastilom, zamrzavanjem, mešanjem odgovora, maglom,
zemljotresom ili ogledalom, ili da podignu štit. Pojačanja rade samo u SOLO i TEAM; partija je
fer borba. **Learning path** je putanja od 5 koraka, od lakog do teškog: svaki korak ima
kratku karticu za učenje i kviz, zvezdice se dobijaju za 60/80/100% tačnih, nagrada stiže pri
prvom prelasku, a sledeći korak se otključava tek kad se pređe prethodni. Svako pogrešno pitanje
ide u **Mistakes notebook** i vraća se na ponavljanje posle 1, 3 i 7 dana, dok se ne odgovori
tačno tri puta zaredom (spaced repetition). Igrač skuplja XP, nivoe, dnevni niz (streak) i
novčiće, kojima u **prodavnici** kupuje heroje, ljubimce, sabotaže i pojačanja (hint, 50/50,
dodatno vreme, druga šansa).

**Sabotaže se otključavaju u prodavnici.** Mastilo (INK) je besplatno za sve i nije predmet.
Ostalih šest (FREEZE, SCRAMBLE, FOG, MIRROR, QUAKE, SHIELD) su predmeti od 80 do 150 novčića,
od nivoa 2 do 4: kupe se jednom i ostaju zauvek, a mogu i da ispadnu iz kovčega. Kupljena
sabotaža ne daje ništa sama: i dalje troši naboj, a naboji se dobijaju samo igrom (1 na početku,
+1 za svaku dobijenu rundu, najviše 2, jedna sabotaža po pitanju). Pravilo je **novac kupuje
raznovrsnost, ne snagu** ("money buys variety, not power"). Server pri startu meča pročita koje
sabotaže svaki igrač ima i odbije onu koju nema, pre nego što potroši naboj.

**Kovčezi** (drveni, srebrni, zlatni) se ne mogu kupiti ni novčićima ni pravim novcem, nego se
zarađuju igrom i učenjem: prvi dobar meč u danu, pobeda u partiji, prelazak koraka putanje, novi
nivo i svakih 7 dana niza. Otvaraju se u "Treasure room" i daju novčiće, pojačanja ili, retko,
"običan predmet" (heroja, ljubimca ili sabotažu iz prodavnice do 150 novčića); neki heroji i
ljubimci postoje samo u kovčezima, a predmet koji igrač već ima pretvara se u novčiće. Šanse
za svaki kovčeg su javne i prikazane na istoj stranici. (Kovčeg nije isto što i "sanduk sa
blagom" u SOLO, TEAM i meču na putanji; to je samo traka koja se puni tačnim odgovorima.)

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
[quiz-writer.service.ts:116-121](../backend/src/modules/ai/quiz-writer.service.ts#L116-L121)).
Demo kvizovi iz seed-a su uvek igrivi.

### Demo nalozi

| Email                  | Lozinka    | Napomena                                                                          |
| ---------------------- | ---------- | --------------------------------------------------------------------------------- |
| `demo@quizverse.dev`   | `demo1234` | nivo 5, ima novčiće, pojačanja, heroja, ljubimca, kvizove, sabotaže FREEZE, FOG i SHIELD i tri neotvorena kovčega (drveni, srebrni, zlatni) |
| `friend@quizverse.dev` | `demo1234` | nivo 4, već je prijatelj sa demo nalogom, ima sabotažu SCRAMBLE i jedan drveni kovčeg |

Oba imaju i besplatno mastilo (INK). Sabotaže demo naloga su u seed-u
([seed.ts:69](../backend/prisma/seed.ts#L69), [seed.ts:81](../backend/prisma/seed.ts#L81)).
Kovčezi iz seed-a se dodaju samo dok nalog nema nijedan, pa ih restart ne vraća posle otvaranja
([seed.ts:123-130](../backend/prisma/seed.ts#L123-L130)).

### Trik: dva igrača u istom browseru

Tokeni se čuvaju u `localStorage`
([token-storage.service.ts:5-14](../frontend/src/app/core/auth/token-storage.service.ts#L5-L14)).
`localStorage` je odvojen po originu (protokol + host + port). `http://localhost:4200` i
`http://127.0.0.1:4200` su za browser **dva različita origina**, pa svaki ima svoje tokene, a oba
gađaju isti Angular dev server i isti backend.

1. Prozor A: `http://localhost:4200` → login kao `demo@quizverse.dev`.
2. Prozor B: `http://127.0.0.1:4200` → login kao `friend@quizverse.dev`.
3. U A: Library → neki kviz → Play → "Party with friends (2-4)" (ili "Team up").
4. U lobiju A klikne Invite pored prijatelja. B dobije `match:invite` dijalog i prihvati ga
   (dugme "Join the party", za Team "Team up").
   Druga mogućnost: B otvori `/join` i ukuca kod sa ekrana A.
5. Kad su oba povezana, host (A) klikne dugme za start u lobiju. Partija kreće već sa dva
   igrača, pa je ovo i meč jedan na jedan.

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
| `reduce` | [path-page.component.ts:78-80](../frontend/src/app/features/paths/path-page.component.ts#L78-L80), [quiz-filters.ts:10-13](../frontend/src/app/features/library/quiz-filters.ts#L10-L13), backend [scoring.ts:42-45](../backend/src/modules/matches/scoring.ts#L42-L45) | Od niza napravi jednu vrednost: ukupno zvezdica na putanji, broj kvizova po temi za filter, ukupno tačnih u timu. RxJS "reduce kroz vreme" je `scan` u [mistake-list.component.ts:29](../frontend/src/app/features/play/components/mistake-list.component.ts#L29). |
| `filter` | backend [match-session.ts:275](../backend/src/modules/matches/match-session.ts#L275), [match.effects.ts:401-404](../frontend/src/app/store/match/match.effects.ts#L401-L404), [auth.guard.ts:13](../frontend/src/app/core/auth/auth.guard.ts#L13) | Server propušta samo odgovore na trenutno pitanje od igrača koji još smeju da odgovore. Frontend odbacuje zakasnele događaje prethodnog meča. Guard čeka da auth status prestane da bude `unknown`. |
| `forEach` | [sound.service.ts:59-63](../frontend/src/app/core/sound/sound.service.ts#L59-L63), backend [matches.service.ts:149-151](../backend/src/modules/matches/matches.service.ts#L149-L151) | Svaku notu melodije zakaže sa malim razmakom (level-up džingl). Posle rematch-a pošalje pozivnicu svakom drugom igraču. |
| fetch API | [sprite-manifest.service.ts:41](../frontend/src/app/core/sprites/sprite-manifest.service.ts#L41), [app.config.ts:47](../frontend/src/app/app.config.ts#L47) | Manifest sprajtova je statičan fajl, pa se čita direktno sa `fetch` i ne prolazi kroz auth interceptor. `HttpClient` je podešen sa `withFetch()`. |
| Promise | [sprite-manifest.service.ts:9-16](../frontend/src/app/core/sprites/sprite-manifest.service.ts#L9-L16), [sprite-manifest.service.ts:54](../frontend/src/app/core/sprites/sprite-manifest.service.ts#L54), [auth-bootstrap.service.ts:18-30](../frontend/src/app/core/auth/auth-bootstrap.service.ts#L18-L30), backend [path-generation.service.ts:77-84](../backend/src/modules/learning-paths/path-generation.service.ts#L77-L84) | `new Promise` čeka da se slika učita, `Promise.all` učitava sve sprajtove odjednom. `restore()` vraća Promise koji Angular čeka pre prvog rutiranja ([app.config.ts:75](../frontend/src/app/app.config.ts#L75)). Backend paralelno piše 5 koraka putanje. |
| `switchMap` | [register-page.component.ts:112-119](../frontend/src/app/features/auth/register-page.component.ts#L112-L119), [friends.effects.ts:41-48](../frontend/src/app/store/friends/friends.effects.ts#L41-L48), [match-clock.service.ts:64-72](../frontend/src/app/features/play/match-clock.service.ts#L64-L72), backend [match-session.ts:97-99](../backend/src/modules/matches/match-session.ts#L97-L99) | Nova vrednost otkazuje prethodni posao: staru proveru imena, staru pretragu, stari tajmer, stari rok runde (posle EXTRA_TIME). |
| `take` | [auth.guard.ts:14](../frontend/src/app/core/auth/auth.guard.ts#L14), [match-clock.service.ts:87](../frontend/src/app/features/play/match-clock.service.ts#L87), backend [match-session.ts:278](../backend/src/modules/matches/match-session.ts#L278) | Guard uzme prvi poznat status i završi. Tajmer zna koliko tikova ima do roka. Runda se završi kad stigne onoliko odgovora koliko ima igrača. |
| `takeUntil` | backend [match-session.ts:279](../backend/src/modules/matches/match-session.ts#L279), [match-session.ts:737-739](../backend/src/modules/matches/match-session.ts#L737-L739), [match-clock.service.ts:89](../frontend/src/app/features/play/match-clock.service.ts#L89), [match.effects.ts:144](../frontend/src/app/store/match/match.effects.ts#L144) | Runda staje kad istekne rok. Svi tajmeri meča staju kad se sesija uništi. Traka tajmera staje kad igrač odgovori. Socket događaji prestaju da ulaze u store kad se napusti stranica meča. |
| `zip` | [match-clock.service.ts:79-81](../frontend/src/app/features/play/match-clock.service.ts#L79-L81), [mistake-list.component.ts:23-34](../frontend/src/app/features/play/components/mistake-list.component.ts#L23-L34) | Upari svaku labelu `3, 2, 1, GO!` sa tikom tajmera, pa izlaze jedna po jedna na 750 ms. Isto za redove "pogrešnih" pitanja na rezultatima. |
| `merge` | [realtime.effects.ts:50-61](../frontend/src/app/store/realtime/realtime.effects.ts#L50-L61), [match.effects.ts:286-292](../frontend/src/app/store/match/match.effects.ts#L286-L292), [match-clock.service.ts:89](../frontend/src/app/features/play/match-clock.service.ts#L89) | Više socket tokova spaja u jedan tok akcija (jedan efekat umesto deset). Tajmer staje na prvi od dva događaja (odgovor ili kraj runde). |

### Angular

| Zahtev | Gde | Zašto baš tu |
| --- | --- | --- |
| Komponente i servisi | [answer-grid.component.ts:32-40](../frontend/src/app/features/play/components/answer-grid.component.ts#L32-L40), [match-page.component.ts:72-111](../frontend/src/app/features/play/match-page.component.ts#L72-L111), [quizzes-api.service.ts:15-18](../frontend/src/app/core/api/quizzes-api.service.ts#L15-L18), [token-storage.service.ts:6-7](../frontend/src/app/core/auth/token-storage.service.ts#L6-L7) | Prezentaciona komponenta (AnswerGrid) samo crta i javlja klik. Stranica (MatchPage) čita store i šalje akcije. Servis drži ono što nije prikaz: HTTP pozive, tokene. |
| Ulazni i izlazni parametri | [answer-grid.component.ts:41-57](../frontend/src/app/features/play/components/answer-grid.component.ts#L41-L57), [match-page.component.html:161-174](../frontend/src/app/features/play/match-page.component.html#L161-L174), [quiz-card.component.ts:42-46](../frontend/src/app/shared/components/quiz-card.component.ts#L42-L46), [library-page.component.html:51](../frontend/src/app/features/library/library-page.component.html#L51) | `input()` donosi podatke od roditelja, `output()` šalje događaj nazad. AnswerGrid ne zna ništa o socketima, samo emituje indeks kliknutog odgovora. |
| Dependency injection | [match-page.component.ts:101-107](../frontend/src/app/features/play/match-page.component.ts#L101-L107), [match-page.component.ts:114-121](../frontend/src/app/features/play/match-page.component.ts#L114-L121), [token-refresh.service.ts:11-15](../frontend/src/app/core/auth/token-refresh.service.ts#L11-L15) | `inject()` uzima zavisnost. `providers` na komponenti pravi novi `MatchClockService` za svaku stranicu meča, pa tajmeri nestaju sa stranicom. `providedIn: 'root'` je jedan primerak za celu aplikaciju. |
| NgRx store | [app.config.ts:48-59](../frontend/src/app/app.config.ts#L48-L59), [auth.reducer.ts:28-106](../frontend/src/app/store/auth/auth.reducer.ts#L28-L106), [path-page.component.ts:62](../frontend/src/app/features/paths/path-page.component.ts#L62) | Globalno stanje (korisnik, kvizovi, meč, prijatelji) na jednom mestu. Slice se pravi sa `createFeature`, a komponenta ga čita kao signal (`selectSignal`). |
| NgRx entity | [quizzes.reducer.ts:23-26](../frontend/src/app/store/quizzes/quizzes.reducer.ts#L23-L26), [quizzes.reducer.ts:139-147](../frontend/src/app/store/quizzes/quizzes.reducer.ts#L139-L147), [friends.reducer.ts:23-24](../frontend/src/app/store/friends/friends.reducer.ts#L23-L24), [friends.reducer.ts:104](../frontend/src/app/store/friends/friends.reducer.ts#L104), [shop.reducer.ts:22-24](../frontend/src/app/store/shop/shop.reducer.ts#L22-L24), kovčezi [chests.reducer.ts:19-22](../frontend/src/app/store/chests/chests.reducer.ts#L19-L22), [chests.reducer.ts:59](../frontend/src/app/store/chests/chests.reducer.ts#L59), [chests.reducer.ts:79](../frontend/src/app/store/chests/chests.reducer.ts#L79), [chests.reducer.ts:66-69](../frontend/src/app/store/chests/chests.reducer.ts#L66-L69) | Liste koje se menjaju element po element: obrisan kviz (`removeOne`), promenjen online status prijatelja (`updateOne`), kupljen predmet. Prijatelji imaju `selectId`, jer im je ključ `friendshipId`. Neotvoreni kovčezi su najbolji primer: `chest:earned` doda jedan (`addOne`), otvaranje ga skine (`removeOne`), a `selectTotal` daje broj na ikonici u gornjoj traci bez ručnog brojanja. |
| NgRx effects | [quizzes.effects.ts:44-54](../frontend/src/app/store/quizzes/quizzes.effects.ts#L44-L54), [match.effects.ts:139-147](../frontend/src/app/store/match/match.effects.ts#L139-L147), [realtime.effects.ts:18-62](../frontend/src/app/store/realtime/realtime.effects.ts#L18-L62) | Sve što izlazi napolje (HTTP, socket, navigacija, toast) je u efektima, pa reducer ostaje čista funkcija. Registracija: [app.config.ts:60-73](../frontend/src/app/app.config.ts#L60-L73). |
| Rutiranje | [app.routes.ts:29-33](../frontend/src/app/app.routes.ts#L29-L33), [app.routes.ts:53-67](../frontend/src/app/app.routes.ts#L53-L67), [app.config.ts:45](../frontend/src/app/app.config.ts#L45), [match-page.component.ts:112](../frontend/src/app/features/play/match-page.component.ts#L112) | Lazy `loadComponent`, guardovi (`authGuard`, `heroGuard`, `guestGuard`), child rute ispod shell-a, `canDeactivate` pita pre izlaska iz meča. Zbog `withComponentInputBinding()` parametar `:matchId` stiže kao `input`. |

### NestJS, Docker, baza

| Zahtev | Gde | Zašto baš tu |
| --- | --- | --- |
| Povezivanje na bazu | [prisma.service.ts:6-21](../backend/src/prisma/prisma.service.ts#L6-L21), [prisma.module.ts:4-9](../backend/src/prisma/prisma.module.ts#L4-L9), [prisma.config.ts:10-12](../backend/prisma.config.ts#L10-L12) | `PrismaService` nasleđuje `PrismaClient` sa Postgres adapterom, a URL čita iz `ConfigService`. Modul je `@Global`, pa svaki servis može da ga injektuje. `prisma.config.ts` daje isti `DATABASE_URL` Prisma CLI-ju (migracije, seed). |
| Baza kroz Docker | [docker-compose.yml:2-18](../docker-compose.yml#L2-L18), [docker-compose.yml:33](../docker-compose.yml#L33), [docker-compose.yml:46-48](../docker-compose.yml#L46-L48), [Dockerfile.dev:15](../backend/Dockerfile.dev#L15) | Postgres kontejner sa healthcheck-om; backend čeka zdravu bazu; migracije i seed se rade pri startu. U Docker mreži host baze je `db`, ne `localhost`. |
| CRUD operacije | [quizzes.controller.ts:36-103](../backend/src/modules/quizzes/quizzes.controller.ts#L36-L103), [quizzes.service.ts:74-140](../backend/src/modules/quizzes/quizzes.service.ts#L74-L140) | Kviz i pitanja: POST (create), GET (read), PATCH/PUT (update), DELETE. Kviz se briše "meko" (`deletedAt`), da istorija mečeva ostane. Prijatelji imaju zahtev, listu, prihvatanje i brisanje; dokumenti i putanje imaju create, read i delete. |
| Min. tri entiteta sa relacijama | [schema.prisma:105-137](../backend/prisma/schema.prisma#L105-L137) User, [schema.prisma:170-195](../backend/prisma/schema.prisma#L170-L195) Quiz, [schema.prisma:197-215](../backend/prisma/schema.prisma#L197-L215) Question, [schema.prisma:234-251](../backend/prisma/schema.prisma#L234-L251) PathStep, [schema.prisma:277-298](../backend/prisma/schema.prisma#L277-L298) MatchPlayer | 1:N User→Quiz i Quiz→Question; 1:1 PathStep↔Quiz (`quizId @unique`); M:N User↔Match preko MatchPlayer (spojna tabela sa podacima: score, answers, nagrade); M:N User↔User preko Friendship. |
| Passport.js | [local.strategy.ts:9-21](../backend/src/modules/auth/strategies/local.strategy.ts#L9-L21), [jwt.strategy.ts:8-22](../backend/src/modules/auth/strategies/jwt.strategy.ts#L8-L22), [jwt-refresh.strategy.ts:10-30](../backend/src/modules/auth/strategies/jwt-refresh.strategy.ts#L10-L30), [local-auth.guard.ts:4-5](../backend/src/modules/auth/guards/local-auth.guard.ts#L4-L5) | Tri strategije: email + lozinka (bcrypt), access JWT i refresh JWT. Guardovi samo nasleđuju `AuthGuard('ime')` i stavljaju se na rute, npr. [auth.controller.ts:46](../backend/src/modules/auth/auth.controller.ts#L46). |

Dodatno, ako pita: globalna validacija [main.ts:23-25](../backend/src/main.ts#L23-L25), Swagger
[main.ts:35-44](../backend/src/main.ts#L35-L44), WebSocket gateway
[match.gateway.ts:36-42](../backend/src/modules/matches/match.gateway.ts#L36-L42), factory provider
[payments.module.ts:30](../backend/src/modules/payments/payments.module.ts#L30) i
[auth.module.ts:29-40](../backend/src/modules/auth/auth.module.ts#L29-L40).

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
   ([auth.service.ts:56-62](../backend/src/modules/auth/auth.service.ts#L56-L62)). Šta `validate`
   vrati, Passport stavi u `request.user`, a dekorator `@CurrentUserId()` odatle čita id
   ([current-user-id.decorator.ts:5-8](../backend/src/modules/auth/decorators/current-user-id.decorator.ts#L5-L8)).
4. Ako korisnik ima 2FA, dobija privremeni `twoFactorToken` umesto sesije
   ([auth.service.ts:64-70](../backend/src/modules/auth/auth.service.ts#L64-L70)). Inače se pravi
   sesija ([auth.service.ts:111-118](../backend/src/modules/auth/auth.service.ts#L111-L118)):

```ts
  private async createSession(userId: string): Promise<AuthResponse> {
    const accessToken = await this.signAccessToken(userId);
    const refreshToken = await this.signRefreshToken(userId);
    // One refresh token per user: logging in on another device ends the previous session.
    await this.users.setRefreshTokenHash(userId, sha256(refreshToken));
    const user = await this.users.findCurrentUser(userId);
    return { user, accessToken, refreshToken };
  }
```

   Access token: `{ sub, type: 'access' }`, traje 15 minuta. Refresh token:
   `{ sub, type: 'refresh', jti }`, drugi secret, traje 7 dana
   ([auth.service.ts:120-131](../backend/src/modules/auth/auth.service.ts#L120-L131)). U bazi se
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
   ([auth.service.ts:80-85](../backend/src/modules/auth/auth.service.ts#L80-L85),
   [auth.service.ts:151-155](../backend/src/modules/auth/auth.service.ts#L151-L155)). Refresh pravi
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
([token-refresh.service.ts:21-29](../frontend/src/app/core/auth/token-refresh.service.ts#L21-L29)):

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
koristi se taj ([token-refresh.service.ts:48-61](../frontend/src/app/core/auth/token-refresh.service.ts#L48-L61)).
Ako je server odbio refresh token (401), tokeni se brišu i šalje se `AuthActions.sessionExpired`
→ `/login`; meta-reducer `clearOnSignOut` tada vrati ceo store na početno stanje
([clear-on-sign-out.ts](../frontend/src/app/store/clear-on-sign-out.ts)), pa sledeći igrač na
istom tabu ne vidi tuđe podatke. Pad mreže ili greška servera ne briše tokene, pa sledeći zahtev
pokuša ponovo. Socketi rade isto: na
grešku `unauthorized` obnove token i ponovo se povežu
([authorized-socket.ts:18-30](../frontend/src/app/core/realtime/authorized-socket.ts#L18-L30)).

### c) Jedna runda meča na serveru (take, takeUntil, takeWhile, rok sa switchMap)

Server je jedini sudija. Svaki meč ima svoj `MatchSession` objekat u memoriji. Odgovori stižu
preko `Subject`-a, a rok runde je `BehaviorSubject`
([match-session.ts:93-99](../backend/src/modules/matches/match-session.ts#L93-L99)):

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
([match-session.ts:468-473](../backend/src/modules/matches/match-session.ts#L468-L473)).

Gateway primi `match:answer` i preda ga sesiji
([match.gateway.ts:131-135](../backend/src/modules/matches/match.gateway.ts#L131-L135)). Sesija
sama izračuna koliko je vremena ostalo, ne veruje klijentu
([match-session.ts:147-157](../backend/src/modules/matches/match-session.ts#L147-L157)):

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
([match-session.ts:257-269](../backend/src/modules/matches/match-session.ts#L257-L269)):

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

Srce runde ([match-session.ts:271-282](../backend/src/modules/matches/match-session.ts#L271-L282)):

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
- `tap` zabeleži odgovor i javi sobi `match:answered` (drugi vide oznaku "Answered" na tom igraču).
- `takeWhile(..., true)` važi samo za PARTY: prvi tačan odgovor završava rundu, a `true` znači da i
  taj odgovor ulazi u rezultat.
- `take(n)`: kad stigne onoliko odgovora koliko ima igrača, runda je gotova odmah.
- `takeUntil(deadline$)`: ako vreme istekne pre toga, runda se završi sa onim što je stiglo.
- `toArray()` skupi sve odgovore u niz i emituje ga tek kad se tok završi (bilo kojim od tri
  razloga gore). Tada se zove `endRound`.

`endRound` boduje (100 + bonus za brzinu do 50,
[scoring.ts:23-29](../backend/src/modules/matches/scoring.ts#L23-L29)), pošalje svakom igraču
`match:round-result` i čeka da svi pritisnu Next, istim RxJS oblikom: `filter`, `tap`, `take`,
`takeUntil(timer(...))`, `toArray`
([match-session.ts:397-407](../backend/src/modules/matches/match-session.ts#L397-L407)). Drugi
klik istog igrača ne broji se dvaput: `markReady` ga izbaci iz `waitingForNext`, pa ga `filter`
sledeći put odbaci. Posle
poslednjeg pitanja `finish` u jednoj transakciji snimi rezultate, nagrade, Mistakes notebook i
korak putanje ([match-results.service.ts:79-102](../backend/src/modules/matches/match-results.service.ts#L79-L102)).
Odložene akcije sesije idu kroz `after()` sa `takeUntil(this.destroy$)`
([match-session.ts:737-739](../backend/src/modules/matches/match-session.ts#L737-L739)), a
pretplate na odgovore i na Next takođe imaju `takeUntil(this.destroy$)`, pa `stop()` gasi sve
odjednom
([match-session.ts:252-255](../backend/src/modules/matches/match-session.ts#L252-L255)).

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
      matchInvite$,
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
   ([match-page.component.ts:290-309](../frontend/src/app/features/play/match-page.component.ts#L290-L309)).
   `switchMap` za novi meč otkaže tokove starog, `takeUntil(left)` ih gasi pri izlasku. Unutra,
   `forMatch(matchId)` filtrira događaje drugog meča
   ([match.effects.ts:401-404](../frontend/src/app/store/match/match.effects.ts#L401-L404)), a
   `merge` spaja grupe događaja ([match.effects.ts:286-292](../frontend/src/app/store/match/match.effects.ts#L286-L292)).
   Server šalje "koliko je ostalo", a frontend od toga izračuna rok po svom satu
   ([match.effects.ts:406-409](../frontend/src/app/store/match/match.effects.ts#L406-L409)).

### e) Odbrojavanje sa zip i tajmer sa takeUntil (frontend)

Sve je u `MatchClockService`, koji je provider stranice meča, pa živi koliko i stranica
([match-clock.service.ts:79-91](../frontend/src/app/features/play/match-clock.service.ts#L79-L91)):

```ts
  private countdownLabels(): Observable<string> {
    return zip(from(COUNTDOWN_LABELS), timer(0, COUNTDOWN_STEP_MS)).pipe(map(([label]) => label));
  }

  // The bar freezes when the player locks in an answer, which shows how fast they were.
  private timeLeftUntil(deadlineAt: number): Observable<number> {
    const ticks = Math.ceil(msUntil(deadlineAt) / TIMER_TICK_MS);
    return timer(0, TIMER_TICK_MS).pipe(
      take(ticks + 1),
      map(() => msUntil(deadlineAt)),
      takeUntil(merge(this.answered$, this.roundEnded$)),
    );
  }
```

- **zip**: `from(COUNTDOWN_LABELS)` bi odmah izbacio sve četiri labele `['3', '2', '1', 'GO!']`
  ([play.constants.ts:8-10](../frontend/src/app/features/play/play.constants.ts#L8-L10)), a
  `timer(0, 750)` kuca na 750 ms. `zip` čeka po jednu vrednost iz oba toka i pravi par, pa
  labele izlaze tempom tajmera:
  `3` (0 ms), `2` (750), `1` (1500), `GO!` (2250). Kad se `from` isprazni, `zip` se završi i
  tajmer staje sam. Ukupno 3 s, isto koliko server čeka pre prvog pitanja.
- **take**: unapred se zna koliko tikova od 250 ms ima do roka, pa se tok sam završi na nuli.
- **takeUntil(merge(...))**: traka se zamrzne čim igrač odgovori (`MatchActions.answer`, osim u
  partiji, gde ostali i dalje jure) ili stigne kraj runde ([match-clock.service.ts:43-49](../frontend/src/app/features/play/match-clock.service.ts#L43-L49)).
- **switchMap** ([match-clock.service.ts:64-72](../frontend/src/app/features/play/match-clock.service.ts#L64-L72)):
  novi rok (sledeće pitanje ili EXTRA_TIME) otkaže stari tajmer.
- `toSignal` pretvara rezultat u signal koji čita šablon (zoneless).

### f) Generisanje putanje: Promise.all i transakcija

`POST /paths` → `PathGenerationService.createPath`
([path-generation.service.ts:36-47](../backend/src/modules/learning-paths/path-generation.service.ts#L36-L47)).
Sve ide kroz `runWithLimits`: jedno generisanje po korisniku u isto vreme i 15 AI kvizova dnevno
([generation-limits.service.ts:13-24](../backend/src/modules/quizzes/generation-limits.service.ts#L13-L24)).
Plan od 5 koraka je u [learning-paths.constants.ts:4-40](../backend/src/modules/learning-paths/learning-paths.constants.ts#L4-L40).

Korak 1: svih 5 koraka piše AI **paralelno**
([path-generation.service.ts:77-84](../backend/src/modules/learning-paths/path-generation.service.ts#L77-L84)):

```ts
    return Promise.all(
      requests.map(async (request) => {
        const step = await this.writeStepWithRetry(request, context);
        done += 1;
        this.reportProgress(userId, done);
        return { ...step, title: specificStepTitle(step.title, request.label, subject) };
      }),
    );
```

- `map` od 5 zahteva napravi 5 Promise-a, `Promise.all` čeka sve i vraća niz u **istom redosledu**.
- Posle svakog gotovog koraka šalje se `quiz:progress { step: 'writing', done, total: 5 }`, pa ekran pokazuje
  "Step 3 of 5 ready".
- Korak sa premalo dobrih pitanja (`WeakQuizException`) AI napiše još jednom
  ([path-generation.service.ts:87-100](../backend/src/modules/learning-paths/path-generation.service.ts#L87-L100)).
  Ako padne i drugi put, ili padne iz drugog razloga, `Promise.all` odmah odbije i ništa se ne snima.

Korak 2: tek kad su svi gotovi, sve se snima u **jednoj transakciji**
([path-generation.service.ts:108-122](../backend/src/modules/learning-paths/path-generation.service.ts#L108-L122)):

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
([quizzes.service.ts:142-149](../backend/src/modules/quizzes/quizzes.service.ts#L142-L149)). Ako
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
([payments.service.ts:24-28](../backend/src/modules/payments/payments.service.ts#L24-L28)).
Samo `sk_test_` ključ uključuje Stripe; live ključ se namerno ignoriše.

Tok kupovine:

1. Frontend: "Buy" na paketu otvara grown-up pitanje (množenje); tek tačan odgovor šalje checkout
   ([grown-up-gate.component.ts:33-43](../frontend/src/app/features/shop/components/grown-up-gate.component.ts#L33-L43)).
2. `POST /payments/checkout`: zatvori stare otvorene kupovine, u transakciji sa zaključanim redom
   korisnika proveri mesečni limit i napravi PENDING kupovinu, pa traži checkout link od
   providera ([payments.service.ts:47-62](../backend/src/modules/payments/payments.service.ts#L47-L62)).
3. Demo vraća link na našu stranicu `/shop/checkout/:id`
   ([demo-payment.provider.ts:7-9](../backend/src/modules/payments/providers/demo-payment.provider.ts#L7-L9));
   Stripe pravi Checkout Session i vraća svoj URL
   ([stripe-payment.provider.ts:17-40](../backend/src/modules/payments/providers/stripe-payment.provider.ts#L17-L40)).
   Frontend za Stripe radi `window.location.assign`, a za demo router navigaciju
   ([payments.effects.ts:109-116](../frontend/src/app/store/shop/payments.effects.ts#L109-L116)).
4. `POST /payments/:id/confirm` pita providera da li je plaćeno
   ([payments.service.ts:64-79](../backend/src/modules/payments/payments.service.ts#L64-L79)) i
   isplati novčiće u `payOut`
   ([payments.service.ts:119-139](../backend/src/modules/payments/payments.service.ts#L119-L139)):

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
   ([chests.reducer.ts:45-52](../frontend/src/app/store/chests/chests.reducer.ts#L45-L52)).
2. Efekat `open$` koristi `exhaustMap`: dok prvi zahtev traje, drugi klik se ignoriše
   ([chests.effects.ts:54-64](../frontend/src/app/store/chests/chests.effects.ts#L54-L64)).
   Zahtev je `POST /chests/:id/open`
   ([chests-api.service.ts:20-22](../frontend/src/app/core/api/chests-api.service.ts#L20-L22)).
3. Kontroler: `ParseUUIDPipe` proverava id, a `@CurrentUserId()` daje korisnika iz JWT-a
   ([chests.controller.ts:34-41](../backend/src/modules/chests/chests.controller.ts#L34-L41)).
4. Servis ([chests.service.ts:47-72](../backend/src/modules/chests/chests.service.ts#L47-L72)):

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
     ([chests.service.ts:135-141](../backend/src/modules/chests/chests.service.ts#L135-L141)).
     Već otvoren kovčeg odmah daje 409.
   - `rollReward` učita predmete i šta igrač već ima, `buildItemPools` od predmeta napravi dva
     skupa, pa pozove čistu funkciju `rollChest(..., Math.random)`
     ([chests.service.ts:93-100](../backend/src/modules/chests/chests.service.ts#L93-L100)).
     Izvlačenje samo čita, zato je pre transakcije, koja ostaje kratka.
   - **Idempotentnost**: `updateMany` sa `openedAt: null` u `where` je provera i upis u jednom
     SQL upitu. Ako dva zahteva stignu u isto vreme, baza pusti samo jedan da promeni red; drugi
     dobije `count === 0`, baci 409 i transakcija se vrati, pa se ništa ne isplati dvaput.
     `update` po id-ju to ne bi sprečio, jer ne gleda da li je kovčeg već otvoren.
   - `payReward` u istoj transakciji doda pojačanja (`upsert` sa `increment`), novi predmet
     (`userItem.create`, osim za duplikat) i novčiće
     ([chests.service.ts:102-123](../backend/src/modules/chests/chests.service.ts#L102-L123)).
     Ili prođe sve (kovčeg otvoren i nagrada isplaćena), ili ništa.
   - Posle commit-a, ako je nagrada donela novčiće (i duplikat ih donosi), ide `coins:updated`,
     isto kao kod plaćanja.
5. Skupovi predmeta ([chests.rules.ts:60-67](../backend/src/modules/chests/chests.rules.ts#L60-L67)):
   "običan predmet" (`BASIC`) je svaki heroj, ljubimac **ili sabotaža** iz prodavnice koji nije
   početni ni samo-iz-kovčega i košta najviše 150 (`BASIC_ITEM_MAX_PRICE`), pa su u njemu svih
   šest sabotaža; `CHEST_ONLY` su heroji i ljubimci koji postoje samo u kovčezima. Izvlačenje je
   čista funkcija `rollChest`
   ([chests.rules.ts:69-89](../backend/src/modules/chests/chests.rules.ts#L69-L89)): prvo izbaci
   red za predmet ako je njegov skup prazan, pa bira red iz tabele po težini
   ([chests.rules.ts:122-132](../backend/src/modules/chests/chests.rules.ts#L122-L132)):

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
   27, pa ispada pojačanje. 0.98 daje 98, posle oduzimanja 70 i 27 ostaje 1, pa ispada običan
   predmet (heroj, ljubimac ili sabotaža).
   Predmet koji igrač već ima postaje novčići (njegova cena, ili 150 za predmet koji postoji samo
   u kovčezima)
   ([chests.rules.ts:164-167](../backend/src/modules/chests/chests.rules.ts#L164-L167),
   [chests.rules.ts:158-162](../backend/src/modules/chests/chests.rules.ts#L158-L162)).
6. **Ubačena random funkcija zbog testova.** `rollChest` ne zove `Math.random` sam, nego ga dobija
   kao parametar tipa `RandomFn`
   ([chests.rules.ts:25-26](../backend/src/modules/chests/chests.rules.ts#L25-L26)). Servis
   prosledi `Math.random`, a test funkciju koja vraća zadate brojeve redom
   ([chests.rules.spec.ts:19-28](../backend/src/modules/chests/chests.rules.spec.ts#L19-L28)),
   pa je rezultat uvek isti
   ([chests.rules.spec.ts:52-56](../backend/src/modules/chests/chests.rules.spec.ts#L52-L56)):

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
   ([chests.reducer.ts:73-84](../frontend/src/app/store/chests/chests.reducer.ts#L73-L84)), a
   `auth` reducer upiše nove novčiće i, ako je ispala sabotaža, doda je u `user.sabotages`
   ([auth.reducer.ts:96-100](../frontend/src/app/store/auth/auth.reducer.ts#L96-L100)). Dijalog
   pusti animaciju (trese se, poklopac se otvara, nagrada iskoči; za sabotažu "New sabotage:
   Fog!" sa ikonicom). Dok nagrada ne iskoči do kraja, dijalog ne može da se zatvori: nema X ni
   Done, a Escape i klik pored dijaloga ne rade
   ([chest-opening.component.ts:53-62](../frontend/src/app/features/chests/components/chest-opening.component.ts#L53-L62)),
   pa igrač uvek vidi šta je dobio. Signal `canClose` ide u `[dismissible]` dijaloga
   ([chest-opening.component.html:1](../frontend/src/app/features/chests/components/chest-opening.component.html#L1)),
   a `ModalComponent` bez toga ne zatvara ni na Escape ni na klik pored
   ([modal.component.ts:73-87](../frontend/src/app/shared/components/modal.component.ts#L73-L87)).
   Ako zahtev padne (npr. 409 jer je drugi tab bio brži), `openFailed` zatvori dijalog
   ([chests.reducer.ts:54](../frontend/src/app/store/chests/chests.reducer.ts#L54)), a efekat
   pokaže grešku i ponovo učita listu.

### i) Sabotaža: kupovina u prodavnici i provera vlasništva u meču

1. Prodavnica, tab "Sabotages": prvo ide INK kao "Free for everyone". Njega server ne prodaje,
   pa ga frontend sam napravi kao predmet koji svi već imaju (`FREE_INK`,
   [shop.constants.ts:25-38](../frontend/src/app/features/shop/shop.constants.ts#L25-L38)) i
   stavi ispred šest sabotaža sa servera
   ([shop-page.component.ts:83-84](../frontend/src/app/features/shop/shop-page.component.ts#L83-L84)).
   Kupovina ide istim putem kao za heroje: dijalog za potvrdu, pa `POST /shop/items/:id/buy`
   ([shop.controller.ts:32-35](../backend/src/modules/shop/shop.controller.ts#L32-L35)).
2. Server, `buyItem` ([shop.service.ts:26-37](../backend/src/modules/shop/shop.service.ts#L26-L37)):
   `assertCanBuy` odbije početni predmet, predmet samo iz kovčega, već kupljen predmet i premali
   nivo ([shop.service.ts:160-173](../backend/src/modules/shop/shop.service.ts#L160-L173)), pa u
   jednoj transakciji `spendCoins` skine novčiće uslovnim `updateMany` (`coins: { gte: price }`)
   i napravi `UserItem` red. Sabotaža se kupuje jednom i ostaje zauvek, ne troši se. Ako dva
   klika stignu istovremeno, `@@unique([userId, itemId])`
   ([schema.prisma:341](../backend/prisma/schema.prisma#L341)) pusti samo jedan red, a drugi
   zahtev dobije 409 i njegova transakcija vrati novčiće. Sabotaža se ne "oblači": equip vraća
   400 ([shop.service.ts:41-43](../backend/src/modules/shop/shop.service.ts#L41-L43)).
3. Koje sabotaže igrač ima računa jedna mala čista funkcija
   ([sabotage-items.ts:14-24](../backend/src/modules/shop/sabotage-items.ts#L14-L24)):

```ts
export function sabotageItemId(type: SabotageType): string {
  return SABOTAGE_ITEM_PREFIX + type.toLowerCase();
}

/** The free sabotages plus the ones bought in the shop or found in a chest. */
export function ownedSabotages(items: { itemId: string }[]): SabotageType[] {
  const ownedItemIds = items.map((item) => item.itemId);
  return SABOTAGE_TYPES.filter(
    (type) => FREE_SABOTAGES.includes(type) || ownedItemIds.includes(sabotageItemId(type)),
  );
}
```

   Id predmeta je `sabotage-` + tip malim slovima (`sabotage-fog` je FOG), a `FREE_SABOTAGES`
   je `['INK']` ([matches.constants.ts:58-59](../backend/src/modules/matches/matches.constants.ts#L58-L59)).
   `CurrentUser.sabotages` se pravi ovom funkcijom
   ([user.mapper.ts:61](../backend/src/modules/users/user.mapper.ts#L61)), pa frontend zna koja
   dugmad da pokaže. Posle kupovine `auth` reducer odmah doda novu sabotažu korisniku
   ([auth.reducer.ts:92-95](../frontend/src/app/store/auth/auth.reducer.ts#L92-L95)).
4. Meč: vlasništvo se čita **jednom**, kad sesija nastaje. `SESSION_SETUP_INCLUDE` uz meč
   učita i sabotaže svakog igrača
   ([match.mapper.ts:53-59](../backend/src/modules/matches/match.mapper.ts#L53-L59)),
   `toSessionSetup` ih pretvori u listu tipova
   ([match.mapper.ts:177-180](../backend/src/modules/matches/match.mapper.ts#L177-L180)), a
   `newPlayer` ih sačuva u igraču sesije
   ([session-player.ts:33-53](../backend/src/modules/matches/session-player.ts#L33-L53)). Zato
   runda ostaje sinhrona: nema čekanja na bazu usred pitanja.
5. Kad stigne `match:sabotage`, `sabotageAttempt` upiše `owned`
   ([match-session.ts:502](../backend/src/modules/matches/match-session.ts#L502)), a čista
   funkcija `sabotageError` to proveri odmah posle moda, **pre** naboja
   ([party-rules.ts:27-44](../backend/src/modules/matches/party-rules.ts#L27-L44)):

```ts
export function sabotageError(attempt: SabotageAttempt): string | null {
  if (attempt.mode !== 'PARTY') {
    return 'Sabotage is only for party matches.';
  }
  if (!attempt.owned) {
    return "You don't own this sabotage yet. You can get it in the shop.";
  }
```

   Greška ide igraču kao `match:error`, a naboj se ne troši, jer `sabotage()` skida naboj tek
   kad provera prođe ([match-session.ts:185-203](../backend/src/modules/matches/match-session.ts#L185-L203)).
   Test: [match-session.spec.ts:763-773](../backend/src/modules/matches/match-session.spec.ts#L763-L773).
6. Frontend u partiji pokazuje samo ono što igrač ima: `ownedAttacks` izbaci napade koje nema
   ([party-round.rules.ts:101-103](../frontend/src/app/features/play/party-round.rules.ts#L101-L103)), dugme za
   štit postoji samo ako ga ima, a dok mu nešto fali piše "More sabotages in the shop", samo
   tekst bez linka, jer izlazak iz meča znači predaju
   ([sabotage-bar.component.ts:31-33](../frontend/src/app/features/play/components/sabotage-bar.component.ts#L31-L33)).
   To je udobnost; pravo pravilo je na serveru (korak 5).

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
   sada piše `export const XP_PER_CORRECT = 10;`, promeni npr. u `export const XP_PER_CORRECT = 15;`
2. Koristi se u `answerReward`
   ([progression.rules.ts:115-121](../backend/src/modules/progression/progression.rules.ts#L115-L121));
   HARD kvizovi množe sa 1.5.
3. Testovi očekuju stare brojeve
   ([progression.rules.spec.ts:147](../backend/src/modules/progression/progression.rules.spec.ts#L147)
   i dalje): `docker compose exec backend npx jest progression`, pa ispravi očekivane vrednosti.

Frontend ne treba menjati: XP stiže sa servera u rezultatu meča. Slično: novčići po tačnom
(`COINS_PER_CORRECT`, linija 6), bonus za pobedu tima (`TEAM_WIN_BONUS`, linija 11), za pobedu
i nerešeno u partiji (`PARTY_WIN_BONUS` i `PARTY_DRAW_BONUS`, linije 12-13), dnevni limit
novčića (`DAILY_MATCH_COIN_CAP`, linija 20).

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
   ([create-page.component.ts:243-256](../frontend/src/app/features/create/create-page.component.ts#L243-L256)).

### 3. Dodaj novi endpoint u Nest (npr. broj mojih kvizova)

1. Servis ([quizzes.service.ts](../backend/src/modules/quizzes/quizzes.service.ts), npr. posle
   `findFeatured`, linija 67):

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
   ([quizzes.service.ts:91-95](../backend/src/modules/quizzes/quizzes.service.ts#L91-L95)):
   `this.notifications.emitToUser(userId, 'quiz:deleted', { quizId });`
   (`emitToUser` šalje u sobu `user:<id>`, [notifications.service.ts:11-17](../backend/src/modules/realtime/notifications.service.ts#L11-L17)).

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
[matches.types.ts:243-261](../backend/src/modules/matches/matches.types.ts#L243-L261) →
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
   [write-path.prompt.ts:15](../backend/src/modules/ai/prompts/write-path.prompt.ts#L15)). Ako AI
   vrati neispravna pitanja, ona se odbacuju: najviše 2 smeju da otpadnu i nikad ne sme ostati
   manje od 3, inače zahtev vraća 503
   ([ai.constants.ts:7-8](../backend/src/modules/ai/ai.constants.ts#L7-L8),
   [ai.rules.ts:14-18](../backend/src/modules/ai/ai.rules.ts#L14-L18)).
3. Frontend ne treba menjati: broj pitanja stiže kao `questionCount` u `StepView`.

Važi samo za nove putanje. Isto mesto: težina koraka (`difficulty`), nagrade
([learning-paths.constants.ts:55-61](../backend/src/modules/learning-paths/learning-paths.constants.ts#L55-L61)),
vreme po pitanju na putanji (linije 48-52).

### 8. Dodaj novo pojačanje (npr. `REMOVE_ONE`, uklanja jedan pogrešan odgovor)

Backend:

1. Enum `BoostType` ([schema.prisma:77-83](../backend/prisma/schema.prisma#L77-L83)) dodaj
   `REMOVE_ONE`, pa migracija i restart.
2. [matches.constants.ts:33-38](../backend/src/modules/matches/matches.constants.ts#L33-L38):
   dodaj `'REMOVE_ONE'` u `MATCH_BOOST_TYPES` (posle `'SECOND_CHANCE'`). Tip `MatchBoostType` je
   `Exclude<BoostType, 'STREAK_FREEZE'>`, pa ga ne diraš; `UseBoostDto` validira preko ove liste.
3. Efekat u `applyBoost`
   ([match-session.ts:450-466](../backend/src/modules/matches/match-session.ts#L450-L466)), novi
   `case` u `switch`-u. Dok ga ne dodaš, TypeScript javlja grešku, jer `switch` više ne pokriva
   svaki tip pojačanja:

```ts
      case 'REMOVE_ONE': {
        const order = this.optionOrders.forPlayer(player.userId, this.index);
        return { eliminatedOptions: pickWrongOptions(order, question.correctIndex, 1) };
      }
```

4. Prodavnica: novi unos u `BOOST_CATALOG`
   ([shop.constants.ts:4-35](../backend/src/modules/shop/shop.constants.ts#L4-L35)), npr.
   `{ type: 'REMOVE_ONE', name: 'Remove one', description: 'Removes one wrong answer.', price: 5 }`.
   Trošenje je već atomično ([match-play.service.ts:58-64](../backend/src/modules/matches/match-play.service.ts#L58-L64)).

Frontend:

5. [shop.model.ts:3](../frontend/src/app/core/models/shop.model.ts#L3): dodaj `'REMOVE_ONE'` u `BoostType`.
6. Labela u [boosts.ts:3-9](../frontend/src/app/shared/boosts.ts#L3-L9) i slika u
   [boost-icon.component.ts:12-18](../frontend/src/app/shared/components/boost-icon.component.ts#L12-L18)
   (npr. `itemIconUrl('sword')`).
7. Dugme u meču: unos u `BOOSTS`
   ([boosts-bar.component.ts:13-26](../frontend/src/app/features/play/components/boosts-bar.component.ts#L13-L26)).
8. Brojači: `REMOVE_ONE: 0` u `STARTING_BOOST_USES`
   ([store/match/match.constants.ts:6-11](../frontend/src/app/store/match/match.constants.ts#L6-L11))
   i `REMOVE_ONE: ownedCount(offers, 'REMOVE_ONE')` u `usesFromOwned`
   ([match.reducer.ts:381-391](../frontend/src/app/store/match/match.reducer.ts#L381-L391)).

`withBoost` u reduceru već prikazuje `eliminatedOptions`
([match.reducer.ts:362-377](../frontend/src/app/store/match/match.reducer.ts#L362-L377)), pa za
prikaz ne treba ništa više.

### 9. Promeni vreme odbrojavanja (3-2-1) i vreme po pitanju

Odbrojavanje je zadato na dva mesta, koja moraju da se slažu:

1. Server čeka pre prvog pitanja: `COUNTDOWN_SECONDS`
   ([matches.constants.ts:27](../backend/src/modules/matches/matches.constants.ts#L27)), koristi se u
   [match-session.ts:131](../backend/src/modules/matches/match-session.ts#L131).
2. Animacija na frontendu ([play.constants.ts:8-10](../frontend/src/app/features/play/play.constants.ts#L8-L10)):
   labele `COUNTDOWN_LABELS` (brojevi i "GO!" na kraju), svaka po `COUNTDOWN_STEP_MS`.

Primer za 5 sekundi: server `COUNTDOWN_SECONDS = 5`; frontend
`COUNTDOWN_LABELS = ['4', '3', '2', '1', 'GO!']` i `COUNTDOWN_STEP_MS = 1000` (5 labela × 1000 ms).

Vreme po pitanju:

- podrazumevano pri pravljenju kviza po uzrastu:
  [create.constants.ts:26-30](../frontend/src/app/features/create/create.constants.ts#L26-L30);
- dozvoljeni opseg (15-120 s):
  [quizzes.constants.ts:11-12](../backend/src/modules/quizzes/quizzes.constants.ts#L11-L12);
- koraci putanje: [learning-paths.constants.ts:48-52](../backend/src/modules/learning-paths/learning-paths.constants.ts#L48-L52);
- Mistakes review: [review.constants.ts:8](../backend/src/modules/review/review.constants.ts#L8);
- dodatno vreme (+15 s): [matches.constants.ts:41](../backend/src/modules/matches/matches.constants.ts#L41)
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
   [create.constants.ts:122-135](../frontend/src/app/features/create/create.constants.ts#L122-L135).

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
   ([create-page.component.ts:113-116](../frontend/src/app/features/create/create-page.component.ts#L113-L116))
   stavi niz validatora:
   `validators: [textLength(QUIZ_TITLE_MIN_LENGTH, QUIZ_TITLE_MAX_LENGTH), Validators.pattern(/\p{L}/u)]`
   (`Validators` dodaj u import iz `@angular/forms`). Tada neispravan naslov ne prolazi proveru
   `this.quizTitle.invalid` pre slanja (linija 235).
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
   ([chests.constants.ts:6-24](../backend/src/modules/chests/chests.constants.ts#L6-L24)). Za
   drveni kovčeg:

```ts
  WOODEN: [
    { kind: 'COINS', weight: 60, minCoins: 20, maxCoins: 40 },
    { kind: 'BOOSTS', weight: 35, boostCount: 1, streakFreezes: 0 },
    { kind: 'ITEM', weight: 5, pool: 'BASIC' },
  ],
```

   `weight` je težina, ne procenat: šansa reda je njegova težina podeljena zbirom težina
   ([chests.rules.ts:103-109](../backend/src/modules/chests/chests.rules.ts#L103-L109)). Drži
   zbir na 100, pa su težine isto što i procenti. U istom redu menjaš i opseg novčića
   (`minCoins`, `maxCoins`), broj pojačanja (`boostCount`) i zamrzavanja niza (`streakFreezes`).
2. Isto mesto, ako treba: koja pojačanja mogu da ispadnu (`CHEST_BOOSTS`, linija 27), najveća
   cena "običnog" predmeta, tj. heroja, ljubimca ili sabotaže (`BASIC_ITEM_MAX_PRICE`, linija
   30), koliko novčića vredi duplikat predmeta koji postoji samo u kovčezima (linija 32), i kada
   se kovčezi dobijaju (linije 34-42).
   Kovčezi za korake putanje su u `STEP_REWARDS`
   ([learning-paths.constants.ts:55-61](../backend/src/modules/learning-paths/learning-paths.constants.ts#L55-L61)).
3. Testovi: `docker compose exec backend npx jest chests`. Pašće provera procenata
   ([chests.rules.spec.ts:118-122](../backend/src/modules/chests/chests.rules.spec.ts#L118-L122),
   sada 60 / 35 / 5) i test koji sa `randomSequence(0.69, ...)` očekuje novčiće
   ([chests.rules.spec.ts:42-45](../backend/src/modules/chests/chests.rules.spec.ts#L42-L45)):
   69 više nije manje od 60, pa sada ispada pojačanje. Stavi 0.59. Testovi znaju tačan ishod
   baš zato što se random funkcija ubacuje spolja (odeljak 4h).
4. Frontend ne treba menjati: panel "Chances" crta ono što vrati `GET /chests/odds`, a to se
   računa iz iste tabele. Proba: Swagger → `GET /chests/odds`. Ako menjaš pravila zarade, promeni
   i tekst "How to earn" na stranici
   ([features/chests/chests.constants.ts:19-26](../frontend/src/app/features/chests/chests.constants.ts#L19-L26)).

### 14. Dodaj novu sabotažu (npr. `SHRINK`: sitna slova odgovora 4 s)

Sabotaža koju samo klijent crta (kao FOG, QUAKE, MIRROR) ne treba nikakvu logiku u rundi:
server je proveri (i to da je igrač ima), skine naboj i javi sobi `match:sabotaged` sa
trajanjem. Pošto se sabotaže kupuju, nova sabotaža je i **predmet u prodavnici**: treba joj red
u seed-u, a prodavnica je onda sama prikaže.

Backend:

1. Tip: `| 'SHRINK'` u `SabotageType`
   ([matches.types.ts:24](../backend/src/modules/matches/matches.types.ts#L24)).
2. Konstante ([matches.constants.ts:49-74](../backend/src/modules/matches/matches.constants.ts#L49-L74)):
   `'SHRINK'` u `SABOTAGE_TYPES`, nova `export const SHRINK_DURATION_MS = 4_000;` i
   `SHRINK: SHRINK_DURATION_MS,` u `SABOTAGE_DURATION_MS`. Ovo poslednje kompajler sam traži, jer
   je to `Record<SabotageType, number>`. DTO već pušta novi tip, jer proverava listu
   `SABOTAGE_TYPES` ([sabotage.dto.ts:12-13](../backend/src/modules/matches/dto/sabotage.dto.ts#L12-L13)).
3. Predmet u prodavnici: red na kraju `SEED_ITEMS`, posle ostalih sabotaža
   ([seed-data/items.ts:107-112](../backend/prisma/seed-data/items.ts#L107-L112)), preko
   pomoćne funkcije `sabotage`
   ([seed-data/items.ts:34-52](../backend/prisma/seed-data/items.ts#L34-L52)):

```ts
  sabotage('SHRINK', 'Shrink', "Shrink a rival's answers for 4 seconds.", 100, 3),
```

   (cena 100, od nivoa 3). Id predmeta (`sabotage-shrink`) napravi `sabotageItemId` od tipa
   ([sabotage-items.ts:14-16](../backend/src/modules/shop/sabotage-items.ts#L14-L16)), ista
   funkcija kojom se predmet i tip povezuju svuda; zato `ownedSabotages` sam prepozna kupljen
   Shrink, i u `CurrentUser.sabotages` i u meču. Pa
   `docker compose restart backend`: seed uradi `upsert` za svaki predmet
   ([seed.ts:90-94](../backend/prisma/seed.ts#L90-L94)). Migracija ne treba, jer je to novi red,
   a ne izmena šeme. Sa cenom do 150 nova sabotaža sama ulazi i u "običan predmet" kovčega.
4. Ništa više: `sabotage()`
   ([match-session.ts:185-203](../backend/src/modules/matches/match-session.ts#L185-L203))
   proveri pravila preko `sabotageError`
   ([party-rules.ts:27-44](../backend/src/modules/matches/party-rules.ts#L27-L44)), uključujući
   vlasništvo; štit radi sam, a `applySabotage`
   ([match-session.ts:532-543](../backend/src/modules/matches/match-session.ts#L532-L543))
   menjaš samo ako server mora nešto da sprovede (kao FREEZE i SCRAMBLE). Za test dodaj
   `SHRINK` u postojeći test
   ([match-session.spec.ts:618-638](../backend/src/modules/matches/match-session.spec.ts#L618-L638));
   `setUp` u testu daje igračima sve sabotaže iz `SABOTAGE_TYPES`
   ([match-session.spec.ts:60-66](../backend/src/modules/matches/match-session.spec.ts#L60-L66)),
   pa u testu ne treba ništa kupovati.

Frontend:

5. Tip: `| 'SHRINK'` u `SabotageType`
   ([match.model.ts:12-15](../frontend/src/app/core/models/match.model.ts#L12-L15)); `AttackType`
   ga dobije sam.
6. Tekstovi u `SABOTAGES` (kompajler traži, jer je `Record<AttackType, ...>`)
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

7. Ikonica (ista komponenta je u prodavnici, u meču i u kovčegu): `SHRINK: 'mirror'` u
   `ICON_FILES`
   ([sabotage-icon.component.ts:17-22](../frontend/src/app/shared/components/sabotage-icon.component.ts#L17-L22)),
   ili nova slika 16x16 `assets/images/icons/shrink.png` i `| 'shrink'` u `PixelIconName`
   ([pixel-icon.component.ts:4-22](../frontend/src/app/shared/components/pixel-icon.component.ts#L4-L22)).
8. Dugme i prodavnica: `'SHRINK'` na kraj liste `ATTACKS`
   ([sabotages.ts:5-7](../frontend/src/app/shared/sabotages.ts#L5-L7)). Iz nje se pravi i
   `SABOTAGE_TYPES`, pa `sabotageOfItem` prepozna predmet `sabotage-shrink`, a traka sabotaža ga
   pokaže kad ga igrač ima (`ownedAttacks`). Tab "Sabotages" ga sam doda, jer lista sve predmete
   tipa `SABOTAGE` sa servera
   ([shop.reducer.ts:123-125](../frontend/src/app/store/shop/shop.reducer.ts#L123-L125)).
9. Da li sam pogođen, kao signal, pored ostalih
   ([party-round.service.ts:115-118](../frontend/src/app/features/play/party-round.service.ts#L115-L118)):
   `readonly shrunk = computed(() => this.isUnder(this.meId(), 'SHRINK'));`
10. Efekat na ekranu, isto kao MIRROR: u `AnswerGridComponent`
   ([answer-grid.component.ts:54-56](../frontend/src/app/features/play/components/answer-grid.component.ts#L54-L56))
   `readonly shrunk = input(false);`, u šablonu
   ([answer-grid.component.html:4-5](../frontend/src/app/features/play/components/answer-grid.component.html#L4-L5))
   `[class.answers-shrunk]="shrunk()"`, u CSS-u
   ([answer-grid.component.css:146-150](../frontend/src/app/features/play/components/answer-grid.component.css#L146-L150))
   `.answers-shrunk .answer-text { font-size: 0.6rem; }`, i na stranici meča
   ([match-page.component.html:171-172](../frontend/src/app/features/play/match-page.component.html#L171-L172))
   `[shrunk]="party.shrunk()"`.

Proba: u prozoru A (demo nalog je nivo 5 i ima novčiće) otvori Shop → Sabotages i kupi Shrink.
Onda party sa dva prozora (trik iz odeljka 2). Svaki igrač počinje sa jednim nabojem, pa odmah
na prvom pitanju izaberi Shrink i klikni na heroja drugog igrača. Igrač B ga nema, pa kod njega
dugme Shrink ne postoji, a server bi ga i odbio.

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
   ([seed-data/items.ts:54-113](../backend/prisma/seed-data/items.ts#L54-L113)), preko pomoćnih
   funkcija sa linija 17-33:
   `hero('hero-ice-queen', 'Ice Queen', 210, 4),` (cena 210, od nivoa 4), za ljubimca
   `pet('pet-...', 'Ime', 60, 2),`, a za predmet koji postoji samo u kovčezima
   `chestOnly('hero-ice-queen', 'Ice Queen', 'AVATAR'),`.
4. `docker compose restart backend`. Migracija ne treba, jer je to red u tabeli, a ne izmena
   šeme; seed pri startu radi `upsert` za svaki predmet
   ([seed.ts:90-94](../backend/prisma/seed.ts#L90-L94)).
5. Proba: Shop → Heroes. Predmet do 150 novčića sam ulazi u "običan predmet" iz kovčega
   (zajedno sa jeftinijim herojima, ljubimcima i sabotažama), a `chestOnly` u ređi red srebrnog
   i zlatnog kovčega
   ([chests.rules.ts:60-67](../backend/src/modules/chests/chests.rules.ts#L60-L67)); u
   prodavnici umesto cene piše "Found in chests".

### 16. Brzi brojevi koje profesor može da traži

| Šta | Gde |
| --- | --- |
| Besplatni hintovi po meču | [matches.constants.ts:39](../backend/src/modules/matches/matches.constants.ts#L39) i [store/match/match.constants.ts:4](../frontend/src/app/store/match/match.constants.ts#L4) |
| Poeni za tačan / bonus za brzinu | [matches.constants.ts:29-30](../backend/src/modules/matches/matches.constants.ts#L29-L30) |
| Procenat za pobedu tima | [matches.constants.ts:31](../backend/src/modules/matches/matches.constants.ts#L31) i [play.constants.ts:21](../frontend/src/app/features/play/play.constants.ts#L21) |
| Koliko najduže čeka da svi kliknu Next | [matches.constants.ts:76-81](../backend/src/modules/matches/matches.constants.ts#L76-L81) |
| Koliko čeka igrača koji je otišao | [matches.constants.ts:83-89](../backend/src/modules/matches/matches.constants.ts#L83-L89) |
| Mesečni limit kupovine | [payments.constants.ts:1-2](../backend/src/modules/payments/payments.constants.ts#L1-L2) |
| Paketi novčića | [coin-packages.ts:3-7](../backend/src/modules/payments/coin-packages.ts#L3-L7) |
| Dnevni limit AI generisanja | [quizzes.constants.ts:26](../backend/src/modules/quizzes/quizzes.constants.ts#L26) i [create.constants.ts:34](../frontend/src/app/features/create/create.constants.ts#L34) |
| Intervali ponavljanja grešaka | [review.constants.ts:4](../backend/src/modules/review/review.constants.ts#L4) |
| Zvezdice 60/80/100% | [progression.constants.ts:22-24](../backend/src/modules/progression/progression.constants.ts#L22-L24) |
| Kriva nivoa | [progression.rules.ts:29-35](../backend/src/modules/progression/progression.rules.ts#L29-L35) |
| Šanse u kovčezima | [chests.constants.ts:6-24](../backend/src/modules/chests/chests.constants.ts#L6-L24) |
| Kada se dobija kovčeg (60%, dve pobede dnevno, svakih 7 dana) | [chests.constants.ts:34-42](../backend/src/modules/chests/chests.constants.ts#L34-L42) |
| Poeni za tačan odgovor iz druge šanse | [matches.constants.ts:42-43](../backend/src/modules/matches/matches.constants.ts#L42-L43) |
| Cene pojačanja (druga šansa 20) | [shop.constants.ts:4-35](../backend/src/modules/shop/shop.constants.ts#L4-L35) |
| Cene i nivoi sabotaža (80-150 novčića, nivo 2-4) | [seed-data/items.ts:107-112](../backend/prisma/seed-data/items.ts#L107-L112) |
| Besplatne sabotaže (INK) | [matches.constants.ts:58-59](../backend/src/modules/matches/matches.constants.ts#L58-L59) |
| Naboji za sabotaže (1 na početku, najviše 2) | [matches.constants.ts:45-46](../backend/src/modules/matches/matches.constants.ts#L45-L46) |
| Trajanje sabotaža | [matches.constants.ts:60-74](../backend/src/modules/matches/matches.constants.ts#L60-L74) |

---

## 6. Pitanja koja profesor može da postavi

**1. Zašto server meri vreme, a ne klijent?**
Klijentu se ne veruje: sat može da se namesti, a poruka putuje mrežom. Server sam upiše
`remainingMs` kad odgovor stigne
([match-session.ts:147-157](../backend/src/modules/matches/match-session.ts#L147-L157)) i iz toga
računa bonus za brzinu ([scoring.ts:23-29](../backend/src/modules/matches/scoring.ts#L23-L29)).
Rok je na serveru (`deadlineAt$`), a klijent dobija samo "koliko je ostalo" i crta traku.

**2. Zašto i signali i RxJS?**
Signal je vrednost koju šablon čita sada (stanje). RxJS je za stvari koje se dešavaju kroz vreme:
HTTP, socket, tajmeri, kucanje. Na granici se pretvara sa `toSignal`/`toObservable`
([match-clock.service.ts:51-72](../frontend/src/app/features/play/match-clock.service.ts#L51-L72)).
U zoneless Angularu šablon se osvežava kad se promeni signal, zato sve što šablon čita mora biti
signal (`store.selectSignal`, `computed`, `input`).

**3. Šta je entity adapter?**
Pomoćnik iz `@ngrx/entity`. Listu čuva kao `{ ids: [...], entities: { id: objekat } }` i daje
gotove funkcije `setAll`, `addOne`, `updateOne`, `removeOne` i selektor `selectAll`. Nalaženje po
id-ju je brzo i nema ručnog kopiranja nizova. Kvizovi su sortirani `sortComparer`-om
([quizzes.reducer.ts:23-26](../frontend/src/app/store/quizzes/quizzes.reducer.ts#L23-L26)), a
prijatelji koriste `selectId`, jer im je ključ `friendshipId`. Neotvoreni kovčezi: `addOne` kad
stigne `chest:earned`, `removeOne` posle otvaranja, a `selectTotal` je broj na ikonici u gornjoj
traci ([chests.reducer.ts:59-69](../frontend/src/app/store/chests/chests.reducer.ts#L59-L69)).

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
([auth.service.ts:111-118](../backend/src/modules/auth/auth.service.ts#L111-L118)).
`jti: randomUUID()` garantuje da je svaki token drugačiji. Stari refresh token više ne prolazi
poređenje hash-a ([auth.service.ts:80-85](../backend/src/modules/auth/auth.service.ts#L80-L85)).
Logout briše hash, pa nijedan refresh token više ne važi. Ako lopov iskoristi ukradeni token,
pravi korisnik ostaje bez sesije i mora ponovo da se uloguje, umesto da obojica tiho rade.

**6. Šta su relacije u bazi?**
Veze između tabela preko stranog ključa. 1:N: jedan korisnik ima više kvizova (`Quiz.ownerId`).
1:1: jedan korak putanje ima tačno jedan kviz (`PathStep.quizId @unique`). M:N: korisnik igra više
mečeva, meč ima više igrača, pa postoji spojna tabela `MatchPlayer` koja čuva i score, odgovore i
nagrade ([schema.prisma:277-298](../backend/prisma/schema.prisma#L277-L298)). `onDelete: Cascade`
briše decu kad se obriše roditelj.

**7. Zašto Docker?**
Isto okruženje kod svih (Node 22, Postgres 16), jedna komanda diže bazu, backend i frontend,
migracije i seed se rade sami, a baza čuva podatke u volumenu. Nema "kod mene radi".

**8. Kako se sprečava varanje?**

- Tačan odgovor ne ide klijentu dok runda traje: pitanje nosi samo tekst i opcije
  ([match-session.ts:696-707](../backend/src/modules/matches/match-session.ts#L696-L707)).
- Opcije se mešaju po meču, a server ih vraća u originalni redosled pre bodovanja
  ([option-order.ts:10-32](../backend/src/modules/matches/option-order.ts#L10-L32)).
- Vreme meri server; jedan odgovor po rundi (`canAnswer`,
  [match-session.ts:284-290](../backend/src/modules/matches/match-session.ts#L284-L290)).
- Socket poruke prolaze DTO validaciju ([match.gateway.ts:36](../backend/src/modules/matches/match.gateway.ts#L36),
  [answer.dto.ts:5-14](../backend/src/modules/matches/dto/answer.dto.ts#L5-L14)).
- Novčići i pojačanja se troše jednim uslovnim upitom (`updateMany ... gte`), pa ne mogu u minus
  ([shop.service.ts:135-149](../backend/src/modules/shop/shop.service.ts#L135-L149),
  [match-play.service.ts:58-64](../backend/src/modules/matches/match-play.service.ts#L58-L64)).
- U partiji pojačanja su isključena
  ([match-session.ts:422-435](../backend/src/modules/matches/match-session.ts#L422-L435)).
- Nagrada iz kovčega se izvlači na serveru, a sabotaže proverava server, uključujući i to da li
  ih igrač ima ([party-rules.ts:27-44](../backend/src/modules/matches/party-rules.ts#L27-L44));
  klijent samo javi nameru i nacrta rezultat. Sakriveno dugme u traci nije zaštita: ručno
  poslat `match:sabotage` za nekupljenu sabotažu dobije `match:error`.

**9. Šta se dešava ako se igrač diskonektuje?**
Gateway proverava da li je igraču ostao ijedan socket u sobi meča (više tabova, reconnect)
([match.gateway.ts:208-224](../backend/src/modules/matches/match.gateway.ts#L208-L224)). Ako ne,
`playerDisconnected` ([match-session.ts:219-235](../backend/src/modules/matches/match-session.ts#L219-L235)):
SOLO ide dalje (propuštena pitanja 0 poena) i posle 60 s bez povratka postaje ABANDONED; u
TEAM i PARTY ostali dobiju `match:player-left` i runde čekaju samo povezane. Tim posle 30 s
postaje ABANDONED. Partija ide dalje dok su bar dvojica; ako ostane samo jedan duže od 30 s, on
pobeđuje, pa u partiji za dvoje pobedi onaj ko je ostao
([match-session.ts:598-609](../backend/src/modules/matches/match-session.ts#L598-L609)).
Ko napusti partiju, zadrži poene za svoje odgovore, ali pobediti ili izjednačiti mogu samo oni
koji su ostali, čak i kad je onaj koji je otišao vodio
([match-session.ts:652-656](../backend/src/modules/matches/match-session.ts#L652-L656)).
Kad se vrati, klijent sam pošalje `match:join` na reconnect
([match-socket.service.ts:55-58](../frontend/src/app/core/realtime/match-socket.service.ts#L55-L58)),
a server mu pošalje trenutno pitanje sa preostalim vremenom
([match-session.ts:611-625](../backend/src/modules/matches/match-session.ts#L611-L625)).

**10. Kako radi grown-up provera i limit potrošnje?**
Frontend: modal sa množenjem dvocifrenog i jednocifrenog broja
([gate-question.ts:10-19](../frontend/src/app/features/shop/gate-question.ts#L10-L19)), posle
pogrešnog odgovora novo pitanje
([grown-up-gate.component.ts:33-43](../frontend/src/app/features/shop/components/grown-up-gate.component.ts#L33-L43));
tek tačan odgovor šalje checkout
([shop-page.component.html:177-183](../frontend/src/app/features/shop/shop-page.component.html#L177-L183)).
Backend: zbir PAID i otvorenih PENDING kupovina u poslednjih 30 dana + novi paket ne sme preći
1000 centi ([payments.service.ts:160-180](../backend/src/modules/payments/payments.service.ts#L160-L180),
[payments.rules.ts:8-10](../backend/src/modules/payments/payments.rules.ts#L8-L10)). Red korisnika
se zaključa sa `SELECT ... FOR UPDATE`, da dva brza klika ne prođu oba
([payments.service.ts:141-158](../backend/src/modules/payments/payments.service.ts#L141-L158)).
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
([match-session-registry.service.ts:28-46](../backend/src/modules/matches/match-session-registry.service.ts#L28-L46)).

**15. Šta ako host i gost istovremeno kliknu Start, ili se meč završi dva puta?**
Start: `updateMany where status 'WAITING'` — samo jedan dobije `count === 1`
([match-play.service.ts:36-43](../backend/src/modules/matches/match-play.service.ts#L36-L43)).
Dok se meč posle toga učitava, registry ga drži u skupu `starting`, pa igrač koji se baš tada
vrati ne proglasi meč prekinutim
([match.gateway.ts:182-193](../backend/src/modules/matches/match.gateway.ts#L182-L193)).
Kraj: `updateMany where status 'IN_PROGRESS'` u transakciji, pa se nagrade dele samo jednom
([match-results.service.ts:79-89](../backend/src/modules/matches/match-results.service.ts#L79-L89)).

**16. Šta se desi sa mečevima kad se server restartuje?**
Sesije su u memoriji, pa ne mogu da se nastave. Pri startu se svi WAITING/IN_PROGRESS mečevi
označe kao ABANDONED ([matches.service.ts:52-63](../backend/src/modules/matches/matches.service.ts#L52-L63)).

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
secret iz `.env` ([auth.module.ts:29-40](../backend/src/modules/auth/auth.module.ts#L29-L40)).
Ostatak koda radi sa interfejsom i ne zna koja je implementacija.

**19. Razlika između guarda u Angularu i u Nest-u?**
Angular guard odlučuje da li se ruta otvara, to je za korisničko iskustvo
([auth.guard.ts:8-17](../frontend/src/app/core/auth/auth.guard.ts#L8-L17)). Nest guard odlučuje
da li zahtev prolazi, to je bezbednost (`JwtAuthGuard` na kontrolerima). Frontend guard može da se
zaobiđe, backend ne.

**20. Zašto se kviz briše "meko"?**
Mečevi pokazuju na kviz sa `onDelete: Cascade`. Pravo brisanje bi obrisalo i istoriju mečeva i XP
na rang listi. Zato se upiše `deletedAt` i svi upiti filtriraju `deletedAt: null`
([quizzes.service.ts:91-95](../backend/src/modules/quizzes/quizzes.service.ts#L91-L95)).

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
[auth.constants.ts:16-18](../backend/src/modules/auth/auth.constants.ts#L16-L18)).

**24. Zašto se kovčezi ne mogu kupiti?**
Aplikacija je za decu. Nasumična nagrada koja se plaća je "loot box": radi kao kockanje, a u
nekim zemljama je zabranjena ili ograničena. Zato je pravilo jasno: novac kupuje samo tačan broj
novčića (iza grown-up pitanja i mesečnog limita), novčići kupuju samo predmet koji si izabrao, a
slučajnost postoji samo u kovčezima koji se zarađuju. U kodu:

- Nema rute koja pravi kovčeg. `ChestsController` ima samo listu, šanse i otvaranje
  ([chests.controller.ts:24-41](../backend/src/modules/chests/chests.controller.ts#L24-L41)).
  Kovčeg se upisuje samo u transakciji koja snima meč
  ([match-results.service.ts:135-155](../backend/src/modules/matches/match-results.service.ts#L135-L155))
  ili prvi prelazak koraka putanje
  ([learning-paths.service.ts:156-171](../backend/src/modules/learning-paths/learning-paths.service.ts#L156-L171)),
  plus seed za demo naloge.
- Predmet koji postoji samo u kovčezima ne može da se kupi: 400
  ([shop.service.ts:164-166](../backend/src/modules/shop/shop.service.ts#L164-L166)). Zamrzavanje
  niza nema cenu (`price: null`), pa i ono vraća 400
  ([shop.constants.ts:29-34](../backend/src/modules/shop/shop.constants.ts#L29-L34),
  [shop.service.ts:92-96](../backend/src/modules/shop/shop.service.ts#L92-L96)).
- Šanse su javne: `GET /chests/odds` ih računa iz iste tabele po kojoj se izvlači
  ([chests.rules.ts:95-109](../backend/src/modules/chests/chests.rules.ts#L95-L109)), a stranica
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
  ([chests.service.ts:55-66](../backend/src/modules/chests/chests.service.ts#L55-L66)). Isti trik
  kao kod plaćanja (`purchase.updateMany` sa `status: 'PENDING'`) i starta meča (`WAITING`).

Slična zaštita postoji i kod dobijanja: `grantForMatch` prvo zaključa red korisnika
(`SELECT ... FOR UPDATE`), pa tek onda broji današnje kovčege, da dva meča koja se završe u isto
vreme ne dobiju oba poslednji dnevni kovčeg
([chests.service.ts:74-87](../backend/src/modules/chests/chests.service.ts#L74-L87)).

**26. Kako radi Second chance?**
Pojačanje za SOLO i TEAM (u partiji su pojačanja isključena), košta 20 novčića ili ispadne iz
kovčega.

1. Igrač klikne dugme pre odgovora. Server proveri da sme (`assertCanUseBoost`), skine jedno
   pojačanje atomičnim `updateMany ... gte: 1` i postavi `secondChance = 'armed'`
   ([match-session.ts:460-462](../backend/src/modules/matches/match-session.ts#L460-L462)).
2. Kad stigne odgovor, `submitAnswer` pre slanja u `answers$` pita `secondChanceCovers`
   ([match-session.ts:475-483](../backend/src/modules/matches/match-session.ts#L475-L483)):
   uključena, ovo pitanje, igrač još sme da odgovori i odgovor je **pogrešan**. Tada odgovor
   uopšte ne ulazi u rundu (pa ga `take(n)` ne broji i runda ne staje), stanje postaje
   `'spent'`, a igrač dobije `match:second-chance { wrongOption }`
   ([match-session.ts:485-492](../backend/src/modules/matches/match-session.ts#L485-L492)).
3. Drugi odgovor ide normalnim putem kroz `answers$`. `pointsFor` vidi `'spent'` i daje
   `secondTryPoints`: 50 za tačan (pola osnovnih poena, bez bonusa za brzinu), 0 za pogrešan
   ([match-session.ts:362-376](../backend/src/modules/matches/match-session.ts#L362-L376),
   [scoring.ts:31-34](../backend/src/modules/matches/scoring.ts#L31-L34)). Ako je prvi odgovor
   tačan, boduje se normalno, a pojačanje je potrošeno.
4. Stanje važi samo za jedno pitanje; `resetRoundState` ga vraća na `'unused'`
   ([session-player.ts:55-62](../backend/src/modules/matches/session-player.ts#L55-L62)).
5. Frontend: reducer obriše moj odgovor i zapamti pogrešnu opciju
   ([match.reducer.ts:354-360](../frontend/src/app/store/match/match.reducer.ts#L354-L360)),
   `AnswerGrid` je precrta, pojavi se "Second chance! Try again", a tajmer, koji je stao na prvom
   odgovoru, ponovo krene ([match-clock.service.ts:58-62](../frontend/src/app/features/play/match-clock.service.ts#L58-L62)).

Server je i ovde sudija: klijent nikad ne kaže "ovo je druga šansa", server sam zna stanje
igrača i sam računa poene.

**27. Zašto se sabotaže kupuju, a da igra ostane fer?**
Pravilo je **novac kupuje raznovrsnost, ne snagu**. Kupljena sabotaža ne donosi ni poen ni
dodatni potez; donosi samo još jednu vrstu poteza (ceo tok je u odeljku 4i):

- Naboj se ne kupuje. Svaka sabotaža, i kupljena, troši naboj, a naboji se dobijaju samo igrom:
  1 na početku, +1 za svaku dobijenu rundu, najviše 2, i najviše jedna sabotaža po pitanju
  ([matches.constants.ts:45-46](../backend/src/modules/matches/matches.constants.ts#L45-L46),
  [party-rules.ts:22-24](../backend/src/modules/matches/party-rules.ts#L22-L24)). Igrač sa svih
  šest sabotaža ne može da napadne češće od igrača koji ima samo mastilo.
- Mastilo (INK) je besplatno za sve (`FREE_SABOTAGES`), pa svako od prvog meča ima čime da
  uzvrati. Štit je odbrana koja se kupuje isto kao napadi, i blokira bilo koju sabotažu.
- Poeni se dobijaju samo tačnim odgovorom; sabotaža samo smeta (zamrzne, zamagli, promeša) i
  traje nekoliko sekundi ili do kraja pitanja.
- Sabotaže se kupuju novčićima, a novčići se zarađuju igrom; mogu i da ispadnu iz kovčega kao
  "običan predmet", pa niko ne mora da plati pravim novcem. Pravi novac kupuje samo tačan broj
  novčića, iza grown-up pitanja i mesečnog limita, i nikad slučajnu nagradu.
- Kupuje se jednom i ostaje zauvek, kao heroj, bez pretplate i bez trošenja.
- Pravilo važi na serveru: vlasništvo se proverava u `sabotageError` pre naboja
  ([party-rules.ts:31-33](../backend/src/modules/matches/party-rules.ts#L31-L33)), a ne samo
  sakrivanjem dugmeta na frontendu.

**28. Kako dvoje prijatelja igra jedan protiv drugog?**
Kao partija za dvoje. PARTY kreće čim su dva igrača povezana
([matches.constants.ts:17-21](../backend/src/modules/matches/matches.constants.ts#L17-L21)), a
pobednik je onaj sa više poena. Ranije je za to postojao poseban mod, ali je radio skoro isto, pa
je izbačen: manje koda, jedna pravila i jedno mesto za nagrade (`PARTY_WIN_BONUS`). Migracija je
prvo prebacila stare mečeve tog moda u PARTY (`UPDATE "matches" SET "mode" = 'PARTY' ...`), pa
tek onda napravila enum `MatchMode` bez njega
([schema.prisma:58-62](../backend/prisma/schema.prisma#L58-L62)), da istorija mečeva ostane
čitljiva.

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
| Naboj (charge) | Potez za sabotažu u partiji: 1 na početku, +1 za dobijenu rundu, najviše 2. Ne kupuje se, dobija se samo igrom. |
| Otključavanje (unlock) | Predmet koji se kupi jednom i ostaje zauvek, kao sabotaža u prodavnici; ne troši se i ne "oblači" se. |
| Ubačena zavisnost (random) | Funkcija ne zove `Math.random` sama, nego ga dobija kao parametar, pa test može da pošalje zadate brojeve. |
| Soft delete | Umesto brisanja upiše se `deletedAt`, a upiti preskaču takve redove. |
| Swagger | Automatska dokumentacija REST API-ja na `/api/docs`, iz dekoratora kontrolera i DTO-a. |
| Healthcheck | Provera da li servis radi; Docker po njoj zna kad je baza spremna. |
