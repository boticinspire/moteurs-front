-- Migration : Agent Recharge — Moteurs.com
-- Tables pour le stockage des cartes de recharge et l'historique des changements

-- ── Table principale : cartes de recharge ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS cartes_recharge (
  id               TEXT        PRIMARY KEY,
  nom              TEXT        NOT NULL,
  operateur        TEXT        NOT NULL,
  pays_origine     TEXT[]      DEFAULT '{}',
  url_officielle   TEXT,
  url_tarifs       TEXT,
  methode_source   TEXT        DEFAULT 'httpx',   -- 'httpx' | 'manuel'
  ideal_voyage     BOOLEAN     DEFAULT FALSE,
  ideal_quotidien  BOOLEAN     DEFAULT FALSE,
  flotte_pro       BOOLEAN     DEFAULT FALSE,
  points_forts     TEXT[]      DEFAULT '{}',
  points_faibles   TEXT[]      DEFAULT '{}',
  donnees          JSONB,                          -- tarifs + roaming (schema flexible)
  hash_donnees     TEXT,                           -- SHA-256 pour détection de changements
  needs_review     BOOLEAN     DEFAULT FALSE,      -- true = scraping incomplet, à vérifier
  anomalies        TEXT[]      DEFAULT '{}',       -- détail des anomalies détectées
  actif            BOOLEAN     DEFAULT TRUE,
  derniere_maj     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour les filtres courants
CREATE INDEX IF NOT EXISTS idx_cartes_recharge_pays
  ON cartes_recharge USING GIN (pays_origine);

CREATE INDEX IF NOT EXISTS idx_cartes_recharge_voyage
  ON cartes_recharge (ideal_voyage) WHERE actif = TRUE;

CREATE INDEX IF NOT EXISTS idx_cartes_recharge_review
  ON cartes_recharge (needs_review) WHERE actif = TRUE;

-- Trigger : mise à jour automatique de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_cartes_recharge ON cartes_recharge;
CREATE TRIGGER set_updated_at_cartes_recharge
  BEFORE UPDATE ON cartes_recharge
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ── Table historique : événements de changement de tarif ──────────────────────

CREATE TABLE IF NOT EXISTS recharge_events (
  id         UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  carte_id   TEXT        REFERENCES cartes_recharge(id) ON DELETE CASCADE,
  type       TEXT        NOT NULL,   -- 'init' | 'init_manuel' | 'tarif_change'
                                     -- | 'scrape_error' | 'extraction_error' | 'manual_update'
  ancien     JSONB,                  -- snapshot donnees avant changement
  nouveau    JSONB,                  -- snapshot donnees après changement
  note       TEXT        DEFAULT '', -- anomalies ou commentaire libre
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recharge_events_carte
  ON recharge_events (carte_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recharge_events_type
  ON recharge_events (type, created_at DESC);


-- ── Politique RLS (Row Level Security) ───────────────────────────────────────
-- Lecture publique (pour le front Next.js via API route proxy)
-- Écriture réservée au service role (backend Railway)

ALTER TABLE cartes_recharge ENABLE ROW LEVEL SECURITY;
ALTER TABLE recharge_events  ENABLE ROW LEVEL SECURITY;

-- Lecture publique des cartes actives
CREATE POLICY "Lecture publique cartes actives"
  ON cartes_recharge FOR SELECT
  USING (actif = TRUE);

-- Lecture publique des events (admin front)
CREATE POLICY "Lecture publique events"
  ON recharge_events FOR SELECT
  USING (TRUE);

-- Écriture service role uniquement (pas de policy INSERT/UPDATE/DELETE pour anon)
-- Le backend utilise la service_role_key, pas l'anon_key → accès complet.


-- ── Vue pratique pour l'admin ─────────────────────────────────────────────────

CREATE OR REPLACE VIEW v_cartes_recharge_resume AS
SELECT
  c.id,
  c.nom,
  c.operateur,
  c.pays_origine,
  c.methode_source,
  c.ideal_voyage,
  c.ideal_quotidien,
  c.flotte_pro,
  c.needs_review,
  c.anomalies,
  c.derniere_maj,
  -- Prix AC slow
  (c.donnees -> 'tarifs_fr' -> 'ac_slow' ->> 'prix')::NUMERIC  AS ac_slow_prix_eur,
  -- Prix DC rapide
  (c.donnees -> 'tarifs_fr' -> 'dc_rapide' ->> 'prix')::NUMERIC AS dc_rapide_prix_eur,
  -- Prix DC ultra
  (c.donnees -> 'tarifs_fr' -> 'dc_ultra' ->> 'prix')::NUMERIC  AS dc_ultra_prix_eur,
  -- Abonnement mensuel
  (c.donnees -> 'abonnement' ->> 'mensuel_eur')::NUMERIC         AS abonnement_mensuel_eur,
  -- Roaming
  (c.donnees -> 'roaming' ->> 'disponible')::BOOLEAN             AS roaming_disponible,
  -- Nb events
  COUNT(e.id) AS nb_events
FROM cartes_recharge c
LEFT JOIN recharge_events e ON e.carte_id = c.id
WHERE c.actif = TRUE
GROUP BY c.id
ORDER BY c.nom;
