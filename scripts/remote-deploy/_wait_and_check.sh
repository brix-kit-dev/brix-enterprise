#!/bin/bash
set -euo pipefail

redact() {
  sed -E \
    -e 's/(Bearer )[A-Za-z0-9._~+\/=-]+/\1[REDACTED]/g' \
    -e 's/"(accessToken|identityToken|refreshToken|token|setupCode|setupToken|setupUrl|inviteUrl|password|secret|totpCode)"[[:space:]]*:[[:space:]]*"[^"]*"/"\1":"[REDACTED]"/Ig' \
    -e 's#https?://[^" <>]+#https://[REDACTED]#g' \
    -e 's/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/[EMAIL_REDACTED]/g'
}

for i in $(seq 1 30); do
  status=$(docker inspect -f '{{.State.Health.Status}}' brix-host-shell-standalone 2>/dev/null || echo unknown)
  echo "attempt $i: $status"
  if [ "$status" = "healthy" ]; then
    break
  fi
  sleep 5
done

echo
echo "=== actuator readiness ==="
curl -sS http://localhost:8081/actuator/health/readiness | redact
echo

echo "=== runtime bootstrap log summary ==="
docker logs brix-host-shell-standalone 2>&1 \
  | grep -iE 'runtime shell|bootstrap|readiness|platform-admin|platform-tenant|brix-app-tenant|fatal' \
  | tail -40 \
  | redact
