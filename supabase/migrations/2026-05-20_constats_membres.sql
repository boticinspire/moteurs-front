-- ═══════════════════════════════════════════════════════════════════════════
-- Moteurs.com — Group D : Espace Membres étendu
-- À exécuter dans Supabase → SQL Editor → New Query → Run
--
-- Migration idempotente (peut être ré-exécutée sans risque).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. Extension user_context : conducteur + assurance ─────────────────────
-- (immatriculation est ajoutée à voiture en JSONB, pas besoin d'ALTER)

ALTER TABLE user_context ADD COLUMN IF NOT EXISTS conducteur jsonb;
ALTER TABLE user_context ADD COLUMN IF NOT EXISTS assurance  jsonb;

COMMENT ON COLUMN user_context.conducteur IS
  'Identité du conducteur principal : nom, prenom, adresse, telephone, email. Pré-remplit le constat amiable.';
COMMENT ON COLUMN user_context.assurance IS
  'Assurance auto : nom_assureur, numero_police, agence, telephone. Pré-remplit le constat amiable.';

-- ─── 2. Nouvelle table constats_membres (schéma hybride JSON + extracts) ────

CREATE TABLE IF NOT EXISTS constats_membres (
  id                 uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at         timestamptz   NOT NULL DEFAULT now(),
  updated_at         timestamptz   NOT NULL DEFAULT now(),
  -- Dump JSON complet du ConstantData (source de vérité)
  data               jsonb         NOT NULL,
  -- Champs extraits pour la liste/filtre rapide (évite de parser le JSON)
  date_accident      date,
  lieu               text,
  pays               text,
  vehicule_a_immat   text,
  vehicule_b_immat   text,
  -- Statut : draft (en cours) | sauvegarde (terminé) | envoye (email parti)
  statut             text          NOT NULL DEFAULT 'sauvegarde'
);

COMMENT ON TABLE constats_membres IS
  'Constats amiables sauvegardés dans l''espace membre. Schéma hybride : data complet en JSONB + 5 champs extraits pour la liste rapide.';

-- Index pour lister les constats d'un user triés par date, instantané
CREATE INDEX IF NOT EXISTS idx_constats_membres_user_created
  ON constats_membres (user_id, created_at DESC);

-- Trigger pour maintenir updated_at à jour automatiquement
CREATE OR REPLACE FUNCTION constats_membres_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS constats_membres_touch_trg ON constats_membres;
CREATE TRIGGER constats_membres_touch_trg
  BEFORE UPDATE ON constats_membres
  FOR EACH ROW EXECUTE FUNCTION constats_membres_touch_updated_at();

-- ─── 3. RLS : un user ne voit/modifie/supprime QUE ses propres constats ─────

ALTER TABLE constats_membres ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "constats_membres_user_select" ON constats_membres;
CREATE POLICY "constats_membres_user_select"
  ON constats_membres FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "constats_membres_user_insert" ON constats_membres;
CREATE POLICY "constats_membres_user_insert"
  ON constats_membres FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "constats_membres_user_update" ON constats_membres;
CREATE POLICY "constats_membres_user_update"
  ON constats_membres FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "constats_membres_user_delete" ON constats_membres;
CREATE POLICY "constats_membres_user_delete"
  ON constats_membres FOR DELETE
  USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════════════════
-- Vérifications post-exécution (à lancer pour valider)
-- ═══════════════════════════════════════════════════════════════════════════
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'user_context' ORDER BY ordinal_position;
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name = 'constats_membres' ORDER BY ordinal_position;
-- SELECT polname FROM pg_policies WHERE tablename = 'constats_membres';
