import zipfile
z = zipfile.ZipFile('/home/deploy/host-shell-standalone/target/host-shell-standalone-3.2.0-SNAPSHOT-exec.jar')
inner = z.read('BOOT-INF/lib/platform-auth-web-3.2.0.jar')
open('/tmp/aw.jar', 'wb').write(inner)
z2 = zipfile.ZipFile('/tmp/aw.jar')
print('=== AutoConfiguration.imports ===')
print(z2.read('META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports').decode())
print('=== files ===')
for n in z2.namelist():
    print(n)
