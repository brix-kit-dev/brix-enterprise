#!/bin/bash
set -euo pipefail

BASE="${BASE:-http://localhost:8081}"
MAILPIT_API="${MAILPIT_API:-http://localhost:8025}"
READINESS_TIMEOUT_SECONDS="${READINESS_TIMEOUT_SECONDS:-180}"
PHASE8_SETUP_NOTES="${PHASE8_SETUP_NOTES:-phase8-e2e}"

: "${BRIX_BOOTSTRAP_SUPER_ADMIN_SETUP_CODE:?Set BRIX_BOOTSTRAP_SUPER_ADMIN_SETUP_CODE before running this script}"
: "${PHASE8_FIRST_ADMIN_EMAIL:?Set PHASE8_FIRST_ADMIN_EMAIL before running this script}"
: "${PHASE8_FIRST_ADMIN_USERNAME:?Set PHASE8_FIRST_ADMIN_USERNAME before running this script}"
: "${PHASE8_FIRST_ADMIN_PASSWORD:?Set PHASE8_FIRST_ADMIN_PASSWORD before running this script}"

redact() {
  sed -E \
    -e 's/(Bearer )[A-Za-z0-9._~+\/=-]+/\1[REDACTED]/g' \
    -e 's/"(accessToken|identityToken|refreshToken|token|setupCode|setupToken|setupUrl|inviteUrl|password|secret|totpCode)"[[:space:]]*:[[:space:]]*"[^"]*"/"\1":"[REDACTED]"/Ig' \
    -e 's#https?://[^" <>]+#https://[REDACTED]#g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL_REDACTED]/g'
}

json_get() {
  local json="$1"
  local field="$2"
  JSON_PAYLOAD="$json" JSON_FIELD="$field" python3 - <<'PY'
import json
import os

payload = os.environ.get("JSON_PAYLOAD", "")
field = os.environ.get("JSON_FIELD", "")
try:
    data = json.loads(payload)
except json.JSONDecodeError:
    print("")
    raise SystemExit(0)

value = data
for part in field.split("."):
    if isinstance(value, dict):
        value = value.get(part)
    else:
        value = None
        break
if value is None:
    print("")
elif isinstance(value, (dict, list)):
    print(json.dumps(value, separators=(",", ":")))
else:
    print(str(value))
PY
}

json_count_mailpit_messages() {
  local json="$1"
  JSON_PAYLOAD="$json" python3 - <<'PY'
import json
import os

try:
    data = json.loads(os.environ.get("JSON_PAYLOAD", ""))
except json.JSONDecodeError:
    print("0")
    raise SystemExit(0)
if isinstance(data, dict):
    if isinstance(data.get("total"), int):
        print(data["total"])
    elif isinstance(data.get("messages"), list):
        print(len(data["messages"]))
    elif isinstance(data.get("Messages"), list):
        print(len(data["Messages"]))
    else:
        print("0")
else:
    print("0")
PY
}

http_request() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local token="${4:-}"
  local actor="${5:-}"
  local output
  output="$(mktemp)"
  local headers=(-H "Content-Type: application/json")
  if [ -n "$token" ]; then
    headers+=(-H "Authorization: Bearer $token")
  fi
  if [ -n "$actor" ]; then
    headers+=(-H "x-actor-id: $actor")
  fi
  local status
  if [ -n "$body" ]; then
    status="$(curl -sS -o "$output" -w '%{http_code}' -X "$method" "$url" "${headers[@]}" --data-raw "$body")"
  else
    status="$(curl -sS -o "$output" -w '%{http_code}' -X "$method" "$url" "${headers[@]}")"
  fi
  local response
  response="$(cat "$output")"
  rm -f "$output"
  printf '%s\n%s\n' "$status" "$response"
}

require_http_success() {
  local label="$1"
  local status="$2"
  local response="$3"
  if [ "$status" -lt 200 ] || [ "$status" -ge 300 ]; then
    echo "ERROR: $label failed with HTTP_$status" >&2
    printf '%s' "$response" | redact >&2
    echo >&2
    exit 1
  fi
}

wait_for_readiness() {
  local deadline=$((SECONDS + READINESS_TIMEOUT_SECONDS))
  while [ "$SECONDS" -le "$deadline" ]; do
    local result status response readiness runtime_ready
    result="$(http_request GET "$BASE/actuator/health/readiness")" || true
    status="$(printf '%s' "$result" | sed -n '1p')"
    response="$(printf '%s' "$result" | sed '1d')"
    readiness="$(json_get "$response" status)"
    runtime_ready="$(json_get "$response" components.runtimeShellReadiness.details.runtimeShellReady)"
    if [ "$status" = "200" ] && [ "$readiness" = "UP" ] && [ "$runtime_ready" = "True" -o "$runtime_ready" = "true" ]; then
      echo "readiness=UP runtimeShellReady=true"
      return 0
    fi
    sleep 3
  done
  echo "ERROR: readiness did not become UP within ${READINESS_TIMEOUT_SECONDS}s" >&2
  exit 1
}

mailpit_count() {
  local messages
  messages="$(curl -sS "$MAILPIT_API/api/v1/messages" || true)"
  json_count_mailpit_messages "$messages"
}

mailpit_latest_setup_token() {
  local list message_id message
  list="$(curl -sS "$MAILPIT_API/api/v1/messages")"
  message_id="$(JSON_PAYLOAD="$list" python3 - <<'PY'
import json
import os

data = json.loads(os.environ["JSON_PAYLOAD"])
items = data.get("messages") or data.get("Messages") or []
if not items:
    print("")
else:
    print(items[0].get("ID") or items[0].get("Id") or items[0].get("id") or "")
PY
)"
  if [ -z "$message_id" ]; then
    echo ""
    return 0
  fi
  message="$(curl -sS "$MAILPIT_API/api/v1/message/$message_id")"
  JSON_PAYLOAD="$message" python3 - <<'PY'
import html
import json
import os
import re
from urllib.parse import parse_qs, urlparse

data = json.loads(os.environ["JSON_PAYLOAD"])
text = "\n".join(str(data.get(key, "")) for key in ("Text", "HTML", "Snippet", "Subject"))
text = html.unescape(text)
match = re.search(r'https?://[^\s"<>]+', text)
while match:
    url = match.group(0)
    parsed = urlparse(url)
    token = parse_qs(parsed.query).get("token", [""])[0]
    if token:
        print(token)
        raise SystemExit(0)
    text = text[match.end():]
    match = re.search(r'https?://[^\s"<>]+', text)
print("")
PY
}

totp_from_otpauth() {
  local uri="$1"
  OTPAUTH_URI="$uri" python3 - <<'PY'
import base64
import hashlib
import hmac
import os
import struct
import time
from urllib.parse import parse_qs, urlparse

uri = os.environ["OTPAUTH_URI"]
secret = parse_qs(urlparse(uri).query).get("secret", [""])[0]
if not secret:
    raise SystemExit("missing TOTP secret")
padding = "=" * ((8 - len(secret) % 8) % 8)
key = base64.b32decode((secret + padding).upper())
counter = int(time.time() // 30)
digest = hmac.new(key, struct.pack(">Q", counter), hashlib.sha1).digest()
offset = digest[-1] & 0x0F
code = (struct.unpack(">I", digest[offset:offset + 4])[0] & 0x7fffffff) % 1000000
print(f"{code:06d}")
PY
}

json_string() {
  local value="$1"
  VALUE="$value" python3 - <<'PY'
import json
import os
print(json.dumps(os.environ["VALUE"]))
PY
}

echo "=== Phase 8 E2E: readiness ==="
wait_for_readiness

echo "=== Phase 8 E2E: bootstrap status ==="
bootstrap_status_result="$(http_request GET "$BASE/api/platform/bootstrap/status")"
bootstrap_status_code="$(printf '%s' "$bootstrap_status_result" | sed -n '1p')"
bootstrap_status_body="$(printf '%s' "$bootstrap_status_result" | sed '1d')"
require_http_success "bootstrap status" "$bootstrap_status_code" "$bootstrap_status_body"
echo "bootstrapStatus=$(json_get "$bootstrap_status_body" status)"

initial_mail_count="$(mailpit_count)"

echo "=== Phase 8 E2E: bootstrap session ==="
setup_code_json="$(json_string "$BRIX_BOOTSTRAP_SUPER_ADMIN_SETUP_CODE")"
session_result="$(http_request POST "$BASE/api/platform/bootstrap/session" "{\"setupCode\":$setup_code_json}")"
session_code="$(printf '%s' "$session_result" | sed -n '1p')"
session_body="$(printf '%s' "$session_result" | sed '1d')"
require_http_success "bootstrap session" "$session_code" "$session_body"
bootstrap_token="$(json_get "$session_body" accessToken)"
if [ -z "$bootstrap_token" ]; then
  echo "ERROR: bootstrap session did not return a token" >&2
  exit 1
fi
echo "bootstrapSession=opened tokenPresent=true"

echo "=== Phase 8 E2E: create first platform admin ==="
admin_email_json="$(json_string "$PHASE8_FIRST_ADMIN_EMAIL")"
admin_username_json="$(json_string "$PHASE8_FIRST_ADMIN_USERNAME")"
notes_json="$(json_string "$PHASE8_SETUP_NOTES")"
first_admin_result="$(http_request POST "$BASE/api/platform/bootstrap/create-first-admin" "{\"username\":$admin_username_json,\"email\":$admin_email_json,\"notes\":$notes_json}" "$bootstrap_token")"
first_admin_code="$(printf '%s' "$first_admin_result" | sed -n '1p')"
first_admin_body="$(printf '%s' "$first_admin_result" | sed '1d')"
require_http_success "create first admin" "$first_admin_code" "$first_admin_body"
echo "firstAdminCreated=true setupLinkSent=$(json_get "$first_admin_body" setupLinkSent)"

echo "=== Phase 8 E2E: Mailpit platform setup mail ==="
for _ in $(seq 1 20); do
  current_mail_count="$(mailpit_count)"
  if [ "$current_mail_count" -gt "$initial_mail_count" ]; then
    echo "mailpitSetupMailArrived=true countDelta=$((current_mail_count - initial_mail_count))"
    break
  fi
  sleep 2
done
if [ "${current_mail_count:-0}" -le "$initial_mail_count" ]; then
  echo "ERROR: setup email did not arrive in Mailpit" >&2
  exit 1
fi

setup_token="$(mailpit_latest_setup_token)"
if [ -z "$setup_token" ]; then
  echo "ERROR: setup token was not discoverable from Mailpit API; no token was printed" >&2
  exit 1
fi

echo "=== Phase 8 E2E: complete platform setup ==="
validate_result="$(http_request GET "$BASE/api/platform/auth/setup/validate?token=$setup_token")"
validate_code="$(printf '%s' "$validate_result" | sed -n '1p')"
validate_body="$(printf '%s' "$validate_result" | sed '1d')"
require_http_success "validate setup token" "$validate_code" "$validate_body"
echo "setupTokenValid=$(json_get "$validate_body" valid)"

setup_token_json="$(json_string "$setup_token")"
totp_init_result="$(http_request POST "$BASE/api/platform/auth/setup/totp/init" "{\"token\":$setup_token_json}")"
totp_init_code="$(printf '%s' "$totp_init_result" | sed -n '1p')"
totp_init_body="$(printf '%s' "$totp_init_result" | sed '1d')"
require_http_success "init setup TOTP" "$totp_init_code" "$totp_init_body"
challenge_id="$(json_get "$totp_init_body" challengeId)"
otpauth_uri="$(json_get "$totp_init_body" otpauthUri)"
totp_code="$(totp_from_otpauth "$otpauth_uri")"
admin_password_json="$(json_string "$PHASE8_FIRST_ADMIN_PASSWORD")"
challenge_json="$(json_string "$challenge_id")"
totp_json="$(json_string "$totp_code")"
complete_result="$(http_request POST "$BASE/api/platform/auth/setup/complete" "{\"token\":$setup_token_json,\"challengeId\":$challenge_json,\"password\":$admin_password_json,\"totpCode\":$totp_json}")"
complete_code="$(printf '%s' "$complete_result" | sed -n '1p')"
complete_body="$(printf '%s' "$complete_result" | sed '1d')"
require_http_success "complete platform setup" "$complete_code" "$complete_body"
echo "platformSetupActivated=$(json_get "$complete_body" activated)"

if [ -n "${PHASE8_PLATFORM_ACCESS_TOKEN:-}" ] && [ -n "${PHASE8_PLATFORM_ACTOR_ID:-}" ]; then
  echo "=== Phase 8 E2E: platform tenant and FIRST_OWNER invitation ==="
  tenant_code="phase8-$(date +%s)"
  tenant_code_json="$(json_string "$tenant_code")"
  tenant_name_json="$(json_string "Phase 8 Tenant")"
  tenant_result="$(http_request POST "$BASE/api/platform/tenants" "{\"code\":$tenant_code_json,\"name\":$tenant_name_json}" "$PHASE8_PLATFORM_ACCESS_TOKEN" "$PHASE8_PLATFORM_ACTOR_ID")"
  tenant_http_code="$(printf '%s' "$tenant_result" | sed -n '1p')"
  tenant_body="$(printf '%s' "$tenant_result" | sed '1d')"
  require_http_success "create pending tenant" "$tenant_http_code" "$tenant_body"
  tenant_id="$(json_get "$tenant_body" id)"
  echo "pendingTenantCreated=true status=$(json_get "$tenant_body" status)"

  before_invite_mail_count="$(mailpit_count)"
  invitee_json="$(json_string "${PHASE8_FIRST_OWNER_EMAIL:-$PHASE8_FIRST_ADMIN_EMAIL}")"
  invite_result="$(http_request POST "$BASE/api/platform/tenants/$tenant_id/first-owner-invitations" "{\"inviteeEmail\":$invitee_json,\"locale\":\"en-US\"}" "$PHASE8_PLATFORM_ACCESS_TOKEN" "$PHASE8_PLATFORM_ACTOR_ID")"
  invite_http_code="$(printf '%s' "$invite_result" | sed -n '1p')"
  invite_body="$(printf '%s' "$invite_result" | sed '1d')"
  require_http_success "create FIRST_OWNER invitation" "$invite_http_code" "$invite_body"
  echo "firstOwnerInvitationCreated=true status=$(json_get "$invite_body" status)"

  for _ in $(seq 1 20); do
    after_invite_mail_count="$(mailpit_count)"
    if [ "$after_invite_mail_count" -gt "$before_invite_mail_count" ]; then
      echo "mailpitFirstOwnerMailArrived=true countDelta=$((after_invite_mail_count - before_invite_mail_count))"
      break
    fi
    sleep 2
  done
  if [ "${after_invite_mail_count:-0}" -le "$before_invite_mail_count" ]; then
    echo "ERROR: FIRST_OWNER email did not arrive in Mailpit" >&2
    exit 1
  fi
else
  echo "tenantFirstOwnerFlow=skipped reason=PHASE8_PLATFORM_ACCESS_TOKEN_or_PHASE8_PLATFORM_ACTOR_ID_missing"
fi

echo "phase8E2E=completed"
