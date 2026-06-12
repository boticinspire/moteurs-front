/* =====================================================
   Moteurs.com — Simulateur TCO
   Calculs simplifiés. Hypothèses transparentes.
   TVA appliquée pour les particuliers (varie par pays).
   Données volatiles chargées depuis data/simulateur-data.json
   ===================================================== */

(function () {
  "use strict";

  // ---------- Données stables (jamais dans le JSON) ----------
  const VAT_RATES = {
    FR: 0.20, BE: 0.21, CH: 0.081, CA: 0.14975,
  };

  const REF_CONSO = {
    voiture:    { diesel: 5.5,  essence: 7.0,  elec: 16,  phev: 7.5,  h2: 1.0, efuel: 6.0,  gnv: 5.5 },
    vul_petit:  { diesel: 6.5,  essence: 8.5,  elec: 18,  phev: 8.5,  h2: 1.1, efuel: 7.0,  gnv: 6.5 },
    vul_moyen:  { diesel: 8.5,  essence: 11.0, elec: 24,  phev: 10.0, h2: 1.3, efuel: 9.0,  gnv: 8.5 },
    vul_grand:  { diesel: 10.5, essence: 13.5, elec: 32,  phev: 12.5, h2: 1.5, efuel: 11.0, gnv: 10.5 },
    camion:     { diesel: 18.0, elec: 95,  phev: 0,    h2: 8.0, efuel: 19.0, gnv: 18.0 },
    poids_lourd:{ diesel: 32.0, elec: 130, phev: 0,    h2: 9.5, efuel: 33.0, gnv: 32.0 },
    vae:        { elec: 0.8 },
    trottinette:{ elec: 1.2 },
    moto:       { diesel: 4.5, elec: 8.0 },
  };

  const MAINT_ANNUAL = {
    voiture:    { diesel: 1100, essence: 1000, elec: 480,  phev: 950,  h2: 1400, efuel: 1100, gnv: 1050 },
    vul_petit:  { diesel: 1400, essence: 1300, elec: 600,  phev: 1200, h2: 1800, efuel: 1400, gnv: 1350 },
    vul_moyen:  { diesel: 1900, essence: 1750, elec: 850,  phev: 0,    h2: 2200, efuel: 1900, gnv: 1850 },
    vul_grand:  { diesel: 2300, essence: 2150, elec: 1100, phev: 0,    h2: 2600, efuel: 2300, gnv: 2250 },
    camion:     { diesel: 4200, elec: 2500, phev: 0,    h2: 4500, efuel: 4200, gnv: 4000 },
    poids_lourd:{ diesel: 7500, elec: 4800, phev: 0,    h2: 7800, efuel: 7500, gnv: 7000 },
    vae:        { elec: 120 },
    trottinette:{ elec: 80 },
    moto:       { diesel: 600, elec: 280 },
  };

  // ---------- Données volatiles — chargées depuis simulateur-data.json ----------
  let ENERGY_PRICES = {};
  let AIDES_B2B     = {};
  let AIDES_PARTICULIER = {};
  let REF_PRICES    = {};

  const LABELS = {
    diesel: "Diesel",
    essence: "Essence",
    elec: "Électrique",
    phev: "PHEV (hybride rechargeable)",
    h2: "Hydrogène",
    efuel: "E-fuel",
    gnv: "Bio-GNV",
  };

  const SEGMENT_LABELS = {
    voiture: "Voiture",
    vul_petit: "Petit VUL",
    vul_moyen: "Fourgon moyen",
    vul_grand: "Grand fourgon",
    camion: "Camion 3,5–7,5 t",
    poids_lourd: "Poids-lourd",
    vae: "Vélo à assistance électrique",
    trottinette: "Trottinette",
    moto: "Moto / scooter",
  };

  // ---------- État ----------
  const state = {
    profil: "B2B",
    pays: "FR",
    segment: "vul_moyen",
    duree_mois: 48,
    km_an: 25000,
    profil_conduite: "mixte",
    charge: "standard",
    pct_hiver: 25,
    taux_recharge_phev: 50,
    aides_recues: null,
    prix_remise: 0,
    // Prix d'achat personnalisés par motorisation (HT)
    // null = utiliser le prix catalogue de référence
    prix_custom: {},
  };

  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return document.querySelectorAll(sel); }

  function bindToggle(group, target) {
    $$(`.toggle-group[data-group="${group}"] button`).forEach((b) => {
      b.addEventListener("click", () => {
        $$(`.toggle-group[data-group="${group}"] button`).forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        state[target] = b.dataset.value;
        if (target === "profil") onProfilChange();
        if (target === "duree_mois") state.duree_mois = parseInt(b.dataset.value, 10);
        recompute();
      });
    });
  }

  function onProfilChange() {
    const segSel = $("#segment");
    const segments = state.profil === "B2B"
      ? ["vul_petit", "vul_moyen", "vul_grand", "camion", "poids_lourd"]
      : ["voiture", "vae", "trottinette", "moto"];
    segSel.innerHTML = segments
      .map((s) => `<option value="${s}">${SEGMENT_LABELS[s]}</option>`)
      .join("");
    state.segment = segments[0];
    segSel.value = state.segment;

    const durBtns = $$(".toggle-group[data-group='duree'] button");
    const durs = state.profil === "B2B" ? [36, 48, 60] : [24, 36, 48];
    durBtns.forEach((b, i) => {
      b.dataset.value = durs[i];
      b.textContent = `${durs[i]} mois`;
    });
    state.duree_mois = parseInt(durBtns[1]?.dataset.value || 36, 10);
    durBtns[1]?.classList.add("active");
    durBtns[0]?.classList.remove("active");
    durBtns[2]?.classList.remove("active");
  }

  function correcteurConduite(motor) {
    const p = state.profil_conduite;
    if (motor === "diesel") {
      if (p === "urbain") return 1.18;
      if (p === "route") return 0.92;
      if (p === "autoroute") return 0.95;
      return 1.0;
    }
    if (motor === "essence") {
      if (p === "urbain") return 1.22;
      if (p === "route") return 0.93;
      if (p === "autoroute") return 0.97;
      return 1.0;
    }
    if (motor === "elec") {
      if (p === "urbain") return 0.95;
      if (p === "route") return 1.12;
      if (p === "autoroute") return 1.28;
      return 1.0;
    }
    if (motor === "phev") {
      if (p === "autoroute") return 1.20;
      return 1.0;
    }
    return 1.0;
  }

  function correcteurCharge() {
    if (state.charge === "vide") return 0.97;
    if (state.charge === "pleine") return 1.12;
    return 1.0;
  }

  function correcteurHiver(motor) {
    if (motor !== "elec" && motor !== "phev") return 1.0;
    return 1 + 0.28 * (state.pct_hiver / 100);
  }

  function tco(motor) {
    const seg = state.segment;
    const refConso = REF_CONSO[seg] && REF_CONSO[seg][motor];
    const catPrix = REF_PRICES[seg] && REF_PRICES[seg][motor];
    const refMaint = MAINT_ANNUAL[seg] && MAINT_ANNUAL[seg][motor];

    if (!refConso || !catPrix) {
      return { available: false, reason: "DATA_MISSING" };
    }

    // Prix d'achat HT : custom (si saisi) ou catalogue de référence
    const customKey = `${seg}_${motor}`;
    const refPrix = (state.prix_custom[customKey] && state.prix_custom[customKey] > 0)
      ? state.prix_custom[customKey]
      : catPrix;
    const isCustom = refPrix !== catPrix;

    // TVA appliquée au prix d'achat en mode Particulier
    // (en B2B la TVA est récupérable, on raisonne donc HT)
    const vatRate = state.profil === "Particulier" ? (VAT_RATES[state.pays] || 0) : 0;
    const prixCatalogueAffiche = refPrix * (1 + vatRate);

    const energyKey = motor === "elec" ? "elec"
      : motor === "phev" ? "diesel"
      : motor === "h2" ? "h2"
      : motor === "efuel" ? "efuel"
      : motor === "gnv" ? "gnv"
      : motor === "essence" ? "essence"
      : "diesel";

    const consoReel = refConso * correcteurConduite(motor) * correcteurCharge() * correcteurHiver(motor);

    const prixEnergie = ENERGY_PRICES[state.pays][energyKey];
    const annees = state.duree_mois / 12;
    const totalKm = state.km_an * annees;

    let coutEnergie;
    if (motor === "phev") {
      const tauxRecharge = state.taux_recharge_phev / 100;
      const consoElec = REF_CONSO[seg].elec * 0.7;
      const energieElec = (consoElec / 100) * totalKm * tauxRecharge * ENERGY_PRICES[state.pays].elec;
      const energieDiesel = (consoReel / 100) * totalKm * (1 - tauxRecharge) * ENERGY_PRICES[state.pays].diesel;
      coutEnergie = energieElec + energieDiesel;
    } else {
      coutEnergie = (consoReel / 100) * totalKm * prixEnergie;
    }

    let aides = 0;
    if (motor !== "diesel" && motor !== "essence" && motor !== "efuel") {
      const table = state.profil === "B2B" ? AIDES_B2B[state.pays] : AIDES_PARTICULIER[state.pays];
      aides = (table && table[seg]) || 0;
      if (state.aides_recues !== null && state.aides_recues !== undefined) {
        aides = state.aides_recues;
      }
    }

    let suramort = 0;
    if (state.profil === "B2B" && state.pays === "FR" && (motor === "elec" || motor === "h2" || motor === "gnv")) {
      const taux_is = 0.25;
      suramort = Math.min(refPrix, 30000) * taux_is;
    }

    const prixNet = Math.max(0, prixCatalogueAffiche - state.prix_remise - aides - suramort);
    const coutMaint = (refMaint || 0) * annees;

    let surcoutTVS = 0;
    if (motor === "phev" && state.profil === "B2B" && state.pays === "FR" && state.taux_recharge_phev < 30) {
      surcoutTVS = 1800 * annees;
    }

    const total = prixNet + coutEnergie + coutMaint + surcoutTVS;

    return {
      available: true,
      motor,
      label: LABELS[motor],
      prixCatalogue: prixCatalogueAffiche,
      prixHT: refPrix,
      isCustomPrice: isCustom,
      vatApplied: vatRate,
      aides,
      suramort,
      prixNet,
      coutEnergie,
      coutMaint,
      surcoutTVS,
      total,
      consoReel: Math.round(consoReel * 10) / 10,
      coutMensuel: Math.round(total / state.duree_mois),
    };
  }

  function breakEven(motorRef, motorCible) {
    const dureeOriginale = state.duree_mois;
    let cross = null;
    for (let m = 1; m <= 84; m++) {
      state.duree_mois = m;
      const a = tco(motorRef);
      const b = tco(motorCible);
      if (a.available && b.available && b.total <= a.total) {
        cross = m;
        break;
      }
    }
    state.duree_mois = dureeOriginale;
    return cross;
  }

  function fmtEur(v) {
    if (typeof v !== "number" || isNaN(v)) return "—";
    return Math.round(v).toLocaleString("fr-FR") + " €";
  }

  function getMotorsForCurrentSegment() {
    if (["vae", "trottinette"].includes(state.segment)) return ["elec"];
    if (state.segment === "moto") return ["diesel", "elec"];
    return state.profil === "B2B"
      ? ["diesel", "essence", "elec", "phev", "h2", "gnv", "efuel"]
      : ["diesel", "essence", "elec", "phev"];
  }

  function renderPrixCustomInputs() {
    const container = $("#prix-customs");
    if (!container) return;
    const seg = state.segment;
    const motors = getMotorsForCurrentSegment().filter((m) => REF_PRICES[seg] && REF_PRICES[seg][m]);

    container.innerHTML = motors.map((m) => {
      const ref = REF_PRICES[seg][m];
      const customKey = `${seg}_${m}`;
      const current = state.prix_custom[customKey] || "";
      return `
        <div class="form-group" style="margin-bottom:10px;">
          <label for="prix_${m}" style="display:flex; justify-content:space-between; align-items:center;">
            <span>${LABELS[m]}</span>
            <span style="font-size:0.7rem; color:var(--color-text-soft); font-weight:400;">cat. ${ref.toLocaleString("fr-FR")} €</span>
          </label>
          <input type="number" id="prix_${m}" data-motor="${m}" data-segment="${seg}"
                 value="${current}" min="0" step="500" placeholder="${ref.toLocaleString("fr-FR")}"
                 class="prix-custom-input" />
        </div>
      `;
    }).join("");

    // Bind inputs — recalcul uniquement sur Enter ou perte de focus
    $$(".prix-custom-input").forEach((input) => {
      function _appliquer(e) {
        const m = e.target.dataset.motor;
        const s = e.target.dataset.segment;
        const v = parseInt(e.target.value, 10);
        const key = `${s}_${m}`;
        if (isNaN(v) || v <= 0) {
          delete state.prix_custom[key];
        } else {
          state.prix_custom[key] = v;
        }
        recompute();
      }
      input.addEventListener("change", _appliquer);
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") _appliquer(e); });
    });
  }

  function recompute() {
    renderPrixCustomInputs();

    if (["vae", "trottinette"].includes(state.segment)) {
      renderMicromobilite();
      return;
    }
    if (state.segment === "moto") {
      renderResults(["diesel", "elec"]);
      return;
    }
    const motors = getMotorsForCurrentSegment();
    renderResults(motors);
  }

  function renderResults(motors) {
    const results = motors.map(tco).filter((r) => r.available);
    if (!results.length) {
      $("#results-content").innerHTML = "<p style='color:#dc2626'>Données indisponibles pour cette combinaison.</p>";
      return;
    }

    const dieselRef = results.find((r) => r.motor === "diesel");
    const meilleur = results.reduce((a, b) => (a.total < b.total ? a : b));
    const max = Math.max(...results.map((r) => r.total));

    let html = `
      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-label">Meilleur TCO</div>
          <div class="kpi-value positive">${meilleur.label}</div>
          <div class="kpi-sub">${fmtEur(meilleur.total)} sur ${state.duree_mois} mois</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Coût mensuel</div>
          <div class="kpi-value">${fmtEur(meilleur.coutMensuel)}<span style="font-size:0.9rem; color:var(--color-text-soft);"> /mois</span></div>
          <div class="kpi-sub">tout compris (achat + énergie + entretien)</div>
        </div>
    `;

    if (dieselRef && meilleur.motor !== "diesel") {
      const economie = dieselRef.total - meilleur.total;
      const be = breakEven("diesel", meilleur.motor);
      html += `
        <div class="kpi">
          <div class="kpi-label">Économie vs diesel</div>
          <div class="kpi-value ${economie > 0 ? "positive" : "negative"}">${economie > 0 ? "−" : "+"}${fmtEur(Math.abs(economie))}</div>
          <div class="kpi-sub">sur ${state.duree_mois} mois</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Break-even</div>
          <div class="kpi-value">${be ? be + " mois" : "Non atteint"}</div>
          <div class="kpi-sub">vs scénario diesel</div>
        </div>
      `;
    }
    html += `</div>`;

    html += `<div class="chart-container">`;
    html += `<h4 style="font-size:0.95rem; margin-bottom:14px;">TCO total sur ${state.duree_mois} mois</h4>`;
    results.forEach((r) => {
      const pct = (r.total / max) * 100;
      const cls = r.motor === "diesel" ? "diesel" : r.motor === "essence" ? "essence" : r.motor === "elec" ? "elec" : r.motor === "phev" ? "phev" : "";
      html += `
        <div class="chart-bars">
          <div class="chart-label">${r.label}</div>
          <div class="chart-bar-track"><div class="chart-bar-fill ${cls}" style="width:${pct}%"></div></div>
          <div class="chart-value">${fmtEur(r.total)}</div>
        </div>
      `;
    });
    html += `</div>`;

    const priceLabel = state.profil === "Particulier" ? "Prix TTC" : "Prix HT";
    html += `
      <div class="table-wrap" style="margin-top:24px;">
        <table>
          <thead>
            <tr>
              <th>Motorisation</th>
              <th>${priceLabel}</th>
              <th>Aides</th>
              <th>Énergie</th>
              <th>Entretien</th>
              <th>TCO total</th>
            </tr>
          </thead>
          <tbody>
            ${results.map((r) => `
              <tr>
                <td><strong>${r.label}</strong></td>
                <td>${fmtEur(r.prixCatalogue)}${r.isCustomPrice ? ' <span style="font-size:0.72rem; color:var(--color-warning); font-weight:600;">(modifié)</span>' : ""}</td>
                <td class="cell-positive">${r.aides + r.suramort > 0 ? "−" + fmtEur(r.aides + r.suramort) : "—"}</td>
                <td>${fmtEur(r.coutEnergie)}</td>
                <td>${fmtEur(r.coutMaint)}</td>
                <td><strong>${fmtEur(r.total)}</strong></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    const phev = results.find((r) => r.motor === "phev");
    if (phev && state.profil === "B2B" && state.taux_recharge_phev < 30 && state.pays === "FR") {
      html += `
        <div class="disclaimer" style="background:#fee2e2; border-color:#fca5a5;">
          <strong>⚠️ Alerte PHEV —</strong> Votre taux de recharge déclaré (${state.taux_recharge_phev} %) est inférieur au seuil de 30 % qui conditionne la déductibilité 2026. Surcoût TVS estimé inclus dans le calcul : <strong>${fmtEur(phev.surcoutTVS)}</strong>.
        </div>
      `;
    }

    const vatPct = (VAT_RATES[state.pays] * 100).toFixed((state.pays === "CA" || state.pays === "CH") ? 1 : 0);
    const tvaInfo = state.profil === "Particulier"
      ? `<li><strong>TVA / taxes vente ${state.pays}&nbsp;:</strong> ${vatPct}&nbsp;% appliquée au prix d'achat (TTC) — non récupérable pour un particulier</li>`
      : `<li><strong>Régime TVA&nbsp;:</strong> calcul en HT (TVA récupérable pour les professionnels assujettis)</li>`;

    html += `
      <div class="hypotheses">
        <h4>Hypothèses du calcul (transparence totale)</h4>
        <ul>
          <li>Profil&nbsp;: <strong>${state.profil}</strong> · Pays&nbsp;: <strong>${state.pays}</strong> · Segment&nbsp;: <strong>${SEGMENT_LABELS[state.segment]}</strong></li>
          <li>Kilométrage annuel&nbsp;: <strong>${state.km_an.toLocaleString("fr-FR")} km</strong> sur <strong>${state.duree_mois} mois</strong></li>
          <li>Profil de conduite&nbsp;: <strong>${state.profil_conduite}</strong> · Charge&nbsp;: <strong>${state.charge}</strong> · Roulage hivernal&nbsp;: <strong>${state.pct_hiver} %</strong></li>
          <li>Taux de recharge PHEV&nbsp;: <strong>${state.taux_recharge_phev} %</strong></li>
          ${tvaInfo}
          <li>Prix énergie ${state.pays}&nbsp;: diesel ${ENERGY_PRICES[state.pays].diesel}€/L · élec. ${ENERGY_PRICES[state.pays].elec}€/kWh · GNV ${ENERGY_PRICES[state.pays].gnv}€/kg (TTC)</li>
          <li>Niveau de confiance données&nbsp;: <span class="confidence high">ÉLEVÉ</span> pour FR/BE · <span class="confidence medium">MOYEN</span> pour CH/CA</li>
        </ul>
      </div>
    `;

    $("#results-content").innerHTML = html;
  }

  function renderMicromobilite() {
    const seg = state.segment;
    const vatRate = VAT_RATES[state.pays] || 0;

    const refPrix = REF_PRICES[seg].elec * (1 + vatRate);
    const conso = REF_CONSO[seg].elec;
    const annees = state.duree_mois / 12;
    const km = state.km_an * annees;
    const energie = (conso / 100) * km * ENERGY_PRICES[state.pays].elec;
    const maint = MAINT_ANNUAL[seg].elec * annees;
    const aides = AIDES_PARTICULIER[state.pays][seg] || 0;
    const totalElec = refPrix - aides + energie + maint;

    const carPrix = REF_PRICES.voiture.diesel * (1 + vatRate);
    const carEnergie = (5.5 / 100) * km * ENERGY_PRICES[state.pays].diesel;
    const carMaint = MAINT_ANNUAL.voiture.diesel * annees;
    const totalCar = carPrix + carEnergie + carMaint;

    const economie = totalCar - totalElec;
    const vatPct = (vatRate * 100).toFixed((state.pays === "CA" || state.pays === "CH") ? 1 : 0);

    const html = `
      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-label">Coût total ${SEGMENT_LABELS[seg]}</div>
          <div class="kpi-value positive">${fmtEur(totalElec)}</div>
          <div class="kpi-sub">sur ${state.duree_mois} mois (TTC)</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Coût mensuel</div>
          <div class="kpi-value">${fmtEur(totalElec / state.duree_mois)}<span style="font-size:0.9rem;"> /mois</span></div>
          <div class="kpi-sub">tout compris</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Économie vs voiture thermique</div>
          <div class="kpi-value ${economie > 0 ? "positive" : "negative"}">${economie > 0 ? "−" : "+"}${fmtEur(Math.abs(economie))}</div>
          <div class="kpi-sub">scénario équivalent ${state.km_an.toLocaleString("fr-FR")} km/an</div>
        </div>
      </div>

      <div class="chart-container">
        <h4 style="font-size:0.95rem; margin-bottom:14px;">Comparaison sur ${state.duree_mois} mois</h4>
        <div class="chart-bars">
          <div class="chart-label">${SEGMENT_LABELS[seg]}</div>
          <div class="chart-bar-track"><div class="chart-bar-fill elec" style="width:${(totalElec / totalCar) * 100}%"></div></div>
          <div class="chart-value">${fmtEur(totalElec)}</div>
        </div>
        <div class="chart-bars">
          <div class="chart-label">Voiture diesel</div>
          <div class="chart-bar-track"><div class="chart-bar-fill diesel" style="width:100%"></div></div>
          <div class="chart-value">${fmtEur(totalCar)}</div>
        </div>
      </div>

      <div class="hypotheses">
        <h4>Hypothèses</h4>
        <ul>
          <li>Bonus appliqué&nbsp;: ${fmtEur(aides)} ${seg === "trottinette" ? "(trottinette non éligible bonus 2026)" : ""}</li>
          <li><strong>TVA / taxes vente ${state.pays}&nbsp;:</strong> ${vatPct}&nbsp;% incluse dans le prix d'achat (TTC)</li>
          <li>Comparaison vs voiture diesel d'entrée de gamme TTC, mêmes km parcourus</li>
          <li>Entretien VAE/trottinette&nbsp;: pneumatiques, batterie de remplacement éventuelle, révisions</li>
          <li>Pertinent surtout sur trajets urbains de moins de 10&nbsp;km</li>
        </ul>
      </div>
    `;
    $("#results-content").innerHTML = html;
  }

  // ---------- Données de fallback intégrées ----------
  // ⚠ Bloc régénéré par `scripts/sync-fallbacks.mjs` depuis simulateur-data.json.
  //   NE PAS éditer manuellement entre les marqueurs.
  function _chargerFallback() {
    // >>> SYNC:FALLBACK START
    ENERGY_PRICES     = {FR:{diesel:1.72,essence:1.79,elec:0.21,gnv:1.45,h2:13.5,efuel:4.2},BE:{diesel:1.78,essence:1.83,elec:0.3,gnv:1.55,h2:14,efuel:4.4},CH:{diesel:1.85,essence:1.92,elec:0.27,gnv:1.85,h2:15.5,efuel:5},CA:{diesel:1.45,essence:1.4,elec:0.13,gnv:1.25,h2:12,efuel:4},DE:{diesel:1.97,essence:2.04,elec:0.3,gnv:1.45,h2:12,efuel:4.5},ES:{diesel:1.69,essence:1.55,elec:0.18,gnv:1.35,h2:11,efuel:4},IT:{diesel:1.98,essence:1.94,elec:0.28,gnv:1.4,h2:12,efuel:4.5},NL:{diesel:2.29,essence:2.39,elec:0.32,gnv:1.55,h2:12,efuel:5},AT:{diesel:1.91,essence:1.81,elec:0.28,gnv:1.5,h2:12,efuel:4.5},PT:{diesel:1.95,essence:2.01,elec:0.22,gnv:1.4,h2:12,efuel:4.3},PL:{diesel:1.58,essence:1.49,elec:0.17,gnv:1.2,h2:11,efuel:3.8},SE:{diesel:1.9,essence:1.72,elec:0.18,gnv:1.6,h2:13,efuel:4.5},DK:{diesel:2.18,essence:2.34,elec:0.35,gnv:1.8,h2:14,efuel:5},IE:{diesel:1.95,essence:1.83,elec:0.32,gnv:1.6,h2:13,efuel:4.6},FI:{diesel:2.14,essence:2.03,elec:0.18,gnv:1.7,h2:13,efuel:4.8},LU:{diesel:1.82,essence:1.82,elec:0.2,gnv:1.45,h2:12,efuel:4.2}};
    AIDES_B2B         = {FR:{vul_petit:4000,vul_moyen:6500,vul_grand:8600,camion:10000,poids_lourd:12000},BE:{vul_petit:2500,vul_moyen:3500,vul_grand:5000,camion:6000,poids_lourd:8000},CH:{vul_petit:0,vul_moyen:0,vul_grand:0,camion:0,poids_lourd:0},CA:{vul_petit:5000,vul_moyen:7000,vul_grand:7000,camion:7000,poids_lourd:7000},DE:{vul_petit:0,vul_moyen:0,vul_grand:0,camion:0,poids_lourd:0},ES:{vul_petit:0,vul_moyen:0,vul_grand:0,camion:0,poids_lourd:0},IT:{vul_petit:0,vul_moyen:0,vul_grand:0,camion:0,poids_lourd:0},NL:{vul_petit:0,vul_moyen:0,vul_grand:0,camion:0,poids_lourd:0},AT:{vul_petit:0,vul_moyen:0,vul_grand:0,camion:0,poids_lourd:0},PT:{vul_petit:0,vul_moyen:0,vul_grand:0,camion:0,poids_lourd:0},PL:{vul_petit:0,vul_moyen:0,vul_grand:0,camion:0,poids_lourd:0},SE:{vul_petit:0,vul_moyen:0,vul_grand:0,camion:0,poids_lourd:0},DK:{vul_petit:0,vul_moyen:0,vul_grand:0,camion:0,poids_lourd:0},IE:{vul_petit:3500,vul_moyen:3500,vul_grand:3500,camion:3500,poids_lourd:0},FI:{vul_petit:0,vul_moyen:0,vul_grand:0,camion:0,poids_lourd:0},LU:{vul_petit:0,vul_moyen:0,vul_grand:0,camion:0,poids_lourd:0}};
    AIDES_PARTICULIER = {FR:{voiture:4000,vae:400,trottinette:0,moto:900},BE:{voiture:2500,vae:300,trottinette:0,moto:500},CH:{voiture:0,vae:0,trottinette:0,moto:0},CA:{voiture:5000,vae:200,trottinette:0,moto:0},DE:{voiture:4000,vae:300,trottinette:0,moto:0},ES:{voiture:7000,vae:500,trottinette:0,moto:0},IT:{voiture:6000,vae:200,trottinette:0,moto:0},NL:{voiture:0,vae:250,trottinette:0,moto:0},AT:{voiture:0,vae:200,trottinette:0,moto:0},PT:{voiture:3000,vae:250,trottinette:0,moto:0},PL:{voiture:4000,vae:200,trottinette:0,moto:0},SE:{voiture:3000,vae:200,trottinette:0,moto:0},DK:{voiture:0,vae:300,trottinette:0,moto:0},IE:{voiture:5000,vae:300,trottinette:0,moto:0},FI:{voiture:2000,vae:200,trottinette:0,moto:0},LU:{voiture:5000,vae:300,trottinette:0,moto:0}};
    REF_PRICES        = {voiture:{diesel:28000,essence:24000,elec:35000,phev:38000,h2:70000,efuel:32000,gnv:27000},vul_petit:{diesel:22000,essence:20000,elec:32000,phev:34000,h2:60000,efuel:24000,gnv:23000},vul_moyen:{diesel:32000,essence:29000,elec:45000,phev:0,h2:75000,efuel:34000,gnv:33000},vul_grand:{diesel:42000,essence:38000,elec:62000,phev:0,h2:90000,efuel:44000,gnv:43000},camion:{diesel:70000,elec:145000,phev:0,h2:220000,efuel:72000,gnv:80000},poids_lourd:{diesel:110000,elec:380000,phev:0,h2:480000,efuel:115000,gnv:130000},vae:{elec:1800},trottinette:{elec:600},moto:{diesel:5500,elec:9000}};
    // >>> SYNC:FALLBACK END
  }

  // ---------- Init — démarre immédiatement, met à jour si JSON disponible ----------
  // Support chargement dynamique (Next.js) : si DOM déjà prêt, init immédiat
  function _onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  _onReady(function () {
    // 1. Démarrage immédiat avec les données intégrées
    _chargerFallback();
    try {
      _initSimulateur();
    } catch (err) {
      var rc = document.getElementById("results-content");
      if (rc) rc.innerHTML = "<p style='color:#dc2626;padding:16px;'>Erreur d'initialisation : " + (err && err.message ? err.message : String(err)) + "</p>";
      console.error("[Simulateur] _initSimulateur error:", err);
    }

    // 2. Tentative de chargement du JSON à jour en arrière-plan
    fetch("/data/simulateur-data.json?v=" + Date.now())
      .then(function(r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function(json) {
        ENERGY_PRICES     = json.energy_prices     || ENERGY_PRICES;
        AIDES_B2B         = json.aides_b2b         || AIDES_B2B;
        AIDES_PARTICULIER = json.aides_particulier  || AIDES_PARTICULIER;
        REF_PRICES        = json.ref_prices         || REF_PRICES;
        recompute(); // Recalcul silencieux avec les données à jour
        const el = document.getElementById("simulateur-data-version");
        if (el && json._meta) el.textContent = "Données au " + json._meta.version;
      })
      .catch(function() {
        // Silencieux — fallback déjà actif
      });
  });

  function _initSimulateur() {
    const params = new URLSearchParams(window.location.search);
    const profilParam = params.get("profil");
    if (profilParam === "particulier") state.profil = "Particulier";

    const segment = params.get("segment");
    if (segment) state.segment = segment;

    const country = (window.MoteursCom && window.MoteursCom.getCountry && window.MoteursCom.getCountry()) || "FR";
    state.pays = country;
    const csel = $("#country-select");
    if (csel) csel.value = country;

    bindToggle("profil", "profil");
    bindToggle("duree", "duree_mois");

    $$(`.toggle-group[data-group='profil'] button`).forEach((b) => {
      if (b.dataset.value === state.profil) {
        $$(`.toggle-group[data-group='profil'] button`).forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
      }
    });

    onProfilChange();
    if (segment) {
      $("#segment").value = segment;
      state.segment = segment;
    }

    $("#segment").addEventListener("change", (e) => { state.segment = e.target.value; recompute(); });
    if ($("#pays")) $("#pays").addEventListener("change", (e) => { state.pays = e.target.value; recompute(); });
    $("#km_an").addEventListener("input", (e) => { state.km_an = parseInt(e.target.value, 10) || 0; recompute(); });
    $("#profil_conduite").addEventListener("change", (e) => { state.profil_conduite = e.target.value; recompute(); });
    $("#charge").addEventListener("change", (e) => { state.charge = e.target.value; recompute(); });
    $("#pct_hiver").addEventListener("input", (e) => { state.pct_hiver = parseInt(e.target.value, 10); $("#pct_hiver_val").textContent = e.target.value + " %"; recompute(); });
    $("#taux_recharge_phev").addEventListener("input", (e) => { state.taux_recharge_phev = parseInt(e.target.value, 10); $("#taux_recharge_phev_val").textContent = e.target.value + " %"; recompute(); });
    $("#prix_remise").addEventListener("input", (e) => { state.prix_remise = parseInt(e.target.value, 10) || 0; recompute(); });

    window.addEventListener("moteurs:country-change", (e) => {
      state.pays = e.detail;
      recompute();
    });

    recompute();
  } // fin _initSimulateur

  // ---------- API publique : ré-init auto-réparante ----------
  // Le formulaire est rendu via React (dangerouslySetInnerHTML). Quand un
  // re-render (ex : fin du bootstrap auth) ré-injecte le HTML statique, la
  // zone résultats revient à "Calcul en cours…" et nos listeners (sur les
  // anciens nœuds) sont perdus. React n'exécute pas à nouveau le script ;
  // c'est le composant qui appelle reinit() pour relancer le calcul sur les
  // nœuds neufs. Le garde "Calcul en cours" évite tout double-binding.
  window.MoteursSimulateur = {
    reinit: function () {
      var rc = document.getElementById("results-content");
      if (!rc) return;
      if (!/Calcul en cours/.test(rc.textContent || "")) return; // déjà initialisé
      try {
        _initSimulateur();
      } catch (e) {
        rc.innerHTML = "<p style='color:#dc2626;padding:16px;'>Erreur d'initialisation : " + (e && e.message ? e.message : String(e)) + "</p>";
        console.error("[Simulateur] reinit error:", e);
      }
    }
  };
})();
