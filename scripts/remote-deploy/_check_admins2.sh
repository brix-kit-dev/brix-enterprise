#!/bin/bash
echo '=== sys_identity rows ==='
docker exec brix-postgres psql -U brix -d brix -c 'SELECT id, username, email, status, password_must_change FROM sys_identity;'
echo
echo '=== sys_platform_admin rows ==='
docker exec brix-postgres psql -U brix -d brix -c 'SELECT id, identity_id, role, status FROM sys_platform_admin;'
echo
echo '=== bootstrap env ==='
docker exec brix-host-shell-standalone env | grep -iE 'super|bootstrap|admin' || echo 'no bootstrap env'
echo
echo '=== bootstrap log lines ==='
docker logs brix-host-shell-standalone 2>&1 | grep -iE 'super|bootstrap|SuperAdmin' | head -30
