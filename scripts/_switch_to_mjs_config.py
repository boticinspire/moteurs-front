"""
Plan D : remplace next.config.ts par next.config.mjs (ESM pur, pas de
compilation TS) pour contourner le bug Vercel CLI 54 "modifyConfig path
undefined" qui se produit pendant la transformation du .ts en .js.

Étapes :
1. Crée next.config.mjs avec config minimale + plugin next-intl
2. Supprime next.config.ts (si possible)
"""
import os
import tempfile

# 1. Crée next.config.mjs
mjs_content = """import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {}

export default withNextIntl(nextConfig)
"""

target = "next.config.mjs"
fd, tmp = tempfile.mkstemp(prefix=".atomic_", dir=os.path.dirname(target) or ".")
with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
    f.write(mjs_content)
    f.flush()
    os.fsync(f.fileno())
os.replace(tmp, target)
print(f"OK created {target}, size: {os.path.getsize(target)} bytes")

# 2. Vide next.config.ts (next.js privilégie .mjs si présent, mais on évite l'ambiguïté)
# Note : on ne peut pas supprimer depuis Python sur Windows si verrouillé,
# alors on remplace par un export vide qui ne fait rien.
ts_path = "next.config.ts"
if os.path.exists(ts_path):
    # Remplace par un fichier qui ne sera jamais lu (next.js privilégie .mjs > .ts)
    try:
        os.unlink(ts_path)
        print(f"OK deleted {ts_path}")
    except Exception as e:
        print(f"WARNING couldn't delete {ts_path}: {e}")
        print("  -> please delete it manually with: Remove-Item next.config.ts")
