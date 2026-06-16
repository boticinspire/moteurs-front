'use client'

import { useMemo, useState, useEffect } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import { useUserContext } from '@/context/UserContextProvider'
import { chargeTimeMin } from '@/lib/ev-charge-model'

// ─────────────────────────────────────────────────────────────────────────────
// Données — Carlist Bedrijfswagen (niveau / ATN) A + B + C
// atnNet = "partie restante / resterend deel" (montant mensuel imposable net).
// Pour A et B, contribution = 0 → atnNet = atnGross.
// confort = indice famille/confort éditorial (0-10).
// ─────────────────────────────────────────────────────────────────────────────

type Car = {
  id: string
  nom: string
  cat: 'A' | 'B' | 'C'
  body: string
  batt: number      // kWh
  wltp: number      // km
  hp: number
  atnNet: number    // €/mois imposable net
  atnGross: number  // €/mois brut (avant contribution upgrade)
  contrib: number   // contribution propre €/mois
  confort: number   // 0-10
  dcKw: number      // puissance DC crête (OpenEV Data / spec constructeur)
  vc?: '400v' | '800v'
}

const CARS: Car[] = [
  // ── CAT A ──
  { id: 'puma-gene', nom: 'Ford Puma Gen-E Premium', cat: 'A', body: 'SUV urbain', batt: 43.6, wltp: 404, hp: 169, atnNet: 140.83, atnGross: 140.83, contrib: 0, confort: 5.5, dcKw: 100 },
  { id: 'ev3-sr', nom: 'Kia EV3 Business (Standard Range)', cat: 'A', body: 'SUV compact', batt: 58.3, wltp: 429, hp: 204, atnNet: 140.83, atnGross: 140.83, contrib: 0, confort: 6.5, dcKw: 100 },
  { id: 'aceman', nom: 'Mini Aceman SE', cat: 'A', body: 'SUV urbain', batt: 49.2, wltp: 405, hp: 218, atnNet: 140.83, atnGross: 140.83, contrib: 0, confort: 5.5, dcKw: 95 },
  { id: 'mokka', nom: 'Opel Mokka Electric Edition (LR)', cat: 'A', body: 'SUV urbain', batt: 54, wltp: 408, hp: 156, atnNet: 140.83, atnGross: 140.83, contrib: 0, confort: 6.0, dcKw: 100 },
  { id: 'e308sw', nom: 'Peugeot e-308 SW GT', cat: 'A', body: 'Break', batt: 58, wltp: 440, hp: 156, atnNet: 140.83, atnGross: 140.83, contrib: 0, confort: 7.5, dcKw: 100 },
  { id: 'e2008', nom: 'Peugeot E-2008 Allure', cat: 'A', body: 'SUV urbain', batt: 54, wltp: 399, hp: 156, atnNet: 140.83, atnGross: 140.83, contrib: 0, confort: 6.0, dcKw: 100 },
  // ── CAT B ──
  { id: 'ix1', nom: 'BMW iX1 eDrive20 M Edition', cat: 'B', body: 'SUV premium', batt: 64.7, wltp: 516, hp: 204, atnNet: 143.36, atnGross: 143.36, contrib: 0, confort: 7.5, dcKw: 130 },
  { id: 'ev3-lr', nom: 'Kia EV3 Business Plus (Long Range)', cat: 'B', body: 'SUV compact', batt: 81.4, wltp: 605, hp: 204, atnNet: 140.83, atnGross: 140.83, contrib: 0, confort: 7.5, dcKw: 128 },
  { id: 'countryman', nom: 'Mini Countryman E', cat: 'B', body: 'SUV compact', batt: 66.5, wltp: 501, hp: 204, atnNet: 140.83, atnGross: 140.83, contrib: 0, confort: 6.5, dcKw: 130 },
  { id: 'e3008', nom: 'Peugeot e-3008 Long Range GT', cat: 'B', body: 'SUV familial', batt: 96, wltp: 700, hp: 230, atnNet: 172.00, atnGross: 172.00, contrib: 0, confort: 9.0, dcKw: 160 },
  { id: 'elroq', nom: 'Skoda Elroq 85 Corporate', cat: 'B', body: 'SUV compact', batt: 82, wltp: 568, hp: 286, atnNet: 140.83, atnGross: 140.83, contrib: 0, confort: 8.0, dcKw: 175 },
  { id: 'id3', nom: 'Volkswagen ID.3 Pro Performance', cat: 'B', body: 'Compacte', batt: 58, wltp: 432, hp: 204, atnNet: 140.83, atnGross: 140.83, contrib: 0, confort: 6.0, dcKw: 135 },
  { id: 'capri', nom: 'Ford Capri Select Ext. Range RWD', cat: 'B', body: 'SUV coupé', batt: 77, wltp: 627, hp: 286, atnNet: 146.31, atnGross: 146.31, contrib: 0, confort: 7.0, dcKw: 135 },
  { id: 'explorer', nom: 'Ford Explorer Select Ext. Range RWD', cat: 'B', body: 'SUV familial', batt: 77, wltp: 602, hp: 286, atnNet: 140.83, atnGross: 140.83, contrib: 0, confort: 8.5, dcKw: 150 },
  { id: 'ex30', nom: 'Volvo EX30 Plus Ext. Range', cat: 'B', body: 'SUV urbain', batt: 65, wltp: 475, hp: 272, atnNet: 140.96, atnGross: 140.96, contrib: 0, confort: 5.5, dcKw: 153 },
  // ── CAT C ──
  { id: 'ix2', nom: 'BMW iX2 eDrive20 M Edition', cat: 'C', body: 'SUV coupé', batt: 64.8, wltp: 470, hp: 204, atnNet: 85.19, atnGross: 160.19, contrib: 75, confort: 7.0, dcKw: 130 },
  { id: 'ev6', nom: 'Kia EV6 Business Plus', cat: 'C', body: 'SUV', batt: 84, wltp: 582, hp: 229, atnNet: 85.98, atnGross: 160.98, contrib: 75, confort: 8.0, dcKw: 240, vc: '800v' },
  { id: 'glb', nom: 'Mercedes-Benz GLB 250+ Business Line', cat: 'C', body: 'SUV familial', batt: 85, wltp: 629, hp: 272, atnNet: 97.89, atnGross: 172.89, contrib: 75, confort: 9.0, dcKw: 100 },
  { id: 'grandland', nom: 'Opel Grandland GS', cat: 'C', body: 'SUV', batt: 82.2, wltp: 583, hp: 213, atnNet: 85.66, atnGross: 160.66, contrib: 75, confort: 7.5, dcKw: 160 },
  { id: 'enyaq', nom: 'Skoda Enyaq 85 Corporate', cat: 'C', body: 'SUV familial', batt: 77, wltp: 576, hp: 286, atnNet: 96.42, atnGross: 171.42, contrib: 75, confort: 9.0, dcKw: 175 },
  { id: 'id4', nom: 'Volkswagen ID.4 Pro Business', cat: 'C', body: 'SUV', batt: 77, wltp: 559, hp: 286, atnNet: 66.94, atnGross: 141.94, contrib: 75, confort: 8.5, dcKw: 135 },
  { id: 'cla', nom: 'Mercedes-Benz CLA 250+ Business Line', cat: 'C', body: 'Berline', batt: 85, wltp: 772, hp: 272, atnNet: 88.44, atnGross: 163.44, contrib: 75, confort: 7.0, dcKw: 200, vc: '800v' },
  { id: 'cla-sb', nom: 'Mercedes-Benz CLA Shooting Brake 250+', cat: 'C', body: 'Break', batt: 85, wltp: 747, hp: 272, atnNet: 91.86, atnGross: 166.86, contrib: 75, confort: 8.0, dcKw: 200, vc: '800v' },
  { id: 'ex40', nom: 'Volvo EX40 Plus Single Motor Ext. Range', cat: 'C', body: 'SUV', batt: 79, wltp: 575, hp: 252, atnNet: 87.25, atnGross: 162.25, contrib: 75, confort: 7.5, dcKw: 150 },
]

// ── Constantes ──
const SEASON = { ete: 0.88, annuel: 0.78, hiver: 0.68 } as const
const CREG = { fla: 0.3191, bxl: 0.3555, wal: 0.3637 } as const  // €/kWh, Q2 2026
const CARD = { ionity: 0.49, fastned: 0.54, chargemap: 0.72 } as const // €/kWh DC, BE 2026
const CARD_LABEL = { ionity: 'IONITY (Motion/Power)', fastned: 'Fastned (Gold)', chargemap: 'Chargemap Pass' } as const

type Season = keyof typeof SEASON
type Region = keyof typeof CREG
type CardKey = keyof typeof CARD
type Scenario = 'pv' | 'borne_atn' | 'borne' | 'public'

function realRange(c: Car, s: Season) { return Math.round(c.wltp * SEASON[s]) }
function consoReal(c: Car) { return (c.batt / c.wltp * 100) * 1.15 } // kWh/100 mixte réel
function rechargeYear(c: Car, sc: Scenario, region: Region, kmAn: number, card: CardKey) {
  const kwh = (kmAn / 100) * consoReal(c)
  const pub = CARD[card]
  if (sc === 'pv') return 0.8 * kwh * 0.06 + 0.2 * kwh * pub
  if (sc === 'borne_atn') return 0.2 * kwh * pub            // domicile remboursé (ATN/CREG)
  if (sc === 'borne') return 0.8 * kwh * CREG[region] + 0.2 * kwh * pub
  return kwh * pub                                          // 100% public
}

const fmt0 = (n: number) => Math.round(n).toLocaleString('fr-BE')
const fmt2 = (n: number) => n.toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const CSS = `
.cvs{--bg:var(--color-bg);--surface:var(--color-bg-card);--surface-2:var(--color-bg-alt);
 --text:var(--color-text);--text-soft:var(--color-text-soft);--text-faint:var(--color-text-muted);
 --line:var(--color-border);--accent:var(--color-primary);--accent-deep:var(--color-primary-dark);
 --accent-soft:rgba(239,108,26,.13);--green:#10b981;--green-soft:rgba(16,185,129,.12);
 --shadow:0 1px 3px rgba(16,24,43,.06),0 12px 30px -16px rgba(16,24,43,.2);
 color:var(--text);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased}
html[data-theme="dark"] .cvs{--shadow:0 1px 3px rgba(0,0,0,.4),0 16px 36px -16px rgba(0,0,0,.55)}
.cvs *{box-sizing:border-box;margin:0;padding:0}
.cvs .wrap{max-width:1180px;margin:0 auto;padding:24px 20px 80px}
.cvs .crumb{font-size:.82rem;color:var(--text-faint);margin-bottom:16px}
.cvs .crumb a{color:var(--text-soft);text-decoration:none}.cvs .crumb a:hover{color:var(--accent)}
.cvs .crumb span{margin:0 6px;opacity:.5}
.cvs .head{border-bottom:1px solid var(--line);padding-bottom:20px;margin-bottom:24px}
.cvs .chip{display:inline-flex;gap:6px;align-items:center;font-size:.72rem;font-weight:700;letter-spacing:.05em;
 text-transform:uppercase;padding:5px 11px;border-radius:999px;background:var(--accent-soft);color:var(--accent);margin-bottom:12px}
.cvs h1{font-size:clamp(1.7rem,3.6vw,2.4rem);font-weight:800;line-height:1.1;letter-spacing:-.02em;margin-bottom:.3em}
.cvs .lede{color:var(--text-soft);max-width:66ch;font-size:1rem}
.cvs .layout{display:grid;grid-template-columns:1fr;gap:24px}
@media(min-width:960px){.cvs .layout{grid-template-columns:320px 1fr;align-items:start}}
.cvs .panel{background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);
 padding:20px 20px 24px;position:sticky;top:14px}
.cvs .panel h2{font-size:1rem;font-weight:700;margin-bottom:4px}
.cvs .panel .sub{font-size:.82rem;color:var(--text-faint);margin-bottom:16px}
.cvs .field{margin-top:16px}
.cvs label.fl{display:block;font-weight:700;font-size:.84rem;margin-bottom:8px}
.cvs .seg{display:flex;flex-wrap:wrap;gap:6px}
.cvs .seg button{flex:1 1 auto;padding:8px 10px;border:1.3px solid var(--line);border-radius:9px;font:inherit;
 font-size:.82rem;font-weight:600;background:var(--surface-2);color:var(--text-soft);cursor:pointer;transition:.15s;white-space:nowrap}
.cvs .seg button.on{background:var(--accent-deep);border-color:var(--accent-deep);color:#fff}
.cvs input[type=range]{width:100%;accent-color:var(--accent)}
.cvs .rangeval{display:flex;justify-content:space-between;font-size:.78rem;color:var(--text-faint);margin-top:4px}
.cvs input[type=number],.cvs select{width:100%;font:inherit;color:var(--text);background:var(--surface-2);
 border:1.3px solid var(--line);border-radius:9px;padding:9px 11px}
.cvs input:focus,.cvs select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.cvs .reco{background:linear-gradient(135deg,var(--accent-deep),#b85016);color:#fff;border-radius:16px;padding:18px 22px;margin-bottom:20px}
.cvs .reco .rl{font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;opacity:.9;font-weight:700}
.cvs .reco .rn{font-size:1.5rem;font-weight:800;margin:4px 0 6px;line-height:1.1}
.cvs .reco .rd{font-size:.9rem;opacity:.95;line-height:1.5}
.cvs .reco .rcard{margin-top:10px;font-size:.82rem;background:rgba(255,255,255,.16);padding:7px 12px;border-radius:8px;display:inline-block}
.cvs .toolbar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;justify-content:space-between;margin-bottom:14px}
.cvs .count{font-size:.85rem;color:var(--text-faint)}
.cvs .sortsel{display:flex;gap:6px;flex-wrap:wrap}
.cvs .sortsel button{padding:6px 11px;border:1.2px solid var(--line);border-radius:8px;font:inherit;font-size:.8rem;
 font-weight:600;background:var(--surface);color:var(--text-soft);cursor:pointer}
.cvs .sortsel button.on{background:var(--accent-soft);color:var(--accent);border-color:transparent}
.cvs .list{display:flex;flex-direction:column;gap:12px}
.cvs .vc{background:var(--surface);border:1px solid var(--line);border-radius:14px;box-shadow:var(--shadow);
 padding:16px 18px;display:grid;grid-template-columns:34px 1fr;gap:14px;align-items:start}
.cvs .vc.win{border-color:var(--accent);box-shadow:0 0 0 2px var(--accent-soft),var(--shadow)}
.cvs .rk{font-size:1.1rem;font-weight:800;color:var(--text-faint);text-align:center;padding-top:2px}
.cvs .vc.win .rk{color:var(--accent)}
.cvs .vtop{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline;justify-content:space-between}
.cvs .vname{font-weight:700;font-size:1.02rem}
.cvs .catb{font-size:.68rem;font-weight:800;padding:3px 8px;border-radius:6px;background:var(--surface-2);color:var(--text-soft);letter-spacing:.04em}
.cvs .vmeta{font-size:.82rem;color:var(--text-faint);margin-top:2px}
.cvs .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:12px}
@media(max-width:520px){.cvs .stats{grid-template-columns:repeat(2,1fr)}}
.cvs .st{background:var(--surface-2);border-radius:9px;padding:8px 10px}
.cvs .st .k{font-size:.68rem;text-transform:uppercase;letter-spacing:.04em;color:var(--text-faint);font-weight:700}
.cvs .st .v{font-size:1.02rem;font-weight:800;font-variant-numeric:tabular-nums;margin-top:1px}
.cvs .st .x{font-size:.7rem;color:var(--text-faint)}
.cvs .bar{height:6px;border-radius:999px;background:var(--surface-2);overflow:hidden;margin-top:10px}
.cvs .bar i{display:block;height:100%;background:var(--accent);border-radius:999px}
.cvs .scoreline{display:flex;justify-content:space-between;font-size:.74rem;color:var(--text-faint);margin-top:5px;font-weight:600}
.cvs .foot{margin-top:26px;font-size:.76rem;color:var(--text-faint);line-height:1.5;border-top:1px solid var(--line);padding-top:16px}
.cvs .srcs{margin-top:22px;background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:18px 20px}
.cvs .srcs h3{font-size:.95rem;font-weight:800;margin-bottom:4px}
.cvs .srcs p{font-size:.82rem;color:var(--text-faint);margin-bottom:12px}
.cvs .srcs .grp{font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text-faint);font-weight:700;margin:10px 0 6px}
.cvs .srcs ul{list-style:none;display:grid;grid-template-columns:1fr;gap:6px}
@media(min-width:640px){.cvs .srcs ul{grid-template-columns:1fr 1fr}}
.cvs .srcs li{font-size:.86rem}
.cvs .srcs a{color:var(--accent);text-decoration:none;font-weight:600}
.cvs .srcs a:hover{text-decoration:underline}
.cvs .srcs a .ext{font-size:.7rem;opacity:.6;font-weight:400}
.cvs .disc{margin-top:18px;background:var(--surface-2);border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:0 12px 12px 0;padding:16px 18px}
.cvs .disc h3{font-size:.92rem;font-weight:800;margin-bottom:6px}
.cvs .disc h4{font-size:.74rem;text-transform:uppercase;letter-spacing:.05em;color:var(--text-faint);font-weight:700;margin:12px 0 5px}
.cvs .disc ul{margin:0 0 0 18px;display:flex;flex-direction:column;gap:5px}
.cvs .disc li{font-size:.8rem;color:var(--text-soft);line-height:1.45}
`

// ── Gate strings ──
const G = {
  title: 'Comparateur réservé aux membres',
  desc: 'Connectez-vous gratuitement pour accéder au comparateur de voitures de société (autonomie réelle, ATN, coût de recharge).',
  cta: 'Accéder à mon espace',
  back: '← Retour aux outils',
}

export default function ComparateurVoitureSociete() {
  const { isReady, isBootstrapped, userId } = useUserContext()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const [cat, setCat] = useState<'all' | 'A' | 'B' | 'C'>('all')
  const [wAuto, setWAuto] = useState(55)
  const [season, setSeason] = useState<Season>('annuel')
  const [scenario, setScenario] = useState<Scenario>('borne_atn')
  const [region, setRegion] = useState<Region>('fla')
  const [kmAn, setKmAn] = useState(30000)
  const [card, setCard] = useState<CardKey>('ionity')
  const [sort, setSort] = useState<'score' | 'auto' | 'cost' | 'atn'>('score')

  const ranked = useMemo(() => {
    const pool = CARS.filter((c) => cat === 'all' || c.cat === cat)
    const ranges = pool.map((c) => realRange(c, season))
    const rmin = Math.min(...ranges), rmax = Math.max(...ranges)
    const span = rmax - rmin || 1
    const wa = wAuto / 100
    const rows = pool.map((c) => {
      const rng = realRange(c, season)
      const sAuto = ((rng - rmin) / span) * 10
      const score = wa * sAuto + (1 - wa) * c.confort
      return {
        c,
        rng,
        ete: realRange(c, 'ete'),
        hiver: realRange(c, 'hiver'),
        cost: rechargeYear(c, scenario, region, kmAn, card),
        atnY: c.atnNet * 12,
        score,
      }
    })
    rows.sort((a, b) => {
      if (sort === 'auto') return b.rng - a.rng
      if (sort === 'cost') return a.cost - b.cost
      if (sort === 'atn') return a.c.atnNet - b.c.atnNet
      return b.score - a.score
    })
    return rows
  }, [cat, wAuto, season, scenario, region, kmAn, card, sort])

  const best = useMemo(() => {
    const pool = CARS.filter((c) => cat === 'all' || c.cat === cat)
    const ranges = pool.map((c) => realRange(c, season))
    const rmin = Math.min(...ranges), rmax = Math.max(...ranges)
    const span = rmax - rmin || 1
    const wa = wAuto / 100
    let top = pool[0], bestScore = -1
    for (const c of pool) {
      const sc = wa * (((realRange(c, season) - rmin) / span) * 10) + (1 - wa) * c.confort
      if (sc > bestScore) { bestScore = sc; top = c }
    }
    return top
  }, [cat, wAuto, season])

  // ── États de gate ──
  if (!mounted || !isReady) return <div style={{ minHeight: '60vh' }} />
  if (!isBootstrapped) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid var(--color-border)', borderTopColor: 'var(--color-primary)', animation: 'spin .7s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }
  if (!userId) {
    return (
      <section style={{ maxWidth: 560, margin: '0 auto', padding: '64px 22px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.6rem', marginBottom: 14 }}>🔒</div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 12 }}>{G.title}</h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 26 }}>{G.desc}</p>
        <Link href={`/espace-membres?next=${encodeURIComponent(pathname)}`} style={{ display: 'inline-block', background: 'var(--color-primary)', color: '#fff', fontWeight: 700, padding: '12px 26px', borderRadius: 10, textDecoration: 'none' }}>{G.cta}</Link>
        <div style={{ marginTop: 18 }}>
          <Link href="/outils" style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>{G.back}</Link>
        </div>
      </section>
    )
  }

  const bestRange = realRange(best, season)
  const recoCard = 'ionity' as CardKey // la moins chère au kWh

  return (
    <div className="cvs">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="wrap">
        <nav className="crumb"><Link href="/">Accueil</Link><span>›</span><Link href="/outils">Outils</Link><span>›</span>Comparateur voiture de société</nav>

        <header className="head">
          <span className="chip">🇧🇪 Voiture de société · Belgique</span>
          <h1>Comparateur de voitures de société — autonomie, confort & coût de recharge</h1>
          <p className="lede">Classe les véhicules de la Carlist (catégories A, B et C) selon <b>tes priorités</b> : autonomie réelle (été/hiver), confort familial, ATN mensuel et coût de recharge réel selon ton installation domicile.</p>
        </header>

        <div className="layout">
          {/* ── Panneau de réglages ── */}
          <aside className="panel">
            <h2>Tes critères</h2>
            <div className="sub">Ajuste, le classement se met à jour en direct.</div>

            <div className="field">
              <label className="fl">Catégorie ATN</label>
              <div className="seg">
                {(['all', 'A', 'B', 'C'] as const).map((k) => (
                  <button key={k} className={cat === k ? 'on' : ''} onClick={() => setCat(k)}>{k === 'all' ? 'Toutes' : 'Cat. ' + k}</button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="fl">Priorité : autonomie ↔ confort</label>
              <input type="range" min={0} max={100} step={5} value={wAuto} onChange={(e) => setWAuto(+e.target.value)} />
              <div className="rangeval"><span>Confort {100 - wAuto}%</span><span>Autonomie {wAuto}%</span></div>
            </div>

            <div className="field">
              <label className="fl">Saison (autonomie affichée)</label>
              <div className="seg">
                {([['ete', 'Été'], ['annuel', 'Annuel'], ['hiver', 'Hiver']] as const).map(([k, l]) => (
                  <button key={k} className={season === k ? 'on' : ''} onClick={() => setSeason(k as Season)}>{l}</button>
                ))}
              </div>
            </div>

            <div className="field">
              <label className="fl">Recharge à domicile</label>
              <div className="seg" style={{ flexDirection: 'column' }}>
                {([['pv', 'PV + borne (solaire)'], ['borne_atn', 'Borne + ATN remboursé'], ['borne', 'Borne réseau (sans ATN)'], ['public', '100% recharge publique']] as const).map(([k, l]) => (
                  <button key={k} className={scenario === k ? 'on' : ''} onClick={() => setScenario(k as Scenario)}>{l}</button>
                ))}
              </div>
            </div>

            {scenario === 'borne' && (
              <div className="field">
                <label className="fl">Région (barème CREG)</label>
                <select value={region} onChange={(e) => setRegion(e.target.value as Region)}>
                  <option value="fla">Flandre — 31,91 c€/kWh</option>
                  <option value="bxl">Bruxelles — 35,55 c€/kWh</option>
                  <option value="wal">Wallonie — 36,37 c€/kWh</option>
                </select>
              </div>
            )}

            <div className="field">
              <label className="fl">Carte de recharge (part publique)</label>
              <select value={card} onChange={(e) => setCard(e.target.value as CardKey)}>
                <option value="ionity">IONITY — 0,49 €/kWh</option>
                <option value="fastned">Fastned (Gold) — 0,54 €/kWh</option>
                <option value="chargemap">Chargemap Pass — ~0,72 €/kWh</option>
              </select>
            </div>

            <div className="field">
              <label className="fl">Kilométrage annuel</label>
              <input type="number" min={5000} max={80000} step={1000} value={kmAn} onChange={(e) => setKmAn(Math.max(0, +e.target.value))} />
            </div>
          </aside>

          {/* ── Résultats ── */}
          <main>
            <div className="reco">
              <div className="rl">★ Recommandation selon tes critères</div>
              <div className="rn">{best.nom}</div>
              <div className="rd">Autonomie {season === 'ete' ? 'estivale' : season === 'hiver' ? 'hivernale' : 'annuelle'} ~{fmt0(bestRange)} km · confort {best.confort.toFixed(1)}/10 · ATN {fmt2(best.atnNet)} €/mois · catégorie {best.cat}.</div>
              <div className="rcard">Pour les longs trajets, carte la moins chère au kWh : <b>{CARD_LABEL[recoCard]}</b> (vise une couverture Benelux + FR + DE).</div>
            </div>

            <div className="toolbar">
              <div className="count">{ranked.length} véhicule{ranked.length > 1 ? 's' : ''}</div>
              <div className="sortsel">
                {([['score', 'Score'], ['auto', 'Autonomie'], ['cost', 'Coût recharge'], ['atn', 'ATN']] as const).map(([k, l]) => (
                  <button key={k} className={sort === k ? 'on' : ''} onClick={() => setSort(k as typeof sort)}>{l}</button>
                ))}
              </div>
            </div>

            <div className="list">
              {ranked.map((r, i) => (
                <article key={r.c.id} className={'vc' + (i === 0 && sort === 'score' ? ' win' : '')}>
                  <div className="rk">{i + 1}</div>
                  <div>
                    <div className="vtop">
                      <div>
                        <span className="vname">{r.c.nom}</span>
                        <div className="vmeta">{r.c.body} · {r.c.batt} kWh · {r.c.hp} ch · {r.c.wltp} km WLTP</div>
                      </div>
                      <span className="catb">CAT {r.c.cat}</span>
                    </div>
                    <div className="stats">
                      <div className="st"><div className="k">Autonomie {season}</div><div className="v">{fmt0(r.rng)} km</div><div className="x">été {r.ete} · hiver {r.hiver}</div></div>
                      <div className="st"><div className="k">Confort</div><div className="v">{r.c.confort.toFixed(1)}<span className="x"> /10</span></div></div>
                      <div className="st"><div className="k">ATN / mois</div><div className="v">{fmt2(r.c.atnNet)} €</div>{r.c.contrib > 0 && <div className="x">après −{r.c.contrib} € contrib.</div>}</div>
                      <div className="st"><div className="k">Recharge / an</div><div className="v">{fmt0(r.cost)} €</div><div className="x">{kmAn.toLocaleString('fr-BE')} km</div></div>
                      <div className="st"><div className="k">Recharge 10→80%</div><div className="v">~{chargeTimeMin({ battKwhNet: r.c.batt, dcPeakKw: r.c.dcKw, voltageClass: r.c.vc, stationKw: 150 }, 10, 80)} min</div><div className="x">{r.c.dcKw} kW DC{r.c.vc === '800v' ? ' · 800V' : ''}</div></div>
                    </div>
                    <div className="bar"><i style={{ width: Math.max(4, Math.min(100, r.score * 10)) + '%' }} /></div>
                    <div className="scoreline"><span>Score pondéré</span><span>{r.score.toFixed(2)} / 10</span></div>
                  </div>
                </article>
              ))}
            </div>

            <p className="foot">
              Méthodologie Moteurs.com. Autonomie réelle estimée : été = WLTP ×0,88 · annuel ×0,78 · hiver ×0,68. Consommation réelle mixte ≈ batterie/WLTP ×1,15. Puissance DC : OpenEV Data / specs constructeur ; temps de recharge 10→80 % estimé (modèle paramétrique, borne 150 kW).
              Coût de recharge sur la base du kilométrage saisi, 80% domicile / 20% public (sauf « 100% public »). Barème CREG Q2 2026. Tarifs cartes IONITY/Fastned/Chargemap relevés en juin 2026, indicatifs.
              ATN = montant imposable mensuel issu de la Carlist Bedrijfswagen (catégories A/B/C) ; pour la catégorie C, montant net après contribution propre « upgrade ». Données indicatives, à vérifier dans ta car policy.
            </p>

            <section className="srcs">
              <h3>Sources &amp; méthode</h3>
              <p>Les chiffres de ce comparateur sont étayés par nos outils dédiés et par les barèmes officiels.</p>

              <div className="grp">Nos outils &amp; guides (Moteurs.com)</div>
              <ul>
                <li><Link href="/outils/recharge-domicile-voiture-societe-belgique">Calculateur ATN « recharge à domicile » (BE)</Link> — barème CREG, circ. 2024/C/77</li>
                <li><Link href="/outils/cartes-recharge">Comparateur de cartes de recharge</Link> — tarifs €/kWh par carte et pays</li>
                <li><Link href="/recharge-electrique">Guide recharge électrique</Link> — AC/DC, bornes, autonomie</li>
                <li><Link href="/cout-voiture">Guide coût d'une voiture (TCO)</Link> — méthode de calcul</li>
                <li><Link href="/comparer-trajet">Comparateur de trajet</Link> — autonomie réelle &amp; arrêts recharge</li>
                <li><Link href="/outils/simulateur-borne-recharge">Simulateur de borne à domicile</Link> — coût d'installation</li>
              </ul>

              <div className="grp">Sources officielles</div>
              <ul>
                <li><a href="https://www.creg.be/fr/consommateurs/prix-et-tarifs/tarif-creg-pour-le-remboursement-de-la-recharge-domicile-des" target="_blank" rel="noopener noreferrer">CREG — barème remboursement recharge domicile <span className="ext">↗</span></a></li>
                <li><a href="https://www.ionity.eu/subscriptions" target="_blank" rel="noopener noreferrer">IONITY — abonnements &amp; tarifs <span className="ext">↗</span></a></li>
                <li><a href="https://www.fastnedcharging.com/fr/tarifs" target="_blank" rel="noopener noreferrer">Fastned — tarifs <span className="ext">↗</span></a></li>
                <li><a href="https://chargemap.com/fr/price" target="_blank" rel="noopener noreferrer">Chargemap — tarifs Pass <span className="ext">↗</span></a></li>
              </ul>
            </section>

            <section className="disc">
              <h3>⚠️ Limites de l'outil &amp; responsabilité</h3>

              <h4>Limites de l'outil</h4>
              <ul>
                <li>Les résultats sont des <b>estimations indicatives</b>, pas des valeurs contractuelles ni garanties.</li>
                <li>Les autonomies reposent sur le cycle <b>WLTP corrigé</b> (été ×0,88 · annuel ×0,78 · hiver ×0,68) : l'autonomie réelle dépend de la vitesse, du relief, de la météo, du chargement, du style de conduite et de l'état de la batterie.</li>
                <li>Les coûts de recharge reposent sur des <b>hypothèses</b> (mix 80 % domicile / 20 % public, consommation = batterie/WLTP ×1,15, kilométrage saisi) ; vos coûts réels peuvent différer.</li>
                <li>Les tarifs des cartes (IONITY, Fastned, Chargemap) et le <b>barème CREG</b> ont été relevés en juin 2026 et <b>évoluent</b> dans le temps.</li>
                <li>L'<b>indice de confort</b> est une appréciation éditoriale subjective, pas une mesure normalisée.</li>
                <li>Les montants <b>ATN</b> proviennent de la Carlist fournie (catégories A/B/C) ; le calcul fiscal réel (ATN voiture, ATN recharge domicile, contribution propre) dépend de votre situation, de votre car policy et de l'administration.</li>
                <li>Liste <b>non exhaustive</b> : d'autres modèles, options, configurations et conditions de leasing ne sont pas couverts.</li>
              </ul>

              <h4>Responsabilité — Moteurs.com</h4>
              <ul>
                <li>Cet outil est fourni à titre <b>informatif</b> et d'aide à la décision. Il ne constitue pas un <b>conseil fiscal, juridique, financier ou d'achat personnalisé</b>.</li>
                <li>Il ne remplace pas l'avis d'un <b>expert-comptable / conseiller fiscal</b>, ni les informations de votre <b>employeur ou société de leasing</b>, ni les documents officiels (Carlist, car policy, circulaires, barèmes CREG).</li>
                <li>Moteurs.com met à jour ses données avec soin mais ne <b>garantit pas</b> leur exactitude, leur exhaustivité ou leur actualité, et <b>décline toute responsabilité</b> quant aux décisions prises sur la base de cet outil.</li>
                <li>Vérifiez toujours les chiffres clés auprès des <b>sources officielles</b> et de votre employeur avant tout engagement.</li>
              </ul>
            </section>
          </main>
        </div>
      </div>
    </div>
  )
}
