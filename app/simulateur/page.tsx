'use client'

import { useEffect } from 'react'

export default function SimulateurPage() {
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

  return (
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
<label for="pct_hiver">Roulage hivernal : <span id="pct_hiver_val">25 %</span></label>
<input id="pct_hiver" max="100" min="0" step="5" style="width:100%;" type="range" value="25"/>
</div>
<div class="form-group">
<label for="taux_recharge_phev">Taux de recharge PHEV : <span id="taux_recharge_phev_val">50 %</span></label>
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
          💡 <strong>Astuce :</strong> changez le pays dans le menu Pays ci-dessus pour adapter automatiquement les aides, la TVA et les prix de l'énergie.
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
<strong>Disclaimer —</strong> Ce simulateur produit une estimation indicative basée sur des moyennes 2026. Les montants réels (achat, aides, énergie, entretien) varient selon l'opérateur, le concessionnaire et votre éligibilité. Vérifiez votre situation auprès d'un professionnel avant tout engage