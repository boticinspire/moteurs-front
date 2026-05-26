import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'

export default function Footer() {
  const t = useTranslations('Footer')
  const tc = useTranslations('Common')

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="logo" style={{ color: 'white', marginBottom: 12 }}>
              <span className="logo-dot" /><span>Moteurs<span style={{ color: '#7af0c2' }}>.com</span></span>
            </div>
            <p style={{ color: '#b8c5d6', fontSize: '0.88rem' }}>
              {t('tagline')}
            </p>
          </div>
          <div>
            <h4>{t('section_spaces')}</h4>
            <ul>
              <li><Link href="/b2b">{t('link_b2b')}</Link></li>
              <li><Link href="/particulier">{t('link_particulier')}</Link></li>
              <li><Link href="/articles">{t('link_articles')}</Link></li>
              <li><Link href="/assistance">{t('link_assistance')}</Link></li>
              <li><Link href="/assistant-vacances">{t('link_assistant_vacances')}</Link></li>
              <li><Link href="/comparer-trajet">{t('link_comparer_trajet')}</Link></li>
              <li><Link href="/recharge-electrique">{t('link_recharge')}</Link></li>
              <li><Link href="/trajet">{t('link_trajet')}</Link></li>
              <li><Link href="/vacances-voiture">{t('link_vacances')}</Link></li>
              <li><Link href="/cout-voiture">{t('link_cout_voiture')}</Link></li>
              <li><Link href="/depannage">{t('link_depannage')}</Link></li>
              <li><Link href="/documents-auto">{t('link_documents')}</Link></li>
              <li><Link href="/outils">{t('link_outils')}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t('section_countries')}</h4>
            <ul>
              <li><Link href={{ pathname: '/articles', query: { pays: 'FR' } }}>{tc('country_fr')}</Link></li>
              <li><Link href={{ pathname: '/articles', query: { pays: 'BE' } }}>{tc('country_be')}</Link></li>
              <li><Link href={{ pathname: '/articles', query: { pays: 'CH' } }}>{tc('country_ch')}</Link></li>
              <li><Link href={{ pathname: '/articles', query: { pays: 'CA' } }}>{tc('country_ca')}</Link></li>
              <li><Link href={{ pathname: '/articles', query: { pays: 'LU' } }}>{tc('country_lu')}</Link></li>
            </ul>
          </div>
          <div>
            <h4>{t('section_legal')}</h4>
            <ul>
              <li><Link href="/mentions-legales">{t('link_mentions')}</Link></li>
              <li><Link href="/a-propos">{t('link_about')}</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>{t('copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
