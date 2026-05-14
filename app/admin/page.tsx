'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const ADMIN_EMAIL = '356904@gmail.com'

const FLAGS: Record<string, string> = { FR: '🇫🇷', BE: '🇧🇪', CH: '🇨🇭', CA: '🇨🇦' }

type Article = {
  id: number
  slug: string
  titre_provisoire: string
  resume_50mots: string | null
  contenu_html: string | null
  pays_cible: string
  niveau_confiance: string | null
  etat_code: string
  created_at: string
  sources_json: any
}

export default function AdminPage() {
  const [session, setSession]     = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [articles, setArticles]   = useState<Article[]>([])
  const [selected, setSelected]   = useState<Article | null>(null)
  const [filter, setFilter]       = useState<'EN_ATTENTE_VALIDATION' | 'PUBLIE' | 'REJETE'>('EN_ATTENTE_VALIDATION')
  const [actionMsg, setActionMsg] = useState('')
  const [stats, setStats]         = useState<Record<string, number>>({})

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
      if (session?.user?.email === ADMIN_EMAIL) {
        chargerArticles('EN_ATTENTE_VALIDATION')
        chargerStats()
      }
    })
  }, [])

  async function chargerArticles(etat: string) {
    setFilter(etat as any)
    setSelected(null)
    const { data } = await sb
      .from('articles')
      .select('id, slug, titre_provisoire, resume_50mots, contenu_html, pays_cible, niveau_confiance, etat_code, created_at, sources_json')
      .eq('etat_code', etat)
      .order('created_at', { ascending: false })
    setArticles(data || [])
  }

  async function chargerStats() {
    const etats = ['EN_ATTENTE_VALIDATION', 'PUBLIE', 'REJETE', 'EN_REDACTION', 'BROUILLON']
    const res: Record<string, number> = {}
    for (const e of etats) {
      const { count } = await sb.from('articles').select('*', { count: 'exact', head: true }).eq('etat_code', e)
      res[e] = count || 0
    }
    setStats(res)
  }

  async function valider(id: number) {
    setActionMsg('Publication en cours…')
    const { error } = await sb.from('articles').update({ etat_code: 'VALIDE' }).eq('id', id)
    if (error) { setActionMsg('✗ Erreur : ' + error.message); return }
    setActionMsg('✓ Article validé — l\'Agent SEO va le publier.')
    setArticles(prev => prev.filter(a => a.id !== id))
    setSelected(null)
    chargerStats()
    setTimeout(() => setActionMsg(''), 4000)
  }

  async function rejeter(id: number) {
    setActionMsg('Rejet en cours…')
    const { error } = await sb.from('articles').update({ etat_code: 'REJETE' }).eq('id', id)
    if (error) { setActionMsg('✗ Erreur : ' + error.message); return }
    setActionMsg('✓ Article rejeté.')
    setArticles(prev => prev.filter(a => a.id !== id))
    setSelected(null)
    chargerStats()
    setTimeout(() => setActionMsg(''), 3000)
  }

  async function lancerVeille() {
    setActionMsg('Lancement veille…')
    try {
      const r = await fetch('https://orchestrateur-production.up.railway.app/veille/lancer', { method: 'POST' })
      const j = await r.json()
      setActionMsg('✓ ' + (j.message || 'Veille lancée'))
    } catch { setActionMsg('✗ Erreur connexion Railway') }
    setTimeout(() => setActionMsg(''), 4000)
  }

  async function lancerRedaction() {
    setActionMsg('Lancement rédaction…')
    try {
      const r = await fetch('https://orchestrateur-production.up.railway.app/articles/lancer-redaction', { method: 'POST' })
      const j = await r.json()
      setActionMsg('✓ ' + (j.message || 'Rédaction lancée'))
    } catch { setActionMsg('✗ Erreur connexion Railway') }
    setTimeout(() => setActionMsg(''), 4000)
  }

  async function lancerSEO() {
    setActionMsg('Traitement SEO des articles validés…')
    try {
      const r = await fetch('https://orchestrateur-production.up.railway.app/seo/traiter-valides', { method: 'POST' })
      const j = await r.json()
      setActionMsg('✓ ' + (j.message || 'SEO traité'))
    } catch { setActionMsg('✗ Erreur connexion Railway') }
    chargerStats()
    setTimeout(() => setActionMsg(''), 5000)
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}>Chargement…</div>

  if (!session) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <h1 style={{ marginBottom: 16 }}>Accès restreint</h1>
      <p style={{ color: 'var(--color-text-soft)', marginBottom: 24 }}>Connectez-vous avec le compte administrateur.</p>
      <Link href="/espace-membres" className="btn btn-primary">Se connecter →</Link>
    </div>
  )

  if (session.user.email !== ADMIN_EMAIL) return (
    <div style={{ textAlign: 'center', padding: '80px 24px' }}>
      <h1>Accès refusé</h1>
      <p style={{ color: 'var(--color-text-soft)' }}>Cette page est réservée à l&apos;administrateur.</p>
    </div>
  )

  return (
    <div style={{ padding: '32px 0 80px' }}>
      <div className="container">

        {/* Header admin */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>🛠️ Administration Moteurs.com</h1>
            <p style={{ color: 'var(--color-text-soft)', fontSize: '0.9rem' }}>Validation articles · Pipeline éditorial · Agents IA</p>
          </div>
          <button onClick={() => sb.auth.signOut()} style={{ background: 'none', border: '1px solid var(--color-border)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', color: 'var(--color-text-soft)' }}>
            Déconnexion
          </button>
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
          {[
            { label: 'En attente', key: 'EN_ATTENTE_VALIDATION', color: '#f59e0b' },
            { label: 'Publiés', key: 'PUBLIE', color: '#10b981' },
            { label: 'Rejetés', key: 'REJETE', color: '#ef4444' },
            { label: 'En rédaction', key: 'EN_REDACTION', color: '#3b82f6' },
          ].map(s => (
            <div key={s.key} style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '12px 20px', minWidth: 120 }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{stats[s.key] ?? '…'}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-soft)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Actions agents */}
        <div style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 10, padding: 20, marginBottom: 32 }}>
          <h2 style={{ fontSize: '1rem', marginBottom: 14 }}>⚡ Déclencher un agent</h2>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={lancerVeille}>🔍 Agent Veille</button>
            <button className="btn btn-secondary btn-sm" onClick={lancerRedaction}>✍️ Agent Rédaction</button>
            <button className="btn btn-primary btn-sm" onClick={lancerSEO}>🚀 Publier validés (SEO)</button>
          </div>
          {actionMsg && (
            <div style={{ marginTop: 12, padding: '8px 14px', background: 'var(--color-bg)', borderRadius: 6, fontSize: '0.85rem', color: 'var(--color-text-soft)' }}>
              {actionMsg}
            </div>
          )}
        </div>

        {/* Onglets filtre */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid var(--color-border)' }}>
          {([
            ['EN_ATTENTE_VALIDATION', '🟡 En attente'],
            ['PUBLIE', '🟢 Publiés'],
            ['REJETE', '🔴 Rejetés'],
          ] as const).map(([etat, label]) => (
            <button key={etat} onClick={() => chargerArticles(etat)} style={{
              padding: '8px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: filter === etat ? 700 : 400,
              color: filter === etat ? 'var(--color-primary)' : 'var(--color-text-soft)',
              borderBottom: filter === etat ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: -2,
            }}>
              {label} {stats[etat] !== undefined ? `(${stats[etat]})` : ''}
            </button>
          ))}
        </div>

        {/* Layout liste + preview */}
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24, alignItems: 'start' }}>

          {/* Liste articles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {articles.length === 0 && (
              <p style={{ color: 'var(--color-text-soft)', padding: 20 }}>Aucun article dans cet état.</p>
            )}
            {articles.map(a => (
              <div key={a.id} onClick={() => setSelected(a)} style={{
                padding: '12px 16px', background: 'var(--color-bg-alt)', border: `1px solid ${selected?.id === a.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                borderRadius: 8, cursor: 'pointer', transition: 'border-color 0.15s',
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '1.1rem' }}>{FLAGS[a.pays_cible] || '🌐'}</span>
                  <span style={{ fontSize: '0.72rem', padding: '2px 7px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, color: 'var(--color-text-soft)' }}>
                    {a.pays_cible}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-soft)', marginLeft: 'auto' }}>
                    {new Date(a.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', lineHeight: 1.3 }}>{a.titre_provisoire}</div>
              </div>
            ))}
          </div>

          {/* Panneau preview */}
          <div style={{ position: 'sticky', top: 100 }}>
            {!selected ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-soft)', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 10 }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
                Sélectionne un article pour le prévisualiser
              </div>
            ) : (
              <div style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>{FLAGS[selected.pays_cible]} {selected.pays_cible} · {selected.niveau_confiance || 'MOYEN'}</span>
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-soft)' }}>{selected.slug}</span>
                </div>
                <div style={{ padding: 20, maxHeight: '60vh', overflowY: 'auto' }}>
                  <h2 style={{ fontSize: '1.15rem', marginBottom: 10 }}>{selected.titre_provisoire}</h2>
                  {selected.resume_50mots && <p style={{ color: 'var(--color-text-soft)', fontSize: '0.9rem', marginBottom: 16, fontStyle: 'italic' }}>{selected.resume_50mots}</p>}
                  {selected.contenu_html && (
                    <div className="article-content" style={{ fontSize: '0.88rem' }} dangerouslySetInnerHTML={{ __html: selected.contenu_html }} />
                  )}
                </div>
                {filter === 'EN_ATTENTE_VALIDATION' && (
                  <div style={{ padding: '16px 20px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 10 }}>
                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => valider(selected.id)}>
                      ✓ Valider & publier
                    </button>
                    <button className="btn btn-secondary" style={{ flex: 1, color: '#ef4444', borderColor: '#ef4444' }} onClick={() => rejeter(selected.id)}>
                      ✗ Rejeter
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
