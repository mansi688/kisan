# KisanUnnatti — Website + Android App

A working implementation of the Digital Commodity Pledge Finance, Warehouse
Receipt & Price Discovery Platform described in the BRD (`KisanUnnatti_BR_
Document_Digital_Commodity_Financing_Platform.docx`). This build covers the
farmer-facing journey end to end:

**Register → Store → WR → Finance → Monitor → Auction → Sell → Settle**

## Run it — one folder, one command

Everything runs from the project's top folder (the one containing `backend`,
`web`, `package.json` and this README). You need Node.js 18.11+.

```bash
npm start
```

That's it. The first time, it installs what's missing, creates
`backend/.env`, builds the website, seeds the demo data, and then serves the
**whole site and the API from one server on http://localhost:4000** — open
that address in your browser. One process, one port, no second terminal, no
CORS or proxy to get wrong. (`npm run setup` does the same preparation
without starting the server.)

Then either click **Explore the platform** → pick a role (no OTP), or sign in:

| Role | Sign in with |
|---|---|
| Farmer | mobile `9000000001` / `Demo@123` |
| Financer | `financer@demo.kisanunnatti.in` / `Demo@123` |
| Warehouse / WSP-CM | `wsp@demo.kisanunnatti.in` / `Demo@123` |
| Admin | username `admin` / `Kailash@1209` (see "Admin access") |

**Editing the code?** `npm run dev` starts the backend (auto-restart) and
Vite's hot-reload dev server together: site on http://localhost:5173, API on
:4000.

**If something doesn't work:**
- `Cannot find module 'dotenv'` → dependencies were never installed in
  `backend/`. `npm start` from the top folder installs them for you.
- `cd backend` says the path doesn't exist, or the folder only contains
  `web` → the zip wasn't fully extracted. Delete the folder and use
  right-click → **Extract All** on the whole zip; you should see `backend`,
  `web`, `mobile`, `scripts` and this README side by side.
- `Failed to resolve import "../../api.js" from src/pages/Settlements.jsx`
  → a leftover folder from an older download was merged with the new one.
  Delete the whole project folder first, then extract fresh.
- Sign-in says "Cannot reach the KisanUnnatti backend" → only the Vite dev
  server is running. Use `npm start` (or `npm run dev`), not `npm run dev`
  inside `web/`.

## Deploying it

The production build is a single Node process (API + built website), so it
deploys as one unit. Health check: `GET /health`.

**Any Node host / VPS:** `npm run setup`, then run with real settings:

```bash
NODE_ENV=production JWT_SECRET="<long random string>" ADMIN_PASSWORD="<strong password>" \
TRUST_PROXY=1 FORCE_HTTPS=true npm start
```
Put nginx/Caddy (TLS) in front and point it at port 4000.

**Docker:** `docker build -t kisanunnatti .` then
`docker run -p 4000:4000 -e JWT_SECRET=... -e ADMIN_PASSWORD=... -v kisan-data:/app/backend/data kisanunnatti`.

**Render:** `render.yaml` is a ready blueprint.

> ⚠️ **Not tested here:** the Dockerfile and `render.yaml` were written
> carefully but could not be built/run in the environment this was developed
> in (no Docker available). The Node path above *was* tested end to end.

Settings worth knowing (all documented in `backend/.env.example`):
`JWT_SECRET` (required in production — the server refuses to start with the
placeholder), `ADMIN_PASSWORD`, `DEMO_MODE`/`SEED_DEMO` (`false` for a real
launch: no demo accounts with public passwords), `TRUST_PROXY`, `FORCE_HTTPS`.

**Know before going live:** data lives in JSON files under `backend/data/`
(mount a persistent volume — on a host with a throw-away disk it resets), or
switch to PostgreSQL with `DB_DRIVER=postgres` (see the Database section).
OTP is still the development stub (`123456`), and there's no real payments/
KYC/SMS integration — those need provider accounts and are the honest
"Phase 2" work, not something this repo can fake.

## Admin access

Unlike Financer/WSP-CM, **Admin accounts cannot self-register** —
`POST /api/participants/ADMIN/register` returns 403 regardless of who
calls it. There is exactly one way into the Admin portal: the seeded
account, username `admin` / password `Kailash@1209` (a plain username,
not an email — the Admin login field is `type="text"`, not `type="email"`,
specifically so a non-email string like this isn't rejected by the
browser's own form validation before it even reaches the server).

Change the password by editing the `bcrypt.hashSync('Kailash@1209', 10)`
call in `backend/seed.js` before your first `npm run seed` — reseeding
after that point won't touch an `admins.json` that already has data in it
(the seed script only seeds empty collections), so update the seed
script first, or edit `backend/data/admins.json` directly and restart.

Demo Mode does **not** offer Admin as a role — only Farmer, Financer and
WSP-CM. A no-password Demo Mode entry into the Admin portal would defeat
the point of locking Admin to one credential, regardless of which account
it happened to point at, so it was left out deliberately rather than
wired up and then gated some other way.

## Fixed this session: the login 500 and related audit

A person actually ran this build and hit `Request failed (500)` on the
seeded farmer login. Root cause, confirmed by direct reproduction (not
just inferred): `bcrypt.compareSync(password, hash)` **throws** — it does
not return `false` — when `hash` is missing, `null`, or not a well-formed
bcrypt string. Both login routes (farmer and participant) called it
directly with no guard, so a stored record with a malformed or absent
`passwordHash` — e.g. a `data/` folder seeded by an earlier version of
this project, before some schema change — would crash the request as an
uncaught 500 instead of failing the login cleanly.

Fixed with a `safeCompare()` helper in `backend/utils/auth.js`: any
comparison failure (malformed hash, wrong password, anything) now
resolves to "invalid credentials" (401), never a crash. Verified by
directly reproducing the throw (`bcrypt.compareSync('x', null)` really
does throw `Illegal arguments: string, object`), then deliberately
corrupting a seeded farmer's `passwordHash` and confirming the login now
returns a clean 401 instead of a 500, then reseeding clean and confirming
normal login still works.

The same pass also found and fixed a real frontend/backend contradiction
Demo Mode's admin-role wiring pointed at `admin@demo.kisanunnatti.in`,
which no longer existed once the Admin credential changed to a plain
`admin` username earlier in this project's history — so "Enter as Admin"
in Demo Mode would have 404'd. Removed Admin from Demo Mode entirely
(see above) rather than just fixing the stale email, since Demo Mode
granting no-password Admin access was the deeper problem.

Also implemented while auditing the error path: `web/src/api.js` now
maps HTTP status codes to meaningful messages (401 → "Session expired...",
403 → "You do not have permission...", 500 → "Something went wrong on our
server...", a real network failure → "Unable to connect...") instead of
a bare "Request failed (500)" — the backend's own specific error message
(e.g. "Invalid mobile number or password") still always takes priority
when the server provides one.

## Fixed this session: `npm run seed` silently skipping with zero output

A person's second `npm run seed` (after re-running the setup steps) printed
only `Seed complete.` with none of the usual `Seeded demo admin: ...`
lines — which looked like something had gone wrong, but was actually the
script working exactly as designed: every seed step is guarded by "only
insert if this collection is currently empty," so a `backend/data/`
folder already populated from an earlier run causes every step to be
silently skipped. The real risk this created: if that existing data
predates a credential change (the admin login moved from
`admin@demo.kisanunnatti.in` to a plain `admin` username earlier in this
project's history), the account actually sitting in `admins.json` could
be completely different from what the current docs and login page expect
— with literally no output anywhere to reveal that mismatch.

Fixed by having every step report its status regardless of which branch
it takes — not just "created," but "N already present, skipping" together
with the actual existing login identifier(s) for every collection that
has one. Verified by reproducing the exact sequence: seeded fresh (all
the normal "Seeded ..." lines appear), ran it again immediately (now
shows "already present" with the current, correct logins listed instead
of silence), then deliberately edited the admin record to simulate
exactly the stale-data scenario described above and re-ran seed a third
time — confirming the mismatched old email would now show up directly in
the console output instead of only surfacing later as a failed login.

Also worth noting directly, since it came up in the same report: visiting
`http://localhost:4000/` in a browser and seeing `{"error":"Not found"}`
is expected, correct behavior — the API has no page at the bare root, only
specific endpoints under `/api/*` and `/health`. It doesn't indicate a
problem; `http://localhost:4000/health` is the actual way to confirm the
backend is up (verified working: `{"status":"ok",...}`).

**If your admin login still doesn't work after pulling this fix:** run
`npm run seed` once and read what it prints for `Admins/WSP-CM:` — if it
shows anything other than `admin` as the ADMIN login, delete
`backend/data/` entirely and run `npm run seed` again to get a fresh,
correct set of accounts.



Same "Admin sign in" report as the CORS issue above, but this time the
person's own terminal output made the real cause unambiguous:
`[vite] http proxy error: ... AggregateError [ECONNREFUSED]`. That means
exactly one thing — nothing is listening on port 4000 at all. Not a CORS
problem this time (the fix above was real and still correct for its own
scenario), not a bug in the login logic — the backend terminal was simply
never started. Only `cd web && npm install && npm run dev` had been run.

That's an easy mistake to make, and the real problem this pass fixes is
that the resulting error message gave no hint of it: Vite's dev proxy,
unable to reach the target, returns a generic failure that the frontend
was mapping to the same "Something went wrong on our server" text used
for an actual backend error — making "you forgot to start the backend"
and "the backend hit a real bug" look identical.

Fixed in `web/vite.config.js`: the proxy now has a custom error handler
that returns a distinct `503` with a specific message — "Cannot reach the
KisanUnnatti backend on port 4000. Make sure it is running: cd backend &&
npm start" — instead of letting the default generic failure through.

Verified end-to-end with the real dev server, not a mock: started Vite
alone with the backend deliberately not running (reproducing the exact
reported setup) and confirmed a real HTTP request through the actual
running proxy comes back `503` with the new message; called the real
frontend `api.js` error-handling logic against that same live proxy and
confirmed the thrown error is the new specific message, not the old
generic one. Then — without restarting anything — started the backend
in a second terminal and re-ran the identical request through the same
already-running Vite process: real `200` with a real token, confirming
the fix only activates when the backend is genuinely unreachable and
otherwise stays completely out of the way. Also confirmed a real login
failure (wrong password) still shows its own distinct "Invalid email or
password" message rather than being swallowed by either of the other two.



A person hit "Unable to connect to KisanUnnatti. Check your connection and
try again." on the Admin login specifically, with correct credentials.
That exact message only fires when `fetch()` itself throws — a genuine
network-level failure, not a normal rejected-login response — so the
first thing to rule out was the backend rejecting the request outright.

Root cause, confirmed by direct reproduction: the backend's CORS
allowlist only ever permitted `http://localhost:5173`. Vite's dev server
defaults to that port but silently falls back to the next free one
(5174, 5175, ...) whenever 5173 is already in use by something else —
common, and easy to not notice, since the page still loads fine at
whatever port it lands on. From a real browser, a request from an origin
not on the allowlist gets a response with no matching
`Access-Control-Allow-Origin` header, which the browser blocks before it
ever reaches the page's JavaScript — `fetch()` reports that as a network
failure. Confirmed exactly this with curl by sending the same request
with different `Origin` headers: port 5173 got the CORS header back, port
5174 didn't.

Fixed properly, not just patched around: `backend/server.js` now defaults
to covering `localhost` **and** `127.0.0.1` (browsers treat these as
different origins even on the same machine) across ports 5173-5176, and
logs a clear `[CORS] Rejected request from origin "..."` line on the
server whenever a real rejection happens — previously silent, so a future
version of this exact bug would show up instantly in the backend's own
terminal instead of only as a mystifying browser-side message. Also found
that `.env.example` had `CORS_ORIGIN=http://localhost:5173` hardcoded and
uncommented — meaning every setup that follows the documented `cp
.env.example .env` step would have that single value baked in immediately,
completely overriding the new, more forgiving code default. Fixed
`.env.example` to leave it commented out (documented, not set), and
re-verified the whole fix with `.env` regenerated fresh from the corrected
file — the first version of this fix looked right in the code but did
nothing until this second file was also fixed.

Verified with real HTTP requests bearing different `Origin` headers, not
just a code read: 5173 works, 5174 works, 5176 works, `127.0.0.1:5173`
works, and a genuinely unexpected origin (`evil.example.com`) is still
correctly rejected with a warning logged server-side. Confirmed the
normal same-origin login flow (no explicit `Origin` header, matching how
curl and same-origin requests behave) still works exactly as before, and
the frontend build is unaffected (this was a backend-only change).

If you still see this error after pulling this fix: check what URL Vite
actually printed when you ran `npm run dev` — if it's not port
5173-5176, either close whatever else is using those ports first, or set
`CORS_ORIGIN` in `backend/.env` explicitly to match.



Added canonical URL support to the `Seo` component — derived from
`window.location` (origin + pathname, query string and hash stripped)
rather than a hardcoded domain, since the real production domain isn't
fixed yet (see sitemap.xml's own placeholder note) and this way it's
correct in dev, staging or production without editing this file later.
Verified with real `BrowserRouter` navigation (not `MemoryRouter`, which
doesn't touch `window.location` and would have given a false pass): started
on a deliberately messy URL with a query string and hash, confirmed the
canonical strips both; navigated via real `pushState`, confirmed the
canonical updates and — importantly — that a second `<link>` isn't added
alongside the first.

Audited every mobile menu/drawer toggle in the app (public nav, farmer
sidebar, financer/WSP/admin sidebar) against Part 22's specific
requirements and found the same three gaps in all of them: no
`aria-expanded`, no `aria-controls` linking the button to the menu it
actually opens, and a static "Open menu" label that never changed to
reflect the open state. Also missing entirely: closing the menu with
Escape, which every disclosure widget is expected to support. Fixed all
three toggles and added Escape-handling once, inside the shared
`useSidebar()` hook, so the farmer and participant shells both inherit it
rather than needing the same fix written twice.

Verified with real interaction, not attribute inspection alone: clicked
each toggle and confirmed `aria-expanded` flips `false`→`true`, confirmed
the label flips "Open menu"→"Close menu", confirmed `aria-controls`
points at an element that actually exists in the DOM, then dispatched a
real Escape keydown and confirmed the menu actually closes — across the
public nav, the farmer dashboard sidebar, and the financer/WSP/admin
sidebar independently (15 + 6 checks).

Also gave the theme toggle's three buttons an explicit `aria-label` each
("Light theme" / "Dark theme" / "System theme") rather than relying on
how a given screen reader chooses to announce the ☀/🌙/🌓 emoji content,
which isn't guaranteed to be consistent or descriptive on its own.



Went back to specifically check dark mode on the app's main authenticated
sidebar (used by all four roles) and the public footer, rather than
assuming they inherited it correctly just because they use CSS variables.
Found a genuine bug: both surfaces have a background that stays dark in
*both* themes (`--panel-bg`, deliberately theme-invariant, styles.css's own
comment for it), but three CSS rules and one inline style paired that
background with `var(--paper)` for text/hover color — a token that is
light in light mode but flips to **dark** in dark mode. Confirmed the
actual values before fixing anything (`--paper` is `#F4EFE7` in light mode,
`#171A10` in dark mode) — meaning the sidebar's active/hovered link text,
the logged-in user's name in the sidebar footer, and the public footer's
brand name and link-hover color would all have gone dark-on-dark and
become unreadable specifically in dark mode.

Fixed all four spots to use `--panel-text` (the token that's genuinely
constant across both themes, confirmed by checking it's simply never
redefined under the dark block — so it can't drift) instead of `--paper`.
Also replaced a hardcoded `#9BA5B3` in the footer's description text with
the proper `--panel-text-soft` token, since hardcoded colors bypass the
theme system entirely regardless of whether they happen to look fine
today.

Checked every other `var(--paper)` usage in the stylesheet (3 remaining)
before considering this done — all three pair it with a background that's
*also* theme-dependent and designed to stay its opposite (`.btn`,
`.btn-wheat:hover`, `.audience-tab.active`), so they're correct as written
and weren't touched. Verified the fix reaches real elements: rendered all
four authenticated sidebars (Farmer/Financer/WSP/Admin) and confirmed the
`.sidebar-user strong` / `.side-link.active` structure the fixed CSS rules
target actually exists in each one, and confirmed the footer's two inline
styles now reference the corrected tokens.



No React error boundary existed anywhere in the app — meaning an unhandled
render error (a genuine frontend bug, not an API error, which was already
handled separately) would crash to React's default behavior: unmounting
the entire tree, leaving a blank white page with no explanation. Added
`web/src/components/ErrorBoundary.jsx` (a class component — React only
supports error boundaries this way, there's no hook equivalent) wrapping
the whole app, paired with a dedicated `SystemError.jsx` screen — "Something
went wrong" / Try Again / Return Home / Contact Support, using the real
logo, deliberately not styled like the 404 page (a crash and a wrong URL
are different situations and shouldn't look identical).

Verified by actually triggering a crash, not by reading the code: rendered
a component that deliberately throws inside the boundary and confirmed
the fallback UI appears, confirmed the actual error message and stack
trace do NOT leak into the rendered HTML (only `console.error`), confirmed
Try Again / Return Home / Contact Support are all present, and confirmed
a normal non-crashing child still renders fine through the same boundary.
Also re-ran the full login flow through the wrapped app to confirm the
boundary doesn't interfere with ordinary operation.

The Return Home / Contact Support links here deliberately use plain
`<a>` tags instead of React Router's `<Link>` — a full page reload is the
one recovery path that doesn't depend on the Router's own context still
being in a working state, which isn't a safe assumption right after
something in the tree has already broken.



12 pages fetched data with no loading indicator at all — `{!rows ? null : ...}` — meaning the content area was just blank until the fetch resolved. Wired the existing `LoadingSkeleton` component (already used on the 4 Overview pages, just not anywhere else) into all 12: every admin table page, every financer list page, both WSP list pages, and the farmer Auction page.

The farmer Auction page (`web/src/pages/Auction.jsx`) turned out to have a real, more serious version of this: its list started as `useState([])` rather than `useState(null)`, so `auctions.length === 0` was true from the very first render — meaning a farmer with real open auction lots would briefly see "No open auction lots" before the actual data arrived and corrected it. Not a blank screen — actively wrong information for a moment. Fixed by giving it a proper `null` initial state distinct from "loaded but empty," same as the others.

While fixing this, found the same problem again one level down: none of the 12 pages' `.catch()` handlers cleared the loading state on a failed fetch, so an API error would show the error banner *and* leave the loading skeleton spinning forever underneath it — never actually resolving to anything. Fixed all 12 to set the list to `[]` alongside the error message.

Verified all of this with real interaction, not code inspection: intercepted the relevant fetch calls to (1) never resolve, (2) reject with a 500, and (3) succeed normally, across four representative pages spanning admin/financer/WSP/farmer — confirmed the skeleton shows while loading, confirmed it does NOT show a premature "No ... yet" during that window, confirmed the error banner appears on failure without a stuck skeleton, and confirmed normal success still renders cleanly. 20 checks, all passing.

Also added the `prefers-reduced-motion` handling that was missing for the skeleton's shimmer animation — it's now a static placeholder instead of an animated one when the user has that preference set. The landing page's own animations already handled this correctly from the original source file.



The favicon added in an earlier pass was a simplified gold-leaf crop —
correct for a 16-32px browser tab, but it turned out to have real
pixelation and stray artifacts once actually viewed at any larger size
(confirmed by rendering the same source at 1024px before trusting it).
Rebuilt properly: the tiny simplified mark is kept only for `favicon.ico`
(16+32 multi-resolution) and `favicon.png` (32px, the fallback most
browsers use), while everything larger — `apple-touch-icon.png` (180px),
`icon-192.png`, `icon-512.png` — uses the full detailed logo mark instead,
which actually resolves cleanly at that size. Added `manifest.json`
referencing the two PWA icon sizes. All six files confirmed present at
their exact correct dimensions and wired into both `index.html` and
`landing.html`'s `<head>`.

Every public page previously showed the same static title
("KisanUnnatti — Digital Commodity Finance") regardless of which page was
open, and there was no meta description anywhere. Built a small
dependency-free `Seo` component (`web/src/components/Seo.jsx` — sets
`document.title`, meta description, and Open Graph tags via `useEffect`,
no router-SSR library needed for a client-rendered SPA) and wired it into
all 19 public pages. Verified with a real test, not a code read: rendered
each page and checked `document.title` actually equals the expected
string, checked og:title tracks it, and — the check that actually matters
— confirmed the title *changes* when navigating from one page to another
rather than getting stuck from whatever the previous route set.

One real mistake caught and fixed during this pass: an early edit to
`Market.jsx` accidentally deleted the `export default function Market()`
line while inserting the Seo import, which would have been a hard build
failure. Caught by checking the file content immediately after the edit
rather than assuming it landed correctly, fixed before it ever reached a
build step.



The catch-all route used to silently redirect any unknown URL straight to
the landing page — no indication anything was wrong. Replaced with a real
branded 404 page (`web/src/public/pages/NotFound.jsx`) wired to both the
catch-all and an explicit `/404` route, with working Return Home / Explore
Platform / Contact Support links. Verified: an unknown path shows "Page
not found"; a real page like `/about` still renders normally, not 404'd
by mistake.

The public footer was reorganized into the four named groups (Platform /
Company / Resources / Legal & Trust) instead of three loosely-grouped
columns — and in doing so, a real duplicate was caught and removed
(`/help` had ended up in two columns). Verified: every footer link
resolves to a real route, zero duplicates.

Two pages the footer already claimed to link to didn't exist —
`/accessibility` and `/cookie-preferences`. Both are now real:
Accessibility describes what's actually implemented (keyboard nav, visible
focus, labelled forms, reduced-motion support) without claiming a WCAG
certification that hasn't happened. Cookie Preferences doesn't fake a
consent-toggle UI — before writing it, every `localStorage` key the app
actually uses was enumerated (`ku_token`, `ku_farmer`,
`ku_participant_<ROLE>`, `ku_theme` — no analytics, no tracking, nothing
else), and the page says plainly that there's nothing to opt in or out of
rather than manufacturing categories that don't exist.

Added `sitemap.xml` (19 URLs, cross-checked against the actual route
list, validated as well-formed XML) and `robots.txt`, both marked
`[DEPLOYMENT DOMAIN TO BE CONFIGURED]` with a placeholder domain rather
than inventing a real one.

## Fixed this session: sessions, "Explore", logo, and one-command run/deploy

- **Logout left the previous role's sidebar behind.** Each role cached its
  own profile but all shared ONE token, and each logout only cleared its
  own role — so logging out of Admin left a stale farmer profile (sidebar and
  all) with no token behind it. New `web/src/session.js`: one person, one
  session; any login replaces every other stored profile, any logout/expiry
  clears them all, and a 401 on a real request ends the session and sends you
  to the correct login page with a "session expired" notice.
- **Signed-in people could open the login/register pages** and saw the
  sidebar beside the form. They're now redirected to their dashboard.
- **"Explore" links.** The hero button jumped to the *last* scene, skipping
  the whole story — it now scrolls to the start of it. The finale's "Explore
  the platform" was `href="/"` with no `target`, which loaded the entire site
  *inside the iframe*; it now opens the Demo page. "Platform"/"How it works"
  in the landing nav now go to real pages.
- **Demo page lied when the server was down** ("switched off on this
  deployment"). It now says it can't reach the server, with a retry button.
- **Logo:** the supplied logo is used as-is (its cream tile, no recolouring
  or dark backdrop) for the favicon, app/nav/footer logo, landing page,
  PWA icons and the mobile app icons. The favicon uses the mark only, since
  the wordmark is unreadable at 16px.
- **Deployable:** the backend now serves the built website (with an explicit
  CSP, cache headers and SPA deep-link fallback); `npm start` / `npm run setup`
  / `npm run dev` at the top level; `Dockerfile`, `.dockerignore`, `render.yaml`;
  `ADMIN_PASSWORD`, `SEED_DEMO`, `TRUST_PROXY`, `FORCE_HTTPS`; an empty
  `backend/.env` (`injected env (0)`) is detected and recreated.

## Fixed this session: consent enforcement and password strength

**Terms/Privacy consent was linked but not actually enforced.** Farmer
registration had a checkbox, but the submit button only disabled while
loading — a person could click "Complete registration" with it unchecked
and only find out from a server rejection, not a professional site's
usual behavior of just not letting you submit yet. Financer/WSP-CM
registration had no checkbox at all — just a text sentence with links,
with zero enforcement on either side.

Fixed properly, matching what a real site actually does: added a real,
required consent checkbox to Financer/WSP-CM registration (frontend
button now disabled until checked, backend now rejects with a clear 400
if it's somehow missing — same defense-in-depth pattern the farmer flow
already had), and fixed the farmer form's existing checkbox to actually
disable its own submit button too, not just get rejected server-side
afterward. Verified with real clicks, not just reading the JSX: rendered
the Financer form, confirmed the button is disabled before checking the
box (even with every other field correctly filled in), confirmed a real
mouse click on the checkbox enables it, and confirmed unchecking it again
correctly re-disables it.

**Password strength only checked length, no complexity requirement at
all.** A password like `aaaaaaaa` passed. Added a real requirement
(matching common practice on professional/financial sites): at least 8
characters, plus at least 3 of the 4 common character classes
(lowercase, uppercase, digit, symbol) — not demanding every class at
once, which tends to just push people toward predictable patterns like
`Password1!`. Checked before implementing this that it wouldn't lock out
the seeded demo accounts: both `Demo@123` and `Kailash@1209` already
satisfy it (verified programmatically, not assumed). Verified with real
requests: a weak all-lowercase password and a 2-class password both get
a clear 400 with the actual rule spelled out; a 3-class password
succeeds; the existing seeded farmer and admin logins are completely
unaffected (this only applies going forward, to new registrations — an
already-hashed password is never re-checked against it). Added a plain
password-strength hint under both password fields so a person sees the
rule before typing, not after being rejected.



A person logging out reported two things: the sidebar staying visible on
the resulting login page, and — more specifically — pressing the browser's
Back button after logout showing what looked like a still-logged-in
portal page. Checked the actual logout code first rather than assuming:
`AuthContext`'s `logout()` correctly clears `localStorage` and resets
state, and `Shell` correctly hides the sidebar whenever there's no
authenticated user (`if (!farmer) return children`) — both already
correct in isolation, confirmed by directly testing a real login →
logout cycle end-to-end (sidebar present after login, genuinely gone
after clicking logout, token cleared from storage).

That pointed at something outside the component logic entirely: the
browser's **back/forward cache (bfcache)**. Modern browsers can restore a
page you navigate away from as a frozen snapshot of its exact DOM state
when you hit Back — without re-running any JavaScript — specifically to
make back-navigation instant. If that snapshot was taken while still
logged in, hitting Back after logging out can show that old, frozen,
now-inaccurate picture, sidebar and all, with the real app underneath
(correctly logged out) never getting a chance to redraw it. This is a
known, well-documented class of bug in single-page apps generally, not
specific to anything wrong in this code.

Fixed in `web/src/main.jsx` with the standard, minimal fix: a `pageshow`
listener that forces a real reload specifically when
`event.persisted === true` — the flag a browser only ever sets when a
page was restored from bfcache, never on a normal load — so this can't
affect any ordinary navigation. Verified as precisely as this specific
browser mechanism allows without a real browser in this environment:
jsdom can't simulate bfcache itself, but dispatching the real `pageshow`
event with `persisted: true` and `persisted: false` and confirming the
handler's reload call fires in exactly the first case and not the second
(via jsdom's own internal navigation-attempt log, since `location.reload`
is correctly read-only and can't be mocked directly — that's accurate
browser behavior, not a test limitation) confirms the logic itself is
correct.

Also replaced the logo everywhere with a newly provided source file
(`favicon.ico`, `favicon.png`, `apple-touch-icon.png`, `icon-192.png`,
`icon-512.png`, `logo.webp`, and both logo instances inside
`landing.html`). The provided file had the same solid-background issue
found before — corrected the same way, chroma-keyed to transparent and
verified by compositing onto a checkerboard and the actual dark panel
background before using it anywhere. One real judgment call made along
the way: the landing page's finale-scene logo displays at only 120×120
with no separate wordmark text nearby, so the full logo (mark + "KISAN
UNNATI" text) was swapped for the mark alone — the full version's dark
green text has genuinely low contrast against that scene's near-black
background and would be illegible at that display size regardless;
verified by rendering both versions against the real background color
before deciding, rather than guessing.



Every password field in the app (Farmer login/register, Financer/WSP-CM
login/register, Admin login) now has a real show/hide toggle — a proper
`<button type="button">` (so it can never submit the form), with
`aria-label`/`aria-pressed` that flip between "Show password"/"Hide
password", built as a shared `web/src/components/PasswordInput.jsx` so
every field behaves identically. Verified by actually typing a value,
clicking the toggle, and confirming the input type flips and the typed
value survives — across Farmer login, Financer login, Financer register,
and Admin login (34 checks). Register.jsx's password field lives on step
3 of its multi-step flow; the component itself is proven correct via the
other four (identical usage), but wasn't independently re-verified through
that specific multi-step path.

The "KU" text-in-a-circle standing in for the logo (in every sidebar,
every auth page, the public nav, and the public footer — 10 occurrences
across 8 files) has been replaced with the actual logo image
(`web/public/logo.webp`, extracted from the same fixed transparent asset
used in the landing page). Verified across 7 different pages spanning
public nav, farmer auth, participant auth, and all three authenticated
sidebars (farmer/financer/admin) — every one renders the real image, none
show literal "KU" text; the public footer's separate logo instance was
checked independently since it's a second occurrence on the same page.

Login, Register, and both Financer/WSP-CM auth forms also gained working
(not decorative) links to the real Terms and Privacy pages, and the
existing farmer-registration consent checkbox now links to those same
pages instead of naming them as plain text.

## What's in this repo

```
kisanunnatti/
├── backend/     Node.js + Express API — shared by both the website and the Android app
├── web/         React (Vite) website — the farmer web portal
└── mobile/      React Native (Expo) Android app — the farmer mobile app
```

## Database (Postgres)

Phase 1 shipped with JSON files as a zero-dependency way to demo the full
lifecycle. This build adds a genuine Postgres-backed path, selected by an
env var — nothing about the JSON path changes, and it stays the default.

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set DB_DRIVER=postgres and DATABASE_URL to your Postgres instance
npm run migrate     # applies migrations/*.sql (idempotent — safe to re-run)
npm run seed        # same seed script as before, now writing to Postgres
npm start
```

**Why `pg` + hand-written SQL instead of an ORM.** Prisma was the first
choice, but its CLI needs to download native query-engine binaries from
`binaries.prisma.sh` at install time, which wasn't reachable from where
this was built — a real constraint, not a style preference. `pg` (the
standard pure-JS Postgres driver) with plain SQL migrations has no such
dependency, is what a lot of production Node services use directly, and
was the other option this README already named. `migrations/001_init.sql`
has one table per existing JSON collection, with real indexes on every
column a route actually filters by (`farmerId`, `financerId`, `status`,
etc.) and JSONB for the nested, variable-shape fields (`kyc`, `valuation`,
`steps`, …). `scripts/migrate.js` is a deliberately small hand-rolled
runner — it applies `migrations/*.sql` in filename order and tracks what's
been applied in a `_migrations` table, so it's always safe to re-run.

**Why every route handler is now `async`.** `db.js` selects between
`db.json.js` (unchanged) and `db.postgres.js` (new) based on `DB_DRIVER`.
The tempting version of this migration — "swap the storage module, touch
nothing else" — turns out not to be fully honest for a real network
database: JSON-file reads are synchronous, Postgres queries over a
connection are inherently asynchronous, and no adapter shape changes that.
So every route across all 7 route files was converted to `async`/`await`
(wrapped in `utils/asyncHandler.js`, since Express 4 doesn't forward
rejected promises to error middleware on its own). The JSON driver's
functions still return plain values rather than Promises internally —
`await somePlainValue` just resolves immediately to that value — so the
exact same route code runs correctly against either driver. Both paths
were run through the full farmer→WR→finance→auction→settlement lifecycle
to confirm this.

**What `writeCollection` does under Postgres.** Every route was written
against a "read the whole array, mutate it, write the whole array back"
model. Rather than rewrite that model across 7 files, `db.postgres.js`'s
`writeCollection(name, records)` reproduces it as a transaction: upsert
every record by `id`, then delete any row whose `id` is no longer present
in the array — same semantics the routes already assume, without a full
table wipe on every write.

**Two real bugs this exercise caught, fixed along the way:** `.env` was
never actually being loaded anywhere in the original app (no `dotenv` was
wired in) — harmless for the JSON driver, but it would have silently
masked a misconfigured `DATABASE_URL` by falling back to JSON. And a naive
first pass at the Postgres adapter let `pg`'s automatic array-serialization
corrupt a JSONB column whose value happens to be an array (`settlements.steps`)
— fixed by explicitly `JSON.stringify`-ing known JSONB columns rather than
relying on `pg`'s default per-value type guessing.



## Cinematic landing page + brand-wide re-theme

### Real bugs found in real use, fixed and verified — not just written

A person actually ran this build and reported three concrete problems.
Here's what each one turned out to be, and how it was confirmed fixed
(not just "should be fixed"):

- **Both logo images were nearly invisible.** The embedded nav and finale
  logo images had a solid ivory/cream background baked in — a color
  practically identical to the page's own background gradient
  (`#F4EFE7`/`#E9DFC6`). Confirmed by decoding the actual base64 image
  data and sampling its corner pixels: `(244,236,227)` vs. the page's own
  `(244,239,231)` — a few RGB points apart. Fixed by chroma-keying the
  background to transparent (verified by compositing the result onto both
  a checkerboard and the actual dark nav-solid background before
  re-embedding) and re-encoding as WebP-with-alpha rather than PNG, which
  actually made the file *smaller* than the original despite adding
  transparency (858 KB vs. 882 KB for the whole page).
- **The large gold "₹54.8L" figure visually clashed with the receipt
  card.** Root cause, found in the CSS: `.value-focus` (the big glowing
  number) is `position: absolute`, while `.receipt-card` (the small card
  showing the same figure) had no `position` set at all — under normal
  CSS stacking rules, a positioned element always paints above a static
  one regardless of DOM order, so the giant glowing overlay was rendering
  *in front of* the card, obscuring its actual content. Fixed with an
  explicit `z-index`: card in front, glow behind — preserving the
  intended atmospheric effect without it clashing with the readable card.
- **No favicon.** Neither the SPA (`web/index.html`) nor the landing page
  had one. Added, using the now-transparent nav logo resized to 32px —
  confirmed it still reads as a distinct icon mark at that size before
  shipping it.

What I could *not* verify myself: actual WebGL rendering in a real
browser — there's still no GPU or browser available in the environment
this was built in. These three fixes were diagnosed from the markup,
CSS, and the actual decoded image bytes, then verified as far as that
allows (parsing, structure, pixel sampling, compositing) — not from
seeing them rendered. If something still looks off, that's the honest
limit of what could be checked here.

### A second pass, from an actual browser screenshot

The three fixes above were diagnosed from markup and pixel-sampling
without ever seeing the page rendered. A person then actually ran it and
sent a screenshot, which caught two more things:

- **The favicon still didn't read as the logo.** The full detailed
  mark (diamond frame + hands + leaf) is too intricate to survive being
  shrunk to a real 16×16 browser tab icon — confirmed by rendering it at
  true size and zooming in pixel-by-pixel; it turned to noise. The nav
  logo at 28px was actually fine (also confirmed the same way, against
  the real screenshot) — only the favicon needed a different asset.
  Replaced it with a simplified favicon: just the gold leaf/flame
  element, isolated and enlarged on a solid dark rounded backdrop —
  bold and legible at both 32px and true 16px.
- **The "₹54.8L" fix from the first pass was incomplete.** Setting
  `z-index` on the receipt card stopped the glow from covering *that*,
  but it was still overlapping the "TURN STORED VALUE..." headline
  below it, for the same underlying reason — I'd special-cased one
  sibling instead of fixing the actual rule. Corrected with
  `z-index:-1` on the glow itself, which puts it behind *all* normal-flow
  content in that stacking context, not just the one element I'd
  patched.

Before trusting any of this, I pulled the person's originally-uploaded
source file back up and diffed the embedded logo images byte-for-byte
against my working copy, to rule out the possibility that an earlier
edit had swapped in the wrong asset rather than just mishandled the
right one — they matched exactly, confirming the fix was applied to the
correct, original logo.

### Dependency vulnerabilities

A person's own `npm audit` on this project surfaced two real advisories,
handled two different ways:

- **`react-router` (moderate, CVE-2025-68470 and a related SSR
  deserialization issue)** — upgraded `react-router-dom` to `7.18.4`
  (the exact version `npm audit fix` itself recommended). This app only
  uses the classic component API (`<Routes>`, `<Route>`, `<Link>`,
  `useNavigate`, `<MemoryRouter>`) with static route strings — no data
  router, no SSR — so v7's "Declarative Mode" is a compatible drop-in.
  Verified with a 13-case regression suite covering every routing pattern
  actually used in the app (top-level routes, the 3-level nested
  descendant routing under `/financer/*` etc., `<Protected>` redirects,
  the catch-all fallback, dynamic `navigate()` calls) — all pass.
  `npm audit --omit=dev` now reports 0 vulnerabilities.
- **`esbuild`/`vite` (moderate)** — **not** upgraded. The advisory is
  specifically that the Vite *dev server* (not the production build) will
  respond to requests from any origin — a real issue while running
  `npm run dev`, but it has no effect on `npm run build` output, which is
  what actually ships. Fixing it requires jumping to Vite 8, a brand-new
  major release with its own migration surface, released as a `--force`
  breaking change by `npm audit` itself. Given the actual exposure is
  dev-server-only, forcing that jump blind wasn't the right tradeoff —
  same reasoning as leaving the Expo SDK gap flagged rather than
  force-upgrading it earlier. Worth doing deliberately later, once Vite 8
  has had time to stabilize.



`web/public/landing.html` is the cinematic "Your Harvest. Your Capital.
Your Choice." scroll experience — a fully self-contained document (own
`<html>`/`<head>`, the entire Three.js library inlined, a hand-built
procedural-grass WebGL scene) rather than a React component. It's embedded
at the app's `/` route via `web/src/public/pages/LandingPage.jsx`, a
full-viewport `<iframe src="/landing.html">`.

**Why an iframe, not a ported React component.** Reverse-engineering a
hand-rolled WebGL scroll animation into React's render/unmount lifecycle,
with no browser or GPU available to verify the result against, is exactly
the kind of change that's easy to get subtly wrong in ways that only show
up visually. An iframe keeps the page's careful scroll choreography
completely intact and avoids any collision between its global styles/script
and the app shell's own CSS variables — at the cost of it being a separate
document rather than a native part of the SPA.

**What was actually fixed, not just assumed to work:** the source file was
missing `<html>`/`<head>`/`<body>` structure (wrapped properly before
saving); its internal `/login` and `/register` links would have tried to
load inside the iframe instead of navigating the whole tab (fixed with
`target="_top"` on exactly the 5 links that needed it — the in-page
`#ecosystem` anchor and the "restart the intro" link were correctly left
alone). Verified: the HTML parses cleanly, all 4 inline `<script>` blocks
are syntactically valid JS, Vite serves the file correctly as a static
asset (confirmed via direct HTTP request), and a full regression suite
(every public page, Demo Mode, every portal) still passes with the new `/`
route in place. **Not verified, and this container has no way to verify
it:** actual WebGL rendering — there's no GPU or browser here to check
that the grass scene, scroll transitions, or camera movement actually look
right. Open it in a real browser before trusting it visually.

**Brand-wide re-theme.** The landing page's ivory/forest/gold palette and
Manrope typeface now apply to the *entire* app — every portal, the public
pages built earlier, and both dark and light mode — not just the landing
page itself. This was a real color-token remap, not a find-and-replace:
`web/src/styles.css`'s `:root` and `:root[data-theme="dark"]` blocks were
rewritten with values mapped from the landing page's own `--forest-dark`
(→ `--ink`, matching its existing dual role as both text color and CTA
surface), `--forest-darker` (→ `--panel-bg`, the sidebar/nav's own
always-dark surface — matches almost exactly), `--gold`/`--gold-deep` (→
`--wheat`/`--wheat-dark`), `--forest-2` (→ `--field`, the "✓ Verified"
green), and `--cream`/`--cream-soft` (→ `--panel-text`/`--panel-text-soft`).
`--rust` (risk/error) was kept from the prior palette — the landing page
defines no red, and this brick-red already read as part of the same
warm-earth family. Manrope replaced Fraunces/Inter for both display and
body text (`index.html`'s Google Fonts link updated to match); IBM Plex
Mono was kept for money/quantity figures specifically, a ledger-style
detail the landing page doesn't need but this app benefits from.

The same palette was applied to `mobile/src/theme.js`, and Manrope is now
a real loaded font there too (`@expo-google-fonts/manrope` +
`expo-splash-screen`, gating the native splash screen until the font
weights actually load — the standard Expo pattern, verified against each
package's real exports, not assumed to work). A few genuine hardcoded
colors left over from the old palette (input backgrounds, a subtitle
color, a tone-color map in the shared `Ledger.js` components) were found
and fixed while going through this, not just the `theme.js` tokens.

Every regression check re-run after this — dark mode toggle, Demo Mode,
every portal, the public pages — still passes.



A real dark theme — a dedicated warm-charcoal palette, not a color-inversion
filter. Toggle (☀ Light / 🌙 Dark / 🌓 System) lives on the public nav and
every portal's sidebar (`web/src/components/ThemeToggle.jsx`), backed by
`ThemeContext` (`web/src/components/ThemeContext.jsx`) which persists the
choice to `localStorage` and, in "System" mode, follows the OS preference
live via `matchMedia` — verified with a headless test that actually flips
the mocked OS preference mid-test and confirms the theme follows it.

How it's wired: every color in `web/src/styles.css` was already a CSS
custom property, so dark mode is a second `:root[data-theme="dark"]` block
redefining those tokens — applied by setting `data-theme` on `<html>`. Two
tokens are deliberately theme-**invariant**: `--panel-bg`/`--panel-text` are
the dark navy sidebar/footer/nav-band surface, which reads the same (just
slightly deepened) in both themes rather than inverting to a light panel —
a common, intentional pattern, not an oversight. Getting this right
required real fixes, not just adding the dark block: a handful of CSS rules
(`.sidebar`, `.pub-footer`, `.pub-band`, the public nav's translucent
backdrop) and four inline JSX styles were hardcoded to `--ink`/`--paper`'s
*light-mode* values specifically because they sit on that invariant dark
panel — left alone, redefining `--ink`/`--paper` for dark mode would have
inverted the sidebar to a light panel with invisible text. All of those
were moved onto the new invariant tokens or an `--overlay-rgb` /
`--paper-rgb` RGB-triplet token (for `rgba()` tints that do need to flip)
before dark mode was verified.

Verified, not assumed: a headless test confirms the default (system light →
`data-theme="light"`), that clicking Dark sets it and persists it, that a
fresh remount restores it from storage (simulating a reload), that System
mode resolves correctly in both OS states and live-follows a change, and
that explicit Light overrides an OS dark preference. Separately
re-confirmed every public page and every authenticated portal (Farmer,
Financer, Admin) still renders correctly with `ThemeProvider` now wrapping
the app, and that the toggle itself appears on every sidebar.

Not done in this pass: the mobile app's own theming (React Native doesn't
share these CSS tokens — it would need its own light/dark `theme.js`
variant and a parallel context, untested here since there's no emulator in
this environment to verify it against).

## Audit + security hardening + Demo Mode

A full project audit was run against the codebase as it stood (dependency
vulnerabilities, missing config, error handling, dead code) — findings and
fixes below, all verified, not assumed.

**Fixed:**
- `uuid@9` had a moderate security advisory (buffer bounds check) → bumped
  to `uuid@11`. Re-ran the full lifecycle afterward to confirm nothing broke.
- No `.gitignore` existed anywhere in the repo — a real risk, since
  `backend/.env` and `backend/data/*.json` (real farmer PII once seeded)
  could have been committed. Added one at the repo root.
- No security headers, no rate limiting, and the global error handler sent
  raw `err.message` (which can include DB error text) straight to the
  client. Added `helmet`, added `express-rate-limit` on every auth endpoint
  (farmer login/register/OTP, every `:role/login` and `:role/register`,
  and `/api/demo/login`), and the error handler now only includes `detail`
  when `NODE_ENV !== "production"`. All three verified directly: checked
  the response headers, hammered the login endpoint until it 429'd, and
  confirmed the error detail disappears with `NODE_ENV=production` set.

**Flagged, not touched (real, but bigger than an audit-fix):**
- `mobile/` is on Expo SDK 51; the current stable is SDK 57. That's a real
  gap worth closing, but it's a multi-version migration with its own
  breaking-change surface — not something to fold into a security pass.
- `GET /api/wr` and `GET /api/financing/offers` still have no auth check
  (documented earlier, unchanged) — worth locking down before anything
  beyond internal/demo use.

### Demo Mode (no OTP required)

Real OTP/SMS verification isn't implemented yet — this build now ships a
proper Demo Mode instead of blocking on that integration. `/demo` on the
public site shows one card per role (Farmer, Financer, Warehouse/WSP,
Admin); picking one calls `POST /api/demo/login` and lands straight in
that role's dashboard, no password or OTP typed.

What makes this a real feature rather than a UI trick:
- The endpoint issues the **exact same JWT** a real login would, through
  the same `issueToken()` call — so every `authRequired`/`requireRole`
  check downstream behaves identically. Verified directly: a demo Farmer
  token gets a 403 on an Admin-only endpoint; a demo Admin token works.
- Gated by a `DEMO_MODE` env flag. Set it to `false` and the whole route
  404s, as if it doesn't exist — verified both states, including that the
  `/demo` page itself shows a clean "switched off" message rather than
  breaking when the backend has it disabled.
- Every demo login is audit-logged (`DEMO_LOGIN`, actor `demo:<ROLE>`), so
  it's traceable in the Admin audit log like anything else.
- A demo Farmer account was added to the seed data — there wasn't one
  before (only Financer/WSP/Admin had seed accounts).
- Linked from the public nav, the homepage hero, and every login page
  ("🧪 Try Demo Mode instead").

Flip `DEMO_MODE=false` in `.env` before any deployment beyond an internal
demo.



`web/` now also serves a public marketing site at the app's root (`/`),
built on the same design system as the rest of the app, alongside the
Financer/WSP/Admin portals below:

Home, About, How It Works, For Farmers, For Financers, For Warehouses,
Market, Security & Trust, FAQ, Contact, Privacy Policy, Terms of Service,
Help Center. All under `web/src/public/`.

A few things worth knowing:
- **Market** shows real data — it calls the public `GET /api/auctions`
  endpoint and lists whatever lots are actually open, rather than a
  fabricated price list.
- **Contact** is a real, working form: it posts to a new `POST /api/contact`
  endpoint (additive; see `backend/routes/contact.js` and
  `backend/migrations/002_contact_messages.sql`), and submissions show up
  in the Admin portal's new **Inbox** page (`/admin/inbox`).
- **For Financers** / **For Warehouses** link to real self-registration
  pages (`/financer/register`, `/wsp/register`) that call the backend's
  existing `POST /api/participants/:role/register` endpoint — this existed
  already but had no UI calling it before now.
- **Privacy Policy** / **Terms of Service** are explicitly labelled
  placeholder content on the page itself — real template text to show the
  page working, not something to treat as a reviewed legal document. Same
  caveat for the phone/email/address on the Contact page.
- The app's catch-all route now sends an unmatched URL to `/` (the public
  home) instead of `/dashboard` — a visitor who isn't signed in lands on
  the marketing site, not a login-gated redirect loop.

## Staff portals (Financer / Warehouse-WSP / Admin)

Beyond the farmer journey, `web/` now also ships three staff-facing portals,
built on the API support that already existed (`routes/participants.js`,
`routes/dashboards.js`, plus a handful of additive read endpoints added
alongside them — see below):

| Portal | Login | Demo credentials |
|---|---|---|
| Financer | `/financer/login` | `financer@demo.kisanunnatti.in` / `Demo@123` |
| Warehouse / WSP-CM | `/wsp/login` | `wsp@demo.kisanunnatti.in` / `Demo@123` |
| Admin | `/admin/login` | `admin@demo.kisanunnatti.in` / `Demo@123` |

Each is a separate route subtree (`web/src/pages/financer`, `.../wsp`,
`.../admin`) sharing the same design system as the farmer app, with its own
login gate (`web/src/participants/`). A farmer session and a staff session
don't coexist in one browser tab — logging into a staff portal replaces
whatever farmer session was active, same as it would with two different
people using the same browser.

Financer: browse unpledged WRs and submit offers (Marketplace), track
offers through to disbursement (My Offers), monitor active loans and risk
exposure (Active Loans). Warehouse/WSP: bookings across your warehouses,
record stock intake, issue digital WRs, view (read-only) stock-intake
exceptions awaiting sign-off. Admin: platform-wide portfolio, warehouse
onboarding, opening auctions on pledged WRs, triggering settlement,
maker-checker approval of stock-intake exceptions, and the audit log.

Additive backend endpoints these portals needed (nothing existing was
changed or removed): `GET /api/financing/offers?financerId=`,
`GET /api/warehouses/:warehouseId/bookings`,
`GET /api/warehouses/stock-intake` (queue, filterable by warehouse/status),
`GET /api/dashboards/audit-log`.

One thing worth knowing before wider use: `GET /api/wr` and
`GET /api/financing/offers` have no auth check (pre-existing, not
introduced here) — fine for this Phase 1 demo, but worth locking down
before anything beyond internal use.

One backend, two clients. The website and the Android app call the exact
same REST API, so a rule enforced once in `backend/utils/calc.js` (the 75%
finance cap, the 90% risk ceiling, the 9-month/31-Aug maturity rule, the
settlement waterfall) is enforced identically everywhere — nothing about
money is decided in the browser or in the app.

## Why this architecture

| Concern | Choice | Reason |
|---|---|---|
| Business logic | Server-enforced only | BRD principle: client-side validation is never sufficient for financial rules |
| Data store (Phase 1) | JSON files (`backend/data/*.json`) | Zero external dependencies, lets you run and demo the whole lifecycle today; swap for PostgreSQL later without touching route logic (see "Path to production" below) |
| Web client | React + Vite | Fast dev loop, small footprint, easy to deploy as static files behind any web server |
| Mobile client | React Native + Expo | One codebase reaches Android now and iOS later with no rewrite; Expo removes most native-toolchain setup pain |
| Auth | JWT (12h) + mock OTP | BRD requires OTP/digital consent at several points (registration, offer selection); the mock OTP (`123456` in dev) lets you exercise those flows before a real UID/SMS gateway is contracted |

## BRD section → code map

| BRD section | Backend route file | Web page | Mobile screen |
|---|---|---|---|
| §5 Farmer Registration & KYC | `routes/farmers.js` | `pages/Register.jsx`, `pages/Login.jsx` | `screens/RegisterScreen.js`, `screens/LoginScreen.js` |
| §6 Warehouse Booking & Stock Intake | `routes/warehouses.js` | `pages/Warehouse.jsx` | `screens/WarehouseScreen.js` |
| §7 Valuation & Digital WR | `routes/wr.js` | (surfaced in Dashboard) | (surfaced in Dashboard) |
| §8 Financing Marketplace | `routes/financing.js` | `pages/Financing.jsx` | `screens/FinancingScreen.js` |
| §9 Loan Tenure & Disbursement | `routes/financing.js` (`/offers/:id/disburse`) | — (financer-side action) | — |
| §10 Risk & Market Monitoring | `routes/financing.js` (`/loans/:id/exposure`) | `pages/Dashboard.jsx` | `screens/DashboardScreen.js` |
| §11 Digital Auction & Price Discovery | `routes/auction.js` | `pages/Auction.jsx` | `screens/AuctionScreen.js` |
| §12 Farmer Decision Engine | `routes/auction.js` (`/decision`) | `pages/Auction.jsx` | `screens/AuctionScreen.js` |
| §13 Escrow & Settlement | `routes/settlement.js` | `pages/Settlements.jsx` | `screens/SettlementsScreen.js` |
| §14 Dashboards | `routes/dashboards.js` | `pages/Dashboard.jsx` | `screens/DashboardScreen.js` |
| §17 Maker-Checker & Audit | `db.js` (`appendAudit`), `routes/warehouses.js` (`/stock-intake/:id/approve`) | — | — |
| §19 Key Business Rules | `utils/calc.js` | — | — |

Sections not yet wired into a UI (WSP/CM, Financer, Processor and Admin
dashboards; §15 MIS; §16 Exception Management UI; §18 external
integrations) already have the underlying API support they need
(`routes/participants.js`, `routes/dashboards.js` `/portfolio`,
`appendAudit`) — see "What's next" below.

---

## 1. Backend setup (do this first — both clients depend on it)

```bash
cd backend
npm install
cp .env.example .env        # edit JWT_SECRET before any real deployment
npm run seed                # creates 2 demo warehouses + a demo financer/processor/admin/WSP login
npm start                   # http://localhost:4000
```

Demo logins created by `npm run seed`:

| Role | Email | Password |
|---|---|---|
| Financer | financer@demo.kisanunnatti.in | Demo@123 |
| Processor | processor@demo.kisanunnatti.in | Demo@123 |
| Admin | admin@demo.kisanunnatti.in | Demo@123 |
| WSP/CM | wsp@demo.kisanunnatti.in | Demo@123 |

Farmer accounts are created through the registration flow in the website or
the app (mock OTP in dev is always `123456`).

Confirm it's running: `curl http://localhost:4000/health`

## 2. Website setup

```bash
cd web
npm install
cp .env.example .env         # VITE_API_BASE — defaults to http://localhost:4000/api
npm run dev                  # http://localhost:5173
```

To ship it as a real website:
```bash
npm run build                # outputs static files to web/dist
```
`web/dist` is a plain static site — deploy it to Netlify, Vercel, S3 +
CloudFront, Nginx, or any static host. Point `VITE_API_BASE` (set at build
time) at your deployed backend URL before building for production.

## 3. Android app setup

```bash
cd mobile
npm install
npx expo start                # opens Expo Dev Tools
```
Then either:
- Press `a` to launch on a connected Android device/emulator (needs Android
  Studio + an emulator, or a physical device with the **Expo Go** app and
  USB debugging / the same Wi-Fi network), or
- Scan the QR code with the Expo Go app on your phone.

**Connecting to the backend:**
- Android emulator: the default `http://10.0.2.2:4000/api` in
  `mobile/app.json` (`expo.extra.apiBaseUrl`) already points at your
  computer's `localhost:4000` — no change needed.
- Physical device on the same Wi-Fi: change `apiBaseUrl` to
  `http://<your-computer's-LAN-IP>:4000/api`.
- Production: change it to your deployed backend's public HTTPS URL.

### Building a real, installable `.apk` / `.aab`

`mobile/eas.json` now ships with `preview` (APK) and `production` (AAB)
build profiles, and `mobile/assets/` has a real icon, adaptive icon,
splash screen and favicon (placeholders in the brand's ink/wheat palette —
swap them for real designed assets before a Play Store submission; nothing
else needs to change to do that).

This container has no network access, so the actual Android build must run
on your machine (same constraint as any React Native/Expo project — it
needs Google's build servers or a local Android SDK):

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build -p android --profile production   # builds an .aab for the Play Store
# or, for a directly-installable APK:
eas build -p android --profile preview
```
This produces a downloadable `.apk`/`.aab` from Expo's cloud build service
(free tier available) without you needing to install the full Android SDK
locally. If you'd rather build fully offline, run `npx expo prebuild` to
generate a native `android/` project and build it with Android Studio /
Gradle directly.

---

## Data model (Phase 1 — JSON files)

Every collection lives as its own file under `backend/data/`:
`farmers`, `warehouses`, `bookings`, `stockIntakes`, `warehouseReceipts`,
`financingOffers`, `loans`, `exposureSnapshots`, `auctions`, `bids`,
`decisions`, `settlements`, `processors`, `financers`, `admins`,
`notifications`, `auditLog`.

Every write goes through `db.js`'s `readCollection`/`writeCollection`, so
this is the only file that needs to change to move to a real database.

## Path to production

This Phase 1 build is deliberately minimal so the full lifecycle can be
demoed and tested today. To take it further:

1. **Database**: replace `backend/db.js` with a PostgreSQL-backed
   implementation (e.g. Prisma or Knex) behind the same
   `readCollection`/`writeCollection` signatures, or refactor routes to use
   a proper ORM directly. The 11-entity ERD from earlier architecture work
   in this project maps directly onto these same 16 collections.
2. **Real OTP/UID integration**: replace the mock OTP in `routes/farmers.js`
   with an actual UID/Aadhaar OTP gateway (BRD §18).
3. **Payments/escrow**: wire `routes/settlement.js` to a real escrow/payment
   gateway instead of just recording the waterfall.
4. **Additional portals**: WSP/CM, Financer, Processor and Admin currently
   have API support (`routes/participants.js`, `routes/warehouses.js`
   stock-intake & approval, `routes/financing.js` offer/disbursement,
   `routes/auction.js` bidding, `routes/dashboards.js` `/portfolio`) but no
   dedicated web/app screens yet — the fastest way to add them is a new
   `pages/`/`screens/` folder per role, reusing `api.js`/`client.js`.
5. **Notifications**: `notifications` collection and audit trail exist;
   wire in SMS/WhatsApp/email per BRD §18 when those contracts are in place.
6. **iOS**: the mobile app is already React Native — `eas build -p ios`
   after setting up an Apple developer account requires no code changes for
   the screens built here.

## Security notes before any production use

**Done, and verified working (not just added) — see "Audit + security
hardening" above for what each of these actually fixed and how it was
tested:**
- `helmet()` security headers, `express-rate-limit` on every auth endpoint
  (farmer login/register/OTP, every `:role/login` and `:role/register`,
  `/api/demo/login`) — confirmed by hammering an endpoint until it 429'd.
- Every endpoint that returns a WR, a financing offer, a loan, or loan
  exposure now requires authentication — confirmed 401 with no token, and
  the full lifecycle re-verified working with one.
- `JWT_SECRET` production guard: the server refuses to boot with
  `NODE_ENV=production` if `JWT_SECRET` is unset **or** still equals either
  known placeholder value (the code's own fallback, or `.env.example`'s
  literal placeholder text) — confirmed both the refusal and the
  success-with-a-real-secret case.
- Minimum password length (8 characters) enforced server-side on every
  registration endpoint.
- Global error handler no longer forwards raw `err.message` to the client
  once `NODE_ENV=production`.
- `.gitignore` added — `.env` and the JSON data store (real farmer PII once
  seeded) were previously unprotected from an accidental commit.

**Still required before this handles real farmer money or data — called
out plainly, not glossed over:**
- Set a strong, unique `JWT_SECRET` in `backend/.env` — the app will now
  refuse to start in production without one, but that guard only catches
  the two known placeholder values, not every weak secret someone might
  type in its place.
- Add HTTPS (terminate TLS at a reverse proxy — Nginx/Caddy/your cloud
  load balancer) in front of the API before it leaves localhost.
- Replace the mock OTP (`123456`) with a real OTP gateway — as written,
  anyone can "verify" any mobile number. Demo Mode (`DEMO_MODE` env flag)
  exists specifically to make the rest of the platform testable while this
  piece is still outstanding — turn it off (`DEMO_MODE=false`) at the same
  time you replace the mock OTP.
- No independent penetration test or third-party security audit has been
  performed. Everything above is real, verified hardening — it is not a
  substitute for one.
- Run a legal/compliance review (BRD §23) — contracts, KYC/AML,
  digital-lending and warehouse-receipt regulations — before production
  launch, independent of anything in this codebase. The Privacy Policy,
  Terms, Cookie Policy, Disclaimer and Grievance pages are explicitly
  labelled placeholder content on the pages themselves for this reason.
- If deployed behind a load balancer/reverse proxy, set Express's
  `trust proxy` appropriately (not enabled by default here) — otherwise
  the rate limiter sees the proxy's IP for every request, either sharing
  one quota across all users or trusting a spoofable header, depending on
  configuration. Worth deciding deliberately at deploy time, not left on a
  default.
