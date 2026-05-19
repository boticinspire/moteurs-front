'use client'

import { useEffect } from 'react'
import FaqAccordion from '@/components/FaqAccordion'
import { useUserContext } from '@/context/UserContextProvider'

const FAQ_SIMULATEUR = [
  {
    question: "Qu'est-ce que le TCO (coût total de possession) ?",
    answer:
      "Le TCO (Total Cost of Ownership) est le coût réel d'un véhicule sur toute sa durée d'utilisation : prix d'achat net des aides, carburant ou électricité, entretien, assurance et fiscalité. Contrairement au simple prix d'achat, le TCO permet de comparer objectivement toutes les motorisations sur la même base.",
  },
  {
    question: "Quelle motorisation est la moins chère sur 4 ans en France ?",
    answer:
      "Pour un fourgon moyen B2B roulant 25 000 km/an en France, le véhicule électrique est généralement le moins coûteux sur 4 ans grâce aux aides (bonus écologique, aides régionales) et au faible coût d'énergie. Le GNV arrive souvent en deuxième position pour les gros kilométrages. Le diesel reste compétitif pour les flottes qui chargent peu ou roulent principalement sur autoroute. Modifiez les paramètres dans le simulateur pour obtenir le résultat propre à votre situation.",
  },
  {
    question: "Les aides gouvernementales sont-elles incluses dans le calcul ?",
    answer:
      "Oui. Le simulateur intègre les principales aides 2026 pour la France (bonus écologique, malus au poids), la Belgique (déductibilité à 100 % pour les BEV), la Suisse (exonérations cantonales) et le Canada (programme iZEV fédéral). Les aides sont appliquées automatiquement selon le pays et le segment sélectionnés. Vérifiez toujours votre éligibilité auprès d'un professionnel avant tout engagement.",
  },
  {
    question: "Comment modifier le prix d'achat dans le simulateur ?",
    answer:
      "Dans la colonne gauche, la section « Prix d'achat réel » vous permet de saisir le prix après remise concessionnaire pour chaque motorisation. Vous pouvez aussi appliquer une remise globale uniforme (en euros) qui s'ajoute aux prix individuels. Si vous laissez les champs vides, le simulateur utilise les prix catalogue de référence 2026.",
  },
  {
    question: "Le simulateur fonctionne-t-il pour la Belgique, la Suisse et le Canada ?",
    answer:
      "Oui. Sélectionnez le pays dans le menu déroulant : les prix de l'énergie, les aides fiscales et la TVA s'adaptent automatiquement. Les données sont mises à jour régulièrement par l'Agent Simulateur de Moteurs.com à partir des sources officielles (DGEC, Commission Européenne).",
  },
  {
    question: "Que signifie « profil de conduite » et pourquoi est-ce important ?",
    answer:
      "Le profil de conduite (urbain, mixte, route, autoroute) influence directement les consommations. Un véhicule électrique consomme beaucoup moins en ville qu'en autoroute, alors que c'est l'inverse pour le diesel. Pour les VUL, le profil « mixte » est le plus représentatif d'un usage livraison classique. Ajustez selon votre réalité terrain pour obtenir l'estimation la plus précise.",
  },
]

export default function SimulateurPage() {
  const { context, isReady } = useUserContext()

  useEffect(() => {
    // Charger simulateur.js depuis les assets statiques
    const script = document.createElement('script')
    script.src = '/simulateur.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script)
    }
  }, [])

  // Pré-remplir le pays depuis le contexte utilisateur
  useEffect(() => {
    if (!isReady) return
    const timer = setTimeout(() => {
      const paysCtx = context.preferences?.pays
      if (paysCtx) {
        const selectPays = document.getElementById('pays') as HTMLSelectElement | null
        if (selectPays && selectPays.value !== paysCtx) {
          selectPays.value = paysCtx
          selectPays.dispatchEvent(new Event('change', { bubbles: true }))
        }
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [isReady, context.preferences?.pays])

  return (
    <>
    <div dangerouslySetInnerHTML={{ __html: `<section class="page-hero">
<div class="container">
<h1>Simulateur TCO Moteurs.com</h1>
<p>Calculez le coût total de possession (achat + énergie + entretien + aides) sur 6 motorisations. Tous les paramètres sont modifiables, toutes les hypothèses sont affichées.</p>
</div>
</section>
<section style="padding: 8px 0 80px;">
<div class="container">
<div class="simulator-grid">
<!-- ===== Panneau gauche : contrôles ===== -->
<aside class="simulator-controls">
<h3>Profil</h3>
<div class="toggle-group" data-group="profil" style="margin-bottom:18px;">
<button class="active" data-value="B2B">B2B</button>
<button data-value="Particulier">Particulier</button>
</div>
<div class="form-group">
<label for="pays">Pays</label>
<select id="pays">
<option value="FR">France</option>
<option value="BE">Belgique</option>
<option value="CH">Suisse</option>
<option value="CA">Canada</option>
</select>
</div>
<div class="form-group">
<label for="segment">Segment</label>
<select id="segment">
<option value="vul_petit">Petit VUL</option>
<option selected="" value="vul_moyen">Fourgon moyen</option>
<option value="vul_grand">Grand fourgon</option>
<option value="camion">Camion 3,5–7,5 t</option>
<option value="poids_lourd">Poids-lourd</option>
</select>
</div>
<h3>Durée d'exploitation</h3>
<div class="toggle-group" data-group="duree" style="margin-bottom:18px;">
<button data-value="36">36 mois</button>
<button class="active" data-value="48">48 mois</button>
<button data-value="60">60 mois</button>
</div>
<div class="form-group">
<label for="km_an">Kilométrage annuel</label>
<input id="km_an" min="1000" step="1000" type="number" value="25000"/>
</div>
<h3>Profil d'usage</h3>
<div class="form-group">
<label for="profil_conduite">Profil de conduite</label>
<select id="profil_conduite">
<option value="urbain">Urbain pur</option>
<option selected="" value="mixte">Mixte (référence)</option>
<option value="route">Route</option>
<option value="autoroute">Autoroute</option>
</select>
</div>
<div class="form-group">
<label for="charge">Charge utile</label>
<select id="charge">
<option value="vide">Vide (&lt; 20 %)</option>
<option selected="" value="standard">Standard (50 %)</option>
<option value="pleine">Pleine (&gt; 80 %)</option>
</select>
</div>
<div class="form-group">
<label for="pct_hiver">Roulage hivernal : <span id="pct_hiver_val">25 %</span></label>
<input id="pct_hiver" max="100" min="0" step="5" style="width:100%;" type="range" value="25"/>
</div>
<div class="form-group">
<label for="taux_recharge_phev">Taux de recharge PHEV : <span id="taux_recharge_phev_val">50 %</span></label>
<input id="taux_recharge_phev" max="100" min="0" step="5" style="width:100%;" type="range" value="50"/>
</div>
<h3>Prix d'achat réel</h3>
<p style="font-size:0.78rem; color:var(--color-text-soft); margin-bottom:12px;">Modifiez le prix réel après remise concessionnaire. Laissez vide pour utiliser le prix catalogue de référence.</p>
<div id="prix-customs"></div>
<div class="form-group" style="margin-top:14px;">
<label for="prix_remise">Remise globale uniforme (€)</label>
<input id="prix_remise" min="0" placeholder="0" step="500" type="number" value="0"/>
<span style="font-size:0.75rem; color:var(--color-text-soft);">Appliquée à toutes les motorisations en plus des prix individuels.</span>
</div>
<div style="margin-top:18px; font-size:0.78rem; color:var(--color-text-soft); padding:10px; background:var(--color-bg-alt); border-radius:6px;">
          💡 <strong>Astuce :</strong> changez le pays dans le menu Pays ci-dessus pour adapter automatiquement les aides, la TVA et les prix de l'énergie.
        </div>
</aside>
<!-- ===== Panneau droit : résultats ===== -->
<main class="simulator-results">
<div id="results-content">
<p style="color: var(--color-text-soft);">Calcul en cours…</p>
</div>
</main>
</div>
<div class="disclaimer" style="margin-top: 32px;">
<strong>Disclaimer —</strong> Ce simulateur produit une estimation indicative basée sur des moyennes 2026. Les montants réels (achat, aides, énergie, entretien) varient selon l'opérateur, le concessionnaire et votre éligibilité. Vérifiez votre situation auprès d'un professionnel avant tout engagement. Moteurs.com n'est pas conseiller financier.
</div>
</div>
</section>
` }} />
    <div className="container" style={{ paddingBottom: 80 }}>
      <FaqAccordion items={FAQ_SIMULATEUR} />
    </div>
    </>
  )
}
