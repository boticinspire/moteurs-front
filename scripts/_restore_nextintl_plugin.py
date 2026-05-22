"""
On remet le plugin next-intl dans next.config.mjs maintenant qu'on a
confirmé que Node 22 + config minimale Vercel marche.
"""
import os
import tempfile

p = "next.config.mjs"
new_content = """import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {}

export default withNextIntl(nextConfig)
"""

fd, tmp = tempfile.mkstemp(prefix=".atomic_", dir=os.path.dirname(p) or ".")
with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
    f.write(new_content)
    f.flush()
    os.fsync(f.fileno())
os.replace(tmp, p)
print(f"OK plugin next-intl restored: {os.path.getsize(p)} bytes")
print(open(p, encoding="utf-8").read())
