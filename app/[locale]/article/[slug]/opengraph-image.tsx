/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og'
import { supabase } from '@/lib/supabase'

export const runtime = 'edge'
export const alt = 'Décryptage — Moteurs.com'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const FLAG: Record<string, string> = { FR: '🇫🇷', BE: '🇧🇪', CH: '🇨🇭', CA: '🇨🇦', LU: '🇱🇺' }

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let titre = 'Décryptage transition énergétique'
  let pays = 'FR'
  try {
    const { data } = await supabase
      .from('articles')
      .select('titre_provisoire, pays_cible')
      .eq('slug', slug)
      .eq('etat_code', 'PUBLIE')
      .single()
    if (data?.titre_provisoire) titre = data.titre_provisoire as string
    if (data?.pays_cible) pays = data.pays_cible as string
  } catch {
    /* fallback */
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0a0e1a 0%, #14182a 100%)',
          color: 'white',
          padding: '60px 70px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 12, height: 12, borderRadius: 12, background: '#7af0c2' }} />
            <div style={{ fontSize: 26, fontWeight: 700, color: 'white' }}>
              Moteurs<span style={{ color: '#7af0c2' }}>.com</span>
            </div>
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: '#7af0c2',
              border: '1px solid rgba(122,240,194,0.4)',
              borderRadius: 20,
              padding: '6px 16px',
            }}
          >
            {FLAG[pays] ?? ''} Décryptage
          </div>
        </div>

        <div
          style={{
            fontSize: titre.length > 80 ? 50 : 60,
            fontWeight: 800,
            lineHeight: 1.12,
            maxWidth: 1060,
            display: 'flex',
          }}
        >
          {titre}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 22, color: '#9ca3af', fontWeight: 500 }}>
            Triangulation des sources · Données 2026
          </div>
          <div style={{ height: 6, width: 200, background: '#7af0c2', borderRadius: 3 }} />
        </div>
      </div>
    ),
    size
  )
}
