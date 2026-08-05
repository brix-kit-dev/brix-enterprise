import zipfile
z = zipfile.ZipFile('/home/deploy/host-shell-standalone/target/host-shell-standalone-3.2.0-SNAPSHOT-exec.jar')
forbidden_entries = [
    'BOOT-INF/lib/platform-auth-web-3.2.0.jar',
    'BOOT-INF/classes/io/brix/platform/auth/web/advice/AuthFlowExceptionAdvice.class',
    'BOOT-INF/classes/io/brix/platform/auth/web/controller/AuthController.class',
]
names = set(z.namelist())
present = [entry for entry in forbidden_entries if entry in names]
if present:
    raise SystemExit('forbidden legacy platform-auth-web entries present: ' + ', '.join(present))
print('legacy platform-auth-web advice/controller entries absent')
