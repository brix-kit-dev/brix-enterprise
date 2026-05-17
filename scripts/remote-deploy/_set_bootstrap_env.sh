#!/bin/bash
set -euo pipefail

: "${BRIX_BOOTSTRAP_SUPER_ADMIN_EMAIL:?Set BRIX_BOOTSTRAP_SUPER_ADMIN_EMAIL before running this script}"
: "${BRIX_BOOTSTRAP_SUPER_ADMIN_PASSWORD:?Set BRIX_BOOTSTRAP_SUPER_ADMIN_PASSWORD before running this script}"
: "${BRIX_BOOTSTRAP_SUPER_ADMIN_USERNAME:?Set BRIX_BOOTSTRAP_SUPER_ADMIN_USERNAME before running this script}"

BRIX_BOOTSTRAP_SUPER_ADMIN_ENABLED="${BRIX_BOOTSTRAP_SUPER_ADMIN_ENABLED:-true}"
BRIX_BOOTSTRAP_SUPER_ADMIN_REQUIRE_MFA="${BRIX_BOOTSTRAP_SUPER_ADMIN_REQUIRE_MFA:-false}"

cd /home/deploy/host-shell-standalone

# Append super-admin bootstrap settings if not present. Values must come from
# the operator's secret source; this script must not carry default credentials.
if ! grep -q '^BRIX_BOOTSTRAP_SUPER_ADMIN_EMAIL=' .env; then
  cat >> .env <<EOF

# SUPER_ADMIN Bootstrap (Layer 2C)
BRIX_BOOTSTRAP_SUPER_ADMIN_ENABLED=$BRIX_BOOTSTRAP_SUPER_ADMIN_ENABLED
BRIX_BOOTSTRAP_SUPER_ADMIN_EMAIL=$BRIX_BOOTSTRAP_SUPER_ADMIN_EMAIL
BRIX_BOOTSTRAP_SUPER_ADMIN_PASSWORD=$BRIX_BOOTSTRAP_SUPER_ADMIN_PASSWORD
BRIX_BOOTSTRAP_SUPER_ADMIN_USERNAME=$BRIX_BOOTSTRAP_SUPER_ADMIN_USERNAME
BRIX_BOOTSTRAP_SUPER_ADMIN_REQUIRE_MFA=$BRIX_BOOTSTRAP_SUPER_ADMIN_REQUIRE_MFA
EOF
  echo "appended bootstrap settings to .env"
else
  echo "bootstrap settings already in .env"
fi
echo
echo "=== bootstrap env (password redacted) ==="
grep '^BRIX_BOOTSTRAP_SUPER_ADMIN_' .env | sed 's/\(BRIX_BOOTSTRAP_SUPER_ADMIN_PASSWORD=\).*/\1****/'
