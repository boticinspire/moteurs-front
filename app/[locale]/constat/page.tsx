import type { Metadata } from 'next'
import { Link } from '@/i18n/navigation'
import ConstantIntelligent from './ConstantIntelligent'

export const metadata: Metadata = {
  title: 'Constat Amiable Intelligent — Guidé pas-à-pas | Moteurs.com',
  description:
    'Remplissez votre constat amiable étape par étape : checklist photos, circonstances, croquis guidé, PDF téléchargeable et email récapitulatif. Adapté FR, BE, CH, CA.',
  alternates: { canonical: 'https://moteurs.com/constat' },
}

const FAQ_CONSTAT: { q: string; a: string }[] = [
  {
    q: 'Comment remplir un constat amiable tout seul ?',
    a: "Renseignez d'abord le recto commun aux deux conducteurs : date, heure, lieu, véhicules, assurés, assureurs, témoins, puis cochez les circonstances et dessinez le croquis. Chaque conducteur remplit ensuite sa colonne (A ou B) au verso. Notre assistant vous guide rubrique par rubrique et génère un PDF prêt à signer. Si vous êtes seul (accident sans tiers identifié, animal, objet), remplissez votre colonne et décrivez les faits dans « Observations ».",
  },
  {
    q: "Que faire si l'autre conducteur refuse de signer le constat ?",
    a: "Vous ne pouvez pas l'y forcer. Remplissez votre propre exemplaire, relevez la plaque d'immatriculation, le modèle et, si possible, l'identité et l'assurance adverses, prenez des photos et notez les coordonnées de témoins. Envoyez ce constat non signé à votre assureur en expliquant le refus : il reste recevable. En cas de blessés ou de litige, appelez la police pour un constat officiel.",
  },
  {
    q: "Sous combien de temps envoyer le constat à l'assurance ?",
    a: "En France, le délai légal est de 5 jours ouvrés après l'accident (2 jours en cas de vol). Mieux vaut l'envoyer le jour même. Un envoi tardif peut réduire votre indemnisation. En Belgique, en Suisse et au Canada, déclarez également au plus vite — les délais contractuels figurent dans votre police.",
  },
  {
    q: 'Peut-on remplir un constat sans dégât matériel visible ?',
    a: "Oui, et c'est recommandé. Certains dommages (châssis, électronique, douleurs cervicales) n'apparaissent qu'après. Remplir le constat fige les circonstances et protège vos droits. Si vous renoncez au constat sur place, vous perdez la preuve des responsabilités.",
  },
  {
    q: 'Le constat amiable européen est-il valable à l\'étranger ?',
    a: "Oui. Le constat amiable est harmonisé dans toute l'Union européenne : les rubriques sont numérotées à l'identique quelle que soit la langue, vous pouvez donc remplir un constat français face à un conducteur italien ou allemand. Notre outil couvre la France, la Belgique, la Suisse et le Canada, avec les numéros d'urgence locaux.",
  },
  {
    q: 'Constat papier ou e-constat : lequel choisir ?',
    a: "Les deux ont la même valeur juridique. L'e-constat (application mobile officielle) est pratique pour un accrochage simple entre deux véhicules légers assurés dans le même pays. Pour un accident impliquant plus de deux véhicules, des blessés, ou un véhicule étranger, le constat papier reste plus sûr. Notre assistant produit un PDF que vous pouvez signer puis transmettre.",
  },
  {
    q: 'Comment corriger une erreur sur un constat déjà signé ?',
    a: "Une fois signé par les deux parties, le constat ne se modifie plus : toute rature serait contestable. Si vous repérez une erreur, ne barrez rien — signalez-la par écrit (email, courrier) à votre assureur en joignant des précisions et des photos. C'est l'assureur qui arbitrera au regard de l'ensemble des éléments.",
  },
]

export default function PageConstat() {
  return (
    <main className="container" style={{ paddingTop: 40, paddingBottom: 72 }}>

      {/* ── Hero ── */}
      <div style={{ maxWidth: 720, margin: '0 auto', marginBottom: 36 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '4px 14px', borderRadius: 20, marginBottom: 14,
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
          fontSize: '0.75rem', fontWeight: 700, color: '#ef4444',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          📋 Constat Amiable
        </div>
        <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', marginBottom: 12, lineHeight: 1.2 }}>
          Constat amiable auto — <span style={{ color: '#ef4444' }}>remplir votre constat étape par étape</span>
        </h1>
        <p style={{ color: 'var(--color-text-soft)', fontSize: '0.97rem', lineHeight: 1.65, marginBottom: 16, maxWidth: 600 }}>
          Ce guide vous accompagne de la sécurisation de l'accident jusqu'au constat signé :
          checklist photos, circonstances européennes, croquis guidé, puis PDF + email pour votre assureur.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['📸 Checklist photos', '📋 17 circonstances', '🗺️ Croquis guidé', '📄 PDF', '📧 Email assureur', '🇫🇷 🇧🇪 🇨🇭 🇨🇦'].map(b => (
            <span key={b} style={{
              padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem',
              background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)',
              color: '#ef4444',
            }}>{b}</span>
          ))}
        </div>
      </div>

      {/* ── Wizard ── */}
      <ConstantIntelligent />

      {/* ── Contenu SEO ── */}
      <article style={{ maxWidth: 720, margin: '56px auto 0', lineHeight: 1.7, color: 'var(--color-text)' }}>
        <h2 style={{ fontSize: '1.35rem', marginBottom: 12 }}>Qu'est-ce qu'un constat amiable et à quoi sert-il ?</h2>
        <p style={{ marginBottom: 18 }}>
          Le <strong>constat amiable d'accident automobile</strong> est le document qui établit les
          circonstances d'un accrochage entre deux véhicules et sert de base à votre assureur pour
          déterminer les responsabilités et vous indemniser. Il n'est pas obligatoire au sens strict,
          mais sans lui, prouver les faits devient très difficile. Bien rempli et signé par les deux
          conducteurs, il a une valeur quasi contractuelle : on ne peut plus revenir dessus.
        </p>

        <h2 style={{ fontSize: '1.35rem', marginBottom: 12 }}>Comment remplir un constat amiable sans se tromper</h2>
        <p style={{ marginBottom: 12 }}>
          Le recto est commun aux deux conducteurs et se remplit <strong>sur place, avant de quitter
          les lieux</strong>. Les rubriques sont numérotées de façon identique dans toute l'Europe :
        </p>
        <ol style={{ margin: '0 0 18px 20px', display: 'grid', gap: 4 }}>
          <li>Date, heure et lieu précis de l'accident</li>
          <li>Blessés, même légers (à signaler impérativement)</li>
          <li>Dégâts matériels à d'autres véhicules ou objets</li>
          <li>Témoins (noms et coordonnées)</li>
          <li>Identité des assurés et des conducteurs (permis)</li>
          <li>Véhicules, assurances et numéros de police</li>
          <li>Point de choc initial (flèche)</li>
          <li>Dégâts apparents</li>
          <li>Les 17 circonstances à cocher</li>
          <li>Le croquis de l'accident</li>
          <li>Vos observations libres</li>
          <li>La signature des deux conducteurs</li>
        </ol>
        <p style={{ marginBottom: 18 }}>
          Notre assistant vous guide rubrique par rubrique, propose une checklist photos, un croquis
          assisté et génère un <strong>PDF prêt à transmettre</strong> à votre assureur — utilisable
          en France, Belgique, Suisse et Canada.
        </p>

        <h2 style={{ fontSize: '1.35rem', marginBottom: 12 }}>Les erreurs à éviter</h2>
        <ul style={{ margin: '0 0 18px 20px', display: 'grid', gap: 6 }}>
          <li>Quitter les lieux sans constat « parce que ça n'a rien » — des dommages cachés peuvent apparaître.</li>
          <li>Signer un constat incomplet ou raturé : une fois signé, il n'est plus modifiable.</li>
          <li>Oublier de cocher « blessés » alors qu'il y a la moindre douleur.</li>
          <li>Négliger le croquis et le point de choc, déterminants pour la responsabilité.</li>
          <li>Dépasser le délai d'envoi (5 jours ouvrés en France).</li>
        </ul>

        <h2 style={{ fontSize: '1.35rem', marginBottom: 16 }}>Constat amiable : questions fréquentes</h2>
        <div style={{ display: 'grid', gap: 10 }}>
          {FAQ_CONSTAT.map(({ q, a }) => (
            <details key={q} style={{ border: '1px solid var(--color-border)', borderRadius: 10, padding: '12px 16px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{q}</summary>
              <p style={{ marginTop: 10, color: 'var(--color-text-soft)' }}>{a}</p>
            </details>
          ))}
        </div>
      </article>

      {/* ── JSON-LD FAQPage ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_CONSTAT.map(({ q, a }) => ({
              '@type': 'Question',
              name: q,
              acceptedAnswer: { '@type': 'Answer', text: a },
            })),
          }),
        }}
      />

      {/* ── Liens retour ── */}
      <div style={{ maxWidth: 720, margin: '48px auto 0', borderTop: '1px solid var(--color-border)', paddingTop: 28, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/assistance/panne" className="btn btn-secondary">🚨 Protocole urgence</Link>
        <Link href="/assistant-depannage" className="btn btn-secondary">🔍 Diagnostic panne</Link>
        <Link href="/assistance" className="btn btn-secondary">🤖 Hub Assistance</Link>
      </div>

    </main>
  )
}
