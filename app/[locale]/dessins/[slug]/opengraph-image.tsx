/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og'
import { getDessin } from '@/lib/dessins'

export const runtime = 'edge'
export const alt = 'Dessin — Moteurs.com'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const d = await getDessin(slug)

  const titre = d?.titre ?? 'Dessin Moteurs.com'
  const image = d?.image_url

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background: '#0a0e1a',
          fontFamily: 'sans-serif',
        }}
      >
        {image ? (
          <img
            src={image}
            alt=""
            width={1200}
            height={630}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : null}

        {/* Voile bas + branding */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '24px 40px',
            background: 'linear-gradient(to top, rgba(10,14,26,0.92), rgba(10,14,26,0))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 12, height: 12, borderRadius: 12, background: '#7af0c2' }} />
            <div style={{ fontSize: 30, fontWeight: 700, color: 'white' }}>
              Moteurs<span style={{ color: '#7af0c2' }}>.com</span>
            </div>
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 600,
              color: '#7af0c2',
              border: '1px solid rgba(122,240,194,0.4)',
              borderRadius: 20,
              padding: '6px 18px',
            }}
          >
            ✏️ Dessin
          </div>
        </div>

        {/* Titre en haut si pas d'image */}
        {!image && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 60px',
              color: 'white',
              fontSize: 56,
              fontWeight: 800,
              textAlign: 'center',
            }}
          >
            {titre}
          </div>
        )}
      </div>
    ),
    size
  )
}
