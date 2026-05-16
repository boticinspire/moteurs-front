'use client'

import { useState } from 'react'
import {
  type ZoneGeo, type ProfilVoyageur, type TypeVoyage, type DureeSejour,
  type SanteData, type ResultatSante,
  analyserSante, INFO_ZONES,
  LABEL_ZONE, LABEL_PROFIL, LABEL_VOYAGE, LABEL_DUREE,
  INFO_ASSURANCE, ASSURANCES_CB,
} from '@/lib/assistance-sante'

// ── Styles ─────────────────────────────────────────────────────────────────────

const COULEUR = '#db2777'

const cardStyle: React.CSSProperties = {
  background: 'var(--color-bg-card)',
  border: '1.5px solid var(--color-border)',
  borderRadius: 16, padding: '32px 28px',
  maxWidth: 700, margin: '0 auto',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 8,
  border: '1.5px solid var(--color-border)',
  background: 'var(--color-bg-alt)',
  color: 'var(--color-text)', fontSize: '0.95rem',
  boxSizing: 'border-box',
}

const navBtnStyle = (primary: boolean): React.CSSProperties => ({
  padding: '11px 28px', borderRadius: 8, fontWeight: 700,
  fontSize: '0.95rem', cursor: 'pointer', border: 'none',
  background: primary ? COULEUR : 'var(--color-bg-alt)',
  color: primary ? '#fff' : 'var(--color-text)',
})

function choiceCard(selected: boolean): React.CSSProperties {
  return {
    padding: '10px 14px', borderRadius: 10, cursor: 'pointer',
    border: selected ? `2px solid ${COULEUR}` : '2px solid var(--color-border)',
    background: selected ? `${COULEUR}18` : 'var(--color-bg-card)',
    color: selected ? COULEUR : 'var(--color-text)',
    fontWeight: selected ? 700 : 500, fontSize: '0.88rem',
    transition: 'all .15s', textAlign: 'center' as const,
  }
}

const sectionTitle: React.CSSProperties = {
  fontWeight: 700, fontSize: '1rem', marginBottom: 12, color: 'var(--color-text)',
}

const badgeRisque = (niveau: ResultatSante['niveauRisque']): React.CSSProperties => ({
  display: 'inline-block', padding: '4px 12px', borderRadius: 20,
  fontSize: '0.78rem', fontWeight: 700,
  background: niveau === 'eleve' ? 'rgba(239,68,68,0.12)' : niveau === 'modere' ? 'rgba(234,179,8,0.12)' : 'rgba(5,150,105,0.12)',
  color: niveau === 'eleve' ? '#dc2626' : niveau === 'modere' ? '#b45309' : '#059669',
})

// ── Données options ─────────────────────────────────────────────────────────────

const ZONES_OPTIONS: { code: ZoneGeo; flag: string; pays: string }[] = [
  { code: 'europe',         flag: '🇪🇺', pays: 'Espagne, Italie, Grèce…' },
  { code: 'maghreb',        flag: '🌍', pays: 'Maroc, Tunisie, Algérie' },
  { code: 'afrique_sub',    flag: '🌍', pays: 'Sénégal, Kenya, Tanzanie…' },
  { code: 'moyen_orient',   flag: '🕌', pays: 'Égypte, Jordanie, Turquie…' },
  { code: 'asie_sud_est',   flag: '🌏', pays: 'Thaïlande, Vietnam, Bali…' },
  { code: 'amerique_nord',  flag: '🌎', pays: 'USA, Canada' },
  { code: 'amerique_latine',flag: '🌎', pays: 'Mexique, Brésil, Cuba…' },
  { code: 'ocean_indien',   flag: '🏝️', pays: 'Réunion, Maurice, Maldives' },
]

const PROFILS_OPTIONS: { value: ProfilVoyageur; emoji: string }[] = [
  { value: 'adulte',         emoji: '🧑' },
  { value: 'senior',         emoji: '👴' },
  { value: 'bebe',           emoji: '🍼' },
  { value: 'enfant',         emoji: '🧒' },
  { value: 'femme_enceinte', emoji: '🤰' },
]

const VOYAGES_OPTIONS: { value: TypeVoyage }[] = [
  { value: 'plage' },
  { value: 'ville' },
  { value: 'montagne' },
  { value: 'randonnee' },
  { value: 'safari' },
  { value: 'camping' },
]

const DUREES_OPTIONS: { value: DureeSejour }[] = [
  { value: 'weekend' },
  { value: 'semaine' },
  { value: 'quinzaine' },
  { value: 'mois_plus' },
]

type Step = 1 | 2 | 3

// ── Composant accordéon réutilisable ────────────────────────────────────────────

function Accordion({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden', marginBottom: 8 }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', padding: '14px 18px', background: 'none', border: 'none',
          cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', fontWeight: 600, fontSize: '0.92rem', color: 'var(--color-text)',
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: '1rem', color: 'var(--color-text-muted)' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--color-border)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Composant principal ─────────────────────────────────────────────────────────

export default function AssistanceSante() {
  const [step, setStep] = useState<Step>(1)
  const [data, setData] = useState<SanteData>({
    zone: null,
    profils: ['adulte'],
    typeVoyage: null,
    duree: null,
    assuranceVoyage: false,
    pathologieChronique: false,
    animauxContacts: false,
  })
  const [resultat, setResultat] = useState<ResultatSante | null>(null)

  function toggleProfil(p: ProfilVoyageur) {
    setData(d => {
      const has = d.profils.includes(p)
      if (has && d.profils.length === 1) return d // au moins un
      return { ...d, profils: has ? d.profils.filter(x => x !== p) : [...d.profils, p] }
    })
  }

  // ── Étape 1 ────────────────────────────────────────────────────────────────

  function renderStep1() {
    const canNext = data.zone && data.typeVoyage && data.duree
    return (
      <div style={cardStyle}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24 }}>
          🌍 Votre voyage
        </h2>

        {/* Zone géo */}
        <div style={{ marginBottom: 24 }}>
          <div style={sectionTitle}>Destination</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {ZONES_OPTIONS.map(z => (
              <div
                key={z.code}
                style={{ ...choiceCard(data.zone === z.code), padding: '12px 14px', textAlign: 'left' as const }}
                onClick={() => setData(d => ({ ...d, zone: z.code }))}
              >
                <div style={{ fontSize: '1.4rem' }}>{z.flag}</div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', marginTop: 4 }}>{LABEL_ZONE[z.code]}</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{z.pays}</div>
              </div>
            ))}
          </div>
          {data.zone && (
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={badgeRisque(INFO_ZONES[data.zone].niveauRisque)}>
                Niveau santé : {INFO_ZONES[data.zone].niveauRisque === 'faible' ? 'Faible' : INFO_ZONES[data.zone].niveauRisque === 'modere' ? 'Modéré' : 'Élevé'}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                {INFO_ZONES[data.zone].pays}
              </span>
            </div>
          )}
        </div>

        {/* Type voyage */}
        <div style={{ marginBottom: 24 }}>
          <div style={sectionTitle}>Type de séjour</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {VOYAGES_OPTIONS.map(v => (
              <div
                key={v.value}
                style={{ ...choiceCard(data.typeVoyage === v.value), minWidth: 110 }}
                onClick={() => setData(d => ({ ...d, typeVoyage: v.value }))}
              >
                {LABEL_VOYAGE[v.value]}
              </div>
            ))}
          </div>
        </div>

        {/* Durée */}
        <div style={{ marginBottom: 28 }}>
          <div style={sectionTitle}>Durée du séjour</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {DUREES_OPTIONS.map(d => (
              <div
                key={d.value}
                style={{ ...choiceCard(data.duree === d.value), minWidth: 120 }}
                onClick={() => setData(dd => ({ ...dd, duree: d.value }))}
              >
                {LABEL_DUREE[d.value]}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={navBtnStyle(true)} disabled={!canNext} onClick={() => canNext && setStep(2)}>
            Étape suivante →
          </button>
        </div>
      </div>
    )
  }

  // ── Étape 2 ────────────────────────────────────────────────────────────────

  function renderStep2() {
    return (
      <div style={cardStyle}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 24 }}>
          👥 Votre groupe & votre couverture
        </h2>

        {/* Profils */}
        <div style={{ marginBottom: 24 }}>
          <div style={sectionTitle}>Qui voyage ? (sélection multiple)</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PROFILS_OPTIONS.map(p => (
              <div
                key={p.value}
                style={{ ...choiceCard(data.profils.includes(p.value)), minWidth: 120 }}
                onClick={() => toggleProfil(p.value)}
              >
                <div style={{ fontSize: '1.4rem' }}>{p.emoji}</div>
                <div style={{ fontSize: '0.82rem', marginTop: 4 }}>{LABEL_PROFIL[p.value]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Assurance voyage */}
        <div style={{ marginBottom: 20 }}>
          <div style={sectionTitle}>Assurance voyage avec rapatriement médical</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { val: true,  label: '✅ Oui — j\'ai une assurance voyage' },
              { val: false, label: '❌ Non / Je ne sais pas' },
            ].map(opt => (
              <div
                key={String(opt.val)}
                style={{ ...choiceCard(data.assuranceVoyage === opt.val), flex: 1 }}
                onClick={() => setData(d => ({ ...d, assuranceVoyage: opt.val }))}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>

        {/* Pathologie chronique */}
        <div style={{ marginBottom: 20 }}>
          <div style={sectionTitle}>Pathologie chronique ou traitement en cours ?</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { val: true,  label: 'Oui' },
              { val: false, label: 'Non' },
            ].map(opt => (
              <div
                key={String(opt.val)}
                style={{ ...choiceCard(data.pathologieChronique === opt.val), flex: 1 }}
                onClick={() => setData(d => ({ ...d, pathologieChronique: opt.val }))}
              >
                {opt.label}
              </div>
            ))}
          </div>
          {data.pathologieChronique && (
            <p style={{ fontSize: '0.82rem', color: '#b45309', marginTop: 8 }}>
              ⚠️ Emportez vos médicaments en quantité suffisante + ordonnance internationale (en DCI/latin). Déclarez votre pathologie à l'assurance voyage.
            </p>
          )}
        </div>

        {/* Contacts animaux */}
        <div style={{ marginBottom: 28 }}>
          <div style={sectionTitle}>Activités avec animaux prévues ? (safari, ferme, balade à cheval…)</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              { val: true,  label: 'Oui' },
              { val: false, label: 'Non' },
            ].map(opt => (
              <div
                key={String(opt.val)}
                style={{ ...choiceCard(data.animauxContacts === opt.val), flex: 1 }}
                onClick={() => setData(d => ({ ...d, animauxContacts: opt.val }))}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
          <button style={navBtnStyle(false)} onClick={() => setStep(1)}>← Retour</button>
          <button
            style={navBtnStyle(true)}
            onClick={() => {
              setResultat(analyserSante(data))
              setStep(3)
            }}
          >
            Obtenir mon bilan santé →
          </button>
        </div>
      </div>
    )
  }

  // ── Étape 3 : Bilan ────────────────────────────────────────────────────────

  function renderStep3() {
    if (!resultat) return null
    const { zone, vaccinsReco, vaccinsOblig, trousse, gestesSecours, conseilsEau,
            assuranceAlerte, conseilsBebe, conseilsEnceinte, conseilsSenior, paludismeAlerte } = resultat

    return (
      <div style={{ maxWidth: 700, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* En-tête */}
        <div style={{ ...cardStyle, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: '2.8rem' }}>{zone.flag}</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{zone.label}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', marginBottom: 6 }}>
              {data.typeVoyage && LABEL_VOYAGE[data.typeVoyage]} · {data.duree && LABEL_DUREE[data.duree]}
            </div>
            <span style={badgeRisque(resultat.niveauRisque)}>
              Niveau santé {resultat.niveauRisque === 'faible' ? 'faible' : resultat.niveauRisque === 'modere' ? 'modéré' : 'élevé'}
            </span>
          </div>
        </div>

        {/* Alertes critiques */}
        {(paludismeAlerte || assuranceAlerte || vaccinsOblig.length > 0) && (
          <div style={{ ...cardStyle, background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.3)' }}>
            <div style={sectionTitle}>🚨 Points critiques à traiter avant le départ</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vaccinsOblig.map((v, i) => (
                <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', fontSize: '0.9rem', color: '#dc2626', fontWeight: 600 }}>
                  💉 Obligatoire : {v}
                </div>
              ))}
              {paludismeAlerte && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', fontSize: '0.9rem', color: '#dc2626' }}>
                  {paludismeAlerte}
                </div>
              )}
              {assuranceAlerte && (
                <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', fontSize: '0.9rem', color: '#dc2626' }}>
                  {assuranceAlerte}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vaccins recommandés */}
        {vaccinsReco.length > 0 && (
          <div style={cardStyle}>
            <div style={sectionTitle}>💉 Vaccins recommandés</div>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>
              Consultez votre médecin ou un centre de vaccination internationale au moins 4 à 6 semaines avant le départ.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {vaccinsReco.map((v, i) => (
                <div key={i} style={{ padding: '12px 16px', borderRadius: 10, background: 'var(--color-bg-alt)', border: v.obligatoire ? '2px solid #dc2626' : '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                      {v.obligatoire && <span style={{ color: '#dc2626', marginRight: 6 }}>●</span>}
                      {v.nom}
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0891b2', whiteSpace: 'nowrap' as const }}>
                      ⏱ {v.delai}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.83rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {v.indication}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Eau & alimentation */}
        <div style={{ ...cardStyle, background: conseilsEau.titre.startsWith('✅') ? 'rgba(5,150,105,0.04)' : conseilsEau.titre.startsWith('⚠️') ? 'rgba(234,179,8,0.06)' : 'rgba(239,68,68,0.06)', borderColor: conseilsEau.titre.startsWith('✅') ? 'rgba(5,150,105,0.2)' : conseilsEau.titre.startsWith('⚠️') ? 'rgba(234,179,8,0.25)' : 'rgba(239,68,68,0.25)' }}>
          <div style={sectionTitle}>{conseilsEau.titre}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {conseilsEau.conseils.map((c, i) => (
              <div key={i} style={{ fontSize: '0.88rem', color: 'var(--color-text)', paddingLeft: 12 }}>• {c}</div>
            ))}
          </div>
        </div>

        {/* Trousse médicale — accordéon par catégorie */}
        <div style={cardStyle}>
          <div style={sectionTitle}>🧳 Trousse médicale recommandée</div>
          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-muted)', marginBottom: 16 }}>
            Certains médicaments nécessitent une ordonnance — préparez votre consultation 3–4 semaines avant le départ.
          </p>
          {trousse.map((section, i) => (
            <Accordion key={i} title={section.categorie}>
              <div style={{ paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {section.items.map((item, j) => (
                  <div key={j} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '6px 0', borderBottom: j < section.items.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                    <span style={{ color: '#059669', fontWeight: 700, flexShrink: 0, marginTop: 2 }}>☐</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.nom}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{item.indication}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Accordion>
          ))}
        </div>

        {/* Gestes premiers secours */}
        {gestesSecours.length > 0 && (
          <div style={cardStyle}>
            <div style={sectionTitle}>🩺 Gestes de premiers secours pour votre voyage</div>
            {gestesSecours.map((g, i) => (
              <Accordion key={i} title={`${g.emoji} ${g.titre}${g.urgence === 'haute' ? ' — URGENCE' : ''}`}>
                <div style={{ paddingTop: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {g.etapes.map((e, j) => (
                      <div key={j} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ background: COULEUR, color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0, marginTop: 1 }}>{j + 1}</span>
                        <span style={{ fontSize: '0.86rem', color: 'var(--color-text)', lineHeight: 1.5 }}>{e}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', fontSize: '0.82rem', color: '#dc2626' }}>
                    📞 Appelez les secours si : {g.quandAppeler}
                  </div>
                </div>
              </Accordion>
            ))}
          </div>
        )}

        {/* Assurance rapatriement */}
        <div style={{ ...cardStyle, background: !data.assuranceVoyage ? 'rgba(239,68,68,0.05)' : 'rgba(5,150,105,0.05)', borderColor: !data.assuranceVoyage ? 'rgba(239,68,68,0.25)' : 'rgba(5,150,105,0.2)' }}>
          <div style={sectionTitle}>🏥 {INFO_ASSURANCE.titre}</div>
          <p style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)', lineHeight: 1.65, marginBottom: 16 }}>
            {INFO_ASSURANCE.description}
          </p>
          {!data.assuranceVoyage && (
            <div style={{ padding: '12px 16px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', marginBottom: 16, fontSize: '0.88rem', color: '#dc2626', fontWeight: 600 }}>
              ⚠️ Vous n&apos;avez pas d&apos;assurance voyage — nous vous recommandons d&apos;en souscrire une avant de partir.
            </div>
          )}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669', marginBottom: 6 }}>Ce que ça couvre</div>
            {INFO_ASSURANCE.couvreQuoi.map((item, i) => (
              <div key={i} style={{ fontSize: '0.85rem', color: 'var(--color-text)', paddingLeft: 12, marginBottom: 3 }}>✅ {item}</div>
            ))}
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#dc2626', marginBottom: 6 }}>Ce que ça ne couvre généralement pas</div>
            {INFO_ASSURANCE.neCouvrePas.map((item, i) => (
              <div key={i} style={{ fontSize: '0.85rem', color: 'var(--color-text)', paddingLeft: 12, marginBottom: 3 }}>❌ {item}</div>
            ))}
          </div>
          <Accordion title="💳 Couverture selon votre carte bancaire">
            <div style={{ paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ASSURANCES_CB.map((cb, i) => (
                <div key={i} style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--color-bg-alt)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{cb.carte}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 3 }}>{cb.note}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', color: cb.rapatriement ? '#059669' : '#dc2626', whiteSpace: 'nowrap' as const }}>
                    {cb.rapatriement ? `✅ ${cb.plafond}` : '❌ Non inclus'}
                  </div>
                </div>
              ))}
            </div>
          </Accordion>
        </div>

        {/* Conseils bébé */}
        {conseilsBebe && (
          <div style={cardStyle}>
            <div style={sectionTitle}>🍼 Conseils spécifiques Bébé / Enfant</div>
            {conseilsBebe.map((section, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: COULEUR, marginBottom: 8 }}>{section.titre}</div>
                {section.conseils.map((c, j) => (
                  <div key={j} style={{ fontSize: '0.86rem', color: 'var(--color-text)', paddingLeft: 12, marginBottom: 4 }}>• {c}</div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Conseils enceinte */}
        {conseilsEnceinte && (
          <div style={{ ...cardStyle, borderColor: 'rgba(219,39,119,0.3)', background: 'rgba(219,39,119,0.04)' }}>
            <div style={sectionTitle}>🤰 Conseils Femme enceinte</div>
            {conseilsEnceinte.map((c, i) => (
              <div key={i} style={{ fontSize: '0.87rem', color: 'var(--color-text)', paddingLeft: 12, marginBottom: 8 }}>• {c}</div>
            ))}
          </div>
        )}

        {/* Conseils senior */}
        {conseilsSenior && (
          <div style={{ ...cardStyle, borderColor: 'rgba(99,102,241,0.25)', background: 'rgba(99,102,241,0.04)' }}>
            <div style={sectionTitle}>👴 Conseils Senior</div>
            {conseilsSenior.map((c, i) => (
              <div key={i} style={{ fontSize: '0.87rem', color: 'var(--color-text)', paddingLeft: 12, marginBottom: 8 }}>• {c}</div>
            ))}
          </div>
        )}

        {/* Risques pays */}
        <div style={cardStyle}>
          <div style={sectionTitle}>⚠️ Risques spécifiques à cette zone</div>
          {zone.risques.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ color: '#b45309', flexShrink: 0 }}>▶</span>
              <span style={{ fontSize: '0.88rem', color: 'var(--color-text)' }}>{r}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button style={navBtnStyle(false)} onClick={() => { setStep(1); setResultat(null) }}>
            ← Nouvelle analyse
          </button>
        </div>
      </div>
    )
  }

  // ── Barre de progression ────────────────────────────────────────────────────

  const steps = [
    { n: 1, label: 'Destination' },
    { n: 2, label: 'Profil' },
    { n: 3, label: 'Bilan santé' },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 0, marginBottom: 32 }}>
        {steps.map((s, i) => (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: step >= s.n ? COULEUR : 'var(--color-bg-alt)',
                color: step >= s.n ? '#fff' : 'var(--color-text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.95rem',
                border: step === s.n ? `2px solid ${COULEUR}` : '2px solid transparent',
              }}>
                {step > s.n ? '✓' : s.n}
              </div>
              <span style={{ fontSize: '0.75rem', color: step >= s.n ? COULEUR : 'var(--color-text-muted)', fontWeight: step === s.n ? 700 : 400 }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ width: 60, height: 2, background: step > s.n ? COULEUR : 'var(--color-border)', marginBottom: 18 }} />
            )}
          </div>
        ))}
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </div>
  )
}
