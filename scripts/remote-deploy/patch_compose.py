#!/usr/bin/env python3
"""Inject Bootstrap v2 env mappings into host-shell service block."""
import sys

PATH = '/home/deploy/host-shell-standalone/docker-compose.yml'
ANCHOR = '      - BRIX_FALLBACK_AUTH_ENABLED=true\n'
MFA_BLOCK = (
    '      - BRIX_PLATFORM_MFA_ISSUER=${BRIX_PLATFORM_MFA_ISSUER:-Brix}\n'
    '      - BRIX_PLATFORM_MFA_ENCRYPTION_KEY=${BRIX_PLATFORM_MFA_ENCRYPTION_KEY:?BRIX_PLATFORM_MFA_ENCRYPTION_KEY is required. Create .env file with a base64-encoded 32-byte random value.}\n'
)
BLOCK = (
    '      # Platform Admin setup-link delivery and Bootstrap configuration\n'
    + MFA_BLOCK
    '      - BRIX_PLATFORM_ADMIN_SETUP_BASE_URL=${BRIX_PLATFORM_ADMIN_SETUP_BASE_URL:-}\n'
    '      - BRIX_PLATFORM_ADMIN_SETUP_MAIL_FROM=${BRIX_PLATFORM_ADMIN_SETUP_MAIL_FROM:-}\n'
    '      - BRIX_PLATFORM_ADMIN_SETUP_TOKEN_TTL_SECONDS=${BRIX_PLATFORM_ADMIN_SETUP_TOKEN_TTL_SECONDS:-86400}\n'
    '      - BRIX_PLATFORM_ADMIN_SETUP_RETURN_URL_FOR_DEV_ONLY=${BRIX_PLATFORM_ADMIN_SETUP_RETURN_URL_FOR_DEV_ONLY:-false}\n'
    '      - BRIX_BOOTSTRAP_SUPER_ADMIN_ENABLED=${BRIX_BOOTSTRAP_SUPER_ADMIN_ENABLED:-false}\n'
    '      - BRIX_BOOTSTRAP_SUPER_ADMIN_EMAIL=${BRIX_BOOTSTRAP_SUPER_ADMIN_EMAIL:-}\n'
    '      - BRIX_BOOTSTRAP_SUPER_ADMIN_USERNAME=${BRIX_BOOTSTRAP_SUPER_ADMIN_USERNAME:-Super Admin}\n'
    '      - BRIX_BOOTSTRAP_SUPER_ADMIN_SETUP_CODE=${BRIX_BOOTSTRAP_SUPER_ADMIN_SETUP_CODE:-}\n'
    '      - BRIX_BOOTSTRAP_SUPER_ADMIN_SETUP_CODE_TTL_SECONDS=${BRIX_BOOTSTRAP_SUPER_ADMIN_SETUP_CODE_TTL_SECONDS:-900}\n'
    '      - BRIX_BOOTSTRAP_SUPER_ADMIN_SESSION_TTL_SECONDS=${BRIX_BOOTSTRAP_SUPER_ADMIN_SESSION_TTL_SECONDS:-300}\n'
)

with open(PATH) as f:
    text = f.read()

if 'BRIX_BOOTSTRAP_SUPER_ADMIN_SETUP_CODE' in text:
    if 'BRIX_PLATFORM_MFA_ENCRYPTION_KEY' not in text:
        marker = '      - BRIX_PLATFORM_ADMIN_SETUP_BASE_URL='
        if marker not in text:
            print('bootstrap-present-but-mfa-marker-missing')
            sys.exit(1)
        text = text.replace(marker, MFA_BLOCK + marker, 1)
        with open(PATH, 'w') as f:
            f.write(text)
        print('patched-mfa')
        sys.exit(0)
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
