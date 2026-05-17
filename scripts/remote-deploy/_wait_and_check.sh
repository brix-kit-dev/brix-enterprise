#!/bin/bash
# wait for health
for i in $(seq 1 30); do
  status=$(docker inspect -f '{{.State.Health.Status}}' brix-host-shell-standalone 2>/dev/null || echo unknown)
  echo "attempt $i: $status"
  if [ "$status" = "healthy" ]; then break; fi
  sleep 5
done
echo
echo "=== bootstrap log lines ==="
docker logs brix-host-shell-standalone 2>&1 | grep -iE 'super_?admin|bootstrap.*super|SuperAdminBootstrap' | tail -20
echo
echo "=== identities ==="
docker exec brix-postgres psql -U brix -d brix -c "SELECT id, email, status, password_must_change FROM sys_identity;"
echo
echo "=== platform admins ==="
docker exec brix-postgres psql -U brix -d brix -c "SELECT id, identity_id, role, status FROM sys_platform_admin;"
