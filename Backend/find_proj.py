import pathlib, os

base = pathlib.Path("C:/Program Files/QGIS 3.44.11")
print("Searching for proj.db under QGIS install...")
proj_files = list(base.rglob("proj.db"))
if proj_files:
    for p in proj_files:
        print(f"  FOUND: {p}")
        print(f"  Parent dir: {p.parent}")
else:
    print("  proj.db NOT found under QGIS 3.44.11")

# Also check for any version
base2 = pathlib.Path("C:/Program Files")
print("\nSearching all of 'C:/Program Files' for proj.db (first 5)...")
count = 0
for p in base2.rglob("proj.db"):
    print(f"  {p}")
    count += 1
    if count >= 5:
        break
if count == 0:
    print("  None found")
