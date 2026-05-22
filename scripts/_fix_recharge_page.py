"""
Fix rapide pour le hub /recharge-electrique :
  1. Remplace la fonction paysLabel hardcodée FR par useTranslations('Common')
  2. Change la couleur du lead hero pour respecter le contraste sombre

Écriture atomique tempfile + os.replace.
"""
import os
import re
import tempfile

p = "app/[locale]/recharge-electrique/page.tsx"
c = open(p, encoding="utf-8").read()
original_len = len(c)

# Fix 1.a : ajouter const tc = useTranslations('Common') juste après const ts
c = c.replace(
    "const ts = useTranslations('HubsShared')",
    "const ts = useTranslations('HubsShared')\n  const tc = useTranslations('Common')",
)

# Fix 1.b : remplacer paysLabel(...) par tc('country_xx')
c = c.replace(
    "{paysLabel(tarif.code as 'FR'|'BE'|'CH'|'CA')}",
    "{tc(('country_' + tarif.code.toLowerCase()) as 'country_fr'|'country_be'|'country_ch'|'country_ca')}",
)

# Fix 1.c : supprimer la fonction paysLabel + son commentaire
c = re.sub(
    r"// Pays labels[^\n]*\n// [^\n]*\nfunction paysLabel[\s\S]*?\n\}\n",
    "",
    c,
)

# Fix 2 : améliorer le contraste du lead hero
c = c.replace(
    "<p style={{ fontSize: '1rem', lineHeight: 1.65, maxWidth: 720, color: 'var(--color-text)' }}>",
    "<p style={{ fontSize: '1rem', lineHeight: 1.65, maxWidth: 720, color: 'rgba(255,255,255,0.92)' }}>",
)

# Atomic write
fd, tmp = tempfile.mkstemp(prefix=".atomic_", dir=os.path.dirname(p))
try:
    with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as f:
        f.write(c)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, p)
except Exception:
    try:
        os.unlink(tmp)
    except FileNotFoundError:
        pass
    raise

new_size = os.path.getsize(p)
print(f"OK {p}")
print(f"  before: {original_len} bytes")
print(f"  after:  {new_size} bytes")
print(f"  delta:  {new_size - original_len:+d} bytes")
