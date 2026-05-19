'use client'

import { useState } from 'react'

export interface FaqItem {
  question: string
  answer: string
}

interface FaqAccordionProps {
  items: FaqItem[]
  title?: string
}

export default function FaqAccordion({ items, title = 'Questions fréquentes' }: FaqAccordionProps) {
  const [open, setOpen] = useState<number | null>(null)

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <section style={{ marginTop: 64, borderTop: '1px solid var(--color-border)', paddingTop: 40 }}>
      {/* JSON-LD FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <h2 style={{ textAlign: 'center', marginBottom: 32, fontSize: '1.3rem' }}>
        {title}
      </h2>

      <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map((item, i) => {
          const isOpen = open === i
          return (
            <div
              key={i}
              style={{
                background: 'var(--color-bg-card)',
                border: `1px solid ${isOpen ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 12,
                overflow: 'hidden',
                transition: 'border-color 0.2s',
              }}
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px 20px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  gap: 12,
                }}
                aria-expanded={isOpen}
              >
                <span>{item.question}</span>
                <span style={{
                  flexShrink: 0,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: isOpen ? 'var(--color-primary)' : 'var(--color-bg-alt)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: isOpen ? '#0a0a0a' : 'var(--color-text-muted)',
                  transition: 'background 0.2s, color 0.2s',
                }}>
                  {isOpen ? '−' : '+'}
                </span>
              </button>

              {isOpen && (
                <div style={{
                  padding: '0 20px 18px',
                  fontSize: '0.9rem',
                  color: 'var(--color-text-muted)',
                  lineHeight: 1.7,
                  borderTop: '1px solid var(--color-border)',
                  paddingTop: 14,
                }}>
                  {item.answer}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
