export default function ParticulierPage() {
  return (
    <div dangerouslySetInnerHTML={{ __html: `<section class="hero">
<div class="container">
<h1>Pour vous, votre famille,<br/><span class="accent">le bon véhicule au bon budget.</span></h1>
<p class="lead">Voiture, vélo électrique, trottinette, scooter — on vous donne le coût mensuel réel, les aides cumulables, et on dédramatise la recharge à domicile. Pas de jargon technique, pas de promesses.</p>
<div class="hero-actions">
<a class="btn btn-primary btn-lg" href="/simulateur?profil=particulier">Trouver le véhicule adapté à mon budget →</a>
<a class="btn btn-secondary btn-lg" href="#aides">Voir les aides 2026</a>
</div>
</div>
</section>
<!-- ===== SEGMENTS PARTICULIER ===== -->
<section>
<div class="container">
<h2 class="section-title">Quel mode de déplacement vous concerne ?</h2>
<p class="section-subtitle">Chaque usage a son arbitrage économique. Cliquez pour aller au plus proche de votre besoin.</p>
<div class="cards-grid">
<a class="card" href="/simulateur?profil=particulier&amp;segment=voiture" style="text-decoration:none; color:inherit;">
<span class="tag tag-particulier">Voiture</span>
<h3>Voiture personnelle ou familiale</h3>
<p>Achat, LOA verte, bonus écologique, prime à la conversion. Comparaison thermique vs électrique sur 24, 36 ou 48 mois.</p>
</a>
<a class="card" href="/simulateur?profil=particulier&amp;segment=vae" style="text-decoration:none; color:inherit;">
<span class="tag tag-particulier">VAE</span>
<h3>Vélo à assistance électrique</h3>
<p>Bonus 400 €, FMD employeur jusqu'à 800 €/an cumulables. Comparé à la voiture sur les trajets de moins de 10 km.</p>
</a>
<a class="card" href="/simulateur?profil=particulier&amp;segment=trottinette" style="text-decoration:none; color:inherit;">
<span class="tag tag-particulier">Trottinette</span>
<h3>Trottinette électrique</h3>
<p>Pas éligible au bonus 2026. Reste imbattable sur les trajets &lt; 5 km. Coût mensuel réel calculé.</p>
</a>
<a class="card" href="/simulateur?profil=particulier&amp;segment=moto" style="text-decoration:none; color:inherit;">
<span class="tag tag-particulier">Moto / Scooter</span>
<h3>Moto et scooter électriques</h3>
<p>Bonus 900 €. Domicile-travail périurbain, trajets autoroute courts. Comparaison thermique 125 cm³ vs équivalent élec.</p>
</a>
</div>
</div>
</section>
<!-- ===== AIDES PARTICULIER ===== -->
<section class="section-alt" id="aides">
<div class="container">
<h2 class="section-title">Aides Particulier 2026</h2>
<p class="section-subtitle">Les principales aides cumulables. Conditions de revenus et d'usage applicables — vérifiez sur les sites officiels.</p>
<div class="table-wrap">
<table>
<thead>
<tr>
<th>Aide</th>
<th>Montant</th>
<th>Cumulable avec</th>
<th>Confiance</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Bonus écologique voiture</strong></td>
<td>jusqu'à 4 000 € (sous conditions)</td>
<td>Prime à la conversion, aide région</td>
<td><span class="confidence high">ÉLEVÉ</span></td>
</tr>
<tr>
<td><strong>Prime à la conversion</strong></td>
<td>jusqu'à 5 000 € (sous conditions)</td>
<td>Bonus écologique, aide région</td>
<td><span class="confidence high">ÉLEVÉ</span></td>
</tr>
<tr>
<td><strong>FMD (Forfait Mobilité Durable)</strong></td>
<td>jusqu'à 800 €/an</td>
<td>Versé par votre employeur — exonéré IR/charges</td>
<td><span class="confidence high">ÉLEVÉ</span></td>
</tr>
<tr>
<td><strong>Bonus VAE</strong></td>
<td>400 €</td>
<td>Aide région / collectivité (souvent doublable)</td>
<td><span class="confidence high">ÉLEVÉ</span></td>
</tr>
<tr>
<td><strong>Bonus moto / scooter électrique</strong></td>
<td>900 €</td>
<td>Aide région éventuelle</td>
<td><span class="confidence high">ÉLEVÉ</span></td>
</tr>
<tr>
<td><strong>Trottinette électrique</strong></td>
<td>Non éligible bonus 2026</td>
<td>—</td>
<td><span class="confidence high">ÉLEVÉ</span></td>
</tr>
<tr>
<td><strong>Aides régionales (IDF, ARA, PACA…)</strong></td>
<td>Variable</td>
<td>Bonus + prime conversion + FMD</td>
<td><span class="confidence medium">Vérifier</span></td>
</tr>
</tbody>
</table>
</div>
<p style="font-size:0.85rem; color:var(--color-text-soft); margin-top:14px;">
<strong>À noter —</strong> les aides régionales évoluent fréquemment. Pour le montant actualisé, consultez le simulateur officiel de votre région
      <a href="https://agir.ademe.fr" rel="noopener" target="_blank">(ADEME, agir.ademe.fr)</a>
      ou le site de votre conseil régional.
    </p>
</div>
</section>
<!-- ===== RECHARGE DOMICILE ===== -->
<section>
<div class="container">
<h2 class="section-title">La recharge à domicile, dédramatisée</h2>
<p class="section-subtitle">C'est le frein n°1 à l'achat d'une électrique. Pourtant, dans 80 % des cas, c'est plus simple qu'on ne le croit.</p>
<div class="cards-grid">
<div class="card">
<h3>🏠 Maison individuelle</h3>
<p>Une prise renforcée Green'up suffit pour 90 % des usages quotidiens. Wallbox 7 kW conseillée si vous roulez plus de 60 km/jour. Aide Advenir : jusqu'à 600 €.</p>
</div>
<div class="card">
<h3>🏢 Copropriété</h3>
<p>Le « droit à la prise » est garanti par la loi. La solution Advenir collective subventionne l'infrastructure partagée — la copro n'a souvent rien à débourser.</p>
</div>
<div class="card">
<h3>🌃 Recharge la nuit, départ à 100 %</h3>
<p>L'électrique se branche en rentrant, comme un téléphone. Le matin, vous partez plein. Pour 90 % des usages, vous n'allez jamais sur une borne publique.</p>
</div>
<div class="card">
<h3>🚲 VAE en cuisine</h3>
<p>Le vélo électrique, c'est encore plus simple : la batterie se recharge sur une prise murale standard, comme un ordinateur portable.</p>
</div>
</div>
</div>
</section>
<!-- ===== CTA ===== -->
<section class="section-alt">
<div class="container">
<div class="cta-block">
<h3>Trouvez le véhicule adapté à votre budget</h3>
<p>Simulateur TCO sur 24, 36 ou 48 mois — voiture, VAE, moto, trottinette. Aucune inscription requise.</p>
<a class="btn btn-lg" href="/simulateur?profil=particulier">Lancer le simulateur →</a>
</div>
</div>
</section>
<!-- ===== DISCLAIMER PARTICULIER ===== -->
<section style="padding-top:0;">
<div class="container">
<div class="disclaimer">
<strong>Disclaimer Particulier —</strong> Informations fournies à titre indicatif. Les aides sont soumises à conditions de revenus et d'usage. Consultez un professionnel avant tout engagement. Moteurs.com ne dispense pas de conseil financier personnel.
    </div>
</div>
</section>` }} />
  )
}
