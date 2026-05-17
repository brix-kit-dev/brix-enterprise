import zipfile, sys
z = zipfile.ZipFile(sys.argv[1])
hits = [n for n in z.namelist() if 'security' in n.lower() or 'bcrypt' in n.lower()]
print('\n'.join(hits[:15]))
print(f'Total entries: {len(z.namelist())}')
