#!/bin/bash
set -e
python3 << 'PYEOF'
import zipfile
with zipfile.ZipFile('/tmp/authcheck/app.jar') as z:
    libs = [n for n in z.namelist() if n.startswith('BOOT-INF/lib/') and n.endswith('.jar')]
    keys = ['spring-security-crypto', 'spring-security-core', 'platform-auth', 'enterprise-app-identity', 'identity-core', 'identity-server']
    for k in keys:
        m = [l for l in libs if k in l]
        print(f"{k}: {m}")
PYEOF
