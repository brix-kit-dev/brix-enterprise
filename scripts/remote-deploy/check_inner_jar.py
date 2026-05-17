import zipfile, os, sys, io
target = sys.argv[1]
outer = zipfile.ZipFile(target)
inner_name = 'BOOT-INF/lib/platform-auth-3.2.0.jar'
data = outer.read(inner_name)
inner = zipfile.ZipFile(io.BytesIO(data))
names = inner.namelist()
print(f'=== {inner_name} contents ({len(names)} entries) ===')
for n in names:
    if n.endswith('.class') or n.endswith('.imports'):
        print(' ', n)
