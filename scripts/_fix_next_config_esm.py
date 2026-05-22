"""
Fix next.config.ts qui plante en build Vercel à cause de `path.resolve(__dirname)`
en mode ESM (__dirname n'existe pas). On retire le bloc turbopack.root qui
n'est pas critique pour la prod (utile uniquement en dev local).
"""
import os
import tempfile

p = "next.config.ts"
new_content = """import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {}

export default withNextIntl(nextConfig)
"""

# Atomic write
fd, tmp = tempfile.mkstemp(prefix=".atomic_", dir=os.path.dirname(p) or ".")
with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
    f.write(new_content)
    f.flush()
    os.fsync(f.fileno())
os.replace(tmp, p)

print(f"OK fixed, new size: {os.path.getsize(p)} bytes")
print(open(p, encoding="utf-8").read())
