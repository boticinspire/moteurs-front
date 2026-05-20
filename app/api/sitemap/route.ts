/**
 * DEPRECATED — Ce fichier est conservé pour compatibilité éventuelle
 * mais le sitemap canonique est généré nativement par app/sitemap.ts → /sitemap.xml
 * Ne pas ajouter de contenu ici pour éviter la duplication.
 */
import { redirect } from 'next/navigation'

export async function GET() {
  return redirect('/sitemap.xml')
}
