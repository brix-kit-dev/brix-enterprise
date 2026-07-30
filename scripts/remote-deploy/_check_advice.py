import zipfile
z = zipfile.ZipFile('/home/deploy/host-shell-standalone/target/host-shell-standalone-3.2.0-SNAPSHOT-exec.jar')
inner = z.read('BOOT-INF/lib/platform-auth-web-3.2.0.jar')
open('/tmp/aw.jar', 'wb').write(inner)
z2 = zipfile.ZipFile('/tmp/aw.jar')
data = z2.read('io/brix/platform/auth/web/advice/AuthFlowExceptionAdvice.class')
print('auth advice package marker present:', b'io/brix/platform/auth/web/advice' in data)
print('size:', len(data))
# also list all META-INF
for n in z2.namelist():
    if 'spring' in n.lower() or 'autoconf' in n.lower():
        print(n)
