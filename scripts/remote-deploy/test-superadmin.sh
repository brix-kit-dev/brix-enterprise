#!/bin/bash
set -euo pipefail

# Super Admin API verification script

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

echo "=== [1] Health Check ==="
curl -s "$BASE/actuator/health" | python3 -m json.tool 2>/dev/null || curl -s "$BASE/actuator/health"

echo ""
echo "=== [2] Super Admin Login ==="
TOKEN_RESP=$(curl -s -X POST "$BASE/api/platform/auth/login" \
  -H "Content-Type: application/json" \
  --data-raw "$LOGIN_PAYLOAD")
LOGIN_STATUS=$(json_field "$TOKEN_RESP" status)
ERROR_CODE=$(json_field "$TOKEN_RESP" code)
PLATFORM_ROLE=$(json_field "$TOKEN_RESP" platformRole)
echo "login status=${LOGIN_STATUS:-${ERROR_CODE:-UNKNOWN}} role=${PLATFORM_ROLE:-n/a}"

TOKEN=$(json_field "$TOKEN_RESP" accessToken)

if [ -z "$TOKEN" ]; then
  TOKEN=$(json_field "$TOKEN_RESP" token)
fi

if [ -z "$TOKEN" ]; then
  echo "ERROR: super-admin login did not return an access token" >&2
  exit 1
fi

echo ""
echo "=== Access token present (length: ${#TOKEN}) ==="

echo ""
echo "=== [3] GET /api/platform/admins ==="
curl -s "$BASE/api/platform/admins" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null || echo "(raw response above)"

echo ""
echo "=== [4] GET /api/platform/tenants ==="
curl -s "$BASE/api/platform/tenants" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null || echo "(raw response above)"

echo ""
echo "=== [5] GET /api/platform/audit-logs ==="
curl -s "$BASE/api/platform/audit-logs" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool 2>/dev/null || echo "(raw response above)"
