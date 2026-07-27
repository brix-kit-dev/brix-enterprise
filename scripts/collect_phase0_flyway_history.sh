#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 ENVIRONMENT {platform-tenant|app-tenant} OUTPUT_JSON" >&2
  echo "Requires a preconfigured PostgreSQL PGSERVICE with read-only access." >&2
}

if [[ $# -ne 3 ]]; then
  usage
  exit 2
fi

if [[ -z "${PGSERVICE:-}" ]]; then
  echo "PGSERVICE is required; credentials must not be passed on the command line." >&2
  exit 2
fi

environment_id=$1
module_id=$2
output_json=$3
schema_id=${PHASE0_FLYWAY_SCHEMA:-public}

if [[ ! "$schema_id" =~ ^[a-z_][a-z0-9_]{0,62}$ ]]; then
  echo "PHASE0_FLYWAY_SCHEMA must be a lowercase PostgreSQL identifier." >&2
  exit 2
fi

case "$module_id" in
  platform-tenant)
    history_table=flyway_schema_history_platform_tenant
    ;;
  app-tenant)
    history_table=flyway_schema_history_app_tenant
    ;;
  *)
    usage
    exit 2
    ;;
esac

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
raw_csv=$(mktemp "${TMPDIR:-/tmp}/brix-phase0-flyway.XXXXXXXX.csv")
trap 'rm -f -- "$raw_csv"' EXIT

psql \
  --no-psqlrc \
  --set=ON_ERROR_STOP=1 \
  --csv \
  --command="SELECT installed_rank,
                    version,
                    description,
                    type,
                    script,
                    checksum,
                    to_char(installed_on AT TIME ZONE 'UTC',
                            'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"') AS installed_on_utc,
                    execution_time AS execution_time_ms,
                    success
             FROM \"${schema_id}\".\"${history_table}\"
             ORDER BY installed_rank" \
  > "$raw_csv"

python3 "$script_dir/phase0_evidence.py" sanitize-flyway \
  --environment "$environment_id" \
  --module "$module_id" \
  --input "$raw_csv" \
  --output "$output_json"

echo "Sanitized Flyway evidence written to $output_json"
