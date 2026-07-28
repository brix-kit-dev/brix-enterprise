#!/bin/bash
set -euo pipefail

redact() {
  sed -E \
    -e 's/"(accessToken|identityToken|refreshToken|token|setupCode|setupToken|setupUrl|inviteUrl|password|secret|totpCode)"[[:space:]]*:[[:space:]]*"[^"]*"/"\1":"[REDACTED]"/Ig' \
    -e 's#https?://[^" <>]+#https://[REDACTED]#g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL_REDACTED]/g'
}

echo '=== platform admin summary ==='
docker exec brix-postgres psql -U brix -d brix -c \
  "SELECT status, role_code, count(*) FROM sys_platform_admin GROUP BY status, role_code ORDER BY status, role_code;" 2>&1 | redact
echo
echo '=== identity summary ==='
docker exec brix-postgres psql -U brix -d brix -c \
  "SELECT status, identity_type, count(*) FROM sys_identity GROUP BY status, identity_type ORDER BY status, identity_type;" 2>&1 | redact
echo
echo '=== bootstrap log summary ==='
docker logs brix-host-shell-standalone 2>&1 \
  | grep -iE 'bootstrap|platform-admin|setup|fatal|readiness' \
  | tail -30 \
  | redact
