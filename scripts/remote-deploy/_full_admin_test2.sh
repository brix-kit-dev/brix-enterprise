#!/bin/bash
set -euo pipefail

BASE="${BASE:-http://localhost:8081}"
: "${BRIX_SUPER_ADMIN_LOGIN_ID:?Set BRIX_SUPER_ADMIN_LOGIN_ID before running this script}"
: "${BRIX_SUPER_ADMIN_PASSWORD:?Set BRIX_SUPER_ADMIN_PASSWORD before running this script}"

json_escape() {
  local value="$1"
  value=${value//\\/\\\\}
  value=${value//\"/\\\"}
  value=${value//$'\n'/\\n}
  value=${value//$'\r'/\\r}
  printf '%s' "$value"
}

json_field() {
  local json="$1"
  local field="$2"
  printf '%s' "$json" | sed -n "s/.*\"$field\":\"\([^\"]*\)\".*/\1/p"
}

LOGIN_PAYLOAD=$(printf '{"loginId":"%s","password":"%s"}' \
  "$(json_escape "$BRIX_SUPER_ADMIN_LOGIN_ID")" \
  "$(json_escape "$BRIX_SUPER_ADMIN_PASSWORD")")

echo "=== STEP 1: try super-admin login ==="
LOGIN=$(curl -s -X POST "$BASE/api/platform/auth/login" \
  -H 'Content-Type: application/json' \
  -d "$LOGIN_PAYLOAD")
LOGIN_STATUS=$(json_field "$LOGIN" status)
ERROR_CODE=$(json_field "$LOGIN" code)
PLATFORM_ROLE=$(json_field "$LOGIN" platformRole)
ATOK=$(json_field "$LOGIN" accessToken)
if [ -n "$ATOK" ]; then
  ACCESS_TOKEN_PRESENT=true
else
  ACCESS_TOKEN_PRESENT=false
fi
echo "login status=${LOGIN_STATUS:-${ERROR_CODE:-UNKNOWN}} role=${PLATFORM_ROLE:-n/a} accessTokenPresent=$ACCESS_TOKEN_PRESENT"
if [ -z "$ATOK" ]; then
  echo "ERROR: super-admin login did not return an access token" >&2
  exit 1
fi
echo
echo "accessToken length: ${#ATOK}"

if [ -n "$ATOK" ]; then
  echo
  echo "=== STEP 2: discover endpoints via actuator/mappings (requires actuator) ==="
  curl -s "$BASE/actuator/mappings" 2>/dev/null | head -5
  echo
  echo "=== STEP 3: GET /api/platform/admins (note 's') ==="
  curl -s -w '\nHTTP_%{http_code}\n' "$BASE/api/platform/admins" \
    -H "Authorization: Bearer $ATOK"
  echo
  echo "=== STEP 4: GET /api/platform/audit-logs ==="
  curl -s -w '\nHTTP_%{http_code}\n' "$BASE/api/platform/audit-logs" \
    -H "Authorization: Bearer $ATOK"
  echo
  echo "=== STEP 5: GET /api/platform/tenants ==="
  curl -s -w '\nHTTP_%{http_code}\n' "$BASE/api/platform/tenants" \
    -H "Authorization: Bearer $ATOK"
  echo
  echo "=== STEP 6: POST /api/platform/auth/logout ==="
  curl -s -w '\nHTTP_%{http_code}\n' -X POST "$BASE/api/platform/auth/logout" \
    -H "Authorization: Bearer $ATOK"
fi
