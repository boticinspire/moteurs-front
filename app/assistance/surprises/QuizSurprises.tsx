'use client'

import { useState } from 'react'

interface Question {
  scenario: string
  question: string
  options: string[]
  correct: number
  explication: string
  tag: string
}

const QUESTIONS: Question[] = [
  {
    tag: '🇮🇹 Amende italienne',
    scenario: "Vous recevez une amende italienne à votre domicile, 5 mois après votre séjour à Florence.",
    question: "Que faites-vous ?",
    options: [
      "Vous l'ignorez — elle ne peut pas être recouvrée en France",
      "Vous la contestez dans les 60 jours par courrier recommandé à la mairie concernée",
      "Vous la payez immédiatement pour éviter toute majoration",
    ],
    correct: 1,
    explication:
      "Depuis la directive UE 2015/413, les amendes européennes sont recouvrables entre États membres. Vous avez le droit de contester dans les 60 jours. Payez uniquement après contestation rejetée — ne payez jamais dans la panique sans lire les mentions légales.",
  },
  {
    tag: '🚜 Fourrière Madrid',
    scenario: "Votre voiture a été mise en fourrière à Madrid. Vous ne parlez pas espagnol.",
    question: "Quelle est votre première action ?",
    options: [
      "Appeler l'ambassade de France en Espagne",
      "Trouver le panneau de la mairie ou le PV laissé sous l'essuie-glace — il contient le numéro du dépôt",
      "Contacter votre assurance assistance pour qu'elle paye à votre place",
    ],
    correct: 1,
    explication:
      "Le PV de mise en fourrière indique toujours l'adresse et le téléphone du dépôt. En Espagne, chaque ville a son propre 'depósito municipal'. L'assistance peut vous aider à communiquer mais vous devez récupérer le véhicule en personne, avec papiers d'identité et certificat d'immatriculation.",
  },
  {
    tag: '🔓 Vol à Rome',
    scenario: "On vous vole votre sac dans votre voiture garée à Rome. Vous êtes couvert par votre assurance auto.",
    question: "Dans quel délai devez-vous déposer plainte pour que votre remboursement soit valide ?",
    options: [
      "24 heures",
      "48 heures",
      "72 heures",
    ],
    correct: 1,
    explication:
      "La quasi-totalité des contrats d'assurance impose un dépôt de plainte dans les 48h suivant la découverte du vol. En Italie, rendez-vous au 'Commissariato di Polizia' le plus proche. Demandez une copie du dépôt de plainte ('denuncia') — c'est la pièce indispensable pour votre dossier.",
  },
  {
    tag: '🇮🇹 ZTL Florence',
    scenario: "En rentrant de vacances, vous réalisez que vous avez traversé une ZTL à Florence sans autorisation.",
    question: "Que faire avant de recevoir l'amende ?",
    options: [
      "Ne rien faire — l'amende mettra des mois et peut ne jamais arriver",
      "Contacter directement la mairie de Florence (Comune) pour régulariser avant la verbalisation",
      "Prévenir votre assurance pour qu'elle anticipe le paiement",
    ],
    correct: 1,
    explication:
      "Certaines villes italiennes (Florence, Rome, Bologne) permettent de régulariser une entrée ZTL dans les 24–48h sur leur site officiel. C'est bien moins cher que l'amende. Passé ce délai, l'amende est de 80–163 € + frais de transmission à l'étranger. L'assurance ne couvre pas les amendes.",
  },
  {
    tag: '🛣️ Péage oublié Espagne',
    scenario: "Sur l'autoroute AP-7 en Espagne, vous avez raté une station de péage automatique faute de monnaie.",
    question: "Quelle est la bonne marche à suivre ?",
    options: [
      "Ignorer — les systèmes espagnols ne croisent pas les données françaises",
      "Payer en ligne sur le site de l'opérateur (ex. Abertis) dans les 48–72h",
      "Attendre le courrier d'amende à domicile et payer avec les pénalités",
    ],
    correct: 1,
    explication:
      "La plupart des opérateurs espagnols (Abertis, Sacyr…) proposent un paiement en ligne du péage raté sous 48–72h, sans pénalité. Au-delà, une amende est générée et peut être transmise via le système européen. Cherchez le site de l'opérateur noté sur votre ticket ou sur les panneaux d'autoroute.",
  },
  {
    tag: '🚗💥 Accident sans constat',
    scenario: "Vous avez un accrochage en Allemagne. L'autre conducteur refuse catégoriquement de signer le constat européen.",
    question: "Que faites-vous ?",
    options: [
      "Vous attendez la police — sans leur signature le constat est nul",
      "Vous repartez sans document — votre assurance gérera avec votre récit",
      "Vous remplissez et signez seul le constat en notant 'Refus de signature de l'autre partie' — avec photos et témoins",
    ],
    correct: 2,
    explication:
      "Un constat rempli et signé par une seule partie reste valable si vous mentionnez le refus de l'autre conducteur. Photographiez la plaque, les dégâts, le lieu et les témoins. Appelez la police si les dégâts sont importants ou s'il y a des blessés (en Allemagne : 110). Transmettez le tout à votre assurance dans les 5 jours ouvrés.",
  },
]

const SCORE_MESSAGES = [
  { min: 0, max: 2, emoji: '😅', titre: 'À retravailler', texte: 'Ces situations sont traîtresses — relisez les guides ci-dessus avant votre prochain voyage.' },
  { min: 3, max: 4, emoji: '🙂', titre: 'Pas mal !', texte: 'Vous avez les bases, mais quelques zones d\'ombre méritent attention. Les fiches détaillées sont là pour ça.' },
  { min: 5, max: 5, emoji: '😎', titre: 'Très bon réflexe !', texte: 'Vous connaissez les erreurs à éviter. Pensez quand même à la checklist avant le départ.' },
  { min: 6, max: 6, emoji: '🏆', titre: 'Expert mauvaises surprises !', texte: 'Parfait score. Vous êtes prêt pour les pires scénarios. Partagez ce quiz à vos proches voyageurs !' },
]

export default function QuizSurprises() {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answers, setAnswers] = useState<(number | null)[]>(Array(QUESTIONS.length).fill(null))
  const [done, setDone] = useState(false)

  const q = QUESTIONS[current]
  const isAnswered = selected !== null
  const score = answers.filter((a, i) => a === QUESTIONS[i].correct).length

  const scoreMsg = SCORE_MESSAGES.find(s => score >= s.min && score <= s.max)!

  function handleSelect(idx: number) {
    if (isAnswered) return
    setSelected(idx)
    const next = [...answers]
    next[current] = idx
    setAnswers(next)
  }

  function handleNext() {
    if (current < QUESTIONS.length - 1) {
      setCurrent(current + 1)
      setSelected(answers[current + 1])
    } else {
      setDone(true)
    }
  }

  function handleRestart() {
    setCurrent(0)
    setSelected(null)
    setAnswers(Array(QUESTIONS.length).fill(null))
    setDone(false)
  }

  const accentColor = '#b45309'
  const accentBg = 'rgba(180,83,9,0.07)'
  const accentBorder = 'rgba(180,83,9,0.25)'

  if (done) {
    return (
      <div style={{
        background: 'var(--color-bg-card)',
        border: `1px solid ${accentBorder}`,
        borderRadius: 16,
        padding: '36px 32px',
        textAlign: 'center',
        maxWidth: 640,
        margin: '0 auto',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 12 }}>{scoreMsg.emoji}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 8 }}>
          {score} / {QUESTIONS.length} — {scoreMsg.titre}
        </div>
        <p style={{ color: 'var(--color-text-soft)', marginBottom: 28, lineHeight: 1.6 }}>
          {scoreMsg.texte}
        </p>

        {/* Récap */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, textAlign: 'left' }}>
          {QUESTIONS.map((q, i) => {
            const ok = answers[i] === q.correct
            return (
              <div key={i} style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 14px',
                borderRadius: 8,
                background: ok ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
                border: `1px solid ${ok ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}`,
              }}>
                <span style={{ fontSize: '1.1rem' }}>{ok ? '✅' : '❌'}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{q.tag}</span>
              </div>
            )
          })}
        </div>

        <button
          onClick={handleRestart}
          style={{
            background: accentColor,
            color: 'white',
            border: 'none',
            borderRadius: 8,
            padding: '12px 28px',
            fontWeight: 600,
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          🔄 Recommencer le quiz
        </button>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      {/* Progress */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--color-text-soft)', fontWeight: 600 }}>
          Question {current + 1} / {QUESTIONS.length}
        </span>
        <span style={{
          fontSize: '0.78rem',
          background: accentBg,
          border: `1px solid ${accentBorder}`,
          color: accentColor,
          padding: '3px 10px',
          borderRadius: 20,
          fontWeight: 600,
        }}>
          {q.tag}
        </span>
      </div>

      {/* Barre de progression */}
      <div style={{ height: 4, borderRadius: 4, background: 'var(--color-border)', marginBottom: 24 }}>
        <div style={{
          height: '100%',
          borderRadius: 4,
          background: accentColor,
          width: `${((current + (isAnswered ? 1 : 0)) / QUESTIONS.length) * 100}%`,
          transition: 'width 0.4s',
        }} />
      </div>

      {/* Carte question */}
      <div style={{
        background: 'var(--color-bg-card)',
        border: `1px solid var(--color-border)`,
        borderRadius: 16,
        padding: '28px 24px',
        marginBottom: 16,
      }}>
        {/* Scénario */}
        <div style={{
          background: accentBg,
          border: `1px solid ${accentBorder}`,
          borderRadius: 10,
          padding: '14px 16px',
          marginBottom: 20,
          fontSize: '0.9rem',
          lineHeight: 1.6,
          color: 'var(--color-text)',
        }}>
          <span style={{ fontWeight: 700, color: accentColor }}>Scénario : </span>
          {q.scenario}
        </div>

        <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 18 }}>
          {q.question}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt, idx) => {
            const isSelected = selected === idx
            const isCorrect = idx === q.correct
            let bg = 'var(--color-bg-alt)'
            let border = 'var(--color-border)'
            let color = 'var(--color-text)'
            let prefix = ''

            if (isAnswered) {
              if (isCorrect) {
                bg = 'rgba(34,197,94,0.09)'
                border = 'rgba(34,197,94,0.4)'
                color = '#15803d'
                prefix = '✅ '
              } else if (isSelected && !isCorrect) {
                bg = 'rgba(239,68,68,0.09)'
                border = 'rgba(239,68,68,0.4)'
                color = '#dc2626'
                prefix = '❌ '
              }
            } else if (isSelected) {
              border = accentColor
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                style={{
                  background: bg,
                  border: `1.5px solid ${border}`,
                  borderRadius: 10,
                  padding: '13px 16px',
                  textAlign: 'left',
                  cursor: isAnswered ? 'default' : 'pointer',
                  color,
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  fontWeight: isAnswered && isCorrect ? 600 : 400,
                  transition: 'all 0.15s',
                }}
              >
                {prefix}{opt}
              </button>
            )
          })}
        </div>
      </div>

      {/* Explication */}
      {isAnswered && (
        <div style={{
          background: selected === q.correct ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)',
          border: `1px solid ${selected === q.correct ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          borderRadius: 12,
          padding: '16px 18px',
          marginBottom: 16,
          fontSize: '0.88rem',
          lineHeight: 1.65,
          color: 'var(--color-text)',
        }}>
          <span style={{ fontWeight: 700 }}>
            {selected === q.correct ? '✅ Bonne réponse — ' : '❌ Pas tout à fait — '}
          </span>
          {q.explication}
        </div>
      )}

      {/* Bouton suivant */}
      {isAnswered && (
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={handleNext}
            style={{
              background: accentColor,
              color: 'white',
              border: 'none',
              borderRadius: 8,
              padding: '11px 24px',
              fontWeight: 600,
              fontSize: '0.92rem',
              cursor: 'pointer',
            }}
          >
            {current < QUESTIONS.length - 1 ? 'Question suivante →' : 'Voir mon score'}
          </button>
        </div>
      )}
    </div>
  )
}
