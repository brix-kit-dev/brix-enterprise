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

echo "=== POST /api/platform/auth/login ==="
LOGIN_RESP=$(curl -s -w '\nHTTP_%{http_code}\n' \
  -X POST "$BASE/api/platform/auth/login" \
  -H 'Content-Type: application/json' \
  -d "$LOGIN_PAYLOAD")
HTTP_STATUS=$(printf '%s\n' "$LOGIN_RESP" | tail -n 1)
BODY=$(printf '%s\n' "$LOGIN_RESP" | sed '$d')
LOGIN_STATUS=$(json_field "$BODY" status)
ERROR_CODE=$(json_field "$BODY" code)
PLATFORM_ROLE=$(json_field "$BODY" platformRole)
ACCESS_TOKEN=$(json_field "$BODY" accessToken)
if [ -n "$ACCESS_TOKEN" ]; then
  TOKEN_PRESENT=true
else
  TOKEN_PRESENT=false
fi
echo "login status=${LOGIN_STATUS:-${ERROR_CODE:-UNKNOWN}} role=${PLATFORM_ROLE:-n/a} tokenPresent=$TOKEN_PRESENT"
echo "$HTTP_STATUS"
