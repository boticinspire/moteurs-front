/**
 * GET /api/tarifs-recharge?pays=FR
 * Tarifs des cartes de recharge (vue Supabase v_tarifs_complet) pour un pays.
 * Sert la section « coût d'un plein » des fiches modèle. Cache 1h.
 */
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const revalidate = 3600

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const pays = (searchParams.get('pays') || 'FR').toUpperCase()
    const { data, error } = await supabase
      .from('v_tarifs_complet')
      .select('carte_id,carte_nom,operateur,pays_iso,devise,plan_principal_kwh,dc_rapide_kwh,dc_ultra_kwh,ac_slow_kwh,abo_mensuel')
      .eq('pays_iso', pays)
    if (error) throw error
    return NextResponse.json({ pays, tarifs: data ?? [] })
  } catch (e) {
    console.error('[API tarifs-recharge]', e)
    return NextResponse.json({ pays: 'FR', tarifs: [] })
  }
}
