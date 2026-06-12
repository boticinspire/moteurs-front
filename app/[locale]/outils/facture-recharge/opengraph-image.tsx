/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Simulateur de facture de recharge - Moteurs.com'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OGImage() {
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 12, height: 12, borderRadius: 12, background: '#7af0c2' }} />
          <div style={{ fontSize: 26, fontWeight: 700, color: 'white' }}>
            Moteurs<span style={{ color: '#7af0c2' }}>.com</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ fontSize: 100 }}>🔥</div>
          <div style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.08, maxWidth: 1020 }}>
            On vous a facturé un prix fou ?
          </div>
          <div style={{ fontSize: 28, color: '#9ca3af', lineHeight: 1.4, maxWidth: 920 }}>
            Entrez votre recharge, on vous dit combien vous auriez pu economiser
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 22, color: '#ef6c1a', fontWeight: 700 }}>
            Simulateur gratuit · sans inscription
          </div>
          <div style={{ height: 6, width: 200, background: '#ef6c1a', borderRadius: 3 }} />
        </div>
      </div>
    ),
    size,
  )
}
