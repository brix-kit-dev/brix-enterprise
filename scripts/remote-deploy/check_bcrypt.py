import zipfile, io, sys
z = zipfile.ZipFile('/home/deploy/host-shell-standalone/target/host-shell-standalone-3.2.0-SNAPSHOT-exec.jar')
data = z.read('BOOT-INF/lib/spring-security-crypto-6.2.1.jar')
inner = zipfile.ZipFile(io.BytesIO(data))
hits = [n for n in inner.namelist() if 'BCryptPasswordEncoder' in n]
print('BCryptPasswordEncoder entries:', hits)
print('Total entries:', len(inner.namelist()))
