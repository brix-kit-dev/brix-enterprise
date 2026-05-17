#!/bin/bash
set -e
cd /tmp
rm -rf authcheck && mkdir authcheck && cd authcheck
# Copy jar from container
docker cp brix-host-shell-standalone:/app/app.jar ./app.jar
python3 << 'PYEOF'
import zipfile, os
with zipfile.ZipFile('app.jar') as z:
    pa = [n for n in z.namelist() if 'BOOT-INF/lib/platform-auth-3' in n and n.endswith('.jar')]
    print("platform-auth jars:", pa)
    if not pa: raise SystemExit(1)
    z.extract(pa[0], '.')
    inner = pa[0]
print("Extracted:", inner)
with zipfile.ZipFile(inner) as z2:
    target = 'io/brix/platform/auth/flow/AuthFlowAutoConfiguration.class'
    if target in z2.namelist():
        data = z2.read(target)
        # Look for ConditionalOnBean string
        import re
        # Class file: look for any string chunks
        s = data.decode('latin-1', errors='ignore')
        for kw in ['ConditionalOnBean', 'AuthFlowCapability', 'IdentityTenantCapability', 'JwtIssuerCapability', 'PasswordCapability', 'authFlowCapability']:
            cnt = s.count(kw)
            print(f"  occurrences of '{kw}': {cnt}")
    else:
        print("AuthFlowAutoConfiguration.class NOT FOUND in jar!")
    # Also check imports file
    imp = 'META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports'
    if imp in z2.namelist():
        print("\n--- AutoConfiguration.imports ---")
        print(z2.read(imp).decode())
PYEOF
