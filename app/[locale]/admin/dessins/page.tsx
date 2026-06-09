'use client'

import { useCallback, useEffect, useState } from 'react'
import { Link } from '@/i18n/navigation'
import { getSupabaseClient } from '@/lib/user-context'
import { useUserContext } from '@/context/UserContextProvider'
import { CATEGORIES, type Dessin } from '@/lib/dessins'

const sb = getSupabaseClient()
const ADMIN_EMAIL = '356904@gmail.com'

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70)
}

function readDims(file: File): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new window.Image()
    const u = URL.createObjectURL(file)
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight })
      URL.revokeObjectURL(u)
    }
    img.onerror = () => {
      resolve({ w: 0, h: 0 })
      URL.revokeObjectURL(u)
    }
    img.src = u
  })
}

export default function AdminDessinsPage() {
  const { userEmail, isReady } = useUserContext()
  const isAdmin = isReady && userEmail === ADMIN_EMAIL

  const [titre, setTitre] = useState('')
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [legende, setLegende] = useState('')
  const [description, setDescription] = useState('')
  const [categorie, setCategorie] = useState('humour')
  const [pays, setPays] = useState('')
  const [articleSlug, setArticleSlug] = useState('')
  const [tags, setTags] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [liste, setListe] = useState<Dessin[]>([])

  const charger = useCallback(async () => {
    const { data } = await sb
      .from('dessins')
      .select('*')
      .order('date_publication', { ascending: false })
    setListe((data ?? []) as Dessin[])
  }, [])

  useEffect(() => {
    if (isAdmin) charger()
  }, [isAdmin, charger])

  async function envoyer(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !titre || !slug) {
      setMsg('Titre, slug et image sont obligatoires.')
      return
    }
    setBusy(true)
    setMsg('Upload en cours…')
    try {
      const ext = (file.name.split('.').pop() ?? 'png').toLowerCase()
      const annee = new Date().getFullYear()
      const path = `${annee}/${slug}-${Date.now()}.${ext}`

      const { error: upErr } = await sb.storage
        .from('dessins')
        .upload(path, file, { upsert: false, contentType: file.type || 'image/png' })
      if (upErr) throw upErr

      const { data: pub } = sb.storage.from('dessins').getPublicUrl(path)
      const imageUrl = pub.publicUrl
      const { w, h } = await readDims(file)

      const { error: insErr } = await sb.from('dessins').insert({
        slug,
        titre,
        legende: legende || null,
        description: description || null,
        image_path: path,
        image_url: imageUrl,
        largeur: w || null,
        hauteur: h || null,
        categorie,
        pays_cible: pays || null,
        article_slug: articleSlug || null,
        tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
        alt: titre,
        publie: true,
      })
      if (insErr) throw insErr

      setMsg('✅ Dessin publié !')
      setTitre(''); setSlug(''); setSlugTouched(false); setLegende(''); setDescription('')
      setPays(''); setArticleSlug(''); setTags(''); setFile(null)
      charger()
    } catch (err: unknown) {
      setMsg('❌ Erreur : ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setBusy(false)
    }
  }

  async function supprimer(d: Dessin) {
    if (!confirm(`Supprimer « ${d.titre} » ?`)) return
    await sb.storage.from('dessins').remove([d.image_path])
    await sb.from('dessins').delete().eq('id', d.id)
    charger()
  }

  async function togglePublie(d: Dessin) {
    await sb.from('dessins').update({ publie: !d.publie }).eq('id', d.id)
    charger()
  }

  if (!isReady) return <main style={{ padding: 40 }}>Chargement…</main>
  if (!isAdmin)
    return (
      <main style={{ padding: 40, maxWidth: 600, margin: '0 auto' }}>
        <h1>Accès réservé</h1>
        <p style={{ color: 'var(--color-text-soft)' }}>
          Cette page est réservée à l&apos;administrateur.{' '}
          <Link href="/espace-membres" style={{ color: 'var(--color-primary)' }}>
            Se connecter
          </Link>
        </p>
      </main>
    )

  const input: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid var(--color-border)',
    background: 'var(--color-bg)',
    color: 'var(--color-text)',
    fontSize: '0.92rem',
  }
  const label: React.CSSProperties = { fontSize: '0.82rem', fontWeight: 600, marginBottom: 4, display: 'block' }

  return (
    <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px 72px' }}>
      <nav style={{ marginBottom: 16, fontSize: '0.85rem' }}>
        <Link href="/dessins" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
          🖼️ Voir la galerie publique
        </Link>
      </nav>
      <h1 style={{ fontSize: '1.7rem', fontWeight: 800, marginBottom: 6 }}>Dessins — administration</h1>
      <p style={{ color: 'var(--color-text-soft)', marginBottom: 26 }}>
        Uploade un dessin ou une illustration. Il apparaît immédiatement sur{' '}
        <Link href="/dessins" style={{ color: 'var(--color-primary)' }}>/dessins</Link>.
      </p>

      <form
        onSubmit={envoyer}
        style={{
          display: 'grid',
          gap: 14,
          background: 'var(--color-bg-alt)',
          border: '1px solid var(--color-border)',
          borderRadius: 14,
          padding: 22,
          marginBottom: 36,
        }}
      >
        <div>
          <label style={label}>Image *</label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={input}
          />
        </div>
        <div>
          <label style={label}>Titre *</label>
          <input
            value={titre}
            onChange={(e) => {
              setTitre(e.target.value)
              if (!slugTouched) setSlug(slugify(e.target.value))
            }}
            style={input}
            placeholder="Le robot-taxi et le contrôle d'alcoolémie"
          />
        </div>
        <div>
          <label style={label}>Slug (URL) *</label>
          <input
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(slugify(e.target.value))
            }}
            style={input}
            placeholder="robot-taxi-alcoolemie"
          />
        </div>
        <div>
          <label style={label}>Légende (sous l&apos;image)</label>
          <input value={legende} onChange={(e) => setLegende(e.target.value)} style={input} />
        </div>
        <div>
          <label style={label}>Description (texte sous la légende)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{ ...input, resize: 'vertical' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 180px' }}>
            <label style={label}>Catégorie</label>
            <select value={categorie} onChange={(e) => setCategorie(e.target.value)} style={input}>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.emoji} {c.label}
                </option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1 1 120px' }}>
            <label style={label}>Pays (optionnel)</label>
            <select value={pays} onChange={(e) => setPays(e.target.value)} style={input}>
              <option value="">—</option>
              <option value="FR">🇫🇷 FR</option>
              <option value="BE">🇧🇪 BE</option>
              <option value="CH">🇨🇭 CH</option>
              <option value="CA">🇨🇦 CA</option>
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={label}>Slug article lié (optionnel)</label>
            <input value={articleSlug} onChange={(e) => setArticleSlug(e.target.value)} style={input} />
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={label}>Tags (séparés par virgule)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} style={input} placeholder="taxi, autonome, alcoolémie" />
          </div>
        </div>
        <button
          type="submit"
          disabled={busy}
          style={{
            padding: '11px 22px',
            borderRadius: 10,
            border: 'none',
            background: busy ? 'var(--color-border)' : 'var(--color-primary)',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.95rem',
            cursor: busy ? 'default' : 'pointer',
            justifySelf: 'start',
          }}
        >
          {busy ? '…' : 'Publier le dessin'}
        </button>
        {msg && <div style={{ fontSize: '0.9rem', color: 'var(--color-text-soft)' }}>{msg}</div>}
      </form>

      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 14 }}>
        Dessins existants ({liste.length})
      </h2>
      <div style={{ display: 'grid', gap: 12 }}>
        {liste.map((d) => (
          <div
            key={d.id}
            style={{
              display: 'flex',
              gap: 14,
              alignItems: 'center',
              padding: 10,
              borderRadius: 10,
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-alt)',
              opacity: d.publie ? 1 : 0.55,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={d.image_url} alt="" width={70} height={50} style={{ width: 70, height: 50, objectFit: 'cover', borderRadius: 6 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{d.titre}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-soft)' }}>
                /dessins/{d.slug} · {d.categorie} {d.publie ? '' : '· (masqué)'}
              </div>
            </div>
            <button onClick={() => togglePublie(d)} style={{ fontSize: '0.8rem', padding: '6px 10px', cursor: 'pointer', borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
              {d.publie ? 'Masquer' : 'Publier'}
            </button>
            <button onClick={() => supprimer(d)} style={{ fontSize: '0.8rem', padding: '6px 10px', cursor: 'pointer', borderRadius: 6, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444' }}>
              Suppr.
            </button>
          </div>
        ))}
      </div>
    </main>
  )
}
