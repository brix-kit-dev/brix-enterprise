#!/bin/bash
echo '=== sys_platform_admin ==='
docker exec brix-postgres psql -U brix -d brix -c "\d sys_platform_admin" 2>&1 | head -40
echo
docker exec brix-postgres psql -U brix -d brix -c "SELECT id, identity_id, login_id, status, role_code FROM sys_platform_admin;" 2>&1
echo
echo '=== sys_identity ==='
docker exec brix-postgres psql -U brix -d brix -c "\d sys_identity" 2>&1 | head -40
echo
docker exec brix-postgres psql -U brix -d brix -c "SELECT id, login_id, identity_type FROM sys_identity LIMIT 10;" 2>&1
echo
echo '=== bootstrap config ==='
docker exec brix-host-shell-standalone sh -c "env | grep -i super" 2>&1
