"""
Fix next.config.ts plus défensif :
- Utilise import.meta.url + fileURLToPath pour gérer __dirname en ESM
- Force outputFileTracingRoot pour éviter le "Received undefined" de Vercel
- Garde le plugin next-intl
"""
import os
import tempfile

p = "next.config.ts"
new_content = """import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'
import createNextIntlPlugin from 'next-intl/plugin'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
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
