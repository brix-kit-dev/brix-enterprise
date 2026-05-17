import zipfile, sys, io
target = sys.argv[1]
inner_name = sys.argv[2]
outer = zipfile.ZipFile(target)
data = outer.read(inner_name)
inner = zipfile.ZipFile(io.BytesIO(data))
imports_name = 'META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports'
print(inner.read(imports_name).decode())
