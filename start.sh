#!/usr/bin/env bash
# PICKUP local launcher.
#
#   ./start.sh                 Start the local dev database (Docker) + Next.js on http://localhost:3000
#   ./start.sh prod            Start Next.js against the PRODUCTION Supabase project in frontend/.env
#   ./start.sh setup           Install frontend (pnpm) and ML (Python venv) dependencies
#   ./start.sh ml [args...]    Run the ML matcher against the LOCAL dev database
#                              e.g. ./start.sh ml --days-ahead 20
#   ./start.sh db:pull-schema  Snapshot the production schema (no data) into frontend/supabase/dev/
#   ./start.sh db:reset        Wipe the local database and reload schema + seed data
#   ./start.sh db:make-admin <email> [scope]
#                              Make a local user super_admin (or admin of <scope>)
#   ./start.sh db:demo-me <email>
#                              Give your signed-in account its own demo rides
#   ./start.sh db:stop         Stop the local Supabase containers
#   ./start.sh db:status       Show local Supabase URLs and keys (Studio, Mailpit, etc.)

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND="$ROOT/frontend"
ML="$ROOT/ML"
FRONTEND_ENV="$FRONTEND/.env"
SCHEMA_DIR="$FRONTEND/supabase/dev"
DB_CONTAINER="supabase_db_pickup"

info() { printf '\033[1;34m==>\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33mwarning:\033[0m %s\n' "$*" >&2; }
die() { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

# Reads KEY from a dotenv file without executing it. Strips surrounding quotes.
env_value() {
  local file="$1" key="$2" line value
  [[ -r "$file" ]] || return 0
  line="$(grep -E "^[[:space:]]*${key}=" "$file" | tail -n 1 || true)"
  value="${line#*=}"
  value="${value%\"}"; value="${value#\"}"
  value="${value%\'}"; value="${value#\'}"
  printf '%s' "$value"
}

supabase_cli() { (cd "$FRONTEND" && pnpm exec supabase "$@"); }

require_docker() {
  command -v docker >/dev/null || die "Docker is not installed. Install Docker Desktop first."
  if ! docker info >/dev/null 2>&1; then
    if [[ "$(uname)" == "Darwin" ]]; then
      info "Starting Docker Desktop..."
      open -a Docker
      for _ in $(seq 1 60); do docker info >/dev/null 2>&1 && return 0; sleep 2; done
    fi
    die "Docker daemon is not running."
  fi
}

ensure_frontend_deps() {
  command -v pnpm >/dev/null || die "pnpm is not installed (brew install pnpm)."
  [[ -d "$FRONTEND/node_modules" ]] || (cd "$FRONTEND" && pnpm install --frozen-lockfile)
}

ensure_ml_deps() {
  if [[ ! -x "$ML/.venv/bin/python" ]]; then
    info "Creating ML virtualenv..."
    python3 -m venv "$ML/.venv"
    "$ML/.venv/bin/pip" install -q -r "$ML/requirements.txt"
  fi
}

require_schema() {
  [[ -f "$FRONTEND/supabase/config.toml" ]] || die "frontend/supabase/config.toml is missing. Is the current frontend branch based on one without the local dev setup?"
  [[ -s "$SCHEMA_DIR/schema.sql" ]] || die "No local schema yet. Run: (cd frontend && pnpm exec supabase login), then ./start.sh db:pull-schema"
}

local_db_running() { docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; }

# Exports the Google OAuth credentials that frontend/supabase/config.toml reads via env().
export_google_oauth() {
  export SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET
  SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID="$(env_value "$FRONTEND_ENV" SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID)"
  SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET="$(env_value "$FRONTEND_ENV" SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET)"
  if [[ -z "$SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID" ]]; then
    warn "SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID is empty in frontend/.env - Google sign-in will not work locally."
  fi
}

# The Google client ID the running auth container was started with (config.toml reads it at start).
running_google_client_id() {
  docker inspect supabase_auth_pickup --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null |
    sed -n 's/^GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=//p'
}

start_local_db() {
  require_docker
  ensure_frontend_deps
  require_schema
  export_google_oauth
  if local_db_running; then
    if [[ "$(running_google_client_id)" != "$SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID" ]]; then
      info "Google OAuth settings in frontend/.env changed; restarting local Supabase (data is kept)..."
      supabase_cli stop
      supabase_cli start
    else
      info "Local Supabase is already running."
    fi
  else
    info "Starting local Supabase (first run downloads images and loads schema + seed)..."
    supabase_cli start
  fi
}

# Exports the local stack's URL and keys under the names each app expects.
export_local_credentials() {
  local status api_url anon_key service_key
  status="$(supabase_cli status -o env 2>/dev/null || true)"
  api_url="$(env_value <(printf '%s\n' "$status") API_URL)"
  anon_key="$(env_value <(printf '%s\n' "$status") ANON_KEY)"
  service_key="$(env_value <(printf '%s\n' "$status") SERVICE_ROLE_KEY)"
  [[ -n "$api_url" && -n "$anon_key" && -n "$service_key" ]] || die "Could not read local Supabase credentials. Run ./start.sh db:status to see which service is down, or ./start.sh db:stop and retry."

  # Process env takes precedence over frontend/.env and ML/.env, so production values there are ignored.
  export NEXT_PUBLIC_SUPABASE_URL="$api_url"
  export NEXT_PUBLIC_SUPABASE_ANON_KEY="$anon_key"
  export SUPABASE_SECRET_KEY="$service_key"
  export SUPABASE_URL="$api_url"
}

psql_local() { docker exec -i "$DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U postgres -d postgres "$@"; }

cmd_local() {
  start_local_db
  export_local_credentials
  cat <<EOF

  App:      http://localhost:3000
  Studio:   http://127.0.0.1:54323   (browse/edit the local database)
  Mailpit:  http://127.0.0.1:54324   (emails sent by local auth)
  Database: LOCAL ($NEXT_PUBLIC_SUPABASE_URL) - production is not touched

EOF
  cd "$FRONTEND" && exec pnpm dev
}

cmd_prod() {
  local url
  url="$(env_value "$FRONTEND_ENV" NEXT_PUBLIC_SUPABASE_URL)"
  [[ -n "$url" ]] || die "NEXT_PUBLIC_SUPABASE_URL is empty in frontend/.env."
  ensure_frontend_deps
  printf '\033[1;31mYou are about to run against PRODUCTION data at %s.\033[0m\n' "$url"
  read -r -p "Type 'prod' to continue: " answer
  [[ "$answer" == "prod" ]] || die "Aborted."
  unset NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SECRET_KEY
  cd "$FRONTEND" && exec pnpm dev
}

cmd_setup() {
  command -v pnpm >/dev/null || die "pnpm is not installed (brew install pnpm)."
  info "Installing frontend dependencies..."
  (cd "$FRONTEND" && pnpm install --frozen-lockfile)
  info "Installing ML dependencies..."
  [[ -x "$ML/.venv/bin/python" ]] || python3 -m venv "$ML/.venv"
  "$ML/.venv/bin/pip" install -q -r "$ML/requirements.txt"
  info "Done. Next: fill frontend/.env, then ./start.sh db:pull-schema and ./start.sh"
}

cmd_ml() {
  ensure_ml_deps
  local_db_running || start_local_db
  export_local_credentials
  info "Running ML matcher against LOCAL database ($SUPABASE_URL)"
  cd "$ML/Algorithm" && exec "$ML/.venv/bin/python" main.py "$@"
}

# Dumps the production schema (no rows) using the Supabase account from `supabase login`.
# The project is linked only for the duration of the dump, so later CLI commands can't target prod.
cmd_pull_schema() {
  local prod_url ref tmp
  prod_url="$(env_value "$FRONTEND_ENV" NEXT_PUBLIC_SUPABASE_URL)"
  ref="$(sed -E 's#^https://([a-z0-9]+)\.supabase\.co/?$#\1#' <<<"$prod_url")"
  [[ -n "$ref" && "$ref" != "$prod_url" ]] || die "NEXT_PUBLIC_SUPABASE_URL in frontend/.env must look like https://<ref>.supabase.co"
  require_docker
  ensure_frontend_deps
  mkdir -p "$SCHEMA_DIR"
  tmp="$(mktemp -d)"
  trap "supabase_cli unlink >/dev/null 2>&1 || true; rm -rf '$tmp'" EXIT

  info "Linking to production project $ref (read-only use; unlinked afterwards)..."
  supabase_cli link --project-ref "$ref" ||
    die "Link failed. Log in first: (cd frontend && pnpm exec supabase login)"
  info "Dumping production roles and schema (no row data)..."
  supabase_cli db dump --linked --role-only -f "$tmp/roles.sql"
  supabase_cli db dump --linked --schema public,app -f "$tmp/schema.sql"

  # Production triggers call edge functions (emails) by absolute URL. Point them at the local
  # gateway instead, where those functions don't exist, so local writes can never reach prod.
  sed -i '' "s#https://$ref\.supabase\.co#http://host.docker.internal:54321#g" "$tmp/schema.sql"
  if grep -q "$ref" "$tmp/schema.sql"; then
    die "Schema still references production project $ref after rewriting; refusing to use it."
  fi

  # Supabase-internal roles (supabase_admin, ...) are owned by the platform and can't be altered locally.
  grep -vE '^ALTER ROLE "supabase_' "$tmp/roles.sql" >"$FRONTEND/supabase/roles.sql"
  mv "$tmp/schema.sql" "$SCHEMA_DIR/schema.sql"
  info "Schema saved to frontend/supabase/{roles.sql,dev/schema.sql}. Run ./start.sh db:reset (or ./start.sh) to load it."
}

cmd_reset() {
  require_docker
  require_schema
  local_db_running || die "Local Supabase is not running. Start it with ./start.sh"
  export_google_oauth
  info "Resetting LOCAL database (schema + seed)..."
  supabase_cli db reset --local
}

cmd_make_admin() {
  local email="${1:-}" scope="${2:-}"
  [[ -n "$email" ]] || die "Usage: ./start.sh db:make-admin <email> [scope]"
  local_db_running || die "Local Supabase is not running. Start it with ./start.sh"
  local role="super_admin"
  [[ -n "$scope" ]] && role="admin"
  psql_local -v email="$email" -v role="$role" -v scope="$scope" <<'SQL'
update public."Users"
set role = :'role', admin_scope = nullif(:'scope', '')
where lower(email) = lower(:'email')
returning email, role, admin_scope;
SQL
}

# Gives a signed-in account its own demo rides (the seed can't know Google accounts in advance):
# a seat in the upcoming subsidized LAX group, a past LAX ride, an unmatched ONT flight on the
# "Find a group" board and a flight waiting for the next matching run.
cmd_demo_me() {
  local email="${1:-}"
  [[ -n "$email" ]] || die "Usage: ./start.sh db:demo-me <email>  (sign in with Google first)"
  local_db_running || die "Local Supabase is not running. Start it with ./start.sh"
  local found
  found="$(psql_local -tA -v email="$email" <<<'select count(*) from public."Users" where lower(email) = lower(:'"'"'email'"'"');')"
  [[ "$found" == 1 ]] || die "No local user $email. Sign in with Google at http://localhost:3000 first."
  psql_local -q -v email="$email" <<'SQL'
select user_id as me from public."Users" where lower(email) = lower(:'email') \gset
delete from public."Matches" where user_id = :'me';
delete from public."Flights" where user_id = :'me';

with ride as (
  select m.*, row_number() over (partition by m.date order by m.ride_id) as rn
  from public."Matches" m join public."Flights" f using (flight_id)
  where f.airport = 'LAX' and f.to_airport and m.date in (current_date + 4, current_date - 10)
),
flights as (
  insert into public."Flights" (user_id, airline_iata, flight_no, airport, terminal, to_airport, date,
    earliest_time, latest_time, bag_no, bag_no_large, bag_no_personal, opt_in, matching_status, has_us_phone)
  values
    (:'me', 'AA', 2231, 'LAX', '4', true, current_date + 4,  '06:30', '08:00', 1, 1, 1, false, 'matched', true),
    (:'me', 'UA', 1844, 'LAX', '7', true, current_date - 10, '07:00', '09:00', 1, 0, 1, false, 'matched', true),
    (:'me', 'WN', 2240, 'ONT', '2', false, current_date + 6, '23:00', '23:59', 1, 0, 1, true, 'unmatched', true),
    (:'me', 'DL', 1561, 'LAX', '3', true, current_date + 13, '09:00', '11:00', 1, 0, 1, true, 'submitted', true)
  returning flight_id, date, earliest_time, latest_time, matching_status
)
insert into public."Matches" (ride_id, user_id, flight_id, date, time, earliest_time, latest_time, source,
  voucher, contingency_voucher, is_verified, is_subsidized, uber_type, email_sent, ready_for_pickup_status)
select r.ride_id, :'me', f.flight_id, r.date, r.time, f.earliest_time, f.latest_time, 'ml',
       r.voucher, r.contingency_voucher, true, r.is_subsidized, r.uber_type, f.date < current_date,
       case when f.date < current_date then 'ready' end
from flights f join ride r on r.date = f.date and r.rn = 1
where f.matching_status = 'matched';

select date, airport, case when to_airport then 'to' else 'from' end as direction, matching_status
from public."Flights" where user_id = :'me' order by date;
SQL
}

case "${1:-local}" in
  local) cmd_local ;;
  prod) cmd_prod ;;
  setup) cmd_setup ;;
  ml) shift; cmd_ml "$@" ;;
  db:pull-schema) cmd_pull_schema ;;
  db:reset) cmd_reset ;;
  db:make-admin) shift; cmd_make_admin "$@" ;;
  db:demo-me) shift; cmd_demo_me "$@" ;;
  db:stop) supabase_cli stop ;;
  db:status) supabase_cli status ;;
  -h|--help|help) awk 'NR > 1 && !/^#/ { exit } NR > 1' "$0" | sed 's/^# \{0,1\}//' ;;
  *) die "Unknown command: $1 (see ./start.sh help)" ;;
esac
