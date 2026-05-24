'use client'

import { useTranslations } from 'next-intl'

export default function PrintButton() {
  const t = useTranslations('ChecklistEV')
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="checklist-ev-print-btn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 18px',
        borderRadius: 10,
        background: 'var(--color-primary)',
        color: '#fff',
        border: 'none',
        fontSize: '0.92rem',
        fontWeight: 600,
        cursor: 'pointer',
      }}
      aria-label={t('print_btn_aria')}
    >
      <span aria-hidden="true">🖨️</span>
      {t('print_btn')}
    </button>
  )
}
