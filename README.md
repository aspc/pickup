<div align="center">

<img src="frontend/public/favicon.png" alt="PICKUP" width="72" />

# PICKUP - Local Development

Run the PICKUP web app and matching pipeline on your machine against a **local dev database**, without touching production.

</div>

PICKUP groups students into shared airport rides. This repo has two parts:

| Folder      | What it is                                         |
| ----------- | -------------------------------------------------- |
| `frontend/` | Next.js app (students + admins), hosted on Netlify |
| `ML/`       | Python batch job that forms ride groups            |

Both talk to **Supabase** (auth + Postgres). Locally, `start.sh` runs a full Supabase stack in Docker, loaded with the production **schema** (no production data) plus fake test users and flights.

> [!IMPORTANT]
> `./start.sh` always uses the local database. Production is only used by `./start.sh prod`, which asks you to confirm. Running `pnpm dev` directly reads `frontend/.env`, so it talks to **production**.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
- Node.js 20+ and [pnpm](https://pnpm.io/installation) (the repo pins pnpm 9.15.2; pnpm switches to it automatically)
- Python 3.11+
- A Supabase account that is a member of the PICKUP organization (ask a maintainer)

## Setup

### 1. Clone the repo

```bash
git clone git@github.com:ASPC/pickup.git
cd pickup
```

### 2. Install dependencies

```bash
./start.sh setup
```

This runs `pnpm install` in `frontend/` and creates a Python virtualenv in `ML/.venv`.

### 3. Create the env files

Both files are gitignored. Get the values from the Supabase dashboard (**Project Settings → API**).

`frontend/.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SECRET_KEY=<service role key>      # server only, never NEXT_PUBLIC_

# Your own Google OAuth client for local sign-in (step 5)
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=

NEXT_PUBLIC_ENABLE_MATCH_REQUESTS=false
```

`ML/.env` (only needed to run the matcher against production):

```bash
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=<service role key>
```

> [!CAUTION]
> The service role key bypasses all database security. Never commit it or paste it into chats or issues.

### 4. Pull the database schema

```bash
(cd frontend && pnpm exec supabase login)   # opens a browser, one time only
./start.sh db:pull-schema
```

This copies the production table structure, functions and security policies (**no rows**) into `frontend/supabase/roles.sql` and `frontend/supabase/dev/schema.sql`. Production database triggers that send emails are rewritten to point at your local stack, so local testing can never trigger real emails. Re-run this command whenever the production schema changes, then run `./start.sh db:reset`.

### 5. Set up Google sign-in

The app only supports Google login, so create a free OAuth client for local use:

1. Go to [Google Cloud Console](https://console.cloud.google.com), create a project (e.g. `pickup-dev`).
2. **APIs & Services → OAuth consent screen**: app name, your email, audience **External**.
3. **Audience → Test users**: add every Google account you will sign in with.
4. **Clients → Create client** → _Web application_:
   - Authorized JavaScript origin: `http://localhost:3000`
   - Authorized redirect URI: `http://127.0.0.1:54321/auth/v1/callback`
5. Copy the client ID and secret into `frontend/.env`.

> [!TIP]
> `redirect_uri_mismatch` means the redirect URI is not exactly `http://127.0.0.1:54321/auth/v1/callback` (use `127.0.0.1`, not `localhost`, and no trailing slash). "Access blocked" means your account is not in the test users list.

### 6. Start

```bash
./start.sh
```

The first run downloads the Supabase Docker images, which takes a few minutes. Then open:

| URL                    | What                                                |
| ---------------------- | --------------------------------------------------- |
| http://localhost:3000  | The app                                             |
| http://127.0.0.1:54323 | Supabase Studio: browse and edit the local database |
| http://127.0.0.1:54324 | Mailpit: emails sent by local auth                  |

Sign in with Google, then give yourself admin access locally:

```bash
./start.sh db:make-admin you@gmail.com            # super_admin
./start.sh db:make-admin you@gmail.com Pomona     # admin scoped to a school
```

## Working with the local database

The seed data (`frontend/supabase/seed.sql`) is a term in progress, dated relative to today. All seeded accounts are `*@pickup.dev` (45 users):

- **Ride groups:** upcoming subsidized groups to and from LAX and ONT (with vouchers), a non-subsidized mixed-college group and a Connect group, plus past groups
- **History:** feedback, a no-show report, one billable and one waived cancellation, matching runs (one failed) and admin change-log entries
- **Unmatched riders** on the "Find a group" board, and flights waiting for the next matching run
- **Match requests**, shown when `NEXT_PUBLIC_ENABLE_MATCH_REQUESTS=true`
- **Pending flights:** the original 7 riders (`ana`, `ben`, ... `gus`) stay pending, so `./start.sh ml` has something to match

The student pages (Results, Questionnaires, Unmatched) show the signed-in user's own rides. After signing in with Google, give your account some:

```bash
./start.sh db:demo-me you@gmail.com   # a seat in an upcoming group, a past ride, an unmatched and a pending flight
```

> [!NOTE]
> `./start.sh db:reset` deletes every account, including yours. Sign in again afterwards, then re-run `db:make-admin` and `db:demo-me`.

Run the matcher against the local database to create groups, then look at `/admin/groups` or `/results`:

```bash
./start.sh ml --days-ahead 20                       # commits groups to the LOCAL db

# Dry run: writes review CSVs to ML/matches/ instead of the db.
# It needs a voucher CSV; ML/vouchers/ is gitignored, so create an empty one once:
mkdir -p ML/vouchers && echo "Date (start),Date (end),Contingency,voucher_link,TO_AIRPORT,AIRPORT,USED,start_date,end_date" > ML/vouchers/Dev.csv
./start.sh ml --dry-run --days-ahead 20 --vouchers ../vouchers/Dev.csv
```

Reset everything back to the seed data at any time:

```bash
./start.sh db:reset
```

## Command reference

| Command                                    | Description                                                |
| ------------------------------------------ | ---------------------------------------------------------- |
| `./start.sh`                               | Start local Supabase + the app on http://localhost:3000    |
| `./start.sh prod`                          | Run the app against **production** (asks for confirmation) |
| `./start.sh setup`                         | Install frontend and ML dependencies                       |
| `./start.sh ml [args]`                     | Run `ML/Algorithm/main.py` against the local database      |
| `./start.sh db:pull-schema`                | Refresh the production schema snapshot                     |
| `./start.sh db:reset`                      | Wipe the local database and reload schema + seed           |
| `./start.sh db:make-admin <email> [scope]` | Make a local user an admin                                 |
| `./start.sh db:demo-me <email>`            | Give your signed-in account its own demo rides             |
| `./start.sh db:status`                     | Show local URLs and keys                                   |
| `./start.sh db:stop`                       | Stop the local Supabase containers (data is kept)          |

## Before you open a PR

```bash
# frontend/
pnpm type-check && pnpm lint && pnpm test

# ML/
.venv/bin/python -m unittest discover -s tests -t . && .venv/bin/python -m ruff check .
```

## Limitations

- **Emails:** the edge functions in `frontend/supabase/functions` run locally, but there is no Resend API key, so real sends fail. Use **Preview Email** (a dry run) in the admin dashboard to check recipients and subjects.
- **Schema changes** go into production through the Supabase dashboard or SQL editor (see `frontend/documentation/SUPABASE.md`). After a change, re-run `./start.sh db:pull-schema` and `./start.sh db:reset`.
- `ML/tests/integration_supabase*.py` write to whatever database `ML/.env` points at. Do not run them against production.

## Further reading

- [frontend/documentation](frontend/documentation/README.md): architecture, schema, RPCs, operations
- [ML/documentation](ML/documentation/README.md): matching rules, pipeline, operations
