export default function B2BPage() {
  return (
    <div dangerouslySetInnerHTML={{ __html: `<section class="hero">
<div class="container">
<h1>Espace PME, artisans &amp; flottes :<br/><span class="accent">arbitrer sur le TCO réel.</span></h1>
<p class="lead">Du fourgon de l'artisan au poids-lourd du transporteur — diesel, électrique, PHEV, H2, e-fuel, bio-GNV. On vous donne les chiffres, vous décidez.</p>
<div class="hero-actions">
<a class="btn btn-primary btn-lg" href="/simulateur">Calculer mon TCO →</a>
<a class="btn btn-secondary btn-lg" href="#aides">Voir les aides 2026</a>
</div>
</div>
</section>
<!-- ===== SEGMENTS ===== -->
<section>
<div class="container">
<h2 class="section-title">Quel segment vous concerne ?</h2>
<p class="section-subtitle">Chaque segment a ses contraintes fiscales, ses aides, ses ZFE. Cliquez pour aller au plus proche de votre cas.</p>
<div class="cards-grid">
<a class="card" href="/simulateur?segment=vul_petit" style="text-decoration:none; color:inherit;">
<span class="tag">Petit VUL</span>
<h3>Petits utilitaires (&lt; 1 t charge utile)</h3>
<p>Kangoo, Berlingo, Combo, Partner — usage urbain, livraison du dernier km. Le segment le plus mature pour l'électrique.</p>
<div class="meta"><span class="confidence high">Données ÉLEVÉ</span></div>
</a>
<a class="card" href="/simulateur?segment=vul_moyen" style="text-decoration:none; color:inherit;">
<span class="tag">Fourgon moyen</span>
<h3>Fourgons moyens (1 à 1,5 t)</h3>
<p>Trafic, Vivaro, Transit Custom, Vito — artisans, BTP, services à domicile. Arbitrage diesel/élec serré sur 48 mois.</p>
<div class="meta"><span class="confidence high">Données ÉLEVÉ</span></div>
</a>
<a class="card" href="/simulateur?segment=vul_grand" style="text-decoration:none; color:inherit;">
<span class="tag">Grand fourgon</span>
<h3>Grands fourgons (&gt; 1,5 t)</h3>
<p>Master, Sprinter, Crafter, Boxer — messagerie, déménagement. L'électrique devient pertinent au-delà de 80 km/jour réguliers.</p>
<div class="meta"><span class="confidence high">Données ÉLEVÉ</span></div>
</a>
<a class="card" href="/simulateur?segment=camion" style="text-decoration:none; color:inherit;">
<span class="tag">Camion 3,5–7,5 t</span>
<h3>Camions légers (3,5–7,5 t)</h3>
<p>Distribution urbaine, BTP local. Bio-GNV et électrique en concurrence ; H2 émerge sur les flottes captives.</p>
<div class="meta"><span class="confidence medium">Données MOYEN</span></div>
</a>
<a class="card" href="/simulateur?segment=poids_lourd" style="text-decoration:none; color:inherit;">
<span class="tag">Poids-lourd</span>
<h3>Poids-lourds (&gt; 7,5 t)</h3>
<p>Tracteurs routiers, porteurs longue distance. H2 et bio-GNV pour le longue distance, électrique pour le hub-to-hub.</p>
<div class="meta"><span class="confidence medium">Données MOYEN</span></div>
</a>
</div>
</div>
</section>
<!-- ===== AIDES B2B ===== -->
<section class="section-alt" id="aides">
<div class="container">
<h2 class="section-title">Aides &amp; fiscalité B2B 2026</h2>
<p class="section-subtitle">Données triangulées avec les sources officielles. Vérifiez votre éligibilité avant tout engagement.</p>
<h3 style="font-size:1.25rem; margin-bottom:14px; color:var(--color-bg-dark);">🇫🇷 France</h3>
<div class="table-wrap">
<table>
<thead>
<tr>
<th>Dispositif</th>
<th>Plafond / Montant</th>
<th>Conditions</th>
<th>Confiance</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>CEE — VUL électrique</strong></td>
<td>2 000 € à 8 600 €</td>
<td>Selon segment et opérateur (TotalEnergies, Engie, EDF…)</td>
<td><span class="confidence high">ÉLEVÉ</span></td>
</tr>
<tr>
<td><strong>Suramortissement fiscal</strong></td>
<td>jusqu'à 30 000 € HT</td>
<td>VUL électrique, GNV, H2 — déduction du résultat imposable</td>
<td><span class="confidence high">ÉLEVÉ</span></td>
</tr>
<tr>
<td><strong>Exonération TVS</strong></td>
<td>100 % VE</td>
<td>Véhicules 100 % électriques exclusivement</td>
<td><span class="confidence high">ÉLEVÉ</span></td>
</tr>
<tr>
<td><strong>Prime à la conversion</strong></td>
<td>jusqu'à 5 000 €</td>
<td>Mise au rebut véhicule diesel ancien — conditions strictes</td>
<td><span class="confidence medium">MOYEN</span></td>
</tr>
<tr>
<td><strong>Aides ZFE métropoles</strong></td>
<td>Variable</td>
<td>IDF, Grand Paris, Lyon, Strasbourg, Toulouse… cumul possible</td>
<td><span class="confidence medium">MOYEN</span></td>
</tr>
</tbody>
</table>
</div>
<h3 style="font-size:1.25rem; margin:32px 0 14px; color:var(--color-bg-dark);">🇧🇪 Belgique</h3>
<div class="table-wrap">
<table>
<thead>
<tr>
<th>Dispositif</th>
<th>Plafond / Montant</th>
<th>Conditions</th>
<th>Confiance</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Déductibilité fiscale VE</strong></td>
<td>100 % (dégressive)</td>
<td>Régime fédéral — barème dégressif 2026-2028</td>
<td><span class="confidence high">ÉLEVÉ</span></td>
</tr>
<tr>
<td><strong>Prime BRUXELL'AIR</strong></td>
<td>Variable</td>
<td>Mise au rebut + acquisition VE — Région bruxelloise</td>
<td><span class="confidence medium">MOYEN</span></td>
</tr>
<tr>
<td><strong>Primes Wallonie</strong></td>
<td>Variable</td>
<td>energie.wallonie.be — TPE et indépendants prioritaires</td>
<td><span class="confidence medium">MOYEN</span></td>
</tr>
<tr>
<td><strong>Flanders Electric</strong></td>
<td>Variable</td>
<td>Aide flamande — entreprises en Flandre</td>
<td><span class="confidence medium">MOYEN</span></td>
</tr>
</tbody>
</table>
</div>
<h3 style="font-size:1.25rem; margin:32px 0 14px; color:var(--color-bg-dark);">🇨🇭 Suisse · 🇨🇦 Canada</h3>
<div class="cards-grid">
<div class="card">
<span class="tag">Suisse</span>
<h3>Pas de bonus fédéral — aides cantonales</h3>
<p>Vaud, Genève, Zurich et Berne ont chacun leur dispositif. Les montants varient fortement. Nous vous renvoyons systématiquement vers le site officiel du canton concerné.</p>
<div class="meta"><span class="confidence low">Vérifier au cas par cas</span></div>
</div>
<div class="card">
<span class="tag">Canada</span>
<h3>Roulez Vert (QC) + iZEV (fédéral)</h3>
<p>Au Québec, jusqu'à 7 000 CAD pour un VUL électrique via Roulez Vert. Cumul possible avec l'iZEV fédéral (jusqu'à 5 000 CAD). Ontario et BC ont leurs propres dispositifs.</p>
<div class="meta"><span class="confidence high">Confiance ÉLEVÉ</span></div>
</div>
</div>
</div>
</section>
<!-- ===== ALERTE PHEV ===== -->
<section>
<div class="container">
<div style="background:#fef3c7; border-left:4px solid #d97706; padding:24px 28px; border-radius:8px;">
<h3 style="color:#92400e; font-size:1.2rem; margin-bottom:8px;">⚠️ Alerte fiscale PHEV 2026</h3>
<p style="color:#78350f; margin:0;">La déductibilité des PHEV en flotte est désormais conditionnée à un taux de recharge effectif. Si vos conducteurs rechargent moins de <strong>30 %</strong> du temps, la TVS reste à 100 % et le surcoût peut atteindre <strong>1 200 € à 2 800 € par véhicule et par an</strong>. Notre simulateur intègre ce paramètre.</p>
</div>
</div>
</section>
<!-- ===== CTA ===== -->
<section class="section-alt">
<div class="container">
<div class="cta-block">
<h3>Calculez votre TCO en 2 minutes</h3>
<p>6 motorisations, vos paramètres réels, des aides multi-pays. Pas d'inscription, pas d'email demandé.</p>
<a class="btn btn-lg" href="/simulateur">Lancer le simulateur →</a>
</div>
</div>
</section>
<!-- ===== FORMULAIRE LEAD B2B ===== -->
<section id="contact" style="padding:64px 0;">
<div class="container">
<div style="max-width:640px; margin:0 auto;">
<h2 class="section-title" style="text-align:left;">Un expert vous répond</h2>
<p style="color:var(--color-text-soft); margin-bottom:32px;">
        Partagez votre situation en 2 minutes — Oliver analyse votre flotte et vous répond personnellement sous 24h avec les chiffres qui comptent pour vous.
      </p>
<form id="form-lead" style="display:flex; flex-direction:column; gap:16px;">
<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
<div class="form-group">
<label for="lead-nom">Nom &amp; prénom *</label>
<input id="lead-nom" placeholder="Jean Dupont" required="" type="text"/>
</div>
<div class="form-group">
<label for="lead-entreprise">Entreprise *</label>
<input id="lead-entreprise" placeholder="Dupont Transport" required="" type="text"/>
</div>
</div>
<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
<div class="form-group">
<label for="lead-email">Email professionnel *</label>
<input id="lead-email" placeholder="jean@dupont-transport.fr" required="" type="email"/>
</div>
<div class="form-group">
<label for="lead-telephone">Téléphone</label>
<input id="lead-telephone" placeholder="+33 6 12 34 56 78" type="tel"/>
</div>
</div>
<div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;">
<div class="form-group">
<label for="lead-pays">Pays *</label>
<select id="lead-pays" required="">
<option value="FR">🇫🇷 France</option>
<option value="BE">🇧🇪 Belgique</option>
<option value="CH">🇨🇭 Suisse</option>
<option value="CA">🇨🇦 Canada</option>
</select>
</div>
<div class="form-group">
<label for="lead-flotte">Type de véhicule *</label>
<select id="lead-flotte" required="">
<option value="">— Sélectionner —</option>
<option value="vul_leger">VUL léger (Kangoo, Berlingo…)</option>
<option value="vul_lourd">VUL lourd (Transit, Sprinter…)</option>
<option value="camion">Camion 3,5–19 t</option>
<option value="poids_lourd">Poids-lourd &gt; 19 t</option>
<option value="voiture">Voitures de société</option>
<option value="mix">Mix de véhicules</option>
</select>
</div>
<div class="form-group">
<label for="lead-taille">Taille de flotte *</label>
<select id="lead-taille" required="">
<option value="">— Sélectionner —</option>
<option value="1-5">1 à 5 véhicules</option>
<option value="6-20">6 à 20 véhicules</option>
<option value="21-50">21 à 50 véhicules</option>
<option value="50+">Plus de 50 véhicules</option>
</select>
</div>
</div>
<div class="form-group">
<label for="lead-problematique">Votre problématique principale *</label>
<select id="lead-problematique" required="">
<option value="">— Sélectionner —</option>
<option value="zfe">Passage en ZFE / conformité réglementaire</option>
<option value="tco">Optimisation TCO / arbitrage motorisation</option>
<option value="aides">Maximisation des aides et subventions</option>
<option value="financement">Plan de financement / leasing</option>
<option value="recharge">Infrastructure de recharge</option>
<option value="autre">Autre</option>
</select>
</div>
<div class="form-group">
<label for="lead-message">Détaillez votre situation <span style="color:var(--color-text-soft); font-weight:400;">(optionnel)</span></label>
<textarea id="lead-message" placeholder="Ex : 12 Sprinter diesel en Île-de-France, contrainte ZFE à partir de 2026, budget max 45 k€ par véhicule…" rows="4" style="width:100%; padding:10px 14px; border:1px solid var(--color-border); border-radius:8px; font-family:inherit; font-size:0.9rem; resize:vertical; background:var(--color-bg); color:var(--color-text);"></textarea>
</div>
<div id="lead-status" style="display:none; padding:12px 16px; border-radius:8px; font-size:0.9rem;"></div>
<button class="btn btn-primary btn-lg" id="btn-submit-lead" style="align-self:flex-start;" type="submit">
          Envoyer ma demande →
        </button>
<p style="font-size:0.75rem; color:var(--color-text-soft);">
          Vos données ne sont utilisées que pour vous répondre. Aucune revente, aucun démarchage tiers.
        </p>
</form>
</div>
</div>
</section>

<!-- ===== DISCLAIMER B2B ===== -->
<section style="padding-top:0;">
<div class="container">
<div class="disclaimer">
<strong>Disclaimer B2B —</strong> Les montants des aides indiqués sont fournis à titre indicatif et susceptibles d'évoluer. Vérifiez votre éligibilité auprès de votre concessionnaire ou de l'ADEME (ou organisme équivalent dans votre pays) avant tout engagement. Moteurs.com n'est pas conseiller financier.
    </div>
</div>
</section>` }} />
  )
}
