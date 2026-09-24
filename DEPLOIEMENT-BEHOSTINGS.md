# Déploiement de Moteurs.com sur Behostings (mutualisé Node.js / cPanel)

> Objectif : faire tourner **tout** le site Next.js (vitrine `/`, média `/media`, outils, admin, routes API) sur l'hébergement belge, sans Vercel.
> Prérequis à confirmer avec le support Behostings : **Node.js ≥ 20** disponible via « Setup Node.js App » et **mémoire ≥ 1 Go** par application.

## 0. Ce qui est déjà prêt dans le repo

| Élément | Où |
|---|---|
| Sortie standalone activable | `next.config.mjs` — `NEXT_OUTPUT=standalone npm run build` |
| Script de packaging (Linux) | `scripts/package-behostings.sh` → `dist/moteurs-behostings-<date>.zip` |
| Police Inter auto-hébergée | `@fontsource-variable/inter` — plus aucune requête Google Fonts (build hors ligne OK, RGPD) |
| `sharp` | dépendance ajoutée — optimisation d'images `next/image` en production |

## 1. Construire le paquet

Le build **doit être fait sous Linux x64** (binaires natifs `sharp`). Trois possibilités :

1. **WSL / VM Ubuntu sur ton PC** : `npm ci && bash scripts/package-behostings.sh`
2. **Directement dans cPanel** (si la mémoire le permet) : uploader le repo, `npm ci`, `NEXT_OUTPUT=standalone npm run build`, puis suivre §2 avec le dossier tel quel
3. **Session Claude** : paquet produit dans le cloud et déposé dans `D:\Moteurs.com\Moteurs.com\deploy\`

## 2. Première mise en place — test sur un sous-domaine (sans toucher au site actuel)

1. **cPanel › Domaines** : créer le sous-domaine `test.moteurs.com` (ou `moteurs.<domaine-déjà-hébergé>.be`) — document root p.ex. `~/apps/moteurs`.
   ↳ Le DNS de `moteurs.com` reste où il est ; seul l'enregistrement `test` pointe vers Behostings (A/CNAME donné dans cPanel).
2. **Gestionnaire de fichiers** : uploader le zip dans `~/apps/moteurs` et l'extraire (server.js, app.js, .next/, public/, node_modules/ à la racine).
3. **cPanel › Setup Node.js App › Create application** :
   - Node.js version : la plus récente ≥ 20
   - Application mode : `Production`
   - Application root : `apps/moteurs`
   - Application URL : `test.moteurs.com`
   - Application startup file : `app.js`
   - Environment variables : reprendre `.env.example` (valeurs dans `.env.local` du repo)
   - **Ne pas** cliquer « Run NPM Install » (les dépendances runtime sont déjà dans le zip)
4. **Start / Restart** l'application, puis ouvrir `https://test.moteurs.com` (SSL AutoSSL / Let's Encrypt via cPanel).
5. Recette :
   - `/`, `/nl`, `/de` (vitrine) · formulaire de devis → ligne dans Supabase `demandes_gabarits` + email
   - `/media`, `/comparer`, `/comparer-trajet` (route API ORS), `/articles` (ISR), `/admin` (auth Supabase)
   - `/sitemap.xml`, `/robots.txt`
   - Recharger 2-3 fois une page ISR : vérifier que `.next/cache/` se remplit (droits d'écriture OK)
6. Charge / mémoire : surveiller « Resource usage » dans cPanel pendant la recette. Si le process est tué (OOM) → demander plus de mémoire ou passer VPS.

## 3. Bascule de moteurs.com

1. **Supabase › Authentication › URL configuration** : rien à changer (Site URL déjà `https://moteurs.com`).
2. cPanel : changer l'*Application URL* de l'app Node vers `moteurs.com` (ou créer une 2ᵉ app), et ajouter `moteurs.com` + `www.moteurs.com` comme domaine hébergé (offre ≥ Personal).
3. DNS : pointer `moteurs.com` (A) et `www` (CNAME) vers Behostings. TTL bas (300 s) 24 h avant.
4. Vérifier la redirection `www → apex` (déjà gérée dans `next.config.mjs`).
5. Vercel : mettre le projet en pause / supprimer le domaine → plus de plan Pro nécessaire.
6. Rebrancher les crons / Make.com qui appellent `/api/revalidate` ou autres endpoints sur la nouvelle IP (aucun changement d'URL).

## 4. Mises à jour ultérieures

`bash scripts/package-behostings.sh` → uploader le nouveau zip → extraire par-dessus → **Restart** dans Setup Node.js App. (Un petit script SSH/rsync fera l'affaire si Behostings donne l'accès SSH.)

## 5. Si le mutualisé ne suffit pas

- **VPS cloud Behostings** : même paquet, lancé avec `pm2 start app.js` derrière Nginx (reverse proxy vers 127.0.0.1:3000) + certbot. Tout reste en Belgique.
- **Repli** : Vercel plan Pro (usage commercial obligatoire) — aucune modification de code.
