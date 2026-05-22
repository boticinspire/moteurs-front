"""
Fix next.config.ts v3 : process.cwd() au lieu de import.meta.url
pour éviter le bug ESM/CommonJS sur Vercel.
"""
import os
import tempfile

p = "next.config.ts"
new_content = """import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
}

export default withNextIntl(nextConfig)
"""

fd, tmp = tempfile.mkstemp(prefix=".atomic_", dir=os.path.dirname(p) or ".")
with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
    f.write(new_content)
    f.flush()
    os.fsync(f.fileno())
os.replace(tmp, p)

print(f"OK fixed, new size: {os.path.getsize(p)} bytes")
print("--- new content ---")
print(open(p, encoding="utf-8").read())
