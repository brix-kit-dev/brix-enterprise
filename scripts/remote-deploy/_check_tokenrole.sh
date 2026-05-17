#!/bin/bash
set -e
docker exec brix-host-shell-standalone sh -c '
  ls -la /app/
  unzip -p /app/app.jar BOOT-INF/lib/platform-auth-3.2.0.jar > /tmp/pa.jar 2>/dev/null
  unzip -p /tmp/pa.jar io/brix/platform/auth/enums/TokenRole.class | strings | grep -iE "platform|subject|actor"
'
