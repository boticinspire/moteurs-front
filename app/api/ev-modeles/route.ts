/**
 * GET /api/ev-modeles?q=<recherche>&marche=eu&limit=50
 *
 * Catalogue véhicules électriques (table Supabase public.ev_modeles, source OpenEV Data).
 * Sert le sélecteur de modèle des calculateurs (axe A) et fournit les champs nécessaires
 * au modèle de charge paramétrique (axe B : dc_kw + voltage_class + batt).
 *
 * Params :
 *   q       recherche plein-texte sur marque/modèle (ilike)
 *   marche  'eu' (défaut) → marques pertinentes FR/BE/CH/CA ; 'all' → tout le catalogue
 *   limit   nb max de résultats (défaut 60, max 200)
 *
 * Lecture via clé anon (RLS : SELECT public sur actif=true). Cache 1h.
 */
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const revalidate = 3600

// Marques effectivement commercialisées (ou en cours) sur les marchés Moteurs.com.
const MARQUES_EU = new Set([
  'Audi', 'BMW', 'Mercedes-Benz', 'Volkswagen', 'Renault', 'Peugeot', 'Citroen', 'Citroën',
  'DS', 'DS Automobiles', 'Dacia', 'Tesla', 'Hyundai', 'Kia', 'Skoda', 'Škoda', 'Cupra',
  'SEAT', 'Seat', 'Volvo', 'Polestar', 'Opel', 'Fiat', 'Abarth', 'Alfa Romeo', 'Lancia',
  'Ford', 'Nissan', 'Toyota', 'Lexus', 'Honda', 'Mazda', 'Mini', 'MINI', 'Smart', 'Jeep',
  'Jaguar', 'Land Rover', 'Porsche', 'MG', 'Subaru', 'Mitsubishi', 'Suzuki', 'Maserati',
  'Genesis', 'Lotus', 'Alpine', 'Leapmotor', 'XPeng', 'NIO', 'BYD', 'Maxus', 'GWM', 'Ora',
])

export type EvModeleLite = {
  id: number
  slug: string
  make: string
  model: string
  trim: string | null
  year: number | null
  batt_kwh_net: number | null
  batt_kwh_gross: number | null
  wltp_km: number | null
  conso_wh_km: number | null
  dc_kw: number | null
  ac_kw: number | null
  ac_phases: number | null
  voltage_class: string | null
  seats: number | null
  drivetrain: string | null
  vehicle_type: string | null
}

const COLS =
  'id,slug,make,model,trim,year,batt_kwh_net,batt_kwh_gross,wltp_km,conso_wh_km,dc_kw,ac_kw,ac_phases,voltage_class,seats,drivetrain,vehicle_type'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = (searchParams.get('q') || '').trim()
    const marche = (searchParams.get('marche') || 'eu').toLowerCase()
    const limit = Math.min(parseInt(searchParams.get('limit') || '60', 10) || 60, 200)

    let query = supabase
      .from('ev_modeles')
      .select(COLS)
      .eq('actif', true)
      .order('make', { ascending: true })
      .order('model', { ascending: true })
      .order('year', { ascending: false })
      .limit(limit)

    if (q) query = query.or(`make.ilike.%${q}%,model.ilike.%${q}%`)

    const { data, error } = await query
    if (error) throw error

    let rows = (data || []) as EvModeleLite[]
    if (marche !== 'all') {
      rows = rows.filter((r) => MARQUES_EU.has(r.make))
    }

    return NextResponse.json({ nb: rows.length, modeles: rows })
  } catch (e) {
    console.error('[API ev-modeles] Erreur:', e)
    return NextResponse.json({ nb: 0, modeles: [] })
  }
}
