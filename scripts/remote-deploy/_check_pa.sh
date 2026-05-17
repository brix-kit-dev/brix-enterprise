#!/bin/sh
set -e
echo "--- /app contents ---"
docker exec brix-host-shell-standalone sh -c 'ls -la /app'
echo "--- platform-admin in jar ---"
docker exec brix-host-shell-standalone sh -c 'unzip -l /app/app.jar | grep -E "platform-admin|PlatformAuthController|PlatformAdminController" | head -40'
echo "--- mapping endpoints (logs) ---"
docker logs --tail 200 brix-host-shell-standalone 2>&1 | grep -E "Mapped|RequestMappingHandlerMapping|/api/platform" | tail -40
