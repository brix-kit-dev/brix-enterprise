#!/bin/bash
set -euo pipefail

: "${BRIX_SUPER_ADMIN_LOGIN_ID:?Set BRIX_SUPER_ADMIN_LOGIN_ID before running this script}"

docker exec brix-postgres psql -U brix -d brix -v login_id="$BRIX_SUPER_ADMIN_LOGIN_ID" -c "DELETE FROM sys_identity WHERE email = :'login_id';"
echo === remaining identities ===
docker exec brix-postgres psql -U brix -d brix -c "SELECT id, email, status FROM sys_identity;"
