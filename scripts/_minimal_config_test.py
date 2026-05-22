"""
TEST DIAGNOSTIC : config minimale absolue, SANS next-intl plugin.
Si Vercel plante encore, le bug est 100% côté Vercel (pas notre code).
Si Vercel passe, le bug vient du plugin next-intl.

ATTENTION : la prod va planter au runtime parce qu'il n'y aura plus
de chargement des messages. C'est UNIQUEMENT pour diagnostiquer.
"""
import os
import tempfile

p = "next.config.mjs"
new_content = """/** @type {import('next').NextConfig} */
const nextConfig = {}

export default nextConfig
"""

fd, tmp = tempfile.mkstemp(prefix=".atomic_", dir=os.path.dirname(p) or ".")
with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
    f.write(new_content)
    f.flush()
    os.fsync(f.fileno())
os.replace(tmp, p)
print(f"OK minimal config written: {os.path.getsize(p)} bytes")
print(open(p, encoding="utf-8").read())
