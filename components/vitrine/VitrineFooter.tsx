import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import s from './vitrine.module.css'

export default function VitrineFooter() {
  const t = useTranslations('Vitrine')
  const year = new Date().getFullYear()

  return (
    <footer className={s.footer}>
      <div className={s.footerInner}>
        <div>
          <div className={s.footerBrand}>Moteurs<span className={s.logoAccent}>.com</span></div>
          <p className={s.footerText}>{t('footer_tagline')}</p>
          <p className={s.footerText}>{t('patent_line')}</p>
        </div>
        <div>
          <h3 className={s.footerH}>{t('footer_products')}</h3>
          <ul className={s.footerList}>
            <li><a href="#produit">{t('nav_product')}</a></li>
            <li><a href="#tailles">{t('nav_sizes')}</a></li>
            <li><a href="#devis">{t('cta_quote')}</a></li>
            <li><span className={s.muted}>{t('footer_soon')}</span></li>
          </ul>
        </div>
        <div>
          <h3 className={s.footerH}>{t('footer_media_title')}</h3>
          <p className={s.footerText}>{t('footer_media_text')}</p>
          <Link href="/media" className={s.footerMediaLink}>{t('footer_media_link')} →</Link>
        </div>
        <div>
          <h3 className={s.footerH}>{t('footer_contact')}</h3>
          <ul className={s.footerList}>
            <li><a href="mailto:info@moteurs.com">info@moteurs.com</a></li>
            <li>{t('footer_location')}</li>
            <li><Link href="/mentions-legales">{t('footer_legal')}</Link></li>
            <li><Link href="/cgu">{t('footer_terms')}</Link></li>
          </ul>
        </div>
      </div>
      <div className={s.footerBottom}>
        © {year} Moteurs.com — <a href="https://botic.be" className={s.footerBotic}>{t('footer_company')}</a> — {t('footer_rights')}
      </div>
    </footer>
  )
}
