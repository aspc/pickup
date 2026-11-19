# PICKUP Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle every PICKUP screen into the approved navy + sage, ASPC-family design system without changing any behavior.

**Architecture:** Colors, fonts, radii and shadows become semantic tokens (CSS variables in `globals.css`, mapped in `tailwind.config.js`). A small shared UI kit in `src/components/ui/` is built once, then every page is migrated onto it. A guard test fails while any file still uses raw Tailwind palette classes or hex colors; each migration task removes its files from the guard's legacy allowlist, and the final task asserts the allowlist is empty.

**Tech Stack:** Next.js 15 App Router, React 18, Tailwind 3.3, Radix (popover, tooltip, scroll-area), react-day-picker 10, lucide-react, Jest + Testing Library, pnpm.

**Spec:** `docs/superpowers/specs/2026-10-28-frontend-redesign-design.md`

## Global Constraints

- Palette tokens only: `navy #13294B`, `sage #3E7C6B`, `sage-tint ~#E3EDE8`, `paper #F7F5F0`, `card #FFFFFF`, `stone ~#6B7280` family, `line ~#E7E3DA`, `danger ~#B42318` + tint. Optional `warning` (amber) only for a real pending-action state. No raw Tailwind color scales or hex values in `src/` outside `globals.css` and `tailwind.config.js`.
- Fonts: Inter for body/UI, Playfair Display for h1 / hero headlines only. Both via `next/font/google`.
- No gradients, blobs, floating shapes, pulsing or bouncing decoration. Motion 150-200ms, respects `prefers-reduced-motion`.
- Behavior, routes, API calls, Supabase queries and copy meaning are unchanged.
- Keep name PICKUP and existing logo files; logo sits on a white rounded tile in the navy header.
- Light theme only.
- WCAG AA contrast, visible focus rings (sage), 44px min touch targets on mobile.
- Student pages: centered column, max ~640-720px. Info pages: prose width. Admin: full width.
- Prettier config in repo (no semicolons, single quotes, 2 spaces). No em dashes anywhere.
- CI must pass: `pnpm type-check`, `pnpm knip`, `pnpm knip:production`, `pnpm lint`, `pnpm test:ci`, `pnpm build`.
- Keep `.animate-spin` on the admin loading indicator (asserted in `AdminDashboard.test.tsx:412`).
- All work on branch `redesign/frontend`, one commit per task, one PR at the end.

## Review Focus

1. Long content on phones (long names, long pickup locations, 6-person groups, many comments): text must wrap or truncate, never overflow the 360px viewport. Each page task's E2E step checks at 360px as well as 390px.
2. Keyboard and screen-reader use of rebuilt interactive pieces (mobile menu, modal, accordion, date picker): focus moves in and back out, Escape closes, labels announced. Pinned by tests in Task 2 and Task 3.
3. Loading, empty and error states of every data page (results with no matches, unmatched with none, admin with no rides, Supabase error): each must use the kit's `Spinner` / `EmptyState` / `Alert`, not a blank screen. Checked in each page task's E2E step by forcing the state with seed data or offline mode.
4. Status meaning: matched, waiting/unmatched, cancelled, ready, and delayed must always map to the same badge tone everywhere. Pinned by the `StatusBadge` mapping test in Task 2.
5. Signed-out and non-admin access: header must never flash admin links to non-admins, and protected pages must look right while auth resolves. Pinned by Header tests in Task 3.

---

## File Structure

New:

- `src/styles/noRawColors.test.ts` - guard test with `LEGACY_FILES` allowlist
- `src/components/ui/Button.tsx` - `Button`, `ButtonLink`
- `src/components/ui/Field.tsx` - `Field`, `Input`, `Textarea`, `Select`, `Checkbox`
- `src/components/ui/Card.tsx` - `Card`, `CardHeader`, `CardBody`, `CardFooter`
- `src/components/ui/StatusBadge.tsx` - `Badge`, `StatusBadge`, `rideStatusTone`
- `src/components/ui/Alert.tsx`
- `src/components/ui/Modal.tsx`
- `src/components/ui/Accordion.tsx`
- `src/components/ui/PageHeader.tsx` - `PageHeader`, `PageContainer`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/Spinner.tsx`
- `src/components/ui/RideTicket.tsx` - boarding-pass card
- `src/components/ui/ui.test.tsx` - kit tests
- `src/components/ui/RideTicket.test.tsx`
- `src/components/PickupHeader.test.tsx`

Modified: `tailwind.config.js`, `src/app/globals.css`, `src/app/layout.tsx`, `package.json`, `.gitignore`, every page and component listed in the spec's Scope.

Removed: `src/providers/ThemeProvider.tsx` (if nothing else imports it), `src/components/results/EmptyState.tsx` (replaced by kit), `src/components/buttons/*` (replaced by `ButtonLink` / nav links) once unused.

---

### Task 1: Tokens, fonts, dependency cleanup, guard test

**Files:**

- Create: `frontend/src/styles/noRawColors.test.ts`
- Modify: `frontend/tailwind.config.js`, `frontend/src/app/globals.css`, `frontend/src/app/layout.tsx`, `frontend/package.json`, `.gitignore`
- Remove: `frontend/src/providers/ThemeProvider.tsx`

**Interfaces:**

- Produces Tailwind color names: `navy` (`DEFAULT`, `50`..`900` tonal steps, `foreground`), `sage` (`DEFAULT`, `tint`, `strong`, `foreground`), `paper`, `card`, `ink` (body text, = navy-ish), `stone` (`DEFAULT` muted text, `light` placeholder), `line`, `danger` (`DEFAULT`, `tint`, `foreground`), optional `warning` (`DEFAULT`, `tint`). Keep shadcn aliases `background`, `foreground`, `border`, `input`, `ring`, `primary`, `muted`, `accent`, `destructive`, `popover` pointing at those tokens so Radix-based files keep working.
- Produces font families: `font-sans` (Inter, CSS var `--font-inter`), `font-display` (Playfair Display, `--font-playfair`).
- Produces `borderRadius`: `lg` 12px (cards), `md` 9px (controls), `sm` 6px.
- Produces `LEGACY_FILES: string[]` in the guard test, which later tasks shrink.

- [ ] **Step 1:** Create branch `redesign/frontend` from `main`. Add `.superpowers/` to root `.gitignore`.
- [ ] **Step 2:** Start the app with `./start.sh`, sign in as a seeded student and a seeded admin, and save "before" screenshots of every route at 390px and 1440px to the scratchpad (not the repo). These are the reference for "behavior unchanged".
- [ ] **Step 3: Write the guard test** `noRawColors.test.ts`. It globs `src/**/*.{ts,tsx}` (excluding `*.test.*`, `database.types.ts`) and fails for any file not in `LEGACY_FILES` that matches either regex:
  - `/\b(?:bg|text|border|ring|from|via|to|fill|stroke|outline|divide|placeholder|shadow|decoration|accent|caret)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/`
  - `/#[0-9a-fA-F]{3,8}\b/` inside a `className`, `style`, or `color=` value (ignore `#` in URLs and comments by matching only within quotes/backticks on lines containing `className`, `style`, or `color`).
  - Also fails for any file that matches `bg-gradient-` or `animate-(?:float|gradient-x|pulse|bounce)`.
  - Second test: `it('legacy allowlist only lists files that still violate')` fails if a listed file is now clean (forces shrinking the list).
  - Initialize `LEGACY_FILES` with every currently violating file (generate the list by running the matcher once).
- [ ] **Step 4:** Run `pnpm test -- noRawColors`. Expected: PASS (allowlist covers today's violations). Temporarily add `text-teal-500` to a clean file and confirm it FAILS, then revert.
- [ ] **Step 5:** Replace tokens in `globals.css` (`:root` HSL vars for the palette above, `body` uses `bg-paper text-ink font-sans antialiased`, a `:focus-visible` base ring in sage, `@media (prefers-reduced-motion: reduce)` disabling transitions/animations). Delete `fade-in-up`, `gradient-x`, `float` keyframes and their utility classes only after Task 5 removes their last use (leave a note in the task log until then). Keep the `cecil-arc` spinner CSS.
- [ ] **Step 6:** Rewrite `tailwind.config.js` without `withMT`; add the color, font and radius tokens above; keep `tailwindcss-animate`.
- [ ] **Step 7:** In `layout.tsx` load Inter and Playfair Display via `next/font/google` with `variable` option, drop Geist and `ThemeProvider`, set NextTopLoader color to sage `#3E7C6B` (the one allowed hex outside CSS: add `layout.tsx` to a `TOKEN_FILES` exemption in the guard, with a comment). `pnpm remove @material-tailwind/react geist next-themes` (FAQ keeps working until Task 12 only if it is migrated in the same commit, so migrate the FAQ accordion import to a temporary plain `<details>` here and finish styling in Task 12).
- [ ] **Step 8:** Run `pnpm type-check && pnpm lint && pnpm test:ci && pnpm knip && pnpm build`. Expected: all pass.
- [ ] **Step 9:** Commit `Add design tokens, fonts and raw color guard`.

### Task 2: Shared UI kit

**Files:**

- Create: the `src/components/ui/` files listed in File Structure (except `RideTicket`), `src/components/ui/ui.test.tsx`
- Modify: `src/components/ui/popover.tsx`, `tooltip.tsx`, `scroll-area.tsx`, `date-picker.tsx` (token restyle only)

**Interfaces (Produces):**

- `Button(props: ButtonHTMLAttributes & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'; size?: 'sm' | 'md' | 'lg'; loading?: boolean; fullWidth?: boolean })`. `primary` = navy fill, `accent` = sage fill, `secondary` = white + line border, `ghost` = text only, `danger` = danger fill. `loading` shows `Spinner` and sets `disabled` + `aria-busy`.
- `ButtonLink(props: LinkProps & same variant/size/fullWidth & { children })` - Next `Link` styled as button.
- `buttonClasses({ variant, size, fullWidth }): string` - exported for non-button elements.
- `Field({ label, htmlFor, hint?, error?, required?, children })`; `Input`, `Textarea`, `Select` forward refs, accept `invalid?: boolean` (sets `aria-invalid` and danger border); `Checkbox({ label, ...input })`.
- `Card({ as?, padded?: boolean, className, children })`, `CardHeader({ title, description?, action? })`, `CardBody`, `CardFooter`.
- `type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info'`; `Badge({ tone, dot?: boolean, children })`.
- `type RideStatus = 'matched' | 'ready' | 'waiting' | 'unmatched' | 'cancelled' | 'delayed' | 'past'`; `rideStatusTone(status: RideStatus): BadgeTone`; `StatusBadge({ status, label? })` (default labels: Matched, Ready, Waiting, Unmatched, Cancelled, Delayed, Past).
- `Alert({ tone: 'info' | 'success' | 'warning' | 'danger', title?, children, action? })` with `role="alert"` for danger/warning, `role="status"` otherwise.
- `Modal({ open, onClose, title, description?, children, footer?, size?: 'sm' | 'md' | 'lg' })` - portal, `role="dialog"`, `aria-modal`, labelled by title, Escape and backdrop click call `onClose`, focus moves into the dialog on open and returns to the previously focused element on close, body scroll locked while open.
- `Accordion({ items: { id: string; title: ReactNode; content: ReactNode }[]; defaultOpenId?: string })` - buttons with `aria-expanded` / `aria-controls`.
- `PageContainer({ width?: 'narrow' | 'prose' | 'wide' | 'full', children })` (narrow = max-w-2xl, prose = max-w-3xl, wide = max-w-6xl, full = none, all with `px-4 sm:px-6`), `PageHeader({ eyebrow?, title, description?, actions? })` (title in `font-display`).
- `EmptyState({ icon?: LucideIcon, title, description?, action? })`.
- `Spinner({ size?: 'sm' | 'md' | 'lg', label?: string })` - uses `animate-spin`, `role="status"`, visually hidden label default "Loading".

- [ ] **Step 1: Write failing tests** in `ui.test.tsx`:
  - `rideStatusTone`: `matched`→`success`, `ready`→`success`, `waiting`→`neutral`, `unmatched`→`neutral`, `past`→`neutral`, `cancelled`→`danger`, `delayed`→`warning`.
  - `Button loading` renders `aria-busy="true"`, is disabled, and contains `role="status"`.
  - `Input invalid` sets `aria-invalid="true"`; `Field` associates label with input (`getByLabelText('Email')` returns the input) and renders `error` text linked by `aria-describedby`.
  - `Modal`: when `open`, `getByRole('dialog', { name: 'Title' })` exists; pressing Escape calls `onClose`; focus is inside the dialog after open; on rerender with `open=false`, focus returns to the trigger button.
  - `Accordion`: clicking a title toggles `aria-expanded` from `false` to `true` and shows content; only `defaultOpenId` is open initially.
  - `Alert tone="danger"` has `role="alert"`.
- [ ] **Step 2:** Run `pnpm test -- ui.test`. Expected: FAIL (modules not found).
- [ ] **Step 3:** Implement the components to the interfaces above using `cn` from `@/utils/tailwind` and only token classes. Restyle popover/tooltip/scroll-area/date-picker with tokens (day picker: selected day navy, today ring sage, disabled stone-light).
- [ ] **Step 4:** Run `pnpm test -- ui.test`. Expected: PASS.
- [ ] **Step 5:** Build a temporary unlisted route `src/app/_kit/page.tsx` showing every component and state; inspect it in Chrome at 360px and 1440px for spacing, alignment, focus rings, contrast; fix issues; delete the route.
- [ ] **Step 6:** Run full CI command set from Task 1 Step 8. Commit `Add shared UI kit`.

### Task 3: Header, footer, sign-in modal

**Files:**

- Modify: `src/components/PickupHeader.tsx`, `src/components/PickupFooter.tsx`, `src/components/SignInModal.tsx`
- Create: `src/components/PickupHeader.test.tsx`
- Remove: `src/components/buttons/SimpleRedirectButton.tsx`, `RedirectButton.tsx` once no imports remain (check with `pnpm knip`)

**Interfaces:**

- Consumes: `Modal`, `Button`, `buttonClasses` from Task 2; `useAuth()` (`user`, `avatarUrl`, `isAdmin`, `signOut`, `signInWithGoogle`).
- Produces: `NavLink({ href, children, variant: 'header' | 'mobile' | 'footer', onNavigate? })` in `src/components/NavLink.tsx`, preserving `SimpleRedirectButton`'s behavior: `aria-current="page"` when active (exact or prefix match), click on current exact route is prevented.

- [ ] **Step 1: Write failing tests** (mock `useAuth`, `next/navigation`):
  - Signed-out: no "Dashboard" link; "Sign in" button present; clicking profile area opens dialog named "Sign in".
  - Non-admin signed-in: no "Dashboard" link in the DOM at all (not just hidden).
  - Admin: "Dashboard" link to `/admin` present.
  - Mobile menu: toggle button has `aria-expanded`, opening it shows nav links, pressing Escape closes it and returns focus to the toggle.
  - With pathname `/results`, the Results link has `aria-current="page"`.
- [ ] **Step 2:** Run, expect FAIL.
- [ ] **Step 3:** Rebuild header: navy bar (`h-16`), left: logo on white `rounded-lg` tile + "PICKUP" wordmark with "by ASPC" small caps in navy-200; desktop nav (`md:` and up) with Forms, Results, About, FAQ, and Dashboard for admins, sage underline for active; right: avatar button (profile) or "Sign in" secondary-on-navy button; mobile: hamburger opening a full-height paper sheet with large links and sign out. Remove the "always rendered but invisible" Dashboard trick; reserve layout width instead to avoid shift. Footer: paper with top hairline, links About, Contact, FAQ, ASPC Info, and "PICKUP is a service of the Associated Students of Pomona College". SignInModal uses `Modal` + Google button (`Button variant="primary"`).
- [ ] **Step 4:** Run tests, expect PASS. Remove header/footer/SignInModal from `LEGACY_FILES`; guard passes.
- [ ] **Step 5:** E2E in Chrome at 360, 390, 768, 1440 as signed-out, student, admin. Check no layout shift when auth resolves.
- [ ] **Step 6:** CI set, commit `Redesign header, footer and sign-in modal`.

### Task 4: Boarding-pass RideTicket

**Files:**

- Create: `src/components/ui/RideTicket.tsx`, `src/components/ui/RideTicket.test.tsx`

**Interfaces (Produces):**

- `RideTicket({ date: string | null, time: string | null, airport: string, toAirport: boolean, status: RideStatus, stub?: ReactNode, children?: ReactNode, timeLabel?: string })`.
- Origin/destination codes: campus code is `CLA` (label "Claremont"); `toAirport` true → `CLA` then airport, false → airport then `CLA`. Time is formatted with existing `formatTime12Hour` from `@/utils/formatTime`; date shown as `Fri, Dec 12` using the parse approach in `date-picker.tsx` (no UTC shift).
- `children` render below the route (details, actions); `stub` renders below the dashed perforation.

- [ ] **Step 1: Write failing tests:** `toAirport=true, airport='LAX'` renders codes in order `CLA`, `LAX`; `toAirport=false, airport='ONT'` renders `ONT`, `CLA`; `date='2026-12-12'` renders `Sat, Dec 12` regardless of TZ (run with `TZ=America/Los_Angeles` and `TZ=UTC` via `process.env.TZ` in test); `status='matched'` renders a `StatusBadge` with text Matched; route has an accessible label like "Claremont to LAX".
- [ ] **Step 2:** Run, expect FAIL. **Step 3:** Implement per spec's signature element description; codes `text-2xl font-semibold tracking-wide tabular-nums`; dashed line `border-dashed border-line`; perforation: dashed top border plus two paper-colored half-circle notches at the edges. Long `stub` text wraps. **Step 4:** Run, expect PASS.
- [ ] **Step 5:** Commit `Add boarding-pass RideTicket`.

### Task 5: Home and error page

**Files:** Modify `src/app/page.tsx`, `src/app/error.tsx`.

- [ ] **Step 1:** Rebuild home keeping `handleGetStarted` logic untouched: paper hero (eyebrow in sage, Playfair headline "Split the ride to the airport.", supporting copy keeping the "$100+" message, primary CTA "Sign in with Google" / "Get started"), a three-step "How it works" row (Submit your flight → We match you → Ride together) with lucide icons in navy on sage-tint tiles, then a short ASPC subsidy/info strip linking to `/aspc-info`, and an FAQ link. No full-viewport-height hero on mobile; content starts above the fold.
- [ ] **Step 2:** Error page: `PageContainer narrow` + `EmptyState` with retry `Button` calling `reset`.
- [ ] **Step 3:** Remove both from `LEGACY_FILES`; delete now-unused `fade-in-up`/`gradient-x`/`float` CSS (grep first). Guard + CI pass.
- [ ] **Step 4:** E2E: signed-out CTA triggers Google sign-in, signed-in with incomplete profile routes to `/profile`, complete to `/questionnaires`. Check 360/390/1440.
- [ ] **Step 5:** Commit `Redesign home and error page`.

### Task 6: Profile

**Files:** Modify `src/app/profile/page.tsx`.

- [ ] **Step 1:** Restyle with `PageContainer narrow`, `PageHeader`, `Card` sections, `Field`/`Input`/`Select`, avatar upload area, `Button` loading states, `Alert` for save success/error. Keep every handler, validation, and state variable.
- [ ] **Step 2:** Remove from `LEGACY_FILES`; guard + CI pass.
- [ ] **Step 3:** E2E: edit and save each field, trigger a validation error, upload avatar, check header avatar refresh; 360/390/1440.
- [ ] **Step 4:** Commit `Redesign profile page`.

### Task 7: Flight forms

**Files:** Modify `src/components/forms/FlightForm.tsx`, `src/app/questionnaires/page.tsx`, `src/app/matchForm/page.tsx`, `src/app/editForm/[flight_id]/page.tsx`, `src/components/questionnaires/ConfirmCancel.tsx`, `ManyBagsNotice.tsx`, `SubmitSuccess.tsx`.

- [ ] **Step 1:** While restyling `FlightForm.tsx`, split presentational sections into `src/components/forms/flight-form/` files (one per visual section, e.g. `TripSection.tsx`, `TimeWindowSection.tsx`, `LuggageSection.tsx`, `PreferencesSection.tsx`, `ReviewSection.tsx`), each receiving values and callbacks as props; state, validation and submit logic stay in `FlightForm.tsx`. Use `Field` components, `DatePicker`, segmented control for to/from airport built from `buttonClasses`, sticky bottom submit bar on mobile.
- [ ] **Step 2:** Questionnaires list: each submitted flight as a `RideTicket` with status (`waiting` / `matched` / `past`) and edit/cancel actions; `ConfirmCancel` uses `Modal`; `ManyBagsNotice` uses `Alert warning`; `SubmitSuccess` uses `EmptyState`-style success panel.
- [ ] **Step 3:** Remove all listed files from `LEGACY_FILES`; guard + CI pass (including `flightValidation` and `studentCommands` tests untouched).
- [ ] **Step 4:** E2E: submit a new flight (to and from airport), trigger each validation error, edit an existing flight, cancel one, many-bags notice; deadline-closed state; 360/390/1440.
- [ ] **Step 5:** Commit `Redesign flight forms and questionnaires`.

### Task 8: Results

**Files:** Modify `src/app/results/page.tsx`, `src/app/results/layout.tsx`, `src/components/results/MatchCard.tsx`, `CommentSection.tsx`, `ConfirmCancelMatch.tsx`. Remove `src/components/results/EmptyState.tsx` in favor of the kit.

- [ ] **Step 1:** `MatchCard` renders `RideTicket` (status from `isGroupReady`/`upcoming`), group members as avatar list with names and contact links, voucher and Uber type in the stub, add-to-calendar and airport address actions as `Button secondary sm`, cancel via `ConfirmCancelMatch` on `Modal`. Upcoming and past sections with headings. `CommentSection` as a simple thread inside the card.
- [ ] **Step 2:** Remove files from `LEGACY_FILES`; guard + CI pass.
- [ ] **Step 3:** E2E with seeded matches: upcoming + past, ready group, 6-person group, long names, comment post, calendar download, cancel; no-match empty state; 360/390/1440.
- [ ] **Step 4:** Commit `Redesign results`.

### Task 9: Unmatched and match requests

**Files:** Modify `src/app/unmatched/page.tsx`, `src/app/unmatched/layout.tsx`, `src/app/MatchRequestsPage/page.tsx`.

- [ ] **Step 1:** Unmatched flights as `RideTicket status="unmatched"`; other riders list as compact cards; request actions as `Button`; info `Alert` explaining next steps. Same for match requests page.
- [ ] **Step 2:** Guard + CI. **Step 3:** E2E with `NEXT_PUBLIC_ENABLE_MATCH_REQUESTS` both `true` and `false`; empty state; 360/1440. **Step 4:** Commit `Redesign unmatched and match requests`.

### Task 10: ASPC delay and ready flows

**Files:** Modify `src/app/aspc-delay/page.tsx`, `src/app/aspc-delay/[rideId]/page.tsx`, `src/components/aspc-delay/*.tsx`, `src/app/aspc-ready/page.tsx`.

- [ ] **Step 1:** Multi-step delay flow gets a step indicator (numbered, navy current, sage done), one `Card` per step, sticky back/next bar on mobile, `RideTicket status="delayed"` summary. Ready page: large clear confirm action, group summary as `RideTicket status="ready"`.
- [ ] **Step 2:** Guard + CI. **Step 3:** E2E through every delay step, including validation errors and the new-flight step; ready confirmation; 360/1440. **Step 4:** Commit `Redesign ASPC delay and ready flows`.

### Task 11: Feedback

**Files:** Modify `src/app/feedback/page.tsx`, `src/components/feedback/StarRating.tsx`.

- [ ] **Step 1:** Form in `Card`s with `Field`s; `StarRating` stars in navy filled / line outline, keyboard operable as a radio group (`role="radiogroup"`, arrow keys). Add a test in `src/components/feedback/StarRating.test.tsx`: arrow right increases selection, each star has an accessible name "N stars".
- [ ] **Step 2:** Run test, FAIL, implement, PASS. Guard + CI. **Step 3:** E2E submit; 360/1440. **Step 4:** Commit `Redesign feedback`.

### Task 12: Info pages

**Files:** Modify `src/app/about/page.tsx`, `contact/page.tsx`, `faq/page.tsx`, `aspc-info/page.tsx`, `aspc-fees/page.tsx`, `aspc-policy/page.tsx`.

- [ ] **Step 1:** `PageContainer prose` + `PageHeader`; consistent prose styles (headings, lists, tables for fees using `line` borders, callouts as `Alert`). FAQ uses `Accordion`. About keeps `teampic.jpg` with rounded corners.
- [ ] **Step 2:** Guard + CI. **Step 3:** E2E read-through at 360/1440, check tables don't overflow (wrap in horizontal scroll container on mobile). **Step 4:** Commit `Redesign info pages`.

### Task 13: Admin dashboard

**Files:** Modify `src/app/admin/layout.tsx`, `src/components/admin/AdminDashboard.tsx`, `AddRider.tsx`, `EmailComposerModal.tsx`.

- [ ] **Step 1:** `PageContainer full`, admin sub-nav (Dashboard, Groups) as tabs, stat tiles as `Card`s, tables with sticky header, zebra-free rows separated by `line`, compact `Badge`s, `Button size="sm"`. `EmailComposerModal` on `Modal size="lg"`. Keep `.animate-spin` loading indicator (via `Spinner`).
- [ ] **Step 2:** Run `pnpm test -- AdminDashboard`; update only selectors that targeted removed classes, never assertions. Guard + CI.
- [ ] **Step 3:** E2E as admin at 1440 and 1024: add rider, compose email (do not send to real addresses; local DB only), filters, loading/empty states. **Step 4:** Commit `Redesign admin dashboard`.

### Task 14: Admin groups management

**Files:** Modify `src/components/admin/GroupsManagement.tsx` and every `.tsx` under `src/components/admin/groups-management/`.

- [ ] **Step 1:** Restyle panels (`FiltersPanel`, `UnmatchedRidersPanel`, `MatchedGroupsPanel`, `CorralPanel`, `CreateGroupPanel`, `ChangesPanel`, `ChangeLogPanel`, `GroupsManagementModals`) with kit components and tokens. Groups shown as compact cards (route codes, time, members, voucher); drag/select states in sage-tint; destructive actions danger. Keep density: no larger than current row heights.
- [ ] **Step 2:** Run `pnpm test -- GroupsManagement UnmatchedRidersPanel`; selector-only updates. Guard + CI.
- [ ] **Step 3:** E2E as admin at 1440: filter, create group, move rider, corral, view changes and change log, export. **Step 4:** Commit `Redesign admin groups management`.

### Task 15: Final sweep and PR

**Files:** Modify `src/styles/noRawColors.test.ts`, any stragglers.

- [ ] **Step 1:** Add assertion `expect(LEGACY_FILES).toEqual([])`; fix any remaining files. Remove unused components/exports flagged by `pnpm knip` and `pnpm knip:production`.
- [ ] **Step 2:** Full CI set passes; `pnpm format-check` passes; `grep -rn "—" src` returns nothing.
- [ ] **Step 3:** Full E2E pass of every route as signed-out, student and admin at 360, 390 and 1440, compared against the "before" screenshots for missing features. Fix anything off, however small.
- [ ] **Step 4:** Commit, push branch, open PR to `main` with a summary and before/after screenshots (no Claude attribution).
