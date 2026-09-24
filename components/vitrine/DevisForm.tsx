'use client'

import { useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import s from './vitrine.module.css'

type Status = 'idle' | 'sending' | 'ok' | 'error'

/**
 * Formulaire de demande de devis / commande pour les gabarits de soupape.
 * POST /api/devis-gabarits → table Supabase `demandes_gabarits`.
 * Repli : lien mailto pré-rempli si l'API échoue.
 */
export default function DevisForm() {
  const t = useTranslations('Vitrine')
  const locale = useLocale()
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    // Honeypot anti-spam
    if ((fd.get('website') as string)?.length) { setStatus('ok'); return }

    const payload = {
      nom: (fd.get('nom') as string).trim(),
      email: (fd.get('email') as string).trim(),
      entreprise: (fd.get('entreprise') as string)?.trim() || null,
      pays: (fd.get('pays') as string) || null,
      profil: (fd.get('profil') as string) || null,
      diametre_tete: (fd.get('diametre_tete') as string)?.trim() || null,
      diametre_tige: (fd.get('diametre_tige') as string)?.trim() || null,
      angle_siege: (fd.get('angle_siege') as string) || null,
      quantite: Number(fd.get('quantite') || 1),
      moteur: (fd.get('moteur') as string)?.trim() || null,
      message: (fd.get('message') as string)?.trim() || null,
      langue: locale,
      source_page: typeof window !== 'undefined' ? window.location.pathname : '/',
    }

    setStatus('sending'); setErrorMsg(null)
    try {
      const res = await fetch('/api/devis-gabarits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setStatus('ok')
      form.reset()
    } catch (err) {
      setStatus('error')
      setErrorMsg(err instanceof Error ? err.message : String(err))
    }
  }

  if (status === 'ok') {
    return (
      <div className={s.formOk} role="status">
        <strong>{t('form_ok_title')}</strong>
        <p>{t('form_ok_text')}</p>
      </div>
    )
  }

  return (
    <form className={s.form} onSubmit={onSubmit} noValidate={false}>
      <div className={s.formGrid}>
        <label className={s.field}>
          <span>{t('form_name')} *</span>
          <input name="nom" type="text" required autoComplete="name" />
        </label>
        <label className={s.field}>
          <span>{t('form_email')} *</span>
          <input name="email" type="email" required autoComplete="email" />
        </label>
        <label className={s.field}>
          <span>{t('form_company')}</span>
          <input name="entreprise" type="text" autoComplete="organization" />
        </label>
        <label className={s.field}>
          <span>{t('form_country')}</span>
          <select name="pays" defaultValue="">
            <option value="">—</option>
            <option value="BE">Belgique / België</option>
            <option value="FR">France</option>
            <option value="NL">Nederland</option>
            <option value="DE">Deutschland</option>
            <option value="LU">Luxembourg</option>
            <option value="CH">Suisse / Schweiz</option>
            <option value="AT">Österreich</option>
            <option value="UK">United Kingdom</option>
            <option value="OTHER">{t('form_country_other')}</option>
          </select>
        </label>
        <label className={s.field}>
          <span>{t('form_profile')}</span>
          <select name="profil" defaultValue="">
            <option value="">—</option>
            <option value="restaurateur">{t('profile_restorer')}</option>
            <option value="garage">{t('profile_garage')}</option>
            <option value="rectifieur">{t('profile_machinist')}</option>
            <option value="ecole">{t('profile_school')}</option>
            <option value="particulier">{t('profile_private')}</option>
          </select>
        </label>
        <label className={s.field}>
          <span>{t('form_engine')}</span>
          <input name="moteur" type="text" placeholder={t('form_engine_ph')} />
        </label>
        <label className={s.field}>
          <span>{t('form_head')}</span>
          <input name="diametre_tete" type="text" inputMode="decimal" placeholder="ex. 36, 40, 45" />
        </label>
        <label className={s.field}>
          <span>{t('form_stem')}</span>
          <input name="diametre_tige" type="text" inputMode="decimal" placeholder="ex. 8, 9, 10.5" />
        </label>
        <label className={s.field}>
          <span>{t('form_angle')}</span>
          <select name="angle_siege" defaultValue="45">
            <option value="30">30°</option>
            <option value="45">45°</option>
            <option value="60">60°</option>
            <option value="autre">{t('form_angle_other')}</option>
          </select>
        </label>
        <label className={s.field}>
          <span>{t('form_qty')}</span>
          <input name="quantite" type="number" min={1} defaultValue={1} />
        </label>
        <label className={`${s.field} ${s.fieldFull}`}>
          <span>{t('form_message')}</span>
          <textarea name="message" rows={4} placeholder={t('form_message_ph')} />
        </label>
        {/* Honeypot */}
        <input name="website" type="text" tabIndex={-1} autoComplete="off" className={s.hp} aria-hidden="true" />
      </div>

      {status === 'error' && (
        <p className={s.formError} role="alert">
          {t('form_error')} {errorMsg && <code>{errorMsg}</code>}<br />
          <a href={`mailto:info@moteurs.com?subject=${encodeURIComponent(t('form_mail_subject'))}`}>info@moteurs.com</a>
        </p>
      )}

      <div className={s.formActions}>
        <button type="submit" className={s.btnPrimary} disabled={status === 'sending'}>
          {status === 'sending' ? t('form_sending') : t('form_submit')}
        </button>
        <span className={s.formNote}>{t('form_note')}</span>
      </div>
    </form>
  )
}
