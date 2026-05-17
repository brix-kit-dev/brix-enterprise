import zipfile, os, sys
target = sys.argv[1] if len(sys.argv) > 1 else 'target'
jars = [f for f in os.listdir(target) if f.endswith('.jar')]
print('Found JARs:', jars)
for j in jars:
    print(f'\n=== {j} ===')
    z = zipfile.ZipFile(os.path.join(target, j))
    names = z.namelist()
    print(f'Total entries: {len(names)}')
    sec = [n for n in names if 'spring-security' in n.lower()]
    pwd = [n for n in names if 'PasswordCapability' in n]
    bcrypt = [n for n in names if 'BCrypt' in n]
    print('spring-security entries:')
    for n in sec[:15]: print(' ', n)
    print('PasswordCapability entries:')
    for n in pwd[:15]: print(' ', n)
    print('BCrypt entries:')
    for n in bcrypt[:15]: print(' ', n)
