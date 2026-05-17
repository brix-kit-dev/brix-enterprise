import zipfile, os, sys
target = sys.argv[1] if len(sys.argv) > 1 else 'target'
jars = [f for f in os.listdir(target) if f.endswith('.jar')]
z = zipfile.ZipFile(os.path.join(target, jars[0]))
names = z.namelist()
print('=== platform-*.jar libs in BOOT-INF/lib ===')
for n in names:
    if n.startswith('BOOT-INF/lib/platform-'):
        print(' ', n)
print('\n=== auth-related libs ===')
for n in names:
    if n.startswith('BOOT-INF/lib/') and 'auth' in n.lower():
        print(' ', n)
print('\n=== runtime/sdk libs ===')
for n in names:
    if n.startswith('BOOT-INF/lib/') and ('runtime' in n.lower() or 'sdk' in n.lower()):
        print(' ', n)
print('\n=== AuthFlow related classes/files ===')
for n in names:
    if 'AuthFlow' in n or 'authflow' in n.lower():
        print(' ', n)
print('\n=== AutoConfiguration imports ===')
imports = [n for n in names if n.endswith('AutoConfiguration.imports')]
for n in imports[:30]: print(' ', n)
