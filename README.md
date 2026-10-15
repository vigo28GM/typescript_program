# Laravel API klients: React + TypeScript (pārejas mape)

Šī mape ir domāta, lai **soli pa solim pārceltu React lietotni no JavaScript uz TypeScript**.
Sākumā tā ir precīza kopija no `../laravel-api-client` (JavaScript versija, commit `9bb8bf9`), un tā darbojas jau tagad. Katru failu var pārcelt atsevišķi, un lietotne visu laiku paliek darbspējīga.

## Komandas

```bash
npm install
npm run dev         # http://127.0.0.1:5501  (JavaScript versija ir uz 5500, abas var darboties reizē)
npm run typecheck   # TypeScript tipu pārbaude (tsc -b)
npm run lint        # ESLint: React noteikumi + TypeScript noteikumi
npm run build       # tipu pārbaude + gatavā versija mapē dist/
```
API (`../laravel-api`) jāpalaiž atsevišķi: `php artisan serve` (port 8000).

## Kā darbojas pārejas režīms

`tsconfig.app.json` satur:

| Iestatījums | Nozīme |
|---|---|
| `allowJs: true`, `checkJs: false` | `.js/.jsx` faili turpina darboties un var importēt `.ts/.tsx` failus un otrādi; JavaScript faili netiek tipu pārbaudīti |
| `strict: true` | visi `.ts/.tsx` faili tiek pārbaudīti **stingri** (`null`, `undefined`, nenorādīti tipi…) |
| `verbatimModuleSyntax: true` | tipus jāimportē ar `import type { … }` |
| `erasableSyntaxOnly: true` | bez `enum` un `namespace`, jo Vite tos neapstrādā |

`eslint.config.js` saglabā visus React noteikumus (arī *Rules of Hooks* un tīrības noteikumus) un `.ts/.tsx` failiem pievieno `typescript-eslint` noteikumus.

## Kā pārcelt vienu failu

1. Pārdēvē failu: `.js` → `.ts`, `.jsx` → `.tsx` (komponentes ar JSX ir `.tsx`).
2. **Atjauno importus** uz jauno paplašinājumu, piemēram `'./format.js'` → `'./format.ts'`. Vite pats nomaina `.js` uz `.ts` tikai tad, ja importētājs jau ir TypeScript fails.
3. Pieraksti tipus: props (`type Props = { … }`), stāvokli (`useState<Post[]>([])`), funkciju parametrus un atgriežamās vērtības.
4. Palaid `npm run typecheck && npm run lint`.
5. Atzīmē failu sarakstā zemāk un pārbaudi lapu pārlūkā.

Tipi, kas lietojami vairākās vietās (`Post`, `Comment`, `User`, `Joke`, žurnāla ieraksts…), jāliek vienā failā **`src/types.ts`**. Tas jāizveido pirmais.

## Pārcelšanas secība (no vienkāršākā uz sarežģītāko)

**1. Tipi un datu slānis** (no tā ir atkarīgi visi pārējie)
- [x] `src/types.ts` (jauns fails ar visiem kopīgajiem tipiem)
- [x] `src/format.ts` (kopā ar `readForm<T>()`, kas nolasa formas laukus ar norādītu tipu)
- [x] `src/api.ts` (katram galapunktam norādīts, ko tas atgriež: `getPosts()` → `Promise<Post[]>`)
- [x] `src/AppContext.ts` (`useApp()` tagad nekad neatgriež `null`)

**2. Hook-i**
- [x] `src/hooks/useToast.ts`
- [x] `src/hooks/useRunner.ts`
- [x] `src/hooks/useHashView.ts` (`ViewName` tips: `go('nezinama')` ir kļūda)
- [x] `src/hooks/useLoadingBar.ts`
- [x] `src/hooks/useRequestLog.ts`
- [x] `src/hooks/usePosts.ts` (eksportē `PostsState` tipu)

**3. Komponentes**
- [x] `Avatar` (CSS mainīgajam `--hue` vajag tipa norādi), `Button` (visas `<button>` īpašības + `loading`), `Spinner`, `StatusBadge`, `AuthRequired`, `ProgressBar`, `Toast`, `View` (`name: ViewName`), `Switch`
- [x] `JokeCard` (pēc `joke.type` TypeScript zina, kuri lauki ir pieejami), `LogEntry`, `Comments`, `NavBar`
- [x] `PostCard`
- [x] `ErrorBoundary` (klases komponente: `Component<Props, State>`)

**4. Lapas**
- [x] `LogView`, `NewPostView`, `RolesView`
- [x] `PostsView`, `JokesView`, `AccountView`

**5. Sakne un noslēgums**
- [x] `src/App.jsx`, `src/main.jsx`
- [x] `index.html`: `<script src="/src/main.jsx">` → `main.tsx`
- [x] `tsconfig.app.json`: izņemt `allowJs` un `checkJs`
- [x] `eslint.config.js`: izņemt JavaScript noteikumu bloku
- [x] Pārbaude: `npm run typecheck`, `npm run lint`, `npm run build` bez kļūdām, un lietotne darbojas pārlūkā

**Progress: 32 / 32 koda faili pārcelti.** Pārejas režīms izslēgts: `allowJs`/`checkJs` izņemti, `index.html` rāda uz `main.tsx`, un visi faili tiek pārbaudīti stingri. `npm run typecheck`, `npm run lint` un `npm run build` darbojas bez kļūdām.

### Svarīgi tipi, ko lietot pārējos failos

| Tips | Kam |
|---|---|
| `Post`, `CreatedPost`, `PostComment`, `User`, `Joke` | dati no servera (`src/types.ts`) |
| `RunFn`, `RunResult<T>` | `run()` un `perform()` atgriež pašu rezultātu; ja serveris atbild bez satura (204), tad `true`; kļūdas gadījumā `undefined` |
| `ViewName` | sadaļu nosaukumi (`'posts'`, `'jokes'`…), no `useHashView.ts` |
| `AppContextValue` | ko dod `useApp()` |
| `readForm<LoginFields>(form)` | formas lauki kā tipizēts objekts (`format.ts`) |

Kļūdas gadījumā `catch (error)` TypeScript to uzskata par `unknown`: izmanto `Api.isAbortError(error)` vai `error instanceof ApiError`.

## Ko TypeScript šeit dos

- `Api.getPosts()` atgriezīs `Promise<Post[]>`, nevis jebko, un kļūda `post.titel` tiks atrasta jau rakstot.
- Komponentēm būs skaidri norādīti props, un aizmirsts obligāts prop būs kļūda.
- `null` un `undefined` gadījumi (piemēram, lietotājs nav pieslēdzies) būs jāapstrādā ar tipu palīdzību.
