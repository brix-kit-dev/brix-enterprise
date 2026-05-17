#!/usr/bin/env python3
"""Inject SUPER_ADMIN bootstrap env mappings into host-shell service block."""
import sys

PATH = '/home/deploy/host-shell-standalone/docker-compose.yml'
ANCHOR = '      - BRIX_FALLBACK_AUTH_ENABLED=true\n'
BLOCK = (
    '      # Super-Admin Bootstrap (Layer 2C) - credentials sourced from .env\n'
    '      - BRIX_BOOTSTRAP_SUPER_ADMIN_ENABLED=${BRIX_BOOTSTRAP_SUPER_ADMIN_ENABLED:-false}\n'
    '      - BRIX_BOOTSTRAP_SUPER_ADMIN_EMAIL=${BRIX_BOOTSTRAP_SUPER_ADMIN_EMAIL:-}\n'
    '      - BRIX_BOOTSTRAP_SUPER_ADMIN_PASSWORD=${BRIX_BOOTSTRAP_SUPER_ADMIN_PASSWORD:-}\n'
    '      - BRIX_BOOTSTRAP_SUPER_ADMIN_USERNAME=${BRIX_BOOTSTRAP_SUPER_ADMIN_USERNAME:-Super Admin}\n'
    '      - BRIX_BOOTSTRAP_SUPER_ADMIN_REQUIRE_MFA=${BRIX_BOOTSTRAP_SUPER_ADMIN_REQUIRE_MFA:-false}\n'
)

with open(PATH) as f:
    text = f.read()

if 'BRIX_BOOTSTRAP_SUPER_ADMIN_ENABLED' in text:
    print('already-patched')
    sys.exit(0)

# Inject after the SECOND occurrence (the host-shell block one near line 84)
parts = text.split(ANCHOR)
if len(parts) < 3:
    print(f'anchor count {len(parts) - 1}, expected >= 2')
    sys.exit(1)
# rebuild: first anchor stays, second is followed by injected block
new = parts[0] + ANCHOR + parts[1] + ANCHOR + BLOCK + ANCHOR.join(parts[2:])
with open(PATH, 'w') as f:
    f.write(new)
print('patched')
