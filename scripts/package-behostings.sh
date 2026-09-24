#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# Moteurs.com — paquet de déploiement pour un hébergement Node.js (Behostings /
# cPanel « Setup Node.js App » / VPS).
#
# À lancer sous Linux (WSL, VM ou CI) — les binaires natifs (sharp) doivent
# correspondre au serveur cible (linux-x64, glibc).
#
#   bash scripts/package-behostings.sh            → dist/moteurs-behostings-<date>.zip
#
# Contenu du zip (racine = dossier de l'application côté cPanel) :
#   server.js            serveur Next.js autonome (généré par `output: standalone`)
#   app.js               point d'entrée Passenger/cPanel (charge server.js)
#   .next/               build + static + cache ISR (dossier `cache/` créé au run)
#   public/              assets statiques (images, flyers, data…)
#   node_modules/        uniquement les dépendances runtime tracées par Next
#   package.json         minimal (name/version/scripts)
#   .env.example         variables à saisir dans cPanel › Node.js App › Environment
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")/.."

STAMP=$(date +%Y%m%d-%H%M)
OUT_DIR=dist
PKG=$OUT_DIR/moteurs-behostings-$STAMP
ZIP=$PKG.zip

echo "▶ Build standalone…"
NEXT_OUTPUT=standalone NEXT_TELEMETRY_DISABLED=1 npm run build

echo "▶ Assemblage → $PKG"
rm -rf "$PKG"; mkdir -p "$PKG"
cp -r .next/standalone/. "$PKG/"
mkdir -p "$PKG/.next/static" "$PKG/public"
cp -r .next/static/. "$PKG/.next/static/"
cp -r public/. "$PKG/public/"

# Point d'entrée Passenger (cPanel demande un « Application startup file »)
cat > "$PKG/app.js" << 'EOF'
// Point d'entrée cPanel / Passenger — Moteurs.com (Next.js standalone)
// cPanel injecte PORT ; Next standalone lit HOSTNAME/PORT.
// NB : '127.0.0.1' provoque une boucle de redirection (rewrite du middleware next-intl
// vers http://localhost:PORT/fr) — garder 'localhost' ou '0.0.0.0'.
// NB 2 : ne PAS reprendre process.env.HOSTNAME — sur un serveur mutualisé le shell la définit
// déjà (nom de la machine) ; utiliser NEXT_HOSTNAME pour surcharger.
process.env.HOSTNAME = process.env.NEXT_HOSTNAME || 'localhost'
process.env.PORT = process.env.PORT || '3000'
process.env.NODE_ENV = 'production'
process.chdir(__dirname)
require('./server.js')
EOF

cat > "$PKG/.env.example" << 'EOF'
# À reporter dans cPanel › Setup Node.js App › Environment variables
NEXT_PUBLIC_SUPABASE_URL=https://ahgtdixezbguinovljoa.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ORS_API_KEY=
NEXT_PUBLIC_ORS_BASE_URL=
OCM_API_KEY=
# optionnel : écriture serveur (leads, revalidate) sans passer par la RLS anon
SUPABASE_SERVICE_ROLE_KEY=
NODE_ENV=production
EOF

# Ne pas embarquer l'env local ni le cache de build
rm -f "$PKG/.env.local" "$PKG/.env"
rm -rf "$PKG/.next/cache"

echo "▶ Taille (trajets générés à la demande — voir lib/prerender.ts)"
du -sh "$PKG"
echo "▶ Zip → $ZIP"
rm -f "$ZIP"
( cd "$PKG" && zip -qr "../$(basename "$ZIP")" . )
du -sh "$ZIP"
echo "✔ Prêt : $ZIP"
echo "   Voir DEPLOIEMENT-BEHOSTINGS.md pour les étapes cPanel."
