'use client'

import { useEffect, useRef, useState } from 'react'
import { Link, usePathname } from '@/i18n/navigation'
import { useUserContext } from '@/context/UserContextProvider'

// ─────────────────────────────────────────────────────────────────────────────
// CSS de l'outil — page-scopé .m-tool, variables remappées sur les tokens du site
// (suit la bascule clair/sombre via html[data-theme]).
// ─────────────────────────────────────────────────────────────────────────────
const TOOL_CSS = `
.m-tool{
  --bg:var(--color-bg); --surface:var(--color-bg-card); --surface-2:var(--color-bg-alt);
  --text:var(--color-text); --text-soft:var(--color-text-soft); --text-faint:var(--color-text-muted);
  --line:var(--color-border); --line-2:rgba(128,128,128,.10);
  --accent:var(--color-primary); --accent-deep:var(--color-primary-dark); --accent-soft:rgba(239,108,26,.14);
  --warn:#b0510c; --warn-soft:rgba(176,81,12,.12);
  --shadow:0 1px 2px rgba(16,24,43,.05),0 14px 34px -16px rgba(16,24,43,.2);
  --font-display:Georgia,"Times New Roman",serif; --font-body:inherit;
  background:var(--bg);color:var(--text);
  font-family:var(--font-body);font-size:16px;line-height:1.55;-webkit-font-smoothing:antialiased;
}
html[data-theme="dark"] .m-tool{
  --warn:#f2a65a; --warn-soft:rgba(242,166,90,.15);
  --line-2:rgba(255,255,255,.05);
  --shadow:0 1px 2px rgba(0,0,0,.4),0 18px 40px -18px rgba(0,0,0,.6);
}
.m-tool *{box-sizing:border-box;margin:0;padding:0}
.m-tool .wrap{max-width:1080px;margin:0 auto;padding:26px 22px 70px}
.m-tool .crumb{font-size:.82rem;color:var(--text-faint);margin-bottom:18px}
.m-tool .crumb a{color:var(--text-soft);text-decoration:none}
.m-tool .crumb a:hover{color:var(--accent)}
.m-tool .crumb span{margin:0 7px;opacity:.5}
.m-tool .head{border-bottom:1px solid var(--line);padding-bottom:22px;margin-bottom:28px}
.m-tool .meta-row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:14px}
.m-tool .chip{display:inline-flex;gap:6px;align-items:center;font-size:.74rem;font-weight:700;
  letter-spacing:.04em;text-transform:uppercase;padding:5px 11px;border-radius:999px;
  background:var(--surface-2);border:1px solid var(--line);color:var(--text-soft)}
.m-tool .chip.pays{color:var(--text)}
.m-tool .chip.maj{color:var(--accent)}
.m-tool h1{font-family:var(--font-display);font-weight:600;font-size:clamp(1.8rem,4.2vw,2.7rem);
  line-height:1.06;letter-spacing:-.01em;max-width:24ch;margin-bottom:.3em}
.m-tool .lede{color:var(--text-soft);max-width:64ch;font-size:1.02rem}
.m-tool .grid{display:grid;grid-template-columns:1fr;gap:24px}
@media(min-width:920px){.m-tool .grid{grid-template-columns:1.12fr .88fr;align-items:start}}
.m-tool .card{background:var(--surface);border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);overflow:hidden}
.m-tool .card-h{padding:18px 22px 0}
.m-tool .card-h h2{font-family:var(--font-display);font-weight:600;font-size:1.2rem}
.m-tool .card-h p{color:var(--text-soft);font-size:.88rem;margin-top:2px}
.m-tool .card-b{padding:14px 22px 24px}
.m-tool .field{margin-top:18px}
.m-tool .flabel{display:block;font-weight:600;font-size:.9rem;margin-bottom:8px}
.m-tool .hint{font-weight:400;color:var(--text-soft);font-size:.8rem;display:block;margin-top:2px}
.m-tool input[type=number],.m-tool select{width:100%;font:inherit;color:var(--text);background:var(--surface-2);
  border:1.3px solid var(--line);border-radius:10px;padding:10px 12px;transition:border-color .15s,box-shadow .15s}
.m-tool input:focus,.m-tool select:focus{outline:none;border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-soft)}
.m-tool .row2{display:grid;grid-template-columns:1fr 1fr;gap:11px}
.m-tool .seg{display:flex;flex-wrap:wrap;gap:7px}
.m-tool .seg label{flex:1 1 auto;min-width:fit-content;position:relative;cursor:pointer}
.m-tool .seg input{position:absolute;opacity:0;inset:0;cursor:pointer}
.m-tool .seg .opt{display:block;text-align:center;padding:9px 13px;border:1.3px solid var(--line);
  border-radius:10px;font-size:.87rem;font-weight:600;background:var(--surface-2);color:var(--text-soft);
  transition:all .15s;white-space:nowrap}
.m-tool .seg input:checked+.opt{background:var(--accent-deep);border-color:var(--accent-deep);color:#fff}
.m-tool .seg input:focus-visible+.opt{box-shadow:0 0 0 3px var(--accent-soft)}
.m-tool .isuf{position:relative}
.m-tool .isuf .suf{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--text-faint);font-size:.82rem;font-weight:600;pointer-events:none}
.m-tool .isuf input{padding-right:60px}
.m-tool .mini-link{background:none;border:none;color:var(--accent);font:inherit;font-size:.8rem;font-weight:600;
  cursor:pointer;text-decoration:underline;text-underline-offset:2px;padding:0;margin-top:8px}
.m-tool .cond{display:none}
.m-tool .cond.show{display:block}
.m-tool .note-inline{font-size:.8rem;color:var(--text-soft);background:var(--surface-2);border-left:3px solid var(--accent);
  padding:9px 12px;border-radius:0 8px 8px 0;margin-top:10px}
.m-tool fieldset{border:none;border-top:1px dashed var(--line);margin-top:20px;padding-top:6px}
.m-tool legend{font-family:var(--font-display);font-size:.98rem;font-weight:600;padding-right:10px;color:var(--accent)}
.m-tool .creg{display:flex;justify-content:space-between;align-items:baseline;gap:10px;
  background:var(--accent-deep);color:#fff;border-radius:11px;padding:12px 15px;margin-top:11px}
.m-tool .creg .cl{font-size:.8rem;opacity:.92;max-width:21ch}
.m-tool .creg .cv{font-family:var(--font-display);font-weight:600;font-size:1.25rem;font-variant-numeric:tabular-nums}
.m-tool .sticky{position:sticky;top:16px}
.m-tool .r-label{font-size:.74rem;letter-spacing:.16em;text-transform:uppercase;color:var(--text-soft);font-weight:700}
.m-tool .r-amount{font-family:var(--font-display);font-weight:600;font-size:clamp(2.3rem,7vw,3.2rem);line-height:1;letter-spacing:-.02em;margin:6px 0 2px}
.m-tool .badge{display:inline-flex;gap:7px;align-items:center;font-size:.74rem;font-weight:700;letter-spacing:.04em;
  text-transform:uppercase;padding:6px 12px;border-radius:999px;margin-bottom:13px}
.m-tool .badge.ok{background:var(--accent-soft);color:var(--accent)}
.m-tool .badge.warn{background:var(--warn-soft);color:var(--warn)}
.m-tool .badge .bd{width:7px;height:7px;border-radius:50%;background:currentColor}
.m-tool .bdown{margin-top:16px;border-top:1px solid var(--line);padding-top:4px}
.m-tool .brow{display:flex;justify-content:space-between;gap:14px;padding:9px 0;border-bottom:1px solid var(--line-2);font-size:.9rem}
.m-tool .brow:last-child{border-bottom:none}
.m-tool .brow .bl{color:var(--text-soft)}
.m-tool .brow .bv{font-weight:600;font-variant-numeric:tabular-nums;text-align:right}
.m-tool .brow.total{border-top:1.5px solid var(--text);margin-top:4px;padding-top:11px}
.m-tool .brow.total .bl{color:var(--text);font-weight:700}
.m-tool .brow.total .bv{font-weight:800;font-size:1.1rem}
.m-tool .bv.tax{color:var(--warn)} .m-tool .bv.free{color:var(--accent)}
.m-tool .explain{margin-top:16px;background:var(--surface-2);border:1px solid var(--line);border-radius:11px;padding:13px 15px}
.m-tool .explain h3{font-size:.74rem;letter-spacing:.13em;text-transform:uppercase;color:var(--accent);margin-bottom:8px}
.m-tool .explain ol{margin:0;padding-left:18px}
.m-tool .explain li{font-size:.85rem;margin:7px 0;color:var(--text-soft)}
.m-tool .explain li b{color:var(--text)}
.m-tool .ref{margin-top:32px}
.m-tool .ref h2{font-family:var(--font-display);font-weight:600;font-size:1.32rem;margin-bottom:3px}
.m-tool .ref .lede{margin-bottom:14px}
.m-tool .tscroll{overflow-x:auto;border:1px solid var(--line);border-radius:13px;background:var(--surface);box-shadow:var(--shadow)}
.m-tool table{border-collapse:collapse;width:100%;min-width:540px;font-size:.88rem}
.m-tool th,.m-tool td{padding:10px 15px;text-align:right;font-variant-numeric:tabular-nums}
.m-tool th:first-child,.m-tool td:first-child{text-align:left}
.m-tool thead th{background:var(--accent-deep);color:#fff;font-weight:600;font-size:.8rem}
.m-tool tbody tr{border-top:1px solid var(--line-2)}
.m-tool tbody td:first-child{font-weight:600}
.m-tool .conf{display:inline-block;font-size:.66rem;font-weight:800;letter-spacing:.05em;padding:2px 7px;border-radius:5px}
.m-tool .conf.eleve{background:var(--accent-soft);color:var(--accent)}
.m-tool .conf.moyen{background:var(--warn-soft);color:var(--warn)}
.m-tool .src-soft{font-size:.74rem;color:var(--text-faint)}
.m-tool .ann{font-size:.74rem;color:var(--text-faint);margin-top:8px}
.m-tool .disc{margin-top:26px;background:var(--warn-soft);border:1px solid var(--line);border-radius:13px;padding:15px 17px;font-size:.85rem;color:var(--text);line-height:1.5}
.m-tool .disc b{color:var(--warn)}
.m-tool .sources{margin-top:24px;border-top:1px solid var(--line);padding-top:16px;font-size:.8rem;color:var(--text-soft)}
.m-tool .sources h3{font-size:.74rem;letter-spacing:.13em;text-transform:uppercase;color:var(--text-soft);margin-bottom:8px}
.m-tool .sources a{color:var(--accent)}
.m-tool .sources ul{list-style:none;padding:0;display:flex;flex-direction:column;gap:4px}
.m-tool .aside-wrap{margin-top:12px;padding:11px 13px;background:var(--surface-2);border:1px dashed var(--line);border-radius:10px}
.m-tool .aside-note{font-size:.8rem;color:var(--text-soft);line-height:1.5}
.m-tool .aside-note b{color:var(--text)}
.m-tool .inv-head{display:grid;grid-template-columns:1.4fr .8fr .9fr 34px;gap:8px;font-size:.7rem;color:var(--text-faint);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}
.m-tool .inv-row{display:grid;grid-template-columns:1.4fr .8fr .9fr 34px;gap:8px;align-items:center;margin-bottom:8px}
.m-tool .inv-row select,.m-tool .inv-row input{margin:0;padding:9px 10px}
.m-tool .inv-del{background:var(--surface-2);border:1px solid var(--line);color:var(--text-soft);border-radius:8px;height:38px;cursor:pointer;font-size:1.15rem;line-height:1;padding:0}
.m-tool .inv-del:hover{color:var(--warn);border-color:var(--warn)}
`

// ─────────────────────────────────────────────────────────────────────────────
// Markup de l'outil (injecté ; les IDs sont pilotés par runCalculator).
// ─────────────────────────────────────────────────────────────────────────────
const TOOL_HTML = `
<div class="wrap">
  <nav class="crumb" aria-label="Fil d'Ariane">
    <a href="/">Accueil</a><span>&rsaquo;</span>
    <a href="/outils">Outils</a><span>&rsaquo;</span>
    <a href="/recharge-electrique">Recharge</a><span>&rsaquo;</span>
    Recharge à domicile · voiture de société (BE)
  </nav>

  <header class="head">
    <div class="meta-row">
      <span class="chip pays">🇧🇪 Belgique</span>
      <span class="chip maj">Mis à jour le 1er juin 2026</span>
      <span class="chip">2 sources min. par chiffre</span>
      <span class="chip">Réservé aux membres · partageable</span>
    </div>
    <h1>Recharge électrique payée par l'employeur : quel montant est imposable&nbsp;? (Belgique)</h1>
    <p class="lede">Calculez l'<b>avantage de toute nature (ATN)</b> lié à l'électricité <b>fournie ou remboursée par l'employeur</b> pour recharger un véhicule — <b>voiture de société ou voiture privée du travailleur</b>, <b>à domicile ou en borne publique</b>. Calcul selon la circulaire <b>2024/C/77</b> ; le <b>barème CREG</b> trimestriel ne s'applique qu'à la recharge <b>à domicile d'une voiture de société</b>.</p>
  </header>

  <div class="grid">
    <section class="card" aria-label="Vos données">
      <div class="card-h"><h2>Vos données</h2><p>Le calcul se met à jour en temps réel.</p></div>
      <div class="card-b">

        <div class="field">
          <span class="flabel">1. Nature de l'arrangement
            <span class="hint">« Fourniture gratuite » = électricité facturée au nom de l'employeur — <b>y compris une carte/un badge de recharge fourni par l'employeur, même sur borne publique</b> (comme une carte carburant) : aucun ATN distinct. « Remboursement » = le travailleur paie puis est remboursé (points 3-7).</span>
          </span>
          <div class="seg" id="arrangement">
            <label><input type="radio" name="arr" value="remb" checked><span class="opt">Remboursement</span></label>
            <label><input type="radio" name="arr" value="fourn"><span class="opt">Fourniture gratuite</span></label>
          </div>
        </div>

        <div id="rembBlock">
          <div class="field">
            <span class="flabel">2. Véhicule rechargé</span>
            <div class="seg" id="vehicule">
              <label><input type="radio" name="veh" value="societe" checked><span class="opt">Voiture de société (élec./hybr.)</span></label>
              <label><input type="radio" name="veh" value="privee"><span class="opt">Voiture privée</span></label>
            </div>
          </div>

          <div class="field">
            <span class="flabel">3. Lieu de recharge
              <span class="hint">Sur borne publique avec une carte au nom de l'employeur, choisissez plutôt « Fourniture gratuite » ci-dessus : pas d'ATN. Cette section « Remboursement » vise le cas où le travailleur paie lui-même.</span>
            </span>
            <div class="seg" id="lieu">
              <label><input type="radio" name="lieu" value="domicile" checked><span class="opt">À domicile</span></label>
              <label><input type="radio" name="lieu" value="publique"><span class="opt">Borne publique</span></label>
            </div>
            <div class="cond note-inline" id="publiqueNote" style="border-left-color:var(--warn)">
              <b>Borne publique payée par le travailleur.</b> Le barème CREG ne s'applique pas (il ne vise que la recharge à domicile). Le remboursement est ici évalué selon la nature des trajets ci-dessous ; certains conseillers le traitent toutefois comme un ATN intégralement imposable. À valider avec votre conseiller fiscal.
            </div>
          </div>

          <div class="cond" id="condBlock">
            <fieldset>
              <legend>Conditions de l'exception (points 14-21)</legend>
              <div class="field" style="margin-top:8px">
                <span class="flabel">Borne / chargeur équipé d'un système de communication transmettant la consommation à l'employeur&nbsp;?
                  <span class="hint">Borne de l'employeur ou borne privée — du moment qu'elle communique la consommation de façon vérifiable.</span>
                </span>
                <div class="seg" id="comm">
                  <label><input type="radio" name="comm" value="oui" checked><span class="opt">Oui</span></label>
                  <label><input type="radio" name="comm" value="non"><span class="opt">Non</span></label>
                </div>
              </div>
              <div class="field">
                <span class="flabel">La « car policy » prévoit le remboursement de l'électricité rechargée&nbsp;?</span>
                <div class="seg" id="policy">
                  <label><input type="radio" name="policy" value="oui" checked><span class="opt">Oui</span></label>
                  <label><input type="radio" name="policy" value="non"><span class="opt">Non</span></label>
                </div>
              </div>
              <div class="field">
                <span class="flabel">Base du remboursement
                  <span class="hint">« Frais réels » = facture à l'appui (cas où une société de borne / CPO vous facture la consommation, que l'employeur rembourse). « Forfait » = montant fixe par kWh fixé par l'employeur.</span>
                </span>
                <div class="seg" id="base">
                  <label><input type="radio" name="base" value="forfait" checked><span class="opt">Forfait par kWh</span></label>
                  <label><input type="radio" name="base" value="reel"><span class="opt">Frais réels (facture)</span></label>
                </div>
                <p class="note-inline" id="baseNote" style="display:none">Frais réels justifiés : le plafond CREG ne s'applique pas. Veillez à ce que la facture porte <b>uniquement sur l'électricité de la voiture</b> — l'abonnement / les frais de gestion de la borne en sont exclus.</p>
              </div>
            </fieldset>
          </div>

          <div class="field">
            <span class="flabel">4. Région du domicile</span>
            <select id="region" aria-label="Région">
              <option value="fl">Région flamande</option>
              <option value="bxl">Région de Bruxelles-Capitale</option>
              <option value="wal">Région wallonne</option>
              <option value="unique">Tarif unique (le plus bas)</option>
            </select>
          </div>

          <div class="field">
            <span class="flabel">5. Mode de saisie
              <span class="hint">« Période unique » = un seul trimestre. « Détail par facture » = une ligne par facture CPO (par mois ou par trimestre), chacune comparée au plafond CREG de son trimestre.</span>
            </span>
            <div class="seg" id="entryMode">
              <label><input type="radio" name="emode" value="single" checked><span class="opt">Période unique</span></label>
              <label><input type="radio" name="emode" value="detail"><span class="opt">Détail par facture (CPO)</span></label>
            </div>
          </div>

          <div class="field" id="singleQuarterField">
            <span class="flabel">Trimestre de consommation</span>
            <select id="quarter" aria-label="Trimestre"></select>
            <div class="creg" id="cregReadout">
              <span class="cl">Plafond CREG applicable (montant fixe maximal)</span>
              <span class="cv" id="cregVal">—</span>
            </div>
          </div>

          <div class="field" id="kwhField">
            <span class="flabel">Électricité rechargée pour la voiture, sur la période</span>
            <div class="isuf"><input type="number" id="kwh" min="0" step="1" placeholder="ex. 600" value="600"><span class="suf">kWh</span></div>
          </div>

          <div class="field" id="methodField">
            <span class="flabel">Remboursement par l'employeur</span>
            <div class="seg" id="method" style="margin-bottom:10px">
              <label><input type="radio" name="meth" value="rate" checked><span class="opt">Tarif c€/kWh</span></label>
              <label><input type="radio" name="meth" value="total"><span class="opt">Montant total €</span></label>
            </div>
            <div id="rateWrap" class="isuf"><input type="number" id="rate" min="0" step="0.01" placeholder="ex. 28.22" value="28.22"><span class="suf">c€/kWh</span></div>
            <div id="totalWrap" class="isuf" style="display:none"><input type="number" id="total" min="0" step="0.01" placeholder="ex. 169.32"><span class="suf">€</span></div>
            <button class="mini-link" type="button" id="fillCreg">↧ Utiliser le plafond CREG comme tarif</button>
          </div>

          <div class="field cond" id="detailBlock">
            <span class="flabel">Factures (CPO) — détail par période
              <span class="hint">Saisissez chaque facture payée (par mois ou par trimestre). Chaque ligne est comparée au plafond CREG de son trimestre, et l'ATN est la somme des excédents.</span>
            </span>
            <div class="inv-head"><span>Période</span><span>kWh</span><span>€ remboursé</span><span></span></div>
            <div id="invRows"></div>
            <button class="mini-link" type="button" id="addInv">+ ajouter une facture</button>
          </div>

          <div class="field cond" id="subWrap">
            <span class="flabel">Abonnement / gestion de borne sur la facture
              <span class="hint">Montant facturé par la société de borne / CPO <b>hors</b> électricité voiture (abonnement, frais de gestion). Saisissez-le ici pour le garder distinct — il n'entre pas dans le remboursement d'électricité.</span>
            </span>
            <div class="isuf"><input type="number" id="subFee" min="0" step="0.01" placeholder="ex. 12.00" value="0"><span class="suf">€</span></div>
          </div>

          <div class="cond" id="splitBlock">
            <fieldset>
              <legend>Répartition par type de trajet</legend>
              <p class="note-inline" style="margin-top:0">Quand l'exception ne s'applique pas, l'imposition dépend de la nature du déplacement (points 9-12). Indiquez la part de chaque usage (%).</p>
              <div class="field" style="margin-top:14px">
                <div class="row2">
                  <div class="isuf"><label class="hint" style="margin-bottom:4px;display:block">Professionnels</label><input type="number" id="pProf" min="0" max="100" step="1" value="0"><span class="suf" style="top:auto;bottom:11px;transform:none">%</span></div>
                  <div class="isuf"><label class="hint" style="margin-bottom:4px;display:block">Domicile ↔ travail</label><input type="number" id="pCommute" min="0" max="100" step="1" value="0"><span class="suf" style="top:auto;bottom:11px;transform:none">%</span></div>
                </div>
                <div class="isuf" style="margin-top:10px"><label class="hint" style="margin-bottom:4px;display:block">Privés proprement dits</label><input type="number" id="pPriv" min="0" max="100" step="1" value="100" readonly style="opacity:.7"><span class="suf" style="top:auto;bottom:11px;transform:none">%</span></div>
              </div>
              <div class="field" id="commuteOpts">
                <span class="flabel">Frais professionnels du travailleur</span>
                <div class="seg" id="expense">
                  <label><input type="radio" name="exp" value="forfait" checked><span class="opt">Forfaitaires</span></label>
                  <label><input type="radio" name="exp" value="reels"><span class="opt">Réels (justifiés)</span></label>
                </div>
                <div class="isuf" style="margin-top:12px"><label class="hint" style="margin-bottom:4px;display:block">Exonération annuelle « frais de déplacement » disponible
                  <span class="hint">490 € pour l'ex. d'imp. 2025 (base 250 €) — montant indexé chaque année, plafond global de toutes les interventions de l'employeur.</span></label>
                  <input type="number" id="exoneration" min="0" step="1" value="490"><span class="suf">€</span></div>
              </div>
            </fieldset>
          </div>

          <div class="cond" id="borneBlock">
            <fieldset>
              <legend>Transfert de la borne (points 37-38)</legend>
              <div class="field" style="margin-top:8px">
                <span class="flabel">En fin de mise à disposition, la borne installée par l'employeur vous est-elle cédée gratuitement&nbsp;?</span>
                <div class="seg" id="transfert">
                  <label><input type="radio" name="trf" value="non" checked><span class="opt">Non</span></label>
                  <label><input type="radio" name="trf" value="oui"><span class="opt">Oui</span></label>
                </div>
                <div class="cond isuf" id="borneValWrap" style="margin-top:12px"><label class="hint" style="margin-bottom:4px;display:block">Valeur réelle de la borne au moment du transfert</label><input type="number" id="borneVal" min="0" step="1" value="0"><span class="suf">€</span></div>
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    </section>

    <section class="card" aria-label="Résultat" aria-live="polite">
      <div class="sticky"><div class="card-b">
        <div class="r-label">Avantage de toute nature imposable</div>
        <div class="r-amount" id="atnAmount">0,00 €</div>
        <span class="badge ok" id="statusBadge"><span class="bd"></span> Non imposable</span>
        <div class="bdown" id="breakdown"></div>
        <div class="explain"><h3>Comment ce montant est obtenu</h3><ol id="steps"></ol></div>
      </div></div>
    </section>
  </div>

  <section class="ref">
    <h2>Barème CREG — montant fixe maximal par kWh</h2>
    <p class="lede">Plafond de remboursement non imposable, par région et par trimestre. Niveau de confiance affiché par ligne.</p>
    <div class="tscroll">
      <table>
        <thead><tr><th>Trimestre</th><th>Flandre</th><th>Bruxelles-Cap.</th><th>Wallonie</th><th>Source</th><th>Confiance</th></tr></thead>
        <tbody id="cregTable"></tbody>
      </table>
    </div>
    <p class="ann">Valeurs en centimes d'euro / kWh. <b>ÉLEVÉ</b> = montant repris d'une circulaire officielle (Fisconet). <b>MOYEN</b> = montant communiqué par les secrétariats sociaux sur base du tarif CREG, en attente de confirmation de la publication officielle.</p>
  </section>

  <div class="disc">
    <b>Avertissement.</b> Outil d'estimation à titre informatif fondé sur la circulaire 2024/C/77 et ses addenda — pays applicable : <b>Belgique</b>. Il ne constitue ni un avis fiscal, ni une décision de l'administration, ni un conseil financier personnalisé. La qualification définitive (preuve des frais propres à l'employeur, justification des frais réels, exactitude du compteur, plafond d'exonération indexé, etc.) dépend des faits propres à chaque dossier. En cas de doute : secrétariat social, conseiller fiscal ou SPF Finances.
  </div>

  <section class="sources">
    <h3>Sources officielles</h3>
    <ul>
      <li>SPF Finances — Circulaire 2024/C/77 du 05.12.2024 (Fisconet)</li>
      <li>Addenda : 2025/C/14 (T2 2025) · 2025/C/38 (T3 2025, application permanente) · 2025/C/60 (T4 2025) · 2025/C/72 (T1 2026) · 2026/C/44 (T2 2026)</li>
      <li>Tarif CREG : <a href="https://www.creg.be/fr/consommateurs/prix-et-tarifs/tarif-creg-pour-le-remboursement-de-la-recharge-a-domicile-des" target="_blank" rel="noopener">creg.be</a></li>
    </ul>
  </section>
</div>
`

// ─────────────────────────────────────────────────────────────────────────────
// Logique de calcul (scopée au conteneur).
// ─────────────────────────────────────────────────────────────────────────────
function runCalculator(root: HTMLElement): () => void {
  const CREG: Record<string, { fl: number; bxl: number; wal: number; circ: string; conf: string }> = {
    '2025-T1': { fl: 28.22, bxl: 32.94, wal: 32.56, circ: '2024/C/77', conf: 'eleve' },
    '2025-T2': { fl: 31.94, bxl: 35.85, wal: 36.17, circ: '2025/C/14', conf: 'eleve' },
    '2025-T3': { fl: 34.56, bxl: 37.87, wal: 38.43, circ: '2025/C/38', conf: 'eleve' },
    '2025-T4': { fl: 30.70, bxl: 33.56, wal: 34.57, circ: '2025/C/60', conf: 'eleve' },
    '2026-T1': { fl: 31.32, bxl: 34.26, wal: 35.23, circ: '2025/C/72', conf: 'eleve' },
    '2026-T2': { fl: 31.91, bxl: 35.55, wal: 36.36, circ: '2026/C/44', conf: 'eleve' },
    '2026-T3': { fl: 32.22, bxl: 37.19, wal: 37.83, circ: 'addendum', conf: 'moyen' },
  }
  const QLABEL: Record<string, string> = {
    '2025-T1': '1er trim. 2025', '2025-T2': '2e trim. 2025', '2025-T3': '3e trim. 2025',
    '2025-T4': '4e trim. 2025', '2026-T1': '1er trim. 2026', '2026-T2': '2e trim. 2026', '2026-T3': '3e trim. 2026',
  }
  const CONFLABEL: Record<string, string> = { eleve: 'ÉLEVÉ', moyen: 'MOYEN' }
  const MONTH_NAMES = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
  const MONTHS: { value: string; label: string; q: string }[] = []
  ;[2025, 2026].forEach((y) => {
    const last = y === 2026 ? 9 : 12
    for (let m = 1; m <= last; m++) {
      const q = y + '-T' + Math.ceil(m / 3)
      if (!CREG[q]) continue
      MONTHS.push({ value: 'M' + y + '-' + String(m).padStart(2, '0'), label: MONTH_NAMES[m - 1] + ' ' + y, q })
    }
  })
  const quarterOf = (period: string) => {
    if (period.charAt(0) === 'M') { const mo = MONTHS.find((x) => x.value === period); return mo ? mo.q : '2025-T1' }
    return period
  }

  const $ = (id: string) => root.querySelector('#' + id) as any
  const fmtE = (v: number) => v.toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'
  const fmtC = (v: number) => v.toLocaleString('fr-BE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' c€/kWh'
  const fmtK = (v: number) => v.toLocaleString('fr-BE', { maximumFractionDigits: 0 })
  const val = (name: string) => (root.querySelector('input[name="' + name + '"]:checked') as HTMLInputElement).value
  const clampPct = (v: any) => { v = parseFloat(v) || 0; return Math.min(100, Math.max(0, Math.round(v))) }
  const cregFor = (region: string, quarter: string) => {
    const c = CREG[quarter]
    return region === 'unique' ? Math.min(c.fl, c.bxl, c.wal) : (c as any)[region]
  }
  let _aside = ''

  // init du select trimestre (mode période unique)
  const q = $('quarter')
  Object.keys(CREG).forEach((k) => { const o = document.createElement('option'); o.value = k; o.textContent = QLABEL[k]; q.appendChild(o) })
  q.value = '2025-T1'

  // tableau de référence CREG
  const tb = $('cregTable')
  Object.keys(CREG).forEach((k) => {
    const c = CREG[k]; const tr = document.createElement('tr')
    tr.innerHTML = `<td>${QLABEL[k]}</td><td>${c.fl.toFixed(2)}</td><td>${c.bxl.toFixed(2)}</td><td>${c.wal.toFixed(2)}</td>` +
      `<td class="src-soft">${c.circ}</td><td><span class="conf ${c.conf}">${CONFLABEL[c.conf]}</span></td>`
    tb.appendChild(tr)
  })

  // ── lignes de factures (mode détail) ──
  function buildPeriodOptions(sel: HTMLSelectElement) {
    const ogQ = document.createElement('optgroup'); ogQ.label = 'Trimestres'
    Object.keys(CREG).forEach((k) => { const o = document.createElement('option'); o.value = k; o.textContent = QLABEL[k]; ogQ.appendChild(o) })
    const ogM = document.createElement('optgroup'); ogM.label = 'Mois'
    MONTHS.forEach((mo) => { const o = document.createElement('option'); o.value = mo.value; o.textContent = mo.label; ogM.appendChild(o) })
    sel.appendChild(ogQ); sel.appendChild(ogM)
  }
  const invRows = $('invRows')
  function addInvRow(period?: string, kwh?: number, eur?: number) {
    const rowEl = document.createElement('div'); rowEl.className = 'inv-row'
    const sel = document.createElement('select'); sel.className = 'inv-period'; buildPeriodOptions(sel); sel.value = period || '2025-T1'
    const inK = document.createElement('input'); inK.type = 'number'; inK.className = 'inv-kwh'; inK.min = '0'; inK.step = '1'; inK.placeholder = 'kWh'; inK.value = kwh != null ? String(kwh) : ''
    const inE = document.createElement('input'); inE.type = 'number'; inE.className = 'inv-eur'; inE.min = '0'; inE.step = '0.01'; inE.placeholder = '€ remb.'; inE.value = eur != null ? String(eur) : ''
    const del = document.createElement('button'); del.type = 'button'; del.className = 'inv-del'; del.textContent = '×'; del.setAttribute('aria-label', 'Supprimer la ligne')
    del.addEventListener('click', () => { rowEl.remove(); compute() })
    rowEl.appendChild(sel); rowEl.appendChild(inK); rowEl.appendChild(inE); rowEl.appendChild(del)
    invRows.appendChild(rowEl)
  }
  addInvRow('2025-T1', 300, 84)
  addInvRow('2025-T2', 250, 80)
  const addBtn = $('addInv')
  const addHandler = () => { addInvRow(); compute() }
  addBtn.addEventListener('click', addHandler)

  function gatherDetail() {
    const lines: { q: string; kwh: number; eur: number }[] = []
    root.querySelectorAll('.inv-row').forEach((r) => {
      const period = (r.querySelector('.inv-period') as HTMLSelectElement).value
      const kwh = Math.max(0, parseFloat((r.querySelector('.inv-kwh') as HTMLInputElement).value) || 0)
      const eur = Math.max(0, parseFloat((r.querySelector('.inv-eur') as HTMLInputElement).value) || 0)
      lines.push({ q: quarterOf(period), kwh, eur })
    })
    return lines
  }

  function render({ atn, status, statusTxt, rows, steps }: any) {
    $('atnAmount').textContent = fmtE(atn)
    $('atnAmount').style.color = atn > 0 ? 'var(--warn)' : 'var(--accent)'
    const b = $('statusBadge'); b.className = 'badge ' + (status === 'warn' ? 'warn' : 'ok'); b.innerHTML = '<span class="bd"></span> ' + statusTxt
    const bd = $('breakdown'); bd.innerHTML = ''
    rows.forEach(([l, v, cls]: any) => { const d = document.createElement('div'); d.className = 'brow'; d.innerHTML = `<span class="bl">${l}</span><span class="bv ${cls || ''}">${v}</span>`; bd.appendChild(d) })
    const t = document.createElement('div'); t.className = 'brow total'; t.innerHTML = `<span class="bl">ATN imposable total</span><span class="bv ${atn > 0 ? 'tax' : 'free'}">${fmtE(atn)}</span>`; bd.appendChild(t)
    if (_aside) { const a = document.createElement('div'); a.className = 'aside-wrap'; a.innerHTML = _aside; bd.appendChild(a) }
    const ol = $('steps'); ol.innerHTML = ''; steps.forEach((s: string) => { const li = document.createElement('li'); li.innerHTML = s; ol.appendChild(li) })
  }

  function compute() {
    _aside = ''
    const arr = val('arr')
    const region = $('region').value
    const mode = val('emode')
    const quarter = $('quarter').value
    const cregMax = cregFor(region, quarter)
    $('cregVal').textContent = fmtC(cregMax)

    if (arr === 'fourn') {
      return render({
        atn: 0, status: 'ok', statusTxt: 'Aucun avantage distinct',
        rows: [['Avantage électricité distinct', '0,00 €', 'free']],
        steps: ["L'électricité est facturée <b>au nom de l'employeur</b> : <b>fourniture gratuite</b> (points 3-5).",
          "Elle est <b>comprise dans l'avantage forfaitaire de la voiture</b> (art. 36, §2 CIR 92). Pas d'ATN électricité supplémentaire.",
          "Seul l'ATN forfaitaire « voiture » reste imposable — calculé séparément."],
      })
    }

    const veh = val('veh'), lieu = val('lieu')

    // rassemble kWh & remboursement selon le mode
    let kwh = 0, reimb = 0
    let detail: { q: string; kwh: number; eur: number }[] | null = null
    if (mode === 'detail') {
      detail = gatherDetail()
      kwh = detail.reduce((s, l) => s + l.kwh, 0)
      reimb = detail.reduce((s, l) => s + l.eur, 0)
    } else {
      kwh = Math.max(0, parseFloat($('kwh').value) || 0)
      const meth = val('meth')
      if (meth === 'rate') { const rate = Math.max(0, parseFloat($('rate').value) || 0); reimb = kwh * rate / 100 }
      else { reimb = Math.max(0, parseFloat($('total').value) || 0) }
    }
    const rateSingle = kwh > 0 ? reimb / kwh * 100 : 0

    let borneAdd = 0, borneStep: string | null = null
    if (val('trf') === 'oui') {
      borneAdd = Math.max(0, parseFloat($('borneVal').value) || 0)
      borneStep = `<b>Transfert de la borne</b> : sa valeur réelle (${fmtE(borneAdd)}) constitue un ATN distinct (points 37-38).`
    }

    const sub = Math.max(0, parseFloat(($('subFee') || {}).value) || 0)
    if (sub > 0 && veh === 'societe') {
      _aside = `<div class="aside-note"><b>Abonnement / gestion de borne : ${fmtE(sub)}</b> — poste distinct du remboursement d'électricité, <b>non compté</b> dans l'ATN ci-dessus. À qualifier selon votre car policy (mise à disposition de la borne, point 16) ; faites confirmer son traitement par votre secrétariat social ou conseiller.</div>`
    }

    const exceptionEligible = (veh === 'societe' && lieu === 'domicile')
    const comm = exceptionEligible ? val('comm') === 'oui' : false
    const policy = exceptionEligible ? val('policy') === 'oui' : false
    const exceptionApplies = exceptionEligible && comm && policy

    if (exceptionApplies) {
      const base = val('base')
      if (base === 'reel') {
        const atn = borneAdd
        const rows: any[] = [["Frais d'électricité réels remboursés", fmtE(reimb), 'free'], ["Couvert (facture à l'appui)", '− ' + fmtE(reimb), 'free']]
        if (borneAdd > 0) rows.push(['Transfert de borne', fmtE(borneAdd), 'tax'])
        const steps = ['Voiture de société + recharge à domicile + borne communicante + « car policy » : <b>l\'exception s\'applique</b> (points 13-21).',
          'Remboursement basé sur vos <b>frais réels justifiés par facture</b> (point 22) → <b>entièrement couvert</b>, comme une carte carburant. Le plafond CREG ne borne que la méthode <i>forfaitaire</i>.',
          'Condition : la facture doit porter <b>uniquement sur l\'électricité de la voiture de société</b> (point 14) — hors abonnement / frais de gestion de la borne.',
          'Seul l\'ATN forfaitaire « voiture » reste dû (calculé séparément).']
        if (borneStep) steps.push(borneStep)
        return render({ atn, status: atn > 0 ? 'warn' : 'ok', statusTxt: atn > 0 ? 'Borne imposable' : 'Non imposable', rows, steps })
      }

      // base forfait
      if (mode === 'detail') {
        const byQ: Record<string, { kwh: number; eur: number }> = {}
        ;(detail as any[]).forEach((l) => { if (!byQ[l.q]) byQ[l.q] = { kwh: 0, eur: 0 }; byQ[l.q].kwh += l.kwh; byQ[l.q].eur += l.eur })
        const qs = Object.keys(byQ).sort()
        let coveredTotal = 0, excessTotal = 0
        const rows: any[] = []
        qs.forEach((qk) => {
          const cmax = cregFor(region, qk)
          const ceiling = byQ[qk].kwh * cmax / 100
          coveredTotal += Math.min(byQ[qk].eur, ceiling)
          const exc = Math.max(0, byQ[qk].eur - ceiling)
          excessTotal += exc
          rows.push([`${QLABEL[qk]} — ${fmtK(byQ[qk].kwh)} kWh × ${fmtC(cmax)}`, fmtE(exc), exc > 0 ? 'tax' : 'free'])
        })
        rows.push(['Total remboursé', fmtE(reimb), ''])
        rows.push(['Couvert par les plafonds CREG', '− ' + fmtE(coveredTotal), 'free'])
        if (borneAdd > 0) rows.push(['Transfert de borne', fmtE(borneAdd), 'tax'])
        const atn = excessTotal + borneAdd
        const steps = ['Voiture de société + recharge à domicile + borne communicante + « car policy » : <b>l\'exception s\'applique</b> (points 13-21).',
          'Saisie détaillée par facture : chaque période est comparée au <b>plafond CREG de son propre trimestre</b> (alignement CREG, point 24).',
          'Par trimestre : excédent = remboursement − (kWh × plafond CREG du trimestre), borné à zéro. L\'ATN est la <b>somme des excédents trimestriels</b>.']
        if (excessTotal === 0) steps.push('Toutes les périodes sont sous leur plafond → <b>aucun ATN supplémentaire</b> (comme une carte carburant).')
        if (borneStep) steps.push(borneStep)
        const statusTxt = atn > 0 ? (excessTotal > 0 ? 'Partiellement imposable' : 'Borne imposable') : 'Non imposable'
        return render({ atn, status: atn > 0 ? 'warn' : 'ok', statusTxt, rows, steps })
      }

      // forfait — période unique
      const ceiling = kwh * cregMax / 100
      if (rateSingle <= cregMax + 1e-9) {
        const atn = borneAdd
        const rows: any[] = [['Électricité remboursée', '0,00 €', 'free']]
        if (borneAdd > 0) rows.push(['Transfert de borne', fmtE(borneAdd), 'tax'])
        const steps = ['Voiture de société + recharge à domicile + borne communicante + « car policy » : <b>l\'exception s\'applique</b> (points 13-21).',
          `Tarif appliqué (${fmtC(rateSingle)}) <b>≤ plafond CREG</b> (${fmtC(cregMax)}) → remboursement <b>entièrement couvert</b>.`,
          'Comme une carte carburant : <b>aucun ATN supplémentaire</b>. Seul l\'ATN forfaitaire « voiture » reste dû.']
        if (borneStep) steps.push(borneStep)
        return render({ atn, status: atn > 0 ? 'warn' : 'ok', statusTxt: atn > 0 ? 'Borne imposable' : 'Non imposable', rows, steps })
      } else {
        const excess = reimb - ceiling, atn = excess + borneAdd
        const rows: any[] = [['Remboursement total', fmtE(reimb), ''], ['Couvert par le plafond CREG', '− ' + fmtE(ceiling), 'free'], ['Excédent hors tolérance', fmtE(excess), 'tax']]
        if (borneAdd > 0) rows.push(['Transfert de borne', fmtE(borneAdd), 'tax'])
        const steps = ['L\'exception s\'applique, <b>mais</b> le tarif forfaitaire dépasse le plafond CREG.',
          `Tarif ${fmtC(rateSingle)} &gt; plafond ${fmtC(cregMax)}. La tolérance « montant fixe » ne vaut que <b>jusqu'au plafond</b> (point 24).`,
          `Part couverte : ${fmtE(ceiling)}. <b>Excédent : ${fmtE(excess)}</b> → imposable, sauf justification de frais réels supérieurs (point 22).`]
        if (borneStep) steps.push(borneStep)
        return render({ atn, status: 'warn', statusTxt: 'Partiellement imposable', rows, steps })
      }
    }

    // exception non applicable → répartition par nature de trajet
    const pProf = clampPct($('pProf').value), pCommute = clampPct($('pCommute').value)
    let pPriv = 100 - pProf - pCommute; if (pPriv < 0) pPriv = 0; $('pPriv').value = pPriv
    const profAmt = reimb * pProf / 100, commuteAmt = reimb * pCommute / 100, privAmt = reimb * pPriv / 100
    const expType = val('exp'), exo = Math.max(0, parseFloat($('exoneration').value) || 0)
    let commuteTax = commuteAmt, commuteNote: string
    if (expType === 'forfait') { commuteTax = Math.max(0, commuteAmt - exo); commuteNote = `exonéré jusqu'à ${fmtE(exo)} (frais forfaitaires)` }
    else { commuteNote = 'frais réels : pas d\'exonération de 490 €' }
    const atn = commuteTax + privAmt + borneAdd

    const why = veh === 'privee' ? 'Voiture <b>privée</b> du travailleur' : lieu === 'publique' ? 'Recharge à une <b>borne publique</b>' : 'Recharge à domicile <b>sans toutes les conditions</b> de l\'exception'
    const rows: any[] = [['Trajets professionnels (' + pProf + '%)', '0,00 €', 'free'], ['Domicile ↔ travail (' + pCommute + '%)', fmtE(commuteTax), 'tax'], ['Trajets privés (' + pPriv + '%)', fmtE(privAmt), 'tax']]
    if (borneAdd > 0) rows.push(['Transfert de borne', fmtE(borneAdd), 'tax'])
    const steps = [`${why} → l'exception ne s'applique pas ; on suit la <b>nature du déplacement</b> (points 9-12).`,
      `<b>Professionnels</b> (${fmtE(profAmt)}) : frais propres à l'employeur → <b>non imposable</b>, moyennant double preuve (point 10).`,
      `<b>Domicile-travail</b> (${fmtE(commuteAmt)}) : ATN imposable, ${commuteNote} → <b>${fmtE(commuteTax)}</b> (point 11).`,
      `<b>Privés</b> (${fmtE(privAmt)}) : intégralement imposable (point 12).`]
    if (borneStep) steps.push(borneStep)
    return render({ atn, status: atn > 0 ? 'warn' : 'ok', statusTxt: atn > 0 ? 'Imposable' : 'Non imposable', rows, steps })
  }

  function refreshVisibility() {
    const arr = val('arr'); $('rembBlock').style.display = arr === 'fourn' ? 'none' : 'block'
    const veh = val('veh'), lieu = val('lieu')
    const mode = val('emode'); const isDetail = mode === 'detail'
    $('publiqueNote').classList.toggle('show', arr === 'remb' && lieu === 'publique')
    const exceptionEligible = (veh === 'societe' && lieu === 'domicile')
    $('condBlock').classList.toggle('show', exceptionEligible)
    const comm = exceptionEligible ? val('comm') === 'oui' : false, policy = exceptionEligible ? val('policy') === 'oui' : false
    const exceptionApplies = exceptionEligible && comm && policy
    $('singleQuarterField').style.display = isDetail ? 'none' : 'block'
    $('kwhField').style.display = isDetail ? 'none' : 'block'
    $('methodField').style.display = isDetail ? 'none' : 'block'
    $('detailBlock').classList.toggle('show', isDetail)
    $('splitBlock').classList.toggle('show', arr === 'remb' && !exceptionApplies)
    $('commuteOpts').style.display = (clampPct($('pCommute').value) > 0) ? 'block' : 'none'
    $('subWrap').classList.toggle('show', arr === 'remb' && veh === 'societe')
    $('borneBlock').classList.toggle('show', arr === 'remb' && veh === 'societe')
    $('borneValWrap').classList.toggle('show', val('trf') === 'oui')
    const baseNote = $('baseNote')
    if (baseNote) baseNote.style.display = (exceptionEligible && val('base') === 'reel') ? 'block' : 'none'
    $('rateWrap').style.display = val('meth') === 'rate' ? 'block' : 'none'
    $('totalWrap').style.display = val('meth') === 'total' ? 'block' : 'none'
  }

  const handler = () => { refreshVisibility(); compute() }
  const fillCregHandler = () => {
    const m = cregFor($('region').value, $('quarter').value)
    ;(root.querySelector('input[name="meth"][value="rate"]') as HTMLInputElement).checked = true
    $('rate').value = m.toFixed(2); refreshVisibility(); compute()
  }
  root.addEventListener('input', handler)
  root.addEventListener('change', handler)
  $('fillCreg').addEventListener('click', fillCregHandler)
  refreshVisibility(); compute()

  return () => {
    root.removeEventListener('input', handler)
    root.removeEventListener('change', handler)
    const fc = root.querySelector('#fillCreg'); if (fc) fc.removeEventListener('click', fillCregHandler)
    const ab = root.querySelector('#addInv'); if (ab) ab.removeEventListener('click', addHandler)
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant : gate auth + barre de partage + outil.
// ─────────────────────────────────────────────────────────────────────────────
export default function RechargeDomicileContent() {
  const { isReady, userId } = useUserContext()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [shareMsg, setShareMsg] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || !userId) return
    const root = rootRef.current
    if (!root) return
    const cleanup = runCalculator(root)
    return cleanup
  }, [mounted, userId])

  async function handleShare() {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://moteurs.com/outils/recharge-domicile-voiture-societe-belgique'
    const titre = 'Calculateur ATN recharge à domicile (BE) — Moteurs.com'
    try {
      if (typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({ title: titre, url })
        return
      }
    } catch { /* partage natif annulé */ }
    try {
      await navigator.clipboard.writeText(url)
      setShareMsg('Lien copié — envoyez-le à un ami ✓')
      setTimeout(() => setShareMsg(''), 3500)
    } catch {
      setShareMsg(url)
    }
  }

  if (!mounted || !isReady) {
    return <div style={{ minHeight: '60vh' }} />
  }

  if (!userId) {
    return (
      <section style={{ maxWidth: 560, margin: '0 auto', padding: '64px 22px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.6rem', marginBottom: 14 }}>🔒</div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 12, color: 'var(--color-text)' }}>
          Outil réservé aux membres
        </h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 26 }}>
          Le calculateur ATN « recharge électrique payée par l'employeur (BE) » est accessible
          gratuitement aux membres connectés. Connectez-vous ou créez un compte en 30 secondes —
          puis partagez le lien à un collègue ou un ami (il lui suffira d'être connecté pour l'ouvrir).
        </p>
        <Link
          href={`/espace-membres?next=${encodeURIComponent(pathname)}`}
          style={{
            display: 'inline-block', background: 'var(--color-primary)', color: '#fff',
            fontWeight: 700, padding: '12px 26px', borderRadius: 10, textDecoration: 'none',
          }}
        >
          Se connecter / s'inscrire →
        </Link>
        <div style={{ marginTop: 18 }}>
          <Link href="/outils" style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
            ← Tous les outils
          </Link>
        </div>
      </section>
    )
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: TOOL_CSS }} />
      <div style={{
        maxWidth: 1080, margin: '0 auto', padding: '18px 22px 0',
        display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'flex-end',
      }}>
        {shareMsg && (
          <span style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 600 }}>{shareMsg}</span>
        )}
        <button
          type="button"
          onClick={handleShare}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            background: 'var(--color-primary)', color: '#fff', border: 'none',
            fontWeight: 700, fontSize: '0.88rem', padding: '9px 18px', borderRadius: 999,
          }}
        >
          🔗 Partager à un ami
        </button>
      </div>
      <main className="m-tool" ref={rootRef} dangerouslySetInnerHTML={{ __html: TOOL_HTML }} />
    </>
  )
}
