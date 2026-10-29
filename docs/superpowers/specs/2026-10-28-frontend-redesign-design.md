# PICKUP frontend redesign - design

Date: 2026-10-28
Status: draft, awaiting approval

## Intent

PICKUP groups Claremont students into shared airport rides. The current frontend works but looks unfinished: a teal-to-pale-yellow gradient header and footer, floating blobs, pulsing text, and raw Tailwind teal / blue / indigo / yellow / red used with no shared meaning. Two styling systems coexist (shadcn-style CSS tokens that are mostly unused, plus Material Tailwind).

The redesign should make PICKUP look like a member of the ASPC family (see `../aspc-website-v2`) while keeping its own personality, with a **clean and natural** feel. All existing functionality stays exactly as it is.

## Users and devices

- **Students, mostly on phones.** Every student screen is designed mobile-first and must look excellent at 360-430px wide, then scale up.
- **Admins, on laptops.** Admin screens are designed for 1280px+ first, using the same tokens and components but denser layouts. They must remain usable (not necessarily pretty) on tablets.

## Goals

1. One small, disciplined palette, enforced through tokens. No page may use raw Tailwind color scales (`teal-500`, `blue-600`, `gray-700`, ...) or hex values.
2. Visual kinship with ASPC: navy header, Inter body text, Playfair Display headings, white surfaces.
3. PICKUP's own identity through the sage accent and the boarding-pass ride card.
4. A shared component set (button, input, select, textarea, card, badge, modal, alert, page header, empty state, etc.) used by every page, so the look stays consistent and future pages inherit it.
5. Pixel-level polish: consistent spacing scale, alignment, focus states, hover/active states, loading and empty states, no layout shift.

## Non-goals

- No changes to behavior, data flow, routes, API routes, Supabase queries, auth, edge functions, or the ML pipeline.
- No rename and no new logo. Keep the name **PICKUP** and the current logo files (`/favicon.png`, `/favicon.ico`).
- No dark mode in this pass (no page uses `dark:` today). Light theme only.
- No new features.

## Anti-goals (failure even if it "works")

- Gradients, glowing blobs, floating shapes, pulsing or bouncing decorative text, rainbow of accent colors.
- A generic "AI template" look: centered hero with emoji, purple gradients, glassmorphism.
- Any regression in a student or admin flow, or any change in copy meaning.
- Admin tables and panels becoming less information-dense or slower to work in.

## Visual system (decided)

### Palette

| Token                | Value                                  | Use                                                          |
| -------------------- | -------------------------------------- | ------------------------------------------------------------ |
| `navy` (primary)     | `#13294B`                              | Header bar, headings, primary buttons, brand                 |
| `sage` (accent)      | `#3E7C6B`                              | "Go / matched", success, links, small highlights, focus ring |
| `sage-tint`          | approx `#E3EDE8`                       | Background behind sage badges and success alerts             |
| `paper` (background) | `#F7F5F0`                              | Page background                                              |
| `white` (card)       | `#FFFFFF`                              | Cards, inputs, modals                                        |
| `stone` (muted fg)   | approx `#6B7280` family                | Secondary text, placeholders, icons                          |
| `line` (border)      | approx `#E7E3DA`                       | Hairline borders and dividers (warm, matches paper)          |
| `danger`             | a muted red, e.g. `#B42318` + its tint | Errors and destructive actions only                          |

The builder may add tonal steps of navy and sage (for hover/pressed states, and a lighter navy for header text such as `#C9D3E3`) and a warm amber for "warning / pending action" states **only if a real state needs it**. Every color must be a named token in `globals.css` and `tailwind.config.js`; nothing else is allowed.

### Typography

- **Body/UI:** Inter (via `next/font/google`), replacing Geist.
- **Display:** Playfair Display for page titles (h1) and hero headlines only. Section headings and everything inside cards stay in Inter.
- A defined type scale (e.g. display, h1, h2, h3, body, small, caption, eyebrow) used everywhere.

### Surfaces and shape

- Paper page, white cards with a 1px warm hairline border. Shadows minimal (at most a subtle shadow on popovers/modals).
- Corner radius around 10-14px for cards, 8-10px for controls. Consistent across the app.
- Generous whitespace on student pages; tighter spacing on admin pages.

### Header and footer

- **Header:** solid navy bar like ASPC's. Logo + "PICKUP" wordmark with a small "by ASPC" line. Desktop: text nav links (Forms, Results, info pages, Dashboard for admins), profile avatar / sign-in. Mobile: hamburger opening a clean full-height navy or paper sheet. The current behaviors (admin Dashboard link, sign-in modal, sign-out, avatar refresh, active-route highlighting, preventing re-navigation to the current page) must all be preserved.
- **Footer:** quiet: paper or navy, with About, Contact, FAQ, ASPC Info links and a small ASPC attribution.

### Signature element: boarding-pass ride card

A ride/match is shown as a boarding pass: date and status badge on top; large origin and destination codes (e.g. `CLA` to `LAX`) joined by a dashed line, with time underneath; a dashed perforation separating a stub with group size and pickup location. Used on Results (`MatchCard`) and anywhere a ride summary appears (profile, unmatched, delay flow). Status badges use a dot plus a label: matched = sage, waiting/unmatched = stone, cancelled/error = danger.

### Motion

Subtle and functional only: short (150-200ms) color/opacity transitions, gentle enter for modals and the mobile menu, respecting `prefers-reduced-motion`. Keep the existing Cecil loading spinner and NextTopLoader (recolored to navy or sage).

## Scope: every screen

Student and public:

- `/` home (hero, how it works, CTA logic for signed-in vs signed-out)
- `/profile`
- `/questionnaires`, `/matchForm`, `/editForm/[flight_id]` and `components/forms/FlightForm.tsx` (largest form, 2.6k lines)
- `/results` (+ `MatchCard`, `CommentSection`, `ConfirmCancelMatch`, `EmptyState`)
- `/unmatched`, `/MatchRequestsPage` (behind `NEXT_PUBLIC_ENABLE_MATCH_REQUESTS`)
- `/aspc-delay`, `/aspc-delay/[rideId]` and `components/aspc-delay/*`
- `/aspc-ready`, `/aspc-info`, `/aspc-fees`, `/aspc-policy`
- `/feedback` (+ `StarRating`)
- `/about`, `/contact`, `/faq` (drop Material Tailwind's accordion for a small in-house one)
- `error.tsx`, `SignInModal`, `components/questionnaires/*`

Admin:

- `/admin` (`AdminDashboard`, `AddRider`, `EmailComposerModal`)
- `/admin/groups` (`GroupsManagement` and everything in `groups-management/`)

## Constraints

- Stack stays: Next.js 15 App Router, React 18, Tailwind 3, Supabase. Keep existing Radix primitives (popover, tooltip, scroll-area) and `react-day-picker`; restyle them.
- Remove `@material-tailwind/react` (only used by the FAQ) and the `withMT` wrapper in `tailwind.config.js`. Remove `geist`. Remove `next-themes` / `ThemeProvider` if nothing else needs it after going light-only. Clean up unused custom animations in `globals.css`.
- CI must stay green: `pnpm type-check`, `pnpm knip`, `pnpm knip:production`, `pnpm lint`, `pnpm test:ci`, `pnpm build`. Existing tests (e.g. `AdminDashboard.test.tsx`, `GroupsManagement.test.tsx`, `UnmatchedRidersPanel.test.tsx`) must keep passing; update selectors only if they relied on visual classes, never weaken assertions.
- Accessibility: WCAG AA contrast for all text, visible focus rings, proper labels, 44px minimum touch targets on mobile.
- Prettier formatting as configured in the repo. No em dashes in copy or code.

## How the work is verified

- Run locally with `./start.sh` (local Supabase with seeded fake users and flights), sign in, and walk every flow end to end in a real browser at phone width (390px) and laptop width (1440px), as both a student and an admin.
- Screenshot each screen before and after for comparison.
- All CI checks above pass.

## Calls made during review (not discussed explicitly)

- **Logo:** the current logo is a cartoon mint car. It stays unchanged, sitting in a small white/paper rounded tile on the navy header so its mint glow does not clash with sage. Revisit if a new mark is designed later.
- **Delivery:** all work happens on one feature branch (`redesign/frontend`) with a commit per phase, merged as a single PR. `main` deploys to production on Netlify, so shipping half the pages restyled would look broken; the Netlify deploy preview on the PR is used for review.
- **Home hero:** light paper hero with a Playfair headline (as in the approved mockup), no photo and no navy hero block.
- **Wide layouts:** student pages use a centered single column (max around 640-720px) even on desktop; info pages use a readable prose width; admin uses full width.

## Left to the builder

- Exact tonal steps, spacing scale and type scale values, within the rules above.
- Component APIs and file layout for the shared UI kit (expected under `src/components/ui/`).
- The order pages are rebuilt in. Expected order: tokens and UI kit, then header and footer, then the student flow in the order students hit it, then info pages, then admin.
- How to restructure very large files (`FlightForm.tsx`, `GroupsManagement.tsx`) during restyling, provided behavior is unchanged and tests pass.
- Copy may be tightened for clarity, but meaning and instructions must stay the same.
