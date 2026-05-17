import zipfile, os, sys
target = sys.argv[1]
z = zipfile.ZipFile(target)
print('=== ALL BOOT-INF/lib JARs ===')
libs = sorted([n for n in z.namelist() if n.startswith('BOOT-INF/lib/') and n.endswith('.jar')])
for n in libs:
    print(' ', n.replace('BOOT-INF/lib/', ''))
print(f'\nTotal: {len(libs)} JARs')
