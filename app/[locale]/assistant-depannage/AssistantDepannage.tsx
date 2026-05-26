'use client'

import { useState, useEffect } from 'react'
import { Link, useRouter } from '@/i18n/navigation'
import ScanVoyant from './ScanVoyant'

// ─── Types ────────────────────────────────────────────────────────────────────

type Motorisation = 'essence' | 'diesel' | 'hybride' | 'elec'
type Gravite      = 'critique' | 'urgent' | 'attention' | 'ok'
type EtapeWizard  = 'symptome' | 'questions' | 'loading' | 'resultat'

interface Reponse {
  questionId: string
  question:   string
  reponse:    string
}

interface DiagnosticResult {
  pannes_probables: { nom: string; probabilite: string; explication: string }[]
  gravite:          Gravite
  peut_rouler:      boolean
  etapes:           string[]
  conseil_cle:      string
}

// ─── Arbre de décision ────────────────────────────────────────────────────────

interface Option {
  label:  string
  emoji?: string
  nextId: string
}

interface QuestionNode {
  type:       'question'
  id:         string
  question:   string
  sousTitre?: string
  options:    Option[]
}

interface DiagnosisNode {
  type: 'diagnosis'
  id:   string
}

type TreeNode = QuestionNode | DiagnosisNode

const TREE: Record<string, TreeNode> = {

  // ── 1. NE DÉMARRE PAS ──────────────────────────────────────────────────────

  nd_phares: {
    type: 'question', id: 'nd_phares',
    question: 'Les phares ou l\'éclairage intérieur s\'allument-ils ?',
    sousTitre: 'Tournez la clé en position "accessoires" ou appuyez sur le bouton démarrage',
    options: [
      { label: 'Non, rien ne s\'allume', emoji: '🔴', nextId: 'nd_batterie_morte' },
      { label: 'Oui, éclairage normal',  emoji: '🟢', nextId: 'nd_bruit' },
      { label: 'Lumières faibles / vacillantes', emoji: '🟡', nextId: 'nd_batterie_faible' },
    ],
  },
  nd_batterie_morte: {
    type: 'question', id: 'nd_batterie_morte',
    question: 'Depuis combien de temps le véhicule n\'a pas roulé ?',
    options: [
      { label: 'Moins de 2 semaines',    emoji: '📅', nextId: 'DIAGNOSIS' },
      { label: '2 semaines à 1 mois',    emoji: '📅', nextId: 'DIAGNOSIS' },
      { label: 'Plus d\'1 mois / hiver', emoji: '❄️', nextId: 'DIAGNOSIS' },
    ],
  },
  nd_batterie_faible: {
    type: 'question', id: 'nd_batterie_faible',
    question: 'Quel est l\'âge approximatif de la batterie 12V ?',
    options: [
      { label: 'Moins de 3 ans',      emoji: '🆕', nextId: 'DIAGNOSIS' },
      { label: '3 à 5 ans',           emoji: '⚠️', nextId: 'DIAGNOSIS' },
      { label: 'Plus de 5 ans / inconnu', emoji: '🔋', nextId: 'DIAGNOSIS' },
    ],
  },
  nd_bruit: {
    type: 'question', id: 'nd_bruit',
    question: 'Quel bruit entendez-vous quand vous tentez de démarrer ?',
    options: [
      { label: 'Silence total',                   emoji: '🔇', nextId: 'nd_batterie_faible' },
      { label: 'Cliquetis rapides (tac-tac-tac)',  emoji: '🔩', nextId: 'DIAGNOSIS' },
      { label: 'Moteur tourne mais ne démarre pas', emoji: '🔄', nextId: 'nd_carburant' },
      { label: 'Bruit fort inhabituel',             emoji: '💥', nextId: 'DIAGNOSIS' },
    ],
  },
  nd_carburant: {
    type: 'question', id: 'nd_carburant',
    question: 'Quel est le niveau de carburant ?',
    options: [
      { label: 'Réservoir vide ou en réserve', emoji: '⛽', nextId: 'DIAGNOSIS' },
      { label: 'Niveau suffisant (>1/4)',       emoji: '✅', nextId: 'nd_temperature' },
    ],
  },
  nd_temperature: {
    type: 'question', id: 'nd_temperature',
    question: 'Quelle est la température extérieure approximative ?',
    options: [
      { label: 'Très froid (< 0°C)',  emoji: '❄️', nextId: 'DIAGNOSIS' },
      { label: 'Normal (> 0°C)',      emoji: '🌤️', nextId: 'DIAGNOSIS' },
    ],
  },

  // ── 2. VOYANT ALLUMÉ ──────────────────────────────────────────────────────

  v_quel: {
    type: 'question', id: 'v_quel',
    question: 'Quel type de voyant est allumé ?',
    sousTitre: 'Choisissez celui qui correspond le mieux',
    options: [
      { label: 'Moteur (pictogramme moteur, jaune/orange)', emoji: '🔧', nextId: 'v_moteur_perte' },
      { label: 'Température (thermomètre rouge)',           emoji: '🌡️', nextId: 'DIAGNOSIS' },
      { label: 'Huile (bidon jaune/rouge)',                 emoji: '🛢️', nextId: 'DIAGNOSIS' },
      { label: 'Batterie / alternateur (rouge)',            emoji: '🔋', nextId: 'v_batterie' },
    ],
  },
  v_quel2: {
    type: 'question', id: 'v_quel2',
    question: 'Autres voyants courants :',
    options: [
      { label: 'AdBlue / Urée (diesel uniquement)',         emoji: '🟦', nextId: 'v_adblue' },
      { label: 'FAP / Filtre à particules (diesel)',        emoji: '💨', nextId: 'DIAGNOSIS' },
      { label: 'Pression pneu (TPMS)',                      emoji: '🔵', nextId: 'DIAGNOSIS' },
      { label: 'ABS / ESP / Freinage',                      emoji: '⚠️', nextId: 'DIAGNOSIS' },
    ],
  },
  v_moteur_perte: {
    type: 'question', id: 'v_moteur_perte',
    question: 'Y a-t-il une perte de puissance ou des ratés moteur ?',
    options: [
      { label: 'Oui, le moteur tremble / manque de puissance', emoji: '⚠️', nextId: 'DIAGNOSIS' },
      { label: 'Non, tout semble normal sinon',                 emoji: '✅', nextId: 'DIAGNOSIS' },
    ],
  },
  v_batterie: {
    type: 'question', id: 'v_batterie',
    question: 'Le voyant batterie est apparu quand ?',
    options: [
      { label: 'Au démarrage seulement (puis s\'éteint)', emoji: '🟢', nextId: 'DIAGNOSIS' },
      { label: 'En roulant, il reste allumé',             emoji: '🔴', nextId: 'DIAGNOSIS' },
    ],
  },
  v_adblue: {
    type: 'question', id: 'v_adblue',
    question: 'Le tableau de bord indique combien de km restants ?',
    options: [
      { label: 'Plus de 2 000 km',    emoji: '🟢', nextId: 'DIAGNOSIS' },
      { label: '500 à 2 000 km',      emoji: '🟡', nextId: 'DIAGNOSIS' },
      { label: 'Moins de 500 km',     emoji: '🔴', nextId: 'DIAGNOSIS' },
      { label: 'Pas d\'indication',   emoji: '❓', nextId: 'DIAGNOSIS' },
    ],
  },

  // ── 3. BRUIT INHABITUEL ───────────────────────────────────────────────────

  b_origine: {
    type: 'question', id: 'b_origine',
    question: 'D\'où semble venir le bruit ?',
    options: [
      { label: 'Moteur (sous le capot)', emoji: '🔧', nextId: 'b_moteur_quand' },
      { label: 'Roues / freins',         emoji: '🛞', nextId: 'b_freins' },
      { label: 'Carrosserie / dessous',  emoji: '🚗', nextId: 'b_type' },
      { label: 'Difficile à localiser',  emoji: '❓', nextId: 'b_type' },
    ],
  },
  b_moteur_quand: {
    type: 'question', id: 'b_moteur_quand',
    question: 'Le bruit moteur apparaît quand ?',
    options: [
      { label: 'Au démarrage uniquement', emoji: '🚀', nextId: 'b_type' },
      { label: 'En accélérant',           emoji: '⬆️', nextId: 'b_type' },
      { label: 'En permanence',           emoji: '🔁', nextId: 'b_type' },
      { label: 'En chauffe / après 5 min',emoji: '🌡️', nextId: 'b_type' },
    ],
  },
  b_freins: {
    type: 'question', id: 'b_freins',
    question: 'Le bruit au niveau des roues/freins apparaît quand ?',
    options: [
      { label: 'En freinant',              emoji: '🛑', nextId: 'DIAGNOSIS' },
      { label: 'En virage',                emoji: '↩️', nextId: 'DIAGNOSIS' },
      { label: 'En roulant droit (vitesse)', emoji: '➡️', nextId: 'DIAGNOSIS' },
    ],
  },
  b_type: {
    type: 'question', id: 'b_type',
    question: 'Comment décririez-vous ce bruit ?',
    options: [
      { label: 'Claquement sec (clac)',     emoji: '💥', nextId: 'DIAGNOSIS' },
      { label: 'Grincement / crissement',   emoji: '😬', nextId: 'DIAGNOSIS' },
      { label: 'Sifflement / chuintement',  emoji: '💨', nextId: 'DIAGNOSIS' },
      { label: 'Vibration / ronronnement',  emoji: '📳', nextId: 'DIAGNOSIS' },
    ],
  },

  // ── 4. PERTE DE PUISSANCE ─────────────────────────────────────────────────

  pp_voyant: {
    type: 'question', id: 'pp_voyant',
    question: 'Y a-t-il des voyants allumés en même temps ?',
    options: [
      { label: 'Oui (moteur, FAP, autres)', emoji: '⚠️', nextId: 'pp_quand' },
      { label: 'Non, aucun voyant',          emoji: '✅', nextId: 'pp_quand' },
    ],
  },
  pp_quand: {
    type: 'question', id: 'pp_quand',
    question: 'La perte de puissance arrive quand ?',
    options: [
      { label: 'En permanence depuis peu',    emoji: '🔁', nextId: 'DIAGNOSIS' },
      { label: 'En forte accélération (autoroute)', emoji: '🏎️', nextId: 'DIAGNOSIS' },
      { label: 'Par à-coups / irrégulier',    emoji: '⚡', nextId: 'DIAGNOSIS' },
      { label: 'Par temps froid uniquement',  emoji: '❄️', nextId: 'DIAGNOSIS' },
    ],
  },

  // ── 5. FREINAGE ───────────────────────────────────────────────────────────

  fr_type: {
    type: 'question', id: 'fr_type',
    question: 'Quel problème de freinage observez-vous ?',
    sousTitre: '⚠️ Les problèmes de freinage peuvent être dangereux — soyez prudent(e)',
    options: [
      { label: 'Pédale de frein molle / enfonce jusqu\'au sol', emoji: '😱', nextId: 'DIAGNOSIS' },
      { label: 'Bruit de grincement en freinant',               emoji: '😬', nextId: 'DIAGNOSIS' },
      { label: 'Vibrations au freinage',                         emoji: '📳', nextId: 'DIAGNOSIS' },
      { label: 'Voiture tire d\'un côté en freinant',           emoji: '↩️', nextId: 'DIAGNOSIS' },
    ],
  },

  // ── 6. RECHARGE VE / HYBRIDE ──────────────────────────────────────────────

  ev_prob: {
    type: 'question', id: 'ev_prob',
    question: 'Quel problème de recharge rencontrez-vous ?',
    options: [
      { label: 'La borne ne reconnaît pas le véhicule', emoji: '🔌', nextId: 'ev_borne' },
      { label: 'La charge démarre puis s\'arrête',       emoji: '⏹️', nextId: 'DIAGNOSIS' },
      { label: 'Charge très lente / anormalement basse', emoji: '🐢', nextId: 'ev_lent' },
      { label: 'Câble bloqué dans la prise',             emoji: '🔒', nextId: 'DIAGNOSIS' },
      { label: 'Autonomie drastiquement réduite',        emoji: '📉', nextId: 'DIAGNOSIS' },
    ],
  },
  ev_borne: {
    type: 'question', id: 'ev_borne',
    question: 'Le problème se produit sur toutes les bornes ou une seule ?',
    options: [
      { label: 'Toutes les bornes testées',  emoji: '🔴', nextId: 'DIAGNOSIS' },
      { label: 'Une borne spécifique seulement', emoji: '📍', nextId: 'DIAGNOSIS' },
      { label: 'Uniquement borne rapide DC',  emoji: '⚡', nextId: 'DIAGNOSIS' },
    ],
  },
  ev_lent: {
    type: 'question', id: 'ev_lent',
    question: 'La charge lente, depuis combien de temps ?',
    options: [
      { label: 'Depuis toujours sur ce véhicule', emoji: '🔧', nextId: 'DIAGNOSIS' },
      { label: 'Récemment apparu',                 emoji: '🆕', nextId: 'DIAGNOSIS' },
      { label: 'Uniquement par temps froid',       emoji: '❄️', nextId: 'DIAGNOSIS' },
    ],
  },

  // ── 7. FUITE ─────────────────────────────────────────────────────────────

  fu_couleur: {
    type: 'question', id: 'fu_couleur',
    question: 'Quelle est la couleur du liquide qui fuit ?',
    sousTitre: 'Regardez sous le véhicule (attention moteur chaud)',
    options: [
      { label: 'Noir ou marron foncé',      emoji: '⚫', nextId: 'fu_quantite' },
      { label: 'Vert, orange ou rose',      emoji: '🟢', nextId: 'fu_quantite' },
      { label: 'Rouge',                     emoji: '🔴', nextId: 'DIAGNOSIS' },
      { label: 'Transparent / incolore',    emoji: '💧', nextId: 'DIAGNOSIS' },
    ],
  },
  fu_quantite: {
    type: 'question', id: 'fu_quantite',
    question: 'Quelle est l\'importance de la fuite ?',
    options: [
      { label: 'Quelques gouttes après l\'arrêt', emoji: '💧', nextId: 'DIAGNOSIS' },
      { label: 'Flaque visible en quelques minutes', emoji: '💦', nextId: 'DIAGNOSIS' },
      { label: 'Fuite continue / importante',        emoji: '🌊', nextId: 'DIAGNOSIS' },
    ],
  },

  // Nodes de diagnostic terminal
  DIAGNOSIS: { type: 'diagnosis', id: 'DIAGNOSIS' },
}

// ─── Catégories de symptômes ──────────────────────────────────────────────────

interface Symptome {
  id:           string
  label:        string
  emoji:        string
  description:  string
  firstNodeId:  string
  urgence?:     boolean
  externalRoute?: string  // Si défini, redirige vers cette route au lieu de lancer le wizard
}

const SYMPTOMES: Symptome[] = [
  { id: 'ne_demarre_pas',   label: 'Ne démarre pas',        emoji: '🚫', description: 'Aucun démarrage, rien ne se passe, clé bloquée…', firstNodeId: 'nd_phares' },
  { id: 'voyant_allume',    label: 'Voyant allumé',         emoji: '⚠️', description: 'Identifier visuellement parmi les 75 témoins du tableau de bord', firstNodeId: 'v_quel', externalRoute: '/assistant-depannage/voyants' },
  { id: 'bruit_bizarre',    label: 'Bruit inhabituel',      emoji: '🔊', description: 'Claquement, grincement, sifflement, vibration…', firstNodeId: 'b_origine' },
  { id: 'perte_puissance',  label: 'Perte de puissance',   emoji: '📉', description: 'Le moteur manque de force, ralentit, a des ratés', firstNodeId: 'pp_voyant' },
  { id: 'probleme_freins',  label: 'Freinage anormal',     emoji: '🛑', description: 'Pédale molle, bruit, vibrations, traction…', firstNodeId: 'fr_type', urgence: true },
  { id: 'probleme_recharge',label: 'Recharge impossible',  emoji: '🔌', description: 'VE ou hybride rechargeable qui ne charge plus', firstNodeId: 'ev_prob' },
  { id: 'fuite',            label: 'Fuite de liquide',     emoji: '💧', description: 'Tache sous le véhicule, vapeur, odeur de brûlé', firstNodeId: 'fu_couleur' },
]

const MOTEUR_LABELS: Record<Motorisation, string> = {
  essence: 'Essence', diesel: 'Diesel', hybride: 'Hybride / PHEV', elec: 'Électrique',
}

// ─── Styles partagés ──────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1.5px solid var(--color-border)',
  borderRadius: 16,
  padding: '28px 28px 24px',
}

const btnOption = (actif = false, danger = false): React.CSSProperties => ({
  width: '100%', textAlign: 'left',
  padding: '14px 18px', borderRadius: 12, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 12,
  background: actif ? 'rgba(122,240,194,0.1)' : danger ? 'rgba(239,68,68,0.06)' : 'var(--color-bg-alt)',
  border: actif
    ? '2px solid var(--color-primary)'
    : danger ? '1.5px solid rgba(239,68,68,0.3)' : '1.5px solid var(--color-border)',
  color: 'var(--color-text)',
  transition: 'all .15s',
  fontWeight: 500, fontSize: '0.92rem',
})

// ─── Composant principal ──────────────────────────────────────────────────────

type Mode = 'wizard' | 'scan'

export default function AssistantDepannage() {
  const router = useRouter()
  const [mode,         setMode]         = useState<Mode>('wizard')
  const [etape,        setEtape]        = useState<EtapeWizard>('symptome')
  const [motorisation, setMotorisation] = useState<Motorisation>('essence')
  const [symptome,     setSymptome]     = useState<Symptome | null>(null)
  const [nodeId,       setNodeId]       = useState<string>('')
  const [reponses,     setReponses]     = useState<Reponse[]>([])
  const [diagnostic,   setDiagnostic]   = useState<DiagnosticResult | null>(null)
  const [erreur,       setErreur]       = useState<string>('')
  const [derniersRep,  setDerniersRep]  = useState<Reponse[]>([])

  // Auto-démarrage du wizard sur le flux voyant si l'utilisateur revient
  // depuis le catalogue avec ?wizard=voyant (utilise window.location pour éviter
  // le Suspense boundary requis par useSearchParams sous Next.js 16)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('wizard') === 'voyant') {
      const symptomeVoyant: Symptome = {
        id: 'voyant_allume',
        label: 'Voyant allumé',
        emoji: '⚠️',
        description: 'Diagnostic guidé par questions',
        firstNodeId: 'v_quel',
      }
      setSymptome(symptomeVoyant)
      setNodeId('v_quel')
      setReponses([])
      setEtape('questions')
    }
  }, [])

  const currentNode = TREE[nodeId]

  // ── Choisir un symptôme ──────────────────────────────────────────────────
  const choisirSymptome = (s: Symptome) => {
    // Certains symptômes redirigent vers une route dédiée plutôt que le wizard
    if (s.externalRoute) {
      router.push(s.externalRoute)
      return
    }
    setSymptome(s)
    setNodeId(s.firstNodeId)
    setReponses([])
    setEtape('questions')
  }

  // ── Répondre à une question ───────────────────────────────────────────────
  const repondre = async (node: QuestionNode, option: Option) => {
    const newReponses: Reponse[] = [
      ...reponses,
      { questionId: node.id, question: node.question, reponse: option.label },
    ]
    setReponses(newReponses)

    if (option.nextId === 'DIAGNOSIS' || TREE[option.nextId]?.type === 'diagnosis') {
      await lancerDiagnostic(newReponses)
    } else {
      setNodeId(option.nextId)
    }
  }

  // ── Appel Claude ─────────────────────────────────────────────────────────
  const lancerDiagnostic = async (rep: Reponse[]) => {
    setEtape('loading')
    setErreur('')
    setDerniersRep(rep)
    try {
      const res = await fetch('/api/diagnostic', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          symptome_label: symptome?.label,
          motorisation:   MOTEUR_LABELS[motorisation],
          reponses:       rep,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error ?? `HTTP ${res.status}`)
      setDiagnostic(data)
      setEtape('resultat')
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      setErreur(msg)
      setEtape('questions')
    }
  }

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = () => {
    setEtape('symptome')
    setSymptome(null)
    setNodeId('')
    setReponses([])
    setDiagnostic(null)
    setErreur('')
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* ── Toggle Wizard / Scan photo ── */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 28,
        background: 'var(--color-bg-alt)',
        border: '1.5px solid var(--color-border)',
        borderRadius: 12, overflow: 'hidden', padding: 4,
      }}>
        {([
          { id: 'wizard', label: '🔍 Diagnostic guidé',   desc: 'Questions pas à pas' },
          { id: 'scan',   label: '📸 Scan voyant photo',  desc: 'Analyse visuelle IA'  },
        ] as { id: Mode; label: string; desc: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setMode(tab.id)}
            style={{
              flex: 1, border: 'none', cursor: 'pointer', borderRadius: 9,
              padding: '11px 14px', transition: 'all .15s',
              background: mode === tab.id ? 'var(--color-bg-card)' : 'transparent',
              boxShadow: mode === tab.id ? '0 1px 4px rgba(0,0,0,0.18)' : 'none',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: mode === tab.id ? 'var(--color-primary)' : 'var(--color-text)' }}>
              {tab.label}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
              {tab.desc}
            </div>
          </button>
        ))}
      </div>

      {/* ── Mode Scan photo ── */}
      {mode === 'scan' && <ScanVoyant />}

      {/* ── Mode Wizard (masqué si scan actif) ── */}
      {mode === 'wizard' && <>

      {/* ── Étape 1 : Choix symptôme + motorisation ── */}
      {etape === 'symptome' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

          {/* Motorisation */}
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>🚗 Votre véhicule</h2>
            <p style={{ margin: '0 0 18px', color: 'var(--color-text-muted)', fontSize: '0.87rem' }}>
              Le type de motorisation affine le diagnostic
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              {(['essence','diesel','hybride','elec'] as Motorisation[]).map(m => (
                <button key={m} onClick={() => setMotorisation(m)} style={btnOption(motorisation === m)}>
                  <span style={{ fontSize: '1.15rem' }}>
                    {m === 'essence' ? '⛽' : m === 'diesel' ? '🛢️' : m === 'hybride' ? '🔋' : '⚡'}
                  </span>
                  <span style={{ fontWeight: 600 }}>{MOTEUR_LABELS[m]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Symptômes */}
          <div style={cardStyle}>
            <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem' }}>🔍 Quel est le problème ?</h2>
            <p style={{ margin: '0 0 18px', color: 'var(--color-text-muted)', fontSize: '0.87rem' }}>
              Choisissez le symptôme qui correspond le mieux
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SYMPTOMES.map(s => (
                <button key={s.id} onClick={() => choisirSymptome(s)} style={btnOption(false, s.urgence)}>
                  <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>{s.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {s.label}
                      {s.urgence && <span style={{ marginLeft: 8, fontSize: '0.72rem', background: 'rgba(239,68,68,0.12)', color: '#ef4444', padding: '2px 8px', borderRadius: 999, fontWeight: 700 }}>URGENT</span>}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{s.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Étape 2 : Questions ── */}
      {etape === 'questions' && symptome && currentNode?.type === 'question' && (
        <div>
          {/* Fil d'Ariane */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 22, fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            <button onClick={reset} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)', fontWeight: 600, padding: 0, fontSize: '0.82rem' }}>
              ← Nouveau diagnostic
            </button>
            <span>·</span>
            <span>{symptome.emoji} {symptome.label}</span>
            <span>·</span>
            <span>{MOTEUR_LABELS[motorisation]}</span>
          </div>

          <div style={cardStyle}>
            {/* Progression */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Question {reponses.length + 1}
                </span>
                <div style={{ display: 'flex', gap: 5 }}>
                  {Array.from({ length: Math.max(reponses.length + 1, 3) }).map((_, i) => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: i <= reponses.length ? 'var(--color-primary)' : 'var(--color-border)' }} />
                  ))}
                </div>
              </div>
            </div>

            <h2 style={{ margin: '0 0 6px', fontSize: '1.1rem', lineHeight: 1.4 }}>{currentNode.question}</h2>
            {currentNode.sousTitre && (
              <p style={{ margin: '0 0 20px', color: 'var(--color-text-muted)', fontSize: '0.84rem' }}>{currentNode.sousTitre}</p>
            )}
            {!currentNode.sousTitre && <div style={{ marginBottom: 20 }} />}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {currentNode.options.map(opt => (
                <button key={opt.label} onClick={() => repondre(currentNode, opt)} style={btnOption()}>
                  {opt.emoji && <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{opt.emoji}</span>}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>

            {erreur && (
              <div style={{ marginTop: 16, padding: '12px 14px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8 }}>
                <div style={{ fontSize: '0.83rem', color: '#ef4444', marginBottom: 8 }}>
                  ⚠️ Erreur : {erreur}
                </div>
                <button
                  onClick={() => lancerDiagnostic(derniersRep)}
                  style={{ fontSize: '0.8rem', fontWeight: 700, padding: '6px 14px', borderRadius: 7, cursor: 'pointer', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                >
                  🔄 Réessayer le diagnostic
                </button>
              </div>
            )}

            {/* Réponses précédentes */}
            {reponses.length > 0 && (
              <div style={{ marginTop: 20, borderTop: '1px solid var(--color-border)', paddingTop: 14 }}>
                <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vos réponses</div>
                {reponses.map(r => (
                  <div key={r.questionId} style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: 4 }}>
                    <span style={{ color: 'var(--color-text)' }}>{r.reponse}</span> <span style={{ opacity: 0.5 }}>({r.question.slice(0, 40)}…)</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Chargement ── */}
      {etape === 'loading' && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '56px 28px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16, opacity: 0.8 }}>🔍</div>
          <h2 style={{ margin: '0 0 10px', fontSize: '1.1rem' }}>Analyse en cours…</h2>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', margin: 0 }}>
            Notre assistant analyse vos réponses et identifie les causes probables
          </p>
        </div>
      )}

      {/* ── Résultat ── */}
      {etape === 'resultat' && diagnostic && symptome && (
        <DiagnosticView
          diagnostic={diagnostic}
          symptome={symptome}
          motorisation={motorisation}
          reponses={reponses}
          onReset={reset}
        />
      )}

      </> /* fin mode wizard */}
    </div>
  )
}

// ─── Vue résultat ─────────────────────────────────────────────────────────────

function DiagnosticView({
  diagnostic, symptome, motorisation, reponses, onReset,
}: {
  diagnostic:   DiagnosticResult
  symptome:     Symptome
  motorisation: Motorisation
  reponses:     Reponse[]
  onReset:      () => void
}) {
  const GRAVITE_CFG: Record<Gravite, { label: string; color: string; bg: string; border: string; emoji: string }> = {
    critique: { label: 'DANGER IMMÉDIAT',  color: '#ef4444', bg: 'rgba(239,68,68,0.08)',    border: 'rgba(239,68,68,0.3)',    emoji: '🚨' },
    urgent:   { label: 'URGENT',           color: '#f97316', bg: 'rgba(249,115,22,0.08)',   border: 'rgba(249,115,22,0.3)',   emoji: '⚠️' },
    attention:{ label: 'À SURVEILLER',     color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',   border: 'rgba(245,158,11,0.3)',   emoji: '👁️' },
    ok:       { label: 'INFORMATIF',       color: '#059669', bg: 'rgba(5,150,105,0.08)',     border: 'rgba(5,150,105,0.3)',    emoji: '✅' },
  }

  const cfg = GRAVITE_CFG[diagnostic.gravite]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* En-tête gravité */}
      <div style={{ background: cfg.bg, border: `2px solid ${cfg.border}`, borderRadius: 16, padding: '22px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.73rem', fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              {cfg.emoji} {cfg.label}
            </div>
            <h2 style={{ margin: '0 0 8px', fontSize: '1.2rem' }}>
              {symptome.emoji} {symptome.label}
            </h2>
            <div style={{ fontSize: '0.83rem', color: 'var(--color-text-muted)' }}>
              {MOTEUR_LABELS[motorisation]} · {reponses.length} question{reponses.length > 1 ? 's' : ''} analysée{reponses.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Peut rouler */}
          <div style={{
            padding: '12px 16px', borderRadius: 12, textAlign: 'center', minWidth: 110,
            background: diagnostic.peut_rouler ? 'rgba(5,150,105,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1.5px solid ${diagnostic.peut_rouler ? 'rgba(5,150,105,0.35)' : 'rgba(239,68,68,0.35)'}`,
          }}>
            <div style={{ fontSize: '1.6rem' }}>{diagnostic.peut_rouler ? '✅' : '🛑'}</div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, marginTop: 4, color: diagnostic.peut_rouler ? '#059669' : '#ef4444' }}>
              {diagnostic.peut_rouler ? 'Peut rouler' : 'Ne pas rouler'}
            </div>
          </div>
        </div>

        {/* Conseil clé */}
        <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, fontSize: '0.88rem', lineHeight: 1.5, fontStyle: 'italic' }}>
          💬 {diagnostic.conseil_cle}
        </div>
      </div>

      {/* Causes probables */}
      <div style={{ background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ fontWeight: 700, marginBottom: 14, fontSize: '0.97rem' }}>🔧 Causes probables</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {diagnostic.pannes_probables.map((p, i) => {
            const probCfg = {
              haute:   { color: '#ef4444', label: 'Haute',   bg: 'rgba(239,68,68,0.08)'  },
              moyenne: { color: '#f59e0b', label: 'Moyenne', bg: 'rgba(245,158,11,0.08)' },
              faible:  { color: '#6b7280', label: 'Faible',  bg: 'rgba(107,114,128,0.08)'},
            }
            const pc = probCfg[p.probabilite as keyof typeof probCfg] ?? probCfg.faible
            return (
              <div key={i} style={{ padding: '12px 14px', background: pc.bg, borderRadius: 10, borderLeft: `3px solid ${pc.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{p.nom}</span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: pc.color, background: `${pc.color}20`, padding: '2px 8px', borderRadius: 999 }}>
                    {pc.label}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>{p.explication}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Étapes à suivre */}
      {diagnostic.etapes.length > 0 && (
        <div style={{ background: 'var(--color-bg-card)', border: '1.5px solid var(--color-border)', borderRadius: 12, padding: '18px 20px' }}>
          <div style={{ fontWeight: 700, marginBottom: 14, fontSize: '0.97rem' }}>📋 Que faire maintenant ?</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {diagnostic.etapes.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                  background: 'var(--color-primary)', color: '#0a1628',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.78rem',
                }}>
                  {i + 1}
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '0.88rem', lineHeight: 1.55, color: 'var(--color-text)' }}>{e}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Numéros utiles */}
      <div style={{ background: 'var(--color-bg-card)', border: '1px solid var(--color-border)', borderRadius: 12, padding: '16px 20px' }}>
        <div style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.9rem' }}>📞 Assistance d'urgence</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
          {[
            { label: 'AXA Assistance',   tel: '01 55 92 27 27', emoji: '🚗' },
            { label: 'MAAF Assistance',  tel: '05 49 32 58 00', emoji: '🚗' },
            { label: 'SÉCURITÉ',         tel: '17',             emoji: '🚨' },
            { label: 'SAMU',             tel: '15',             emoji: '🏥' },
          ].map(a => (
            <a key={a.label} href={`tel:${a.tel.replace(/\s/g,'')}`} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 12px', borderRadius: 8,
              background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)',
              textDecoration: 'none', color: 'var(--color-text)',
              fontSize: '0.82rem', fontWeight: 600,
            }}>
              <span>{a.emoji}</span>
              <div>
                <div style={{ fontWeight: 700 }}>{a.label}</div>
                <div style={{ color: 'var(--color-primary)', fontSize: '0.78rem' }}>{a.tel}</div>
              </div>
            </a>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
          💡 Vérifiez le numéro de votre assureur dans votre contrat — il figure généralement sur la carte verte.
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={onReset} style={{
          flex: 1, padding: '12px 20px', borderRadius: 10, cursor: 'pointer',
          fontWeight: 700, fontSize: '0.92rem',
          background: 'var(--color-primary)', color: '#0a1628', border: 'none',
        }}>
          🔍 Nouveau diagnostic
        </button>
        <a href="/assistance/panne" style={{
          flex: 1, padding: '12px 20px', borderRadius: 10, cursor: 'pointer',
          fontWeight: 700, fontSize: '0.92rem', textAlign: 'center', textDecoration: 'none',
          background: 'var(--color-bg-card)', color: 'var(--color-text)',
          border: '1.5px solid var(--color-border)',
        }}>
          🚨 Protocole urgence
        </a>
        <a href="/assistant-vacances" style={{
          flex: 1, padding: '12px 20px', borderRadius: 10, cursor: 'pointer',
          fontWeight: 700, fontSize: '0.92rem', textAlign: 'center', textDecoration: 'none',
          background: 'var(--color-bg-card)', color: 'var(--color-text)',
          border: '1.5px solid var(--color-border)',
        }}>
          🏖️ Planifier mon trajet
        </a>
      </div>

      <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.5 }}>
        Ce diagnostic est fourni à titre indicatif uniquement par une IA et ne remplace pas l&apos;avis d&apos;un professionnel qualifié. En cas de doute ou de danger immédiat, appelez les secours ou votre assistance routière.
      </p>
    </div>
  )
}
