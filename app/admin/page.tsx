'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const RAIL = 'https://orchestrateur-production.up.railway.app'
const ADMIN_EMAIL = '356904@gmail.com'
const FLAGS: Record<string, string> = { FR: '🇫🇷', BE: '🇧🇪', CH: '🇨🇭', CA: '🇨🇦' }

type Article = {
  id: number; slug: string; titre_provisoire: string; resume_50mots: string | null
  contenu_html: string | null; pays_cible: string; niveau_confiance: string | null
  etat_code: string; created_at: string; sources_json: any
}
type Post = { id: number; article_id: number; plateforme: string; contenu: string; publie: boolean }
type AlerteGov = { id: number; nom: string; pays: string; resume_changement: string; statut: string; created_at: string }

type Tab = 'articles' | 'social' | 'alertes'

export default function AdminPage() {
  const [session, setSession]         = useState<any>(null)
  const [loading, setLoading]         = useState(true)
  const [tab, setTab]                 = useState<Tab>('articles')
  const [articles, setArticles]       = useState<Article[]>([])
  const [selected, setSelected]       = useState<Article | null>(null)
  const [filter, setFilter]           = useState<string>('EN_ATTENTE_VALIDATION')
  const [stats, setStats]             = useState<Record<string, number>>({})
  const [actionMsg, setActionMsg]     = useState('')
  const [posts, setPosts]             = useState<Post[]>([])
  const [alertes, setAlertes]         = useState<AlerteGov[]>([])
  const [nbAlertes, setNbAlertes]     = useState(0)
  const [expandPost, setExpandPost]   = useState<number | null>(null)

  const msg = (m: string, delay = 4000) => { setActionMsg(m); setTimeout(() => setActionMsg(''), delay) }

  // ── Auth ──
  useEffect(() => {
    sb.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
  }, [])

  // ── Chargements initiaux ──
  useEffect(() => {
    if (session?.user?.email !== ADMIN_EMAIL) return
    chargerArticles('EN_ATTENTE_VALIDATION')
    chargerStats()
    chargerNbAlertes()
  }, [session])

  // ── Loaders ──
  async function chargerArticles(etat: string) {
    setFilter(etat); setSelected(null)
    const { data } = await sb.from('articles')
      .select('id, slug, titre_provisoire, resume_50mots, contenu_html, pays_cible, niveau_confiance, etat_code, created_at, sources_json')
      .eq('etat_code', etat).order('created_at', { ascending: false })
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

  async function chargerNbAlertes() {
    const { count } = await sb.from('alertes_gov_events').select('*', { count: 'exact', head: true }).eq('statut', 'NON_LU')
    setNbAlertes(count || 0)
  }

  async function chargerPosts() {
    const { data } = await sb.from('social_posts').select('id, article_id, plateforme, contenu, publie').eq('publie', false).order('id', { ascending: false }).limit(60)
    setPosts(data || [])
  }

  async function chargerAlertes() {
    const { data } = await sb.from('alertes_gov_events').select('*').order('created_at', { ascending: false }).limit(50)
    setAlertes(data || [])
  }

  // ── Tabs ──
  function switchTab(t: Tab) {
    setTab(t)
    if (t === 'social') chargerPosts()
    if (t === 'alertes') chargerAlertes()
  }

  // ── Actions articles ──
  async function valider(id: number) {
    msg('Publication en cours…')
    const { error } = await sb.from('articles').update({ etat_code: 'VALIDE' }).eq('id', id)
    if (error) { msg('✗ Erreur : ' + error.message); return }
    msg('✓ Validé — Agent SEO en cours…')
    setArticles(prev => prev.filter(a => a.id !== id)); setSelected(null); chargerStats()
  }

  async function validerTout() {
    const enAttente = articles.filter(a => a.etat_code === 'EN_ATTENTE_VALIDATION')
    if (enAttente.length === 0) { msg('Aucun article en attente.'); return }
    msg(`Validation de ${enAttente.length} article(s) en cours…`)
    const { error } = await sb.from('articles')
      .update({ etat_code: 'VALIDE' })
      .eq('etat_code', 'EN_ATTENTE_VALIDATION')
    if (error) { msg('✗ Erreur : ' + error.message); return }
    msg(`✓ ${enAttente.length} article(s) validés — Lancement Agent SEO…`)
    try {
      await fetch(`${RAIL}/seo/traiter-valides`, { method: 'POST' })
      msg(`✓ ${enAttente.length} article(s) validés et publiés.`, 6000)
    } catch { msg('✓ Validés — mais erreur connexion SEO. Lance "Publier validés" manuellement.') }
    setSelected(null)
    await chargerStats()
    await chargerArticles('EN_ATTENTE_VALIDATION')
  }

  async function rejeter(id: number) {
    msg('Rejet en cours…')
    await sb.from('articles').update({ etat_code: 'REJETE' }).eq('id', id)
    msg('✓ Article rejeté.')
    setArticles(prev => prev.filter(a => a.id !== id)); setSelected(null); chargerStats()
  }

  // ── Actions agents (Railway) ──
  async function appelerRail(path: string, label: string) {
    msg(`${label}…`)
    try {
      const r = await fetch(`${RAIL}${path}`, { method: 'POST' })
      const j = await r.json()
      msg('✓ ' + (j.message || j.traites !== undefined ? `${label} — ${j.traites ?? ''} traité(s)` : label))
    } catch { msg('✗ Erreur connexion Railway') }
  }

  async function lancerSocial(articleId?: number) {
    if (articleId) {
      msg('Génération posts sociaux…')
      try {
        const r = await fetch(`${RAIL}/social/generer/${articleId}`, { method: 'POST' })
        const j = await r.json()
        msg('✓ Posts générés : ' + (j.posts_generes || []).join(', '))
        if (tab === 'social') chargerPosts()
      } catch { msg('✗ Erreur connexion Railway') }
    } else {
      await appelerRail('/social/generer-batch', 'Agent Social batch')
      chargerPosts()
    }
  }

  // ── Actions posts sociaux ──
  async function marquerPublie(postId: number) {
    await sb.from('social_posts').update({ publie: true }).eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  async function supprimerPost(postId: number) {
    await sb.from('social_posts').delete().eq('id', postId)
    setPosts(prev => prev.filter(p => p.id !== postId))
  }

  // ── Actions alertes ──
  async function marquerAlerteLue(id: number) {
    await sb.from('alertes_gov_events').update({ statut: 'LU' }).eq('id', id)
    setAlertes(prev => prev.map(a => a.id === id ? { ...a, statut: 'LU' } : a))
    setNbAlertes(prev => Math.max(0, prev - 1))
  }

  // ─────────────────────────────────────────────────────────────────────────────
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

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '1.6rem', marginBottom: 4 }}>🛠️ Administration Moteurs.com</h1>
            <p style={{ color: 'var(--color-text-soft)', fontSize: '0.9rem' }}>Validation articles · Pipeline éditorial · Agents IA</p>
          </div>
          <button onClick={() => sb.auth.signOut()} style={{ background: 'none', border: '1px solid var(--color-border)', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', color: 'var(--color-text-soft)' }}>
            Déconnexion
          </button>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'En attente', key: 'EN_ATTENTE_VALIDATION', color: '#f59e0b' },
            { label: 'Publiés',    key: 'PUBLIE',                color: '#10b981' },
            { label: 'Rejetés',   key: 'REJETE',                color: '#ef4444' },
            { label: 'En rédaction', key: 'EN_REDACTION',       color: '#3b82f6' },
          ].map(s => (
            <div key={s.key} style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 18px', minWidth: 110 }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{stats[s.key] ?? '…'}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Agents ── */}
        <div style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: 12 }}>⚡ Déclencher un agent</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => appelerRail('/veille/lancer', '🔍 Veille')}>🔍 Veille</button>
            <button className="btn btn-secondary btn-sm" onClick={() => appelerRail('/articles/lancer-redaction', '✍️ Rédaction')}>✍️ Rédaction</button>
            <button className="btn btn-primary btn-sm"   onClick={() => appelerRail('/seo/traiter-valides', '🚀 SEO')}>🚀 Publier validés</button>
            <button className="btn btn-secondary btn-sm" onClick={() => lancerSocial()}>📣 Posts sociaux (batch)</button>
            <button className="btn btn-secondary btn-sm" onClick={() => appelerRail('/alerte-gov/lancer', '🏛️ Alertes Gov.')}>🏛️ Alertes Gov.</button>
          </div>
          {actionMsg && (
            <div style={{ marginTop: 10, padding: '7px 12px', background: 'var(--color-bg)', borderRadius: 6, fontSize: '0.83rem', color: 'var(--color-text-soft)' }}>
              {actionMsg}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid var(--color-border)' }}>
          {([
            ['articles', '📰 Articles'],
            ['social',   '📣 Posts sociaux'],
            ['alertes',  `🏛️ Alertes gov.${nbAlertes > 0 ? ` (${nbAlertes})` : ''}`],
          ] as const).map(([t, label]) => (
            <button key={t} onClick={() => switchTab(t)} style={{
              padding: '8px 20px', background: 'none', border: 'none', cursor: 'pointer',
              fontWeight: tab === t ? 700 : 400,
              color: tab === t ? 'var(--color-primary)' : 'var(--color-text-soft)',
              borderBottom: tab === t ? '2px solid var(--color-primary)' : '2px solid transparent',
              marginBottom: -2,
            }}>
              {label}
            </button>
          ))}
        </div>

        {/* ════════════════ TAB ARTICLES ════════════════ */}
        {tab === 'articles' && (<>
          <div style={{ display: 'flex', gap: 0, marginBottom: 16 }}>
            {([
              ['EN_ATTENTE_VALIDATION', '🟡 En attente'],
              ['PUBLIE', '🟢 Publiés'],
              ['REJETE', '🔴 Rejetés'],
            ] as const).map(([etat, label]) => (
              <button key={etat} onClick={() => chargerArticles(etat)} style={{
                padding: '6px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                fontWeight: filter === etat ? 700 : 400,
                color: filter === etat ? 'var(--color-primary)' : 'var(--color-text-soft)',
                borderBottom: filter === etat ? '2px solid var(--color-primary)' : '2px solid transparent',
              }}>
                {label} ({stats[etat] ?? 0})
              </button>
            ))}
          </div>

          {filter === 'EN_ATTENTE_VALIDATION' && articles.length > 0 && (
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn btn-primary btn-sm" onClick={validerTout}>
                ✓ Valider tout & publier ({articles.length})
              </button>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-soft)' }}>
                Valide tous les articles en attente et déclenche l&apos;Agent SEO.
              </span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>
            {/* Liste */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {articles.length === 0 && <p style={{ color: 'var(--color-text-soft)', padding: 20 }}>Aucun article.</p>}
              {articles.map(a => (
                <div key={a.id} onClick={() => setSelected(a)} style={{
                  padding: '11px 14px', background: 'var(--color-bg-alt)',
                  border: `1px solid ${selected?.id === a.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
                  borderRadius: 8, cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 5 }}>
                    <span>{FLAGS[a.pays_cible] || '🌐'}</span>
                    <span style={{ fontSize: '0.7rem', padding: '1px 6px', background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, color: 'var(--color-text-soft)' }}>{a.pays_cible}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-soft)', marginLeft: 'auto' }}>{new Date(a.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.3 }}>{a.titre_provisoire}</div>
                </div>
              ))}
            </div>

            {/* Préview */}
            <div style={{ position: 'sticky', top: 100 }}>
              {!selected ? (
                <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-soft)', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 10 }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
                  Sélectionne un article pour le prévisualiser
                </div>
              ) : (
                <div style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700 }}>{FLAGS[selected.pays_cible]} {selected.pays_cible} · {selected.niveau_confiance || 'MOYEN'}</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)' }}>{selected.slug}</span>
                  </div>
                  <div style={{ padding: 18, maxHeight: '55vh', overflowY: 'auto' }}>
                    <h2 style={{ fontSize: '1.1rem', marginBottom: 10 }}>{selected.titre_provisoire}</h2>
                    {selected.resume_50mots && <p style={{ color: 'var(--color-text-soft)', fontSize: '0.88rem', marginBottom: 14, fontStyle: 'italic' }}>{selected.resume_50mots}</p>}
                    {selected.contenu_html && (
                      <div className="article-content" style={{ fontSize: '0.85rem' }} dangerouslySetInnerHTML={{ __html: selected.contenu_html }} />
                    )}
                  </div>
                  <div style={{ padding: '14px 18px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {filter === 'EN_ATTENTE_VALIDATION' && (<>
                      <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => valider(selected.id)}>✓ Valider & publier</button>
                      <button className="btn btn-secondary btn-sm" style={{ flex: 1, color: '#ef4444', borderColor: '#ef4444' }} onClick={() => rejeter(selected.id)}>✗ Rejeter</button>
                    </>)}
                    {filter === 'PUBLIE' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => lancerSocial(selected.id)}>📣 Générer posts sociaux</button>
                    )}
                    <a className="btn btn-secondary btn-sm" href={`/article/${selected.slug}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                      🔗 Voir en ligne
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>)}

        {/* ════════════════ TAB SOCIAL ════════════════ */}
        {tab === 'social' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ color: 'var(--color-text-soft)', fontSize: '0.88rem' }}>
                Brouillons de posts générés par l&apos;Agent Social — à copier-coller pour publication manuelle.
              </p>
              <button className="btn btn-secondary btn-sm" onClick={chargerPosts}>↻ Rafraîchir</button>
            </div>

            {posts.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-soft)', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 10 }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
                Aucun brouillon — lance l&apos;Agent Social pour en générer.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {posts.map(p => (
                <div key={p.id} style={{ background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                      background: p.plateforme === 'linkedin' ? '#0a66c2' : '#000',
                      color: '#fff',
                    }}>
                      {p.plateforme === 'linkedin' ? '🔵 LinkedIn' : '✖ X'}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)' }}>Article #{p.article_id}</span>
                    <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => setExpandPost(expandPost === p.id ? null : p.id)}
                        style={{ background: 'none', border: '1px solid var(--color-border)', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem' }}
                      >
                        {expandPost === p.id ? 'Réduire' : 'Voir'}
                      </button>
                      <button
                        onClick={() => navigator.clipboard.writeText(p.contenu)}
                        style={{ background: 'none', border: '1px solid var(--color-border)', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem' }}
                      >
                        📋 Copier
                      </button>
                      <button onClick={() => marquerPublie(p.id)} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem' }}>
                        ✓ Publié
                      </button>
                      <button onClick={() => supprimerPost(p.id)} style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem' }}>
                        ✗
                      </button>
                    </div>
                  </div>
                  {expandPost === p.id && (
                    <div style={{ padding: '14px 16px', fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: 'var(--color-text)' }}>
                      {p.contenu}
                    </div>
                  )}
                  {expandPost !== p.id && (
                    <div style={{ padding: '10px 16px', fontSize: '0.83rem', color: 'var(--color-text-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.contenu.slice(0, 120)}…
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════ TAB ALERTES GOV ════════════════ */}
        {tab === 'alertes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <p style={{ color: 'var(--color-text-soft)', fontSize: '0.88rem' }}>
                Changements détectés sur les sources gouvernementales (aides, ZFE, réglementation).
              </p>
              <button className="btn btn-secondary btn-sm" onClick={chargerAlertes}>↻ Rafraîchir</button>
            </div>

            {alertes.length === 0 && (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-soft)', background: 'var(--color-bg-alt)', border: '1px solid var(--color-border)', borderRadius: 10 }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏛️</div>
                Aucune alerte — lance l&apos;Agent Alertes Gov. pour vérifier les sources.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alertes.map(a => (
                <div key={a.id} style={{
                  background: 'var(--color-bg-alt)',
                  border: `1px solid ${a.statut === 'NON_LU' ? '#f59e0b' : 'var(--color-border)'}`,
                  borderLeft: `4px solid ${a.statut === 'NON_LU' ? '#f59e0b' : 'var(--color-border)'}`,
                  borderRadius: 10, padding: '14px 18px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{FLAGS[a.pays]} {a.nom}</span>
                        {a.statut === 'NON_LU' && (
                          <span style={{ fontSize: '0.68rem', background: '#f59e0b', color: '#000', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>NOUVEAU</span>
                        )}
                        <span style={{ fontSize: '0.72rem', color: 'var(--color-text-soft)', marginLeft: 'auto' }}>
                          {new Date(a.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', lineHeight: 1.5, color: 'var(--color-text)', margin: 0 }}>
                        {a.resume_changement}
                      </p>
                    </div>
                    {a.statut === 'NON_LU' && (
                      <button onClick={() => marquerAlerteLue(a.id)} style={{ background: 'none', border: '1px solid var(--color-border)', padding: '4px 12px', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        Marquer lu
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
