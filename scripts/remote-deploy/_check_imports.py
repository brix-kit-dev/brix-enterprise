import zipfile
z = zipfile.ZipFile('/home/deploy/host-shell-standalone/target/host-shell-standalone-3.2.0-SNAPSHOT-exec.jar')
names = set(z.namelist())
removed = 'BOOT-INF/lib/platform-auth-web-3.2.0.jar'
if removed in names:
    raise SystemExit(f'forbidden legacy auth web jar still packaged: {removed}')
print('platform-auth-web jar absent')
print('platform auth/runtime libs:')
for name in sorted(names):
    if name.startswith('BOOT-INF/lib/platform-auth') or name.startswith('BOOT-INF/lib/platform-admin'):
        print(name)
