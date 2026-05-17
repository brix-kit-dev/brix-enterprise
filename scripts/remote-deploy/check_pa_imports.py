import zipfile, io, sys
jar='/home/deploy/host-shell-standalone/target/host-shell-standalone-3.2.0-SNAPSHOT-exec.jar'
with zipfile.ZipFile(jar) as z:
    inner=z.read('BOOT-INF/lib/platform-auth-3.2.0.jar')
with zipfile.ZipFile(io.BytesIO(inner)) as z2:
    print('=== AutoConfiguration.imports ===')
    print(z2.read('META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports').decode())
    print('=== files in jar ===')
    for n in z2.namelist():
        if 'PasswordCapability' in n or 'AuthFlow' in n or 'JwtIssuer' in n:
            print(n)
