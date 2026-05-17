#!/bin/bash
set -euo pipefail

BASE="${BASE:-http://localhost:8081}"
: "${BRIX_SUPER_ADMIN_LOGIN_ID:?Set BRIX_SUPER_ADMIN_LOGIN_ID before running this script}"
: "${BRIX_SUPER_ADMIN_INITIAL_PASSWORD:?Set BRIX_SUPER_ADMIN_INITIAL_PASSWORD before running this script}"
: "${BRIX_SUPER_ADMIN_NEW_PASSWORD:?Set BRIX_SUPER_ADMIN_NEW_PASSWORD before running this script}"

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

LOGIN1_PAYLOAD=$(printf '{"loginId":"%s","password":"%s"}' \
  "$(json_escape "$BRIX_SUPER_ADMIN_LOGIN_ID")" \
  "$(json_escape "$BRIX_SUPER_ADMIN_INITIAL_PASSWORD")")

CHANGE_PASSWORD_PAYLOAD=$(printf '{"oldPassword":"%s","newPassword":"%s"}' \
  "$(json_escape "$BRIX_SUPER_ADMIN_INITIAL_PASSWORD")" \
  "$(json_escape "$BRIX_SUPER_ADMIN_NEW_PASSWORD")")

LOGIN2_PAYLOAD=$(printf '{"loginId":"%s","password":"%s"}' \
  "$(json_escape "$BRIX_SUPER_ADMIN_LOGIN_ID")" \
  "$(json_escape "$BRIX_SUPER_ADMIN_NEW_PASSWORD")")

echo "=== STEP 1: initial login (PASSWORD_MUST_CHANGE) ==="
LOGIN1=$(curl -s -X POST "$BASE/api/platform/auth/login" \
  -H 'Content-Type: application/json' \
  -d "$LOGIN1_PAYLOAD")
LOGIN1_STATUS=$(json_field "$LOGIN1" status)
LOGIN1_CODE=$(json_field "$LOGIN1" code)
ITOK=$(json_field "$LOGIN1" identityToken)
if [ -n "$ITOK" ]; then
  IDENTITY_TOKEN_PRESENT=true
else
  IDENTITY_TOKEN_PRESENT=false
fi
echo "login status=${LOGIN1_STATUS:-${LOGIN1_CODE:-UNKNOWN}} identityTokenPresent=$IDENTITY_TOKEN_PRESENT"
echo
echo "identityToken length: ${#ITOK}"

echo
echo "=== STEP 2: change password ==="
curl -s -w '\nHTTP_%{http_code}\n' -X POST "$BASE/api/auth/change-password" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ITOK" \
  -d "$CHANGE_PASSWORD_PAYLOAD"

echo
echo "=== STEP 3: re-login with new password ==="
LOGIN2=$(curl -s -X POST "$BASE/api/platform/auth/login" \
  -H 'Content-Type: application/json' \
  -d "$LOGIN2_PAYLOAD")
LOGIN2_STATUS=$(json_field "$LOGIN2" status)
LOGIN2_CODE=$(json_field "$LOGIN2" code)
PLATFORM_ROLE=$(json_field "$LOGIN2" platformRole)
ATOK=$(json_field "$LOGIN2" accessToken)
if [ -n "$ATOK" ]; then
  ACCESS_TOKEN_PRESENT=true
else
  ACCESS_TOKEN_PRESENT=false
fi
echo "login status=${LOGIN2_STATUS:-${LOGIN2_CODE:-UNKNOWN}} role=${PLATFORM_ROLE:-n/a} accessTokenPresent=$ACCESS_TOKEN_PRESENT"
echo
echo "accessToken length: ${#ATOK}"

echo
echo "=== STEP 4: GET /api/platform/admins (list admins) ==="
curl -s -w '\nHTTP_%{http_code}\n' "$BASE/api/platform/admins" \
  -H "Authorization: Bearer $ATOK" | head -50

echo
echo "=== STEP 5: GET /api/platform/audit-logs ==="
curl -s -w '\nHTTP_%{http_code}\n' "$BASE/api/platform/audit-logs" \
  -H "Authorization: Bearer $ATOK" | head -80

echo
echo "=== STEP 6: GET /api/platform/tenants ==="
curl -s -w '\nHTTP_%{http_code}\n' "$BASE/api/platform/tenants" \
  -H "Authorization: Bearer $ATOK" | head -50

echo
echo "=== STEP 7: POST /api/platform/auth/logout ==="
curl -s -w '\nHTTP_%{http_code}\n' -X POST "$BASE/api/platform/auth/logout" \
  -H "Authorization: Bearer $ATOK"
