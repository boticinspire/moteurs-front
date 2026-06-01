'use client'

import { useEffect, useRef, useState } from 'react'
import { useLocale } from 'next-intl'
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
// HTML markup — versions localisées (EN / NL / DE)
// Extraites des fichiers de traduction D:\Moteurs.com\Design\atn
// ─────────────────────────────────────────────────────────────────────────────
const TOOL_HTML_EN = `
  <div class="wrap">

    <nav class="crumb" aria-label="Breadcrumb">
      <a href="https://moteurs.com/">Home</a><span>›</span>
      <a href="https://moteurs.com/outils">Tools</a><span>›</span>
      <a href="https://moteurs.com/recharge-electrique">Charging</a><span>›</span>
      Home charging · company car (BE)
    </nav>

    <header class="head">
      <div class="meta-row">
        <span class="chip pays">🇧🇪 Belgium</span>
        <span class="chip maj">Updated June 1, 2026</span>
        <span class="chip">2 sources min. per figure</span>
        <span class="chip">Free · no registration</span>
      </div>
      <h1>Home charging of a company car: what amount is taxable&nbsp;?</h1>
      <p class="lede">Simulate the tax treatment of the <b>employer reimbursement of electricity costs</b> for home charging, for the employee or executive — based on circular <b>2024/C/77</b> and the quarterly CREG rate schedule.</p>
    </header>

    <div class="grid">
      <!-- ============== FORMULAIRE ============== -->
      <section class="card" aria-label="Your details">
        <div class="card-h"><h2>Your details</h2><p>The calculation updates in real time.</p></div>
        <div class="card-b">

          <div class="field">
            <span class="flabel">1. Type of arrangement
              <span class="hint">"Free supply" = electricity invoiced in the employer's name. "Reimbursement" = invoiced in the employee's name, then reimbursed (points 3-7).</span>
            </span>
            <div class="seg" id="arrangement">
              <label><input type="radio" name="arr" value="remb" checked><span class="opt">Reimbursement</span></label>
              <label><input type="radio" name="arr" value="fourn"><span class="opt">Free supply</span></label>
            </div>
          </div>

          <div id="rembBlock">
            <div class="field">
              <span class="flabel">2. Vehicle charged</span>
              <div class="seg" id="vehicule">
                <label><input type="radio" name="veh" value="societe" checked><span class="opt">Company car (elec./hybrid)</span></label>
                <label><input type="radio" name="veh" value="privee"><span class="opt">Private vehicle</span></label>
              </div>
            </div>

            <div class="field">
              <span class="flabel">3. Charging location</span>
              <div class="seg" id="lieu">
                <label><input type="radio" name="lieu" value="domicile" checked><span class="opt">At home</span></label>
                <label><input type="radio" name="lieu" value="publique"><span class="opt">Public charging station</span></label>
              </div>
            </div>

            <div class="cond" id="condBlock">
              <fieldset>
                <legend>Conditions for the exemption (points 14-21)</legend>
                <div class="field" style="margin-top:8px">
                  <span class="flabel">Charging station / charger equipped with a communication system transmitting consumption data to the employer&nbsp;?
                    <span class="hint">Employer-owned charger or private charger — as long as it communicates consumption in a verifiable way.</span>
                  </span>
                  <div class="seg" id="comm">
                    <label><input type="radio" name="comm" value="oui" checked><span class="opt">Yes</span></label>
                    <label><input type="radio" name="comm" value="non"><span class="opt">No</span></label>
                  </div>
                </div>
                <div class="field">
                  <span class="flabel">Does the car policy provide for reimbursement of charged electricity&nbsp;?</span>
                  <div class="seg" id="policy">
                    <label><input type="radio" name="policy" value="oui" checked><span class="opt">Yes</span></label>
                    <label><input type="radio" name="policy" value="non"><span class="opt">No</span></label>
                  </div>
                </div>
                <div class="field">
                  <span class="flabel">Reimbursement basis
                    <span class="hint">"Actual costs" = supported by invoice (case where a charging station provider invoices the consumption, which the employer reimburses). "Flat rate" = fixed amount per kWh set by the employer.</span>
                  </span>
                  <div class="seg" id="base">
                    <label><input type="radio" name="base" value="forfait" checked><span class="opt">Flat rate per kWh</span></label>
                    <label><input type="radio" name="base" value="reel"><span class="opt">Actual costs (invoice)</span></label>
                  </div>
                  <p class="note-inline" id="baseNote" style="display:none">Actual costs supported by evidence: the CREG ceiling does not apply. Make sure the invoice covers <b>only the electricity for the vehicle</b> — the subscription / charger management fees are excluded.</p>
                </div>
              </fieldset>
            </div>

            <div class="field">
              <span class="flabel">4. Home region &amp; consumption quarter</span>
              <div class="row2">
                <select id="region" aria-label="Region">
                  <option value="fl">Flemish Region</option>
                  <option value="bxl">Brussels-Capital Region</option>
                  <option value="wal">Walloon Region</option>
                  <option value="unique">Flat rate (lowest)</option>
                </select>
                <select id="quarter" aria-label="Quarter"></select>
              </div>
              <div class="creg">
                <span class="cl">Applicable CREG ceiling (maximum fixed amount)</span>
                <span class="cv" id="cregVal">—</span>
              </div>
            </div>

            <div class="field">
              <span class="flabel">5. Electricity charged for the vehicle, over the period</span>
              <div class="isuf"><input type="number" id="kwh" min="0" step="1" placeholder="e.g. 600" value="600"><span class="suf">kWh</span></div>
            </div>

            <div class="field">
              <span class="flabel">6. Employer reimbursement</span>
              <div class="seg" id="method" style="margin-bottom:10px">
                <label><input type="radio" name="meth" value="rate" checked><span class="opt">Rate c€/kWh</span></label>
                <label><input type="radio" name="meth" value="total"><span class="opt">Total amount €</span></label>
              </div>
              <div id="rateWrap" class="isuf"><input type="number" id="rate" min="0" step="0.01" placeholder="e.g. 28.22" value="28.22"><span class="suf">c€/kWh</span></div>
              <div id="totalWrap" class="isuf" style="display:none"><input type="number" id="total" min="0" step="0.01" placeholder="e.g. 169.32"><span class="suf">€</span></div>
              <button class="mini-link" type="button" id="fillCreg">↧ Use CREG ceiling as rate</button>
            </div>

            <div class="field cond" id="subWrap">
              <span class="flabel">7. Subscription / charger management on the invoice
                <span class="hint">Amount invoiced by the charging station provider <b>excluding</b> vehicle electricity (subscription, management fees / CPO). Enter it here to keep it separate — it is not included in the electricity reimbursement.</span>
              </span>
              <div class="isuf"><input type="number" id="subFee" min="0" step="0.01" placeholder="e.g. 12.00" value="0"><span class="suf">€</span></div>
            </div>

            <div class="cond" id="splitBlock">
              <fieldset>
                <legend>Breakdown by journey type</legend>
                <p class="note-inline" style="margin-top:0">When the exemption does not apply, taxation depends on the nature of the trip (points 9-12). Indicate the share of each use (%).</p>
                <div class="field" style="margin-top:14px">
                  <div class="row2">
                    <div class="isuf"><label class="hint" style="margin-bottom:4px;display:block">Professional</label><input type="number" id="pProf" min="0" max="100" step="1" value="0"><span class="suf" style="top:auto;bottom:11px;transform:none">%</span></div>
                    <div class="isuf"><label class="hint" style="margin-bottom:4px;display:block">Home ↔ work</label><input type="number" id="pCommute" min="0" max="100" step="1" value="0"><span class="suf" style="top:auto;bottom:11px;transform:none">%</span></div>
                  </div>
                  <div class="isuf" style="margin-top:10px"><label class="hint" style="margin-bottom:4px;display:block">Private</label><input type="number" id="pPriv" min="0" max="100" step="1" value="100" readonly style="opacity:.7"><span class="suf" style="top:auto;bottom:11px;transform:none">%</span></div>
                </div>
                <div class="field" id="commuteOpts">
                  <span class="flabel">Employee's professional expenses</span>
                  <div class="seg" id="expense">
                    <label><input type="radio" name="exp" value="forfait" checked><span class="opt">Standard flat rate</span></label>
                    <label><input type="radio" name="exp" value="reels"><span class="opt">Actual (supported by evidence)</span></label>
                  </div>
                  <div class="isuf" style="margin-top:12px"><label class="hint" style="margin-bottom:4px;display:block">Annual "commuting expenses" exemption available
                    <span class="hint">€490 for tax year 2025 (base €250) — amount indexed each year, overall ceiling for all employer contributions.</span></label>
                    <input type="number" id="exoneration" min="0" step="1" value="490"><span class="suf">€</span></div>
                </div>
              </fieldset>
            </div>

            <div class="cond" id="borneBlock">
              <fieldset>
                <legend>Charger transfer (points 37-38)</legend>
                <div class="field" style="margin-top:8px">
                  <span class="flabel">At the end of the provision period, is the charging station installed by the employer transferred to you free of charge&nbsp;?</span>
                  <div class="seg" id="transfert">
                    <label><input type="radio" name="trf" value="non" checked><span class="opt">No</span></label>
                    <label><input type="radio" name="trf" value="oui"><span class="opt">Yes</span></label>
                  </div>
                  <div class="cond isuf" id="borneValWrap" style="margin-top:12px"><label class="hint" style="margin-bottom:4px;display:block">Fair market value of the charger at the time of transfer</label><input type="number" id="borneVal" min="0" step="1" value="0"><span class="suf">€</span></div>
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      </section>

      <!-- ============== RÉSULTAT ============== -->
      <section class="card" aria-label="Result" aria-live="polite">
        <div class="sticky"><div class="card-b">
          <div class="r-label">Taxable benefit in kind</div>
          <div class="r-amount" id="atnAmount">0.00 €</div>
          <span class="badge ok" id="statusBadge"><span class="bd"></span> Not taxable</span>
          <div class="bdown" id="breakdown"></div>
          <div class="explain"><h3>How this amount is calculated</h3><ol id="steps"></ol></div>
        </div></div>
      </section>
    </div>

    <!-- ============== BARÈME CREG ============== -->
    <section class="ref">
      <h2>CREG rate schedule — maximum fixed amount per kWh</h2>
      <p class="lede">Non-taxable reimbursement ceiling, by region and by quarter. Confidence level shown per row.</p>
      <div class="tscroll">
        <table>
          <thead><tr><th>Quarter</th><th>Flanders</th><th>Brussels-Cap.</th><th>Wallonia</th><th>Source</th><th>Confidence</th></tr></thead>
          <tbody id="cregTable"></tbody>
        </table>
      </div>
      <p class="ann">Values in euro cents / kWh. <b>HIGH</b> = amount taken from an official circular (Fisconet). <b>MEDIUM</b> = amount communicated by social secretariats based on the CREG rate, pending confirmation of official publication.</p>
    </section>

    <div class="disc">
      <b>Warning.</b> Estimation tool for informational purposes only, based on circular 2024/C/77 and its addenda — applicable country: <b>Belgium</b>. It does not constitute tax advice, an administrative decision, or personalised financial advice. The definitive qualification (proof of the employer's own expenses, justification of actual costs, meter accuracy, indexed exemption ceiling, etc.) depends on the specific facts of each case. In case of doubt: social secretariat, tax adviser or FPS Finance.
    </div>

    <section class="sources">
      <h3>Official sources</h3>
      <ul>
        <li>FPS Finance — Circular 2024/C/77 of 05.12.2024 (Fisconet)</li>
        <li>Addenda: 2025/C/14 (Q2 2025) · 2025/C/38 (Q3 2025, permanent application) · 2025/C/60 (Q4 2025) · 2025/C/72 (Q1 2026) · 2026/C/44 (Q2 2026)</li>
        <li>CREG rate: <a href="https://www.creg.be/fr/consommateurs/prix-et-tarifs/tarif-creg-pour-le-remboursement-de-la-recharge-a-domicile-des" target="_blank" rel="noopener">creg.be</a></li>
      </ul>
    </section>

  </div>
`

const TOOL_HTML_NL = `
  <div class="wrap">

    <nav class="crumb" aria-label="Broodkruimel">
      <a href="https://moteurs.com/">Startpagina</a><span>›</span>
      <a href="https://moteurs.com/outils">Tools</a><span>›</span>
      <a href="https://moteurs.com/recharge-electrique">Opladen</a><span>›</span>
      Thuisladen · bedrijfswagen (BE)
    </nav>

    <header class="head">
      <div class="meta-row">
        <span class="chip pays">🇧🇪 België</span>
        <span class="chip maj">Bijgewerkt op 1 juni 2026</span>
        <span class="chip">2 bronnen min. per cijfer</span>
        <span class="chip">Gratis · zonder registratie</span>
      </div>
      <h1>Thuisladen van een bedrijfswagen: welk bedrag is belastbaar&nbsp;?</h1>
      <p class="lede">Simuleer de fiscale behandeling van de <b>terugbetaling door de werkgever van de elektriciteitskosten</b> voor thuisladen, in hoofde van de werknemer of de bedrijfsleider — volgens circulaire <b>2024/C/77</b> en het kwartaallijkse CREG-tarief.</p>
    </header>

    <div class="grid">
      <!-- ============== FORMULAIRE ============== -->
      <section class="card" aria-label="Uw gegevens">
        <div class="card-h"><h2>Uw gegevens</h2><p>De berekening wordt in realtime bijgewerkt.</p></div>
        <div class="card-b">

          <div class="field">
            <span class="flabel">1. Aard van de regeling
              <span class="hint">« Gratis verstrekking » = elektriciteit gefactureerd op naam van de werkgever. « Terugbetaling » = gefactureerd op naam van de werknemer, daarna terugbetaald (punten 3-7).</span>
            </span>
            <div class="seg" id="arrangement">
              <label><input type="radio" name="arr" value="remb" checked><span class="opt">Terugbetaling</span></label>
              <label><input type="radio" name="arr" value="fourn"><span class="opt">Gratis verstrekking</span></label>
            </div>
          </div>

          <div id="rembBlock">
            <div class="field">
              <span class="flabel">2. Opgeladen voertuig</span>
              <div class="seg" id="vehicule">
                <label><input type="radio" name="veh" value="societe" checked><span class="opt">Bedrijfswagen (elec./hybr.)</span></label>
                <label><input type="radio" name="veh" value="privee"><span class="opt">Privéwagen</span></label>
              </div>
            </div>

            <div class="field">
              <span class="flabel">3. Laadlocatie</span>
              <div class="seg" id="lieu">
                <label><input type="radio" name="lieu" value="domicile" checked><span class="opt">Thuis</span></label>
                <label><input type="radio" name="lieu" value="publique"><span class="opt">Openbare laadpaal</span></label>
              </div>
            </div>

            <div class="cond" id="condBlock">
              <fieldset>
                <legend>Voorwaarden voor de uitzondering (punten 14-21)</legend>
                <div class="field" style="margin-top:8px">
                  <span class="flabel">Laadpaal / lader uitgerust met een communicatiesysteem dat het verbruik doorgeeft aan de werkgever&nbsp;?
                    <span class="hint">Laadpaal van de werkgever of privélaadpaal — zolang het verbruik op controleerbare wijze wordt doorgegeven.</span>
                  </span>
                  <div class="seg" id="comm">
                    <label><input type="radio" name="comm" value="oui" checked><span class="opt">Ja</span></label>
                    <label><input type="radio" name="comm" value="non"><span class="opt">Nee</span></label>
                  </div>
                </div>
                <div class="field">
                  <span class="flabel">Voorziet de « car policy » in de terugbetaling van de opgeladen elektriciteit&nbsp;?</span>
                  <div class="seg" id="policy">
                    <label><input type="radio" name="policy" value="oui" checked><span class="opt">Ja</span></label>
                    <label><input type="radio" name="policy" value="non"><span class="opt">Nee</span></label>
                  </div>
                </div>
                <div class="field">
                  <span class="flabel">Basis van de terugbetaling
                    <span class="hint">« Werkelijke kosten » = op basis van factuur (geval waarbij een laadpaalbedrijf het verbruik aan u factureert, dat de werkgever terugbetaalt). « Forfait » = vast bedrag per kWh bepaald door de werkgever.</span>
                  </span>
                  <div class="seg" id="base">
                    <label><input type="radio" name="base" value="forfait" checked><span class="opt">Forfait per kWh</span></label>
                    <label><input type="radio" name="base" value="reel"><span class="opt">Werkelijke kosten (factuur)</span></label>
                  </div>
                  <p class="note-inline" id="baseNote" style="display:none">Bewezen werkelijke kosten: het CREG-plafond is niet van toepassing. Zorg ervoor dat de factuur <b>uitsluitend betrekking heeft op de elektriciteit van de wagen</b> — het abonnement / de beheerskosten van de laadpaal zijn hiervan uitgesloten.</p>
                </div>
              </fieldset>
            </div>

            <div class="field">
              <span class="flabel">4. Gewest van de woonplaats &amp; kwartaal van verbruik</span>
              <div class="row2">
                <select id="region" aria-label="Gewest">
                  <option value="fl">Vlaams Gewest</option>
                  <option value="bxl">Brussels Hoofdstedelijk Gewest</option>
                  <option value="wal">Waals Gewest</option>
                  <option value="unique">Uniek tarief (laagste)</option>
                </select>
                <select id="quarter" aria-label="Kwartaal"></select>
              </div>
              <div class="creg">
                <span class="cl">Toepasselijk CREG-plafond (maximaal vast bedrag)</span>
                <span class="cv" id="cregVal">—</span>
              </div>
            </div>

            <div class="field">
              <span class="flabel">5. Opgeladen elektriciteit voor de wagen, over de periode</span>
              <div class="isuf"><input type="number" id="kwh" min="0" step="1" placeholder="bv. 600" value="600"><span class="suf">kWh</span></div>
            </div>

            <div class="field">
              <span class="flabel">6. Terugbetaling door de werkgever</span>
              <div class="seg" id="method" style="margin-bottom:10px">
                <label><input type="radio" name="meth" value="rate" checked><span class="opt">Tarief c€/kWh</span></label>
                <label><input type="radio" name="meth" value="total"><span class="opt">Totaalbedrag €</span></label>
              </div>
              <div id="rateWrap" class="isuf"><input type="number" id="rate" min="0" step="0.01" placeholder="bv. 28.22" value="28.22"><span class="suf">c€/kWh</span></div>
              <div id="totalWrap" class="isuf" style="display:none"><input type="number" id="total" min="0" step="0.01" placeholder="bv. 169.32"><span class="suf">€</span></div>
              <button class="mini-link" type="button" id="fillCreg">↧ CREG-plafond als tarief gebruiken</button>
            </div>

            <div class="field cond" id="subWrap">
              <span class="flabel">7. Abonnement / laadpaalbeheer op de factuur
                <span class="hint">Bedrag gefactureerd door het laadpaalbedrijf <b>buiten</b> de elektriciteit van de wagen (abonnement, beheerskosten / CPO). Vul dit hier in om het afzonderlijk te houden — het maakt geen deel uit van de elektriciteitterugbetaling.</span>
              </span>
              <div class="isuf"><input type="number" id="subFee" min="0" step="0.01" placeholder="bv. 12.00" value="0"><span class="suf">€</span></div>
            </div>

            <div class="cond" id="splitBlock">
              <fieldset>
                <legend>Verdeling per type traject</legend>
                <p class="note-inline" style="margin-top:0">Wanneer de uitzondering niet van toepassing is, hangt de belasting af van de aard van de verplaatsing (punten 9-12). Geef het aandeel van elk gebruik aan (%).</p>
                <div class="field" style="margin-top:14px">
                  <div class="row2">
                    <div class="isuf"><label class="hint" style="margin-bottom:4px;display:block">Professioneel</label><input type="number" id="pProf" min="0" max="100" step="1" value="0"><span class="suf" style="top:auto;bottom:11px;transform:none">%</span></div>
                    <div class="isuf"><label class="hint" style="margin-bottom:4px;display:block">Woon-werkverkeer</label><input type="number" id="pCommute" min="0" max="100" step="1" value="0"><span class="suf" style="top:auto;bottom:11px;transform:none">%</span></div>
                  </div>
                  <div class="isuf" style="margin-top:10px"><label class="hint" style="margin-bottom:4px;display:block">Privé</label><input type="number" id="pPriv" min="0" max="100" step="1" value="100" readonly style="opacity:.7"><span class="suf" style="top:auto;bottom:11px;transform:none">%</span></div>
                </div>
                <div class="field" id="commuteOpts">
                  <span class="flabel">Beroepskosten van de werknemer</span>
                  <div class="seg" id="expense">
                    <label><input type="radio" name="exp" value="forfait" checked><span class="opt">Forfaitaire kosten</span></label>
                    <label><input type="radio" name="exp" value="reels"><span class="opt">Werkelijke kosten (bewezen)</span></label>
                  </div>
                  <div class="isuf" style="margin-top:12px"><label class="hint" style="margin-bottom:4px;display:block">Beschikbare jaarlijkse vrijstelling « reiskosten »
                    <span class="hint">490 € voor aanslagjaar 2025 (basis 250 €) — jaarlijks geïndexeerd bedrag, globaal plafond van alle tussenkomsten van de werkgever.</span></label>
                    <input type="number" id="exoneration" min="0" step="1" value="490"><span class="suf">€</span></div>
                </div>
              </fieldset>
            </div>

            <div class="cond" id="borneBlock">
              <fieldset>
                <legend>Overdracht van de laadpaal (punten 37-38)</legend>
                <div class="field" style="margin-top:8px">
                  <span class="flabel">Wordt de door de werkgever geïnstalleerde laadpaal u aan het einde van de terbeschikkingstelling gratis overgedragen&nbsp;?</span>
                  <div class="seg" id="transfert">
                    <label><input type="radio" name="trf" value="non" checked><span class="opt">Nee</span></label>
                    <label><input type="radio" name="trf" value="oui"><span class="opt">Ja</span></label>
                  </div>
                  <div class="cond isuf" id="borneValWrap" style="margin-top:12px"><label class="hint" style="margin-bottom:4px;display:block">Werkelijke waarde van de laadpaal op het moment van overdracht</label><input type="number" id="borneVal" min="0" step="1" value="0"><span class="suf">€</span></div>
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      </section>

      <!-- ============== RÉSULTAT ============== -->
      <section class="card" aria-label="Resultaat" aria-live="polite">
        <div class="sticky"><div class="card-b">
          <div class="r-label">Belastbaar voordeel van alle aard</div>
          <div class="r-amount" id="atnAmount">0,00 €</div>
          <span class="badge ok" id="statusBadge"><span class="bd"></span> Niet belastbaar</span>
          <div class="bdown" id="breakdown"></div>
          <div class="explain"><h3>Hoe dit bedrag wordt berekend</h3><ol id="steps"></ol></div>
        </div></div>
      </section>
    </div>

    <!-- ============== BARÈME CREG ============== -->
    <section class="ref">
      <h2>CREG-tarief — maximaal vast bedrag per kWh</h2>
      <p class="lede">Plafond voor niet-belastbare terugbetaling, per gewest en per kwartaal. Betrouwbaarheidsniveau per rij.</p>
      <div class="tscroll">
        <table>
          <thead><tr><th>Kwartaal</th><th>Vlaanderen</th><th>Brussel-Hfdst.</th><th>Wallonië</th><th>Bron</th><th>Betrouwbaarheid</th></tr></thead>
          <tbody id="cregTable"></tbody>
        </table>
      </div>
      <p class="ann">Waarden in eurocent / kWh. <b>HOOG</b> = bedrag opgenomen in een officiële circulaire (Fisconet). <b>GEMIDDELD</b> = bedrag meegedeeld door de sociale secretariaten op basis van het CREG-tarief, in afwachting van bevestiging van de officiële publicatie.</p>
    </section>

    <div class="disc">
      <b>Waarschuwing.</b> Schattingsinstrument ter informatie op basis van circulaire 2024/C/77 en haar addenda — toepasselijk land: <b>België</b>. Het vormt noch een fiscaal advies, noch een beslissing van de administratie, noch een gepersonaliseerd financieel advies. De definitieve kwalificatie (bewijs van eigen kosten van de werkgever, rechtvaardiging van werkelijke kosten, nauwkeurigheid van de teller, geïndexeerd vrijstellingsplafond, enz.) hangt af van de feiten eigen aan elk dossier. Bij twijfel: sociaal secretariaat, fiscaal adviseur of FOD Financiën.
    </div>

    <section class="sources">
      <h3>Officiële bronnen</h3>
      <ul>
        <li>FOD Financiën — Circulaire 2024/C/77 van 05.12.2024 (Fisconet)</li>
        <li>Addenda: 2025/C/14 (K2 2025) · 2025/C/38 (K3 2025, permanente toepassing) · 2025/C/60 (K4 2025) · 2025/C/72 (K1 2026) · 2026/C/44 (K2 2026)</li>
        <li>CREG-tarief: <a href="https://www.creg.be/fr/consommateurs/prix-et-tarifs/tarif-creg-pour-le-remboursement-de-la-recharge-a-domicile-des" target="_blank" rel="noopener">creg.be</a></li>
      </ul>
    </section>

  </div>
`

const TOOL_HTML_DE = `
  <div class="wrap">

    <nav class="crumb" aria-label="Brotkrumen-Navigation">
      <a href="https://moteurs.com/">Startseite</a><span>›</span>
      <a href="https://moteurs.com/outils">Tools</a><span>›</span>
      <a href="https://moteurs.com/recharge-electrique">Aufladen</a><span>›</span>
      Heimladen · Firmenwagen (BE)
    </nav>

    <header class="head">
      <div class="meta-row">
        <span class="chip pays">🇧🇪 Belgien</span>
        <span class="chip maj">Aktualisiert am 1. Juni 2026</span>
        <span class="chip">2 Quellen min. pro Zahl</span>
        <span class="chip">Kostenlos · ohne Anmeldung</span>
      </div>
      <h1>Heimladen eines Firmenwagens: welcher Betrag ist steuerpflichtig&nbsp;?</h1>
      <p class="lede">Simulieren Sie die steuerliche Behandlung der <b>Erstattung der Stromkosten durch den Arbeitgeber</b> für das Heimladen, für den Arbeitnehmer oder Geschäftsführer — gemäß Rundschreiben <b>2024/C/77</b> und dem quartalsweisen CREG-Tarif.</p>
    </header>

    <div class="grid">
      <!-- ============== FORMULAIRE ============== -->
      <section class="card" aria-label="Ihre Angaben">
        <div class="card-h"><h2>Ihre Angaben</h2><p>Die Berechnung wird in Echtzeit aktualisiert.</p></div>
        <div class="card-b">

          <div class="field">
            <span class="flabel">1. Art der Vereinbarung
              <span class="hint">„Kostenlose Bereitstellung" = Strom auf den Namen des Arbeitgebers in Rechnung gestellt. „Erstattung" = auf den Namen des Arbeitnehmers in Rechnung gestellt und anschließend erstattet (Punkte 3-7).</span>
            </span>
            <div class="seg" id="arrangement">
              <label><input type="radio" name="arr" value="remb" checked><span class="opt">Erstattung</span></label>
              <label><input type="radio" name="arr" value="fourn"><span class="opt">Kostenlose Bereitstellung</span></label>
            </div>
          </div>

          <div id="rembBlock">
            <div class="field">
              <span class="flabel">2. Aufgeladenes Fahrzeug</span>
              <div class="seg" id="vehicule">
                <label><input type="radio" name="veh" value="societe" checked><span class="opt">Firmenwagen (Elektro/Hybrid)</span></label>
                <label><input type="radio" name="veh" value="privee"><span class="opt">Privatfahrzeug</span></label>
              </div>
            </div>

            <div class="field">
              <span class="flabel">3. Ladeort</span>
              <div class="seg" id="lieu">
                <label><input type="radio" name="lieu" value="domicile" checked><span class="opt">Zuhause</span></label>
                <label><input type="radio" name="lieu" value="publique"><span class="opt">Öffentliche Ladestation</span></label>
              </div>
            </div>

            <div class="cond" id="condBlock">
              <fieldset>
                <legend>Voraussetzungen der Ausnahme (Punkte 14-21)</legend>
                <div class="field" style="margin-top:8px">
                  <span class="flabel">Ladestation / Ladegerät ausgestattet mit einem Kommunikationssystem, das den Verbrauch an den Arbeitgeber übermittelt&nbsp;?
                    <span class="hint">Ladestation des Arbeitgebers oder private Ladestation — sofern sie den Verbrauch nachweisbar übermittelt.</span>
                  </span>
                  <div class="seg" id="comm">
                    <label><input type="radio" name="comm" value="oui" checked><span class="opt">Ja</span></label>
                    <label><input type="radio" name="comm" value="non"><span class="opt">Nein</span></label>
                  </div>
                </div>
                <div class="field">
                  <span class="flabel">Sieht die car policy die Erstattung des aufgeladenen Stroms vor&nbsp;?</span>
                  <div class="seg" id="policy">
                    <label><input type="radio" name="policy" value="oui" checked><span class="opt">Ja</span></label>
                    <label><input type="radio" name="policy" value="non"><span class="opt">Nein</span></label>
                  </div>
                </div>
                <div class="field">
                  <span class="flabel">Grundlage der Erstattung
                    <span class="hint">„Tatsächliche Kosten" = belegter Rechnungsnachweis (Fall, in dem eine Ladestation-Gesellschaft Ihnen den Verbrauch in Rechnung stellt, den der Arbeitgeber erstattet). „Pauschale" = fester Betrag pro kWh, vom Arbeitgeber festgelegt.</span>
                  </span>
                  <div class="seg" id="base">
                    <label><input type="radio" name="base" value="forfait" checked><span class="opt">Pauschale pro kWh</span></label>
                    <label><input type="radio" name="base" value="reel"><span class="opt">Tatsächliche Kosten (Rechnung)</span></label>
                  </div>
                  <p class="note-inline" id="baseNote" style="display:none">Belegte tatsächliche Kosten: die CREG-Obergrenze gilt nicht. Achten Sie darauf, dass die Rechnung <b>ausschließlich den Strom für das Fahrzeug</b> ausweist — Abonnement / Verwaltungsgebühren der Ladestation sind ausgeschlossen.</p>
                </div>
              </fieldset>
            </div>

            <div class="field">
              <span class="flabel">4. Region des Wohnsitzes &amp; Verbrauchsquartal</span>
              <div class="row2">
                <select id="region" aria-label="Region">
                  <option value="fl">Flämische Region</option>
                  <option value="bxl">Region Brüssel-Hauptstadt</option>
                  <option value="wal">Wallonische Region</option>
                  <option value="unique">Einheitstarif (niedrigster)</option>
                </select>
                <select id="quarter" aria-label="Quartal"></select>
              </div>
              <div class="creg">
                <span class="cl">Anwendbare CREG-Obergrenze (maximaler Festbetrag)</span>
                <span class="cv" id="cregVal">—</span>
              </div>
            </div>

            <div class="field">
              <span class="flabel">5. Für das Fahrzeug aufgeladener Strom im Zeitraum</span>
              <div class="isuf"><input type="number" id="kwh" min="0" step="1" placeholder="z.B. 600" value="600"><span class="suf">kWh</span></div>
            </div>

            <div class="field">
              <span class="flabel">6. Erstattung durch den Arbeitgeber</span>
              <div class="seg" id="method" style="margin-bottom:10px">
                <label><input type="radio" name="meth" value="rate" checked><span class="opt">Tarif c€/kWh</span></label>
                <label><input type="radio" name="meth" value="total"><span class="opt">Gesamtbetrag €</span></label>
              </div>
              <div id="rateWrap" class="isuf"><input type="number" id="rate" min="0" step="0.01" placeholder="z.B. 28.22" value="28.22"><span class="suf">c€/kWh</span></div>
              <div id="totalWrap" class="isuf" style="display:none"><input type="number" id="total" min="0" step="0.01" placeholder="z.B. 169.32"><span class="suf">€</span></div>
              <button class="mini-link" type="button" id="fillCreg">↧ CREG-Obergrenze als Tarif verwenden</button>
            </div>

            <div class="field cond" id="subWrap">
              <span class="flabel">7. Abonnement / Ladestationsverwaltung auf der Rechnung
                <span class="hint">Von der Ladestation-Gesellschaft in Rechnung gestellter Betrag <b>ohne</b> Fahrzeugstrom (Abonnement, Verwaltungs- / CPO-Gebühren). Tragen Sie diesen hier ein, um ihn separat zu halten — er geht nicht in die Stromerstattung ein.</span>
              </span>
              <div class="isuf"><input type="number" id="subFee" min="0" step="0.01" placeholder="z.B. 12.00" value="0"><span class="suf">€</span></div>
            </div>

            <div class="cond" id="splitBlock">
              <fieldset>
                <legend>Aufteilung nach Fahrtenart</legend>
                <p class="note-inline" style="margin-top:0">Wenn die Ausnahme nicht gilt, hängt die Besteuerung von der Art der Fahrt ab (Punkte 9-12). Geben Sie den Anteil jeder Nutzung an (%).</p>
                <div class="field" style="margin-top:14px">
                  <div class="row2">
                    <div class="isuf"><label class="hint" style="margin-bottom:4px;display:block">Beruflich</label><input type="number" id="pProf" min="0" max="100" step="1" value="0"><span class="suf" style="top:auto;bottom:11px;transform:none">%</span></div>
                    <div class="isuf"><label class="hint" style="margin-bottom:4px;display:block">Wohnung ↔ Arbeit</label><input type="number" id="pCommute" min="0" max="100" step="1" value="0"><span class="suf" style="top:auto;bottom:11px;transform:none">%</span></div>
                  </div>
                  <div class="isuf" style="margin-top:10px"><label class="hint" style="margin-bottom:4px;display:block">Privat</label><input type="number" id="pPriv" min="0" max="100" step="1" value="100" readonly style="opacity:.7"><span class="suf" style="top:auto;bottom:11px;transform:none">%</span></div>
                </div>
                <div class="field" id="commuteOpts">
                  <span class="flabel">Berufskosten des Arbeitnehmers</span>
                  <div class="seg" id="expense">
                    <label><input type="radio" name="exp" value="forfait" checked><span class="opt">Pauschale Kosten</span></label>
                    <label><input type="radio" name="exp" value="reels"><span class="opt">Tatsächliche Kosten (belegt)</span></label>
                  </div>
                  <div class="isuf" style="margin-top:12px"><label class="hint" style="margin-bottom:4px;display:block">Verfügbare jährliche Steuerbefreiung „Fahrtkosten"
                    <span class="hint">490 € für das Steuerjahr 2025 (Basis 250 €) — jährlich indexierter Betrag, globale Obergrenze aller Arbeitgeberbeiträge.</span></label>
                    <input type="number" id="exoneration" min="0" step="1" value="490"><span class="suf">€</span></div>
                </div>
              </fieldset>
            </div>

            <div class="cond" id="borneBlock">
              <fieldset>
                <legend>Übertragung der Ladestation (Punkte 37-38)</legend>
                <div class="field" style="margin-top:8px">
                  <span class="flabel">Wird Ihnen die vom Arbeitgeber installierte Ladestation am Ende der Bereitstellung kostenlos übertragen&nbsp;?</span>
                  <div class="seg" id="transfert">
                    <label><input type="radio" name="trf" value="non" checked><span class="opt">Nein</span></label>
                    <label><input type="radio" name="trf" value="oui"><span class="opt">Ja</span></label>
                  </div>
                  <div class="cond isuf" id="borneValWrap" style="margin-top:12px"><label class="hint" style="margin-bottom:4px;display:block">Tatsächlicher Wert der Ladestation zum Zeitpunkt der Übertragung</label><input type="number" id="borneVal" min="0" step="1" value="0"><span class="suf">€</span></div>
                </div>
              </fieldset>
            </div>
          </div>
        </div>
      </section>

      <!-- ============== RÉSULTAT ============== -->
      <section class="card" aria-label="Ergebnis" aria-live="polite">
        <div class="sticky"><div class="card-b">
          <div class="r-label">Steuerpflichtiger geldwerter Vorteil</div>
          <div class="r-amount" id="atnAmount">0,00 €</div>
          <span class="badge ok" id="statusBadge"><span class="bd"></span> Nicht steuerpflichtig</span>
          <div class="bdown" id="breakdown"></div>
          <div class="explain"><h3>Wie dieser Betrag ermittelt wird</h3><ol id="steps"></ol></div>
        </div></div>
      </section>
    </div>

    <!-- ============== BARÈME CREG ============== -->
    <section class="ref">
      <h2>CREG-Tarif — maximaler Festbetrag pro kWh</h2>
      <p class="lede">Nicht steuerpflichtige Erstattungsobergrenze, nach Region und Quartal. Vertrauensniveau pro Zeile.</p>
      <div class="tscroll">
        <table>
          <thead><tr><th>Quartal</th><th>Flandern</th><th>Brüssel-Hpst.</th><th>Wallonien</th><th>Quelle</th><th>Vertrauen</th></tr></thead>
          <tbody id="cregTable"></tbody>
        </table>
      </div>
      <p class="ann">Werte in Eurocent / kWh. <b>HOCH</b> = Betrag aus einem offiziellen Rundschreiben (Fisconet). <b>MITTEL</b> = Betrag, der von Sozialsekretariaten auf Basis des CREG-Tarifs mitgeteilt wurde, ausstehende Bestätigung der offiziellen Veröffentlichung.</p>
    </section>

    <div class="disc">
      <b>Hinweis.</b> Schätzungstool zu Informationszwecken auf Grundlage des Rundschreibens 2024/C/77 und seiner Nachträge — anwendbares Land: <b>Belgien</b>. Es stellt weder einen Steuerratschlag, noch eine Verwaltungsentscheidung, noch eine personalisierte Finanzberatung dar. Die endgültige Qualifikation (Nachweis der eigenen Kosten des Arbeitgebers, Begründung der tatsächlichen Kosten, Zählergenauigkeit, indexierte Befreiungsobergrenze usw.) hängt von den Umständen des Einzelfalls ab. Im Zweifelsfall: Sozialsekretariat, Steuerberater oder Belgisches Finanzministerium (SPF Finances).
    </div>

    <section class="sources">
      <h3>Offizielle Quellen</h3>
      <ul>
        <li>Belgisches Finanzministerium (SPF Finances) — Rundschreiben 2024/C/77 vom 05.12.2024 (Fisconet)</li>
        <li>Nachträge: 2025/C/14 (Q2 2025) · 2025/C/38 (Q3 2025, dauerhafte Anwendung) · 2025/C/60 (Q4 2025) · 2025/C/72 (Q1 2026) · 2026/C/44 (Q2 2026)</li>
        <li>CREG-Tarif: <a href="https://www.creg.be/fr/consommateurs/prix-et-tarifs/tarif-creg-pour-le-remboursement-de-la-recharge-a-domicile-des" target="_blank" rel="noopener">creg.be</a></li>
      </ul>
    </section>

  </div>
`

// ─────────────────────────────────────────────────────────────────────────────
// Scripts calculateur — versions localisées (injectés dynamiquement post-mount)
// ─────────────────────────────────────────────────────────────────────────────
const TOOL_SCRIPT_EN = `
"use strict";
/* CREG ceilings (euro cents/kWh) — conf: confidence, circ: source */
const CREG={
  "2025-T1":{fl:28.22,bxl:32.94,wal:32.56,circ:"2024/C/77",conf:"eleve"},
  "2025-T2":{fl:31.94,bxl:35.85,wal:36.17,circ:"2025/C/14",conf:"eleve"},
  "2025-T3":{fl:34.56,bxl:37.87,wal:38.43,circ:"2025/C/38",conf:"eleve"},
  "2025-T4":{fl:30.70,bxl:33.56,wal:34.57,circ:"2025/C/60",conf:"eleve"},
  "2026-T1":{fl:31.32,bxl:34.26,wal:35.23,circ:"2025/C/72",conf:"moyen"},
  "2026-T2":{fl:31.91,bxl:35.55,wal:36.36,circ:"2026/C/44",conf:"eleve"},
  "2026-T3":{fl:32.22,bxl:37.19,wal:37.83,circ:"addendum",conf:"moyen"}
};
const QLABEL={"2025-T1":"Q1 2025","2025-T2":"Q2 2025","2025-T3":"Q3 2025","2025-T4":"Q4 2025","2026-T1":"Q1 2026","2026-T2":"Q2 2026","2026-T3":"Q3 2026"};
const CONFLABEL={eleve:"HIGH",moyen:"MEDIUM"};
const $=id=>document.getElementById(id);
let _aside="";
const fmtE=v=>v.toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
const fmtC=v=>v.toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})+" c€/kWh";

(function init(){
  const q=$("quarter");
  Object.keys(CREG).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=QLABEL[k];q.appendChild(o);});
  q.value="2025-T1";
  const tb=$("cregTable");
  Object.keys(CREG).forEach(k=>{const c=CREG[k];const tr=document.createElement('tr');
    tr.innerHTML=\`<td>\${QLABEL[k]}</td><td>\${c.fl.toFixed(2)}</td><td>\${c.bxl.toFixed(2)}</td><td>\${c.wal.toFixed(2)}</td>\`+
      \`<td class="src-soft">\${c.circ}</td><td><span class="conf \${c.conf}">\${CONFLABEL[c.conf]}</span></td>\`;
    tb.appendChild(tr);});
})();

function cregFor(region,quarter){const c=CREG[quarter];return region==="unique"?Math.min(c.fl,c.bxl,c.wal):c[region];}
const val=name=>document.querySelector(\`input[name="\${name}"]:checked\`).value;

function compute(){
  _aside="";
  const arr=val("arr");
  const region=$("region").value,quarter=$("quarter").value;
  const cregMax=cregFor(region,quarter);
  $("cregVal").textContent=fmtC(cregMax);

  if(arr==="fourn"){
    return render({atn:0,status:"ok",statusTxt:"No separate benefit",
      rows:[["Separate electricity benefit","0.00 €","free"]],
      steps:["Electricity is invoiced <b>in the employer's name</b>: <b>free supply</b> (points 3-5).",
        "It is <b>included in the flat-rate benefit in kind for the vehicle</b> (Art. 36, §2 ITC 92). No additional electricity BIK.",
        "Only the flat-rate BIK for the 'vehicle' remains taxable — calculated separately."]});
  }

  const veh=val("veh"),lieu=val("lieu");
  const kwh=Math.max(0,parseFloat($("kwh").value)||0);
  const meth=val("meth");
  let rate,reimb;
  if(meth==="rate"){rate=Math.max(0,parseFloat($("rate").value)||0);reimb=kwh*rate/100;}
  else{reimb=Math.max(0,parseFloat($("total").value)||0);rate=kwh>0?reimb/kwh*100:0;}

  let borneAdd=0,borneStep=null;
  if(val("trf")==="oui"){borneAdd=Math.max(0,parseFloat($("borneVal").value)||0);
    borneStep=\`<b>Charger transfer</b>: its fair market value (\${fmtE(borneAdd)}) constitutes a separate BIK (points 37-38).\`;}

  const sub=Math.max(0,parseFloat(($("subFee")||{}).value)||0);
  if(sub>0&&veh==="societe") _aside=\`<div class="aside-note"><b>Subscription / charger management: \${fmtE(sub)}</b> — a separate line item from the electricity reimbursement, <b>not counted</b> in the BIK above. To be qualified according to your car policy (provision of the charger, point 16); have its treatment confirmed by your social secretariat or adviser.</div>\`;

  const exceptionEligible=(veh==="societe"&&lieu==="domicile");
  const comm=exceptionEligible?val("comm")==="oui":false;
  const policy=exceptionEligible?val("policy")==="oui":false;
  const exceptionApplies=exceptionEligible&&comm&&policy;

  if(exceptionApplies){
    const base=val("base");
    if(base==="reel"){
      const atn=borneAdd;
      const rows=[["Actual electricity costs reimbursed",fmtE(reimb),"free"],["Covered (supported by invoice)","− "+fmtE(reimb),"free"]];
      if(borneAdd>0)rows.push(["Charger transfer",fmtE(borneAdd),"tax"]);
      const steps=["Company car + home charging + communicating charger + car policy: <b>the exemption applies</b> (points 13-21).",
        "Reimbursement based on your <b>actual costs supported by invoice</b> (point 22) → <b>fully covered</b>, like a fuel card. The CREG ceiling only limits the <i>flat-rate</i> method.",
        "Condition: the invoice must cover <b>only the electricity for the company car</b> (point 14) — excluding subscription / charger management fees.",
        "Only the flat-rate BIK for the 'vehicle' remains due (calculated separately)."];
      if(borneStep)steps.push(borneStep);
      return render({atn,status:atn>0?"warn":"ok",statusTxt:atn>0?"Charger taxable":"Not taxable",rows,steps});
    }
    const ceiling=kwh*cregMax/100;
    if(rate<=cregMax+1e-9){
      let atn=borneAdd;
      const rows=[["Electricity reimbursed","0.00 €","free"]];
      if(borneAdd>0)rows.push(["Charger transfer",fmtE(borneAdd),"tax"]);
      const steps=["Company car + home charging + communicating charger + car policy: <b>the exemption applies</b> (points 13-21).",
        \`Rate applied (\${fmtC(rate)}) <b>≤ CREG ceiling</b> (\${fmtC(cregMax)}) → reimbursement <b>fully covered</b>.\`,
        "Like a fuel card: <b>no additional BIK</b>. Only the flat-rate BIK for the 'vehicle' remains due."];
      if(borneStep)steps.push(borneStep);
      return render({atn,status:atn>0?"warn":"ok",statusTxt:atn>0?"Charger taxable":"Not taxable",rows,steps});
    }else{
      const excess=reimb-ceiling,atn=excess+borneAdd;
      const rows=[["Total reimbursement",fmtE(reimb),""],["Covered by CREG ceiling","− "+fmtE(ceiling),"free"],["Excess beyond tolerance",fmtE(excess),"tax"]];
      if(borneAdd>0)rows.push(["Charger transfer",fmtE(borneAdd),"tax"]);
      const steps=["The exemption applies, <b>but</b> the flat rate exceeds the CREG ceiling.",
        \`Rate \${fmtC(rate)} &gt; ceiling \${fmtC(cregMax)}. The "fixed amount" tolerance only applies <b>up to the ceiling</b> (point 24).\`,
        \`Covered portion: \${fmtE(ceiling)}. <b>Excess: \${fmtE(excess)}</b> → taxable, unless actual higher costs can be justified (point 22).\`];
      if(borneStep)steps.push(borneStep);
      return render({atn,status:"warn",statusTxt:"Partially taxable",rows,steps});
    }
  }

  const pProf=clampPct($("pProf").value),pCommute=clampPct($("pCommute").value);
  let pPriv=100-pProf-pCommute;if(pPriv<0)pPriv=0;$("pPriv").value=pPriv;
  const profAmt=reimb*pProf/100,commuteAmt=reimb*pCommute/100,privAmt=reimb*pPriv/100;
  const expType=val("exp"),exo=Math.max(0,parseFloat($("exoneration").value)||0);
  let commuteTax=commuteAmt,commuteNote;
  if(expType==="forfait"){commuteTax=Math.max(0,commuteAmt-exo);commuteNote=\`exempt up to \${fmtE(exo)} (standard flat rate expenses)\`;}
  else{commuteNote="actual costs: no €490 exemption applies";}
  const atn=commuteTax+privAmt+borneAdd;

  const why=veh==="privee"?"Employee's <b>private</b> vehicle":lieu==="publique"?"Charging at a <b>public charging station</b>":"Home charging <b>without all conditions</b> of the exemption";
  const rows=[["Professional journeys ("+pProf+"%)","0.00 €","free"],["Home ↔ work ("+pCommute+"%)",fmtE(commuteTax),"tax"],["Private journeys ("+pPriv+"%)",fmtE(privAmt),"tax"]];
  if(borneAdd>0)rows.push(["Charger transfer",fmtE(borneAdd),"tax"]);
  const steps=[\`\${why} → the exemption does not apply; the <b>nature of the journey</b> governs (points 9-12).\`,
    \`<b>Professional</b> (\${fmtE(profAmt)}): employer's own expenses → <b>not taxable</b>, subject to dual proof (point 10).\`,
    \`<b>Home-work</b> (\${fmtE(commuteAmt)}): taxable BIK, \${commuteNote} → <b>\${fmtE(commuteTax)}</b> (point 11).\`,
    \`<b>Private</b> (\${fmtE(privAmt)}): fully taxable (point 12).\`];
  if(borneStep)steps.push(borneStep);
  return render({atn,status:atn>0?"warn":"ok",statusTxt:atn>0?"Taxable":"Not taxable",rows,steps});
}
function clampPct(v){v=parseFloat(v)||0;return Math.min(100,Math.max(0,Math.round(v)));}

function render({atn,status,statusTxt,rows,steps}){
  $("atnAmount").textContent=fmtE(atn);
  $("atnAmount").style.color=atn>0?"var(--warn)":"var(--accent)";
  const b=$("statusBadge");b.className="badge "+(status==="warn"?"warn":"ok");b.innerHTML='<span class="bd"></span> '+statusTxt;
  const bd=$("breakdown");bd.innerHTML="";
  rows.forEach(([l,v,cls])=>{const d=document.createElement('div');d.className="brow";d.innerHTML=\`<span class="bl">\${l}</span><span class="bv \${cls||''}">\${v}</span>\`;bd.appendChild(d);});
  const t=document.createElement('div');t.className="brow total";t.innerHTML=\`<span class="bl">Total taxable BIK</span><span class="bv \${atn>0?'tax':'free'}">\${fmtE(atn)}</span>\`;bd.appendChild(t);
  if(_aside){const a=document.createElement('div');a.className="aside-wrap";a.innerHTML=_aside;bd.appendChild(a);}
  const ol=$("steps");ol.innerHTML="";steps.forEach(s=>{const li=document.createElement('li');li.innerHTML=s;ol.appendChild(li);});
}

function refreshVisibility(){
  const arr=val("arr");$("rembBlock").style.display=arr==="fourn"?"none":"block";
  const veh=val("veh"),lieu=val("lieu");
  const exceptionEligible=(veh==="societe"&&lieu==="domicile");
  $("condBlock").classList.toggle("show",exceptionEligible);
  const comm=exceptionEligible?val("comm")==="oui":false,policy=exceptionEligible?val("policy")==="oui":false;
  const exceptionApplies=exceptionEligible&&comm&&policy;
  $("splitBlock").classList.toggle("show",arr==="remb"&&!exceptionApplies);
  $("commuteOpts").style.display=(clampPct($("pCommute").value)>0)?"block":"none";
  $("borneBlock").classList.toggle("show",arr==="remb"&&veh==="societe");
  $("subWrap").classList.toggle("show",arr==="remb"&&veh==="societe");
  $("borneValWrap").classList.toggle("show",val("trf")==="oui");
  const baseNote=document.getElementById("baseNote");
  if(baseNote) baseNote.style.display=(exceptionEligible&&val("base")==="reel")?"block":"none";
  $("rateWrap").style.display=val("meth")==="rate"?"block":"none";
  $("totalWrap").style.display=val("meth")==="total"?"block":"none";
}
document.addEventListener("input",()=>{refreshVisibility();compute();});
document.addEventListener("change",()=>{refreshVisibility();compute();});
$("fillCreg").addEventListener("click",()=>{const m=cregFor($("region").value,$("quarter").value);
  document.querySelector('input[name="meth"][value="rate"]').checked=true;$("rate").value=m.toFixed(2);refreshVisibility();compute();});
refreshVisibility();compute();
`

const TOOL_SCRIPT_NL = `
"use strict";
/* Plafonds CREG (centimes €/kWh) — conf: confiance, circ: source */
const CREG={
  "2025-T1":{fl:28.22,bxl:32.94,wal:32.56,circ:"2024/C/77",conf:"eleve"},
  "2025-T2":{fl:31.94,bxl:35.85,wal:36.17,circ:"2025/C/14",conf:"eleve"},
  "2025-T3":{fl:34.56,bxl:37.87,wal:38.43,circ:"2025/C/38",conf:"eleve"},
  "2025-T4":{fl:30.70,bxl:33.56,wal:34.57,circ:"2025/C/60",conf:"eleve"},
  "2026-T1":{fl:31.32,bxl:34.26,wal:35.23,circ:"2025/C/72",conf:"moyen"},
  "2026-T2":{fl:31.91,bxl:35.55,wal:36.36,circ:"2026/C/44",conf:"eleve"},
  "2026-T3":{fl:32.22,bxl:37.19,wal:37.83,circ:"addendum",conf:"moyen"}
};
const QLABEL={"2025-T1":"K1 2025","2025-T2":"K2 2025","2025-T3":"K3 2025","2025-T4":"K4 2025","2026-T1":"K1 2026","2026-T2":"K2 2026","2026-T3":"K3 2026"};
const CONFLABEL={eleve:"HOOG",moyen:"GEMIDDELD"};
const $=id=>document.getElementById(id);
let _aside="";
const fmtE=v=>v.toLocaleString('nl-BE',{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
const fmtC=v=>v.toLocaleString('nl-BE',{minimumFractionDigits:2,maximumFractionDigits:2})+" c€/kWh";

(function init(){
  const q=$("quarter");
  Object.keys(CREG).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=QLABEL[k];q.appendChild(o);});
  q.value="2025-T1";
  const tb=$("cregTable");
  Object.keys(CREG).forEach(k=>{const c=CREG[k];const tr=document.createElement('tr');
    tr.innerHTML=\`<td>\${QLABEL[k]}</td><td>\${c.fl.toFixed(2)}</td><td>\${c.bxl.toFixed(2)}</td><td>\${c.wal.toFixed(2)}</td>\`+
      \`<td class="src-soft">\${c.circ}</td><td><span class="conf \${c.conf}">\${CONFLABEL[c.conf]}</span></td>\`;
    tb.appendChild(tr);});
})();

function cregFor(region,quarter){const c=CREG[quarter];return region==="unique"?Math.min(c.fl,c.bxl,c.wal):c[region];}
const val=name=>document.querySelector(\`input[name="\${name}"]:checked\`).value;

function compute(){
  _aside="";
  const arr=val("arr");
  const region=$("region").value,quarter=$("quarter").value;
  const cregMax=cregFor(region,quarter);
  $("cregVal").textContent=fmtC(cregMax);

  if(arr==="fourn"){
    return render({atn:0,status:"ok",statusTxt:"Geen afzonderlijk voordeel",
      rows:[["Afzonderlijk elektriciteitsvoordeel","0,00 €","free"]],
      steps:["De elektriciteit wordt gefactureerd <b>op naam van de werkgever</b>: <b>gratis verstrekking</b> (punten 3-5).",
        "Ze is <b>inbegrepen in het forfaitaire voordeel van de wagen</b> (art. 36, §2 WIB 92). Geen bijkomend VAA elektriciteit.",
        "Alleen het forfaitaire VAA « wagen » blijft belastbaar — afzonderlijk berekend."]});
  }

  const veh=val("veh"),lieu=val("lieu");
  const kwh=Math.max(0,parseFloat($("kwh").value)||0);
  const meth=val("meth");
  let rate,reimb;
  if(meth==="rate"){rate=Math.max(0,parseFloat($("rate").value)||0);reimb=kwh*rate/100;}
  else{reimb=Math.max(0,parseFloat($("total").value)||0);rate=kwh>0?reimb/kwh*100:0;}

  let borneAdd=0,borneStep=null;
  if(val("trf")==="oui"){borneAdd=Math.max(0,parseFloat($("borneVal").value)||0);
    borneStep=\`<b>Overdracht van de laadpaal</b>: de werkelijke waarde ervan (\${fmtE(borneAdd)}) vormt een afzonderlijk VAA (punten 37-38).\`;}

  const sub=Math.max(0,parseFloat(($("subFee")||{}).value)||0);
  if(sub>0&&veh==="societe") _aside=\`<div class="aside-note"><b>Abonnement / laadpaalbeheer: \${fmtE(sub)}</b> — afzonderlijke post van de elektriciteitterugbetaling, <b>niet meegerekend</b> in het bovenstaande VAA. Te kwalificeren volgens uw car policy (terbeschikkingstelling van de laadpaal, punt 16); laat de behandeling ervan bevestigen door uw sociaal secretariaat of adviseur.</div>\`;

  const exceptionEligible=(veh==="societe"&&lieu==="domicile");
  const comm=exceptionEligible?val("comm")==="oui":false;
  const policy=exceptionEligible?val("policy")==="oui":false;
  const exceptionApplies=exceptionEligible&&comm&&policy;

  if(exceptionApplies){
    const base=val("base");
    if(base==="reel"){
      const atn=borneAdd;
      const rows=[["Terugbetaalde werkelijke elektriciteitskosten",fmtE(reimb),"free"],["Gedekt (op basis van factuur","− "+fmtE(reimb),"free"]];
      if(borneAdd>0)rows.push(["Overdracht laadpaal",fmtE(borneAdd),"tax"]);
      const steps=["Bedrijfswagen + thuisladen + communicerende laadpaal + « car policy »: <b>de uitzondering is van toepassing</b> (punten 13-21).",
        "Terugbetaling op basis van uw <b>werkelijke kosten bewezen door factuur</b> (punt 22) → <b>volledig gedekt</b>, zoals een brandstofkaart. Het CREG-plafond geldt alleen voor de <i>forfaitaire</i> methode.",
        "Voorwaarde: de factuur moet <b>uitsluitend betrekking hebben op de elektriciteit van de bedrijfswagen</b> (punt 14) — exclusief abonnement / beheerskosten van de laadpaal.",
        "Alleen het forfaitaire VAA « wagen » blijft verschuldigd (afzonderlijk berekend)."];
      if(borneStep)steps.push(borneStep);
      return render({atn,status:atn>0?"warn":"ok",statusTxt:atn>0?"Laadpaal belastbaar":"Niet belastbaar",rows,steps});
    }
    const ceiling=kwh*cregMax/100;
    if(rate<=cregMax+1e-9){
      let atn=borneAdd;
      const rows=[["Terugbetaalde elektriciteit","0,00 €","free"]];
      if(borneAdd>0)rows.push(["Overdracht laadpaal",fmtE(borneAdd),"tax"]);
      const steps=["Bedrijfswagen + thuisladen + communicerende laadpaal + « car policy »: <b>de uitzondering is van toepassing</b> (punten 13-21).",
        \`Toegepast tarief (\${fmtC(rate)}) <b>≤ CREG-plafond</b> (\${fmtC(cregMax)}) → terugbetaling <b>volledig gedekt</b>.\`,
        "Zoals een brandstofkaart: <b>geen bijkomend VAA</b>. Alleen het forfaitaire VAA « wagen » blijft verschuldigd."];
      if(borneStep)steps.push(borneStep);
      return render({atn,status:atn>0?"warn":"ok",statusTxt:atn>0?"Laadpaal belastbaar":"Niet belastbaar",rows,steps});
    }else{
      const excess=reimb-ceiling,atn=excess+borneAdd;
      const rows=[["Totale terugbetaling",fmtE(reimb),""],["Gedekt door het CREG-plafond","− "+fmtE(ceiling),"free"],["Overschot buiten tolerantie",fmtE(excess),"tax"]];
      if(borneAdd>0)rows.push(["Overdracht laadpaal",fmtE(borneAdd),"tax"]);
      const steps=["De uitzondering is van toepassing, <b>maar</b> het forfaitaire tarief overschrijdt het CREG-plafond.",
        \`Tarief \${fmtC(rate)} &gt; plafond \${fmtC(cregMax)}. De tolerantie « vast bedrag » geldt alleen <b>tot het plafond</b> (punt 24).\`,
        \`Gedekt deel: \${fmtE(ceiling)}. <b>Overschot: \${fmtE(excess)}</b> → belastbaar, tenzij hogere werkelijke kosten worden bewezen (punt 22).\`];
      if(borneStep)steps.push(borneStep);
      return render({atn,status:"warn",statusTxt:"Gedeeltelijk belastbaar",rows,steps});
    }
  }

  const pProf=clampPct($("pProf").value),pCommute=clampPct($("pCommute").value);
  let pPriv=100-pProf-pCommute;if(pPriv<0)pPriv=0;$("pPriv").value=pPriv;
  const profAmt=reimb*pProf/100,commuteAmt=reimb*pCommute/100,privAmt=reimb*pPriv/100;
  const expType=val("exp"),exo=Math.max(0,parseFloat($("exoneration").value)||0);
  let commuteTax=commuteAmt,commuteNote;
  if(expType==="forfait"){commuteTax=Math.max(0,commuteAmt-exo);commuteNote=\`vrijgesteld tot \${fmtE(exo)} (forfaitaire kosten)\`;}
  else{commuteNote="werkelijke kosten: geen vrijstelling van 490 €";}
  const atn=commuteTax+privAmt+borneAdd;

  const why=veh==="privee"?"<b>Privé</b>wagen van de werknemer":lieu==="publique"?"Opladen aan een <b>openbare laadpaal</b>":"Thuisladen <b>zonder alle voorwaarden</b> van de uitzondering";
  const rows=[["Professionele trajecten ("+pProf+"%)","0,00 €","free"],["Woon-werkverkeer ("+pCommute+"%)",fmtE(commuteTax),"tax"],["Privétrajekten ("+pPriv+"%)",fmtE(privAmt),"tax"]];
  if(borneAdd>0)rows.push(["Overdracht laadpaal",fmtE(borneAdd),"tax"]);
  const steps=[\`\${why} → de uitzondering is niet van toepassing; men volgt de <b>aard van de verplaatsing</b> (punten 9-12).\`,
    \`<b>Professioneel</b> (\${fmtE(profAmt)}): eigen kosten van de werkgever → <b>niet belastbaar</b>, mits dubbel bewijs (punt 10).\`,
    \`<b>Woon-werk</b> (\${fmtE(commuteAmt)}): belastbaar VAA, \${commuteNote} → <b>\${fmtE(commuteTax)}</b> (punt 11).\`,
    \`<b>Privé</b> (\${fmtE(privAmt)}): volledig belastbaar (punt 12).\`];
  if(borneStep)steps.push(borneStep);
  return render({atn,status:atn>0?"warn":"ok",statusTxt:atn>0?"Belastbaar":"Niet belastbaar",rows,steps});
}
function clampPct(v){v=parseFloat(v)||0;return Math.min(100,Math.max(0,Math.round(v)));}

function render({atn,status,statusTxt,rows,steps}){
  $("atnAmount").textContent=fmtE(atn);
  $("atnAmount").style.color=atn>0?"var(--warn)":"var(--accent)";
  const b=$("statusBadge");b.className="badge "+(status==="warn"?"warn":"ok");b.innerHTML='<span class="bd"></span> '+statusTxt;
  const bd=$("breakdown");bd.innerHTML="";
  rows.forEach(([l,v,cls])=>{const d=document.createElement('div');d.className="brow";d.innerHTML=\`<span class="bl">\${l}</span><span class="bv \${cls||''}">\${v}</span>\`;bd.appendChild(d);});
  const t=document.createElement('div');t.className="brow total";t.innerHTML=\`<span class="bl">Totaal belastbaar VAA</span><span class="bv \${atn>0?'tax':'free'}">\${fmtE(atn)}</span>\`;bd.appendChild(t);
  if(_aside){const a=document.createElement('div');a.className="aside-wrap";a.innerHTML=_aside;bd.appendChild(a);}
  const ol=$("steps");ol.innerHTML="";steps.forEach(s=>{const li=document.createElement('li');li.innerHTML=s;ol.appendChild(li);});
}

function refreshVisibility(){
  const arr=val("arr");$("rembBlock").style.display=arr==="fourn"?"none":"block";
  const veh=val("veh"),lieu=val("lieu");
  const exceptionEligible=(veh==="societe"&&lieu==="domicile");
  $("condBlock").classList.toggle("show",exceptionEligible);
  const comm=exceptionEligible?val("comm")==="oui":false,policy=exceptionEligible?val("policy")==="oui":false;
  const exceptionApplies=exceptionEligible&&comm&&policy;
  $("splitBlock").classList.toggle("show",arr==="remb"&&!exceptionApplies);
  $("commuteOpts").style.display=(clampPct($("pCommute").value)>0)?"block":"none";
  $("borneBlock").classList.toggle("show",arr==="remb"&&veh==="societe");
  $("subWrap").classList.toggle("show",arr==="remb"&&veh==="societe");
  $("borneValWrap").classList.toggle("show",val("trf")==="oui");
  const baseNote=document.getElementById("baseNote");
  if(baseNote) baseNote.style.display=(exceptionEligible&&val("base")==="reel")?"block":"none";
  $("rateWrap").style.display=val("meth")==="rate"?"block":"none";
  $("totalWrap").style.display=val("meth")==="total"?"block":"none";
}
document.addEventListener("input",()=>{refreshVisibility();compute();});
document.addEventListener("change",()=>{refreshVisibility();compute();});
$("fillCreg").addEventListener("click",()=>{const m=cregFor($("region").value,$("quarter").value);
  document.querySelector('input[name="meth"][value="rate"]').checked=true;$("rate").value=m.toFixed(2);refreshVisibility();compute();});
refreshVisibility();compute();
`

const TOOL_SCRIPT_DE = `
"use strict";
/* Plafonds CREG (centimes €/kWh) — conf: confiance, circ: source */
const CREG={
  "2025-T1":{fl:28.22,bxl:32.94,wal:32.56,circ:"2024/C/77",conf:"eleve"},
  "2025-T2":{fl:31.94,bxl:35.85,wal:36.17,circ:"2025/C/14",conf:"eleve"},
  "2025-T3":{fl:34.56,bxl:37.87,wal:38.43,circ:"2025/C/38",conf:"eleve"},
  "2025-T4":{fl:30.70,bxl:33.56,wal:34.57,circ:"2025/C/60",conf:"eleve"},
  "2026-T1":{fl:31.32,bxl:34.26,wal:35.23,circ:"2025/C/72",conf:"moyen"},
  "2026-T2":{fl:31.91,bxl:35.55,wal:36.36,circ:"2026/C/44",conf:"eleve"},
  "2026-T3":{fl:32.22,bxl:37.19,wal:37.83,circ:"addendum",conf:"moyen"}
};
const QLABEL={"2025-T1":"Q1 2025","2025-T2":"Q2 2025","2025-T3":"Q3 2025","2025-T4":"Q4 2025","2026-T1":"Q1 2026","2026-T2":"Q2 2026","2026-T3":"Q3 2026"};
const CONFLABEL={eleve:"HOCH",moyen:"MITTEL"};
const $=id=>document.getElementById(id);
let _aside="";
const fmtE=v=>v.toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})+" €";
const fmtC=v=>v.toLocaleString('de-DE',{minimumFractionDigits:2,maximumFractionDigits:2})+" c€/kWh";

(function init(){
  const q=$("quarter");
  Object.keys(CREG).forEach(k=>{const o=document.createElement('option');o.value=k;o.textContent=QLABEL[k];q.appendChild(o);});
  q.value="2025-T1";
  const tb=$("cregTable");
  Object.keys(CREG).forEach(k=>{const c=CREG[k];const tr=document.createElement('tr');
    tr.innerHTML=\`<td>\${QLABEL[k]}</td><td>\${c.fl.toFixed(2)}</td><td>\${c.bxl.toFixed(2)}</td><td>\${c.wal.toFixed(2)}</td>\`+
      \`<td class="src-soft">\${c.circ}</td><td><span class="conf \${c.conf}">\${CONFLABEL[c.conf]}</span></td>\`;
    tb.appendChild(tr);});
})();

function cregFor(region,quarter){const c=CREG[quarter];return region==="unique"?Math.min(c.fl,c.bxl,c.wal):c[region];}
const val=name=>document.querySelector(\`input[name="\${name}"]:checked\`).value;

function compute(){
  _aside="";
  const arr=val("arr");
  const region=$("region").value,quarter=$("quarter").value;
  const cregMax=cregFor(region,quarter);
  $("cregVal").textContent=fmtC(cregMax);

  if(arr==="fourn"){
    return render({atn:0,status:"ok",statusTxt:"Kein gesonderter Vorteil",
      rows:[["Gesonderter Stromvorteil","0,00 €","free"]],
      steps:["Der Strom wird <b>auf den Namen des Arbeitgebers</b> in Rechnung gestellt: <b>kostenlose Bereitstellung</b> (Punkte 3-5).",
        "Er ist <b>im pauschalen Vorteil des Fahrzeugs enthalten</b> (Art. 36, §2 EStGB). Kein zusätzlicher GWV für Strom.",
        "Nur der pauschale GWV „Fahrzeug" bleibt steuerpflichtig — wird separat berechnet."]});
  }

  const veh=val("veh"),lieu=val("lieu");
  const kwh=Math.max(0,parseFloat($("kwh").value)||0);
  const meth=val("meth");
  let rate,reimb;
  if(meth==="rate"){rate=Math.max(0,parseFloat($("rate").value)||0);reimb=kwh*rate/100;}
  else{reimb=Math.max(0,parseFloat($("total").value)||0);rate=kwh>0?reimb/kwh*100:0;}

  let borneAdd=0,borneStep=null;
  if(val("trf")==="oui"){borneAdd=Math.max(0,parseFloat($("borneVal").value)||0);
    borneStep=\`<b>Übertragung der Ladestation</b>: ihr tatsächlicher Wert (\${fmtE(borneAdd)}) stellt einen gesonderten GWV dar (Punkte 37-38).\`;}

  const sub=Math.max(0,parseFloat(($("subFee")||{}).value)||0);
  if(sub>0&&veh==="societe") _aside=\`<div class="aside-note"><b>Abonnement / Ladestationsverwaltung: \${fmtE(sub)}</b> — gesonderter Posten der Stromerstattung, <b>nicht berücksichtigt</b> im obigen GWV. Gemäß Ihrer car policy zu qualifizieren (Bereitstellung der Ladestation, Punkt 16); lassen Sie die steuerliche Behandlung durch Ihr Sozialsekretariat oder Ihren Steuerberater bestätigen.</div>\`;

  const exceptionEligible=(veh==="societe"&&lieu==="domicile");
  const comm=exceptionEligible?val("comm")==="oui":false;
  const policy=exceptionEligible?val("policy")==="oui":false;
  const exceptionApplies=exceptionEligible&&comm&&policy;

  if(exceptionApplies){
    const base=val("base");
    if(base==="reel"){
      const atn=borneAdd;
      const rows=[["Erstattete tatsächliche Stromkosten",fmtE(reimb),"free"],["Gedeckt (Rechnungsnachweis)","− "+fmtE(reimb),"free"]];
      if(borneAdd>0)rows.push(["Übertragung der Ladestation",fmtE(borneAdd),"tax"]);
      const steps=["Firmenwagen + Heimladen + kommunizierende Ladestation + car policy: <b>die Ausnahme gilt</b> (Punkte 13-21).",
        "Erstattung auf Basis Ihrer <b>durch Rechnung belegten tatsächlichen Kosten</b> (Punkt 22) → <b>vollständig gedeckt</b>, wie eine Tankkarte. Die CREG-Obergrenze begrenzt nur die <i>Pauschalmethode</i>.",
        "Voraussetzung: Die Rechnung muss <b>ausschließlich den Strom für den Firmenwagen</b> ausweisen (Punkt 14) — ohne Abonnement / Verwaltungsgebühren der Ladestation.",
        "Nur der pauschale GWV „Fahrzeug" bleibt geschuldet (wird separat berechnet)."];
      if(borneStep)steps.push(borneStep);
      return render({atn,status:atn>0?"warn":"ok",statusTxt:atn>0?"Ladestation steuerpflichtig":"Nicht steuerpflichtig",rows,steps});
    }
    const ceiling=kwh*cregMax/100;
    if(rate<=cregMax+1e-9){
      let atn=borneAdd;
      const rows=[["Erstatteter Strom","0,00 €","free"]];
      if(borneAdd>0)rows.push(["Übertragung der Ladestation",fmtE(borneAdd),"tax"]);
      const steps=["Firmenwagen + Heimladen + kommunizierende Ladestation + car policy: <b>die Ausnahme gilt</b> (Punkte 13-21).",
        \`Angewendeter Tarif (\${fmtC(rate)}) <b>≤ CREG-Obergrenze</b> (\${fmtC(cregMax)}) → Erstattung <b>vollständig gedeckt</b>.\`,
        "Wie eine Tankkarte: <b>kein zusätzlicher GWV</b>. Nur der pauschale GWV „Fahrzeug" bleibt geschuldet."];
      if(borneStep)steps.push(borneStep);
      return render({atn,status:atn>0?"warn":"ok",statusTxt:atn>0?"Ladestation steuerpflichtig":"Nicht steuerpflichtig",rows,steps});
    }else{
      const excess=reimb-ceiling,atn=excess+borneAdd;
      const rows=[["Gesamterstattung",fmtE(reimb),""],["Gedeckt durch CREG-Obergrenze","− "+fmtE(ceiling),"free"],["Überschuss außerhalb der Toleranz",fmtE(excess),"tax"]];
      if(borneAdd>0)rows.push(["Übertragung der Ladestation",fmtE(borneAdd),"tax"]);
      const steps=["Die Ausnahme gilt, <b>aber</b> der Pauschaltarif übersteigt die CREG-Obergrenze.",
        \`Tarif \${fmtC(rate)} &gt; Obergrenze \${fmtC(cregMax)}. Die Toleranz „Festbetrag" gilt nur <b>bis zur Obergrenze</b> (Punkt 24).\`,
        \`Gedeckter Anteil: \${fmtE(ceiling)}. <b>Überschuss: \${fmtE(excess)}</b> → steuerpflichtig, außer Nachweis höherer tatsächlicher Kosten (Punkt 22).\`];
      if(borneStep)steps.push(borneStep);
      return render({atn,status:"warn",statusTxt:"Teilweise steuerpflichtig",rows,steps});
    }
  }

  const pProf=clampPct($("pProf").value),pCommute=clampPct($("pCommute").value);
  let pPriv=100-pProf-pCommute;if(pPriv<0)pPriv=0;$("pPriv").value=pPriv;
  const profAmt=reimb*pProf/100,commuteAmt=reimb*pCommute/100,privAmt=reimb*pPriv/100;
  const expType=val("exp"),exo=Math.max(0,parseFloat($("exoneration").value)||0);
  let commuteTax=commuteAmt,commuteNote;
  if(expType==="forfait"){commuteTax=Math.max(0,commuteAmt-exo);commuteNote=\`befreit bis \${fmtE(exo)} (Pauschale Kosten)\`;}
  else{commuteNote="tatsächliche Kosten: keine Befreiung von 490 €";}
  const atn=commuteTax+privAmt+borneAdd;

  const why=veh==="privee"?"<b>Privat</b>fahrzeug des Arbeitnehmers":lieu==="publique"?"Laden an einer <b>öffentlichen Ladestation</b>":"Heimladen <b>ohne alle Voraussetzungen</b> der Ausnahme";
  const rows=[["Berufliche Fahrten ("+pProf+"%)","0,00 €","free"],["Wohnung ↔ Arbeit ("+pCommute+"%)",fmtE(commuteTax),"tax"],["Private Fahrten ("+pPriv+"%)",fmtE(privAmt),"tax"]];
  if(borneAdd>0)rows.push(["Übertragung der Ladestation",fmtE(borneAdd),"tax"]);
  const steps=[\`\${why} → die Ausnahme gilt nicht; es wird die <b>Art der Fahrt</b> berücksichtigt (Punkte 9-12).\`,
    \`<b>Beruflich</b> (\${fmtE(profAmt)}): eigene Kosten des Arbeitgebers → <b>nicht steuerpflichtig</b>, vorbehaltlich doppelten Nachweises (Punkt 10).\`,
    \`<b>Wohnung-Arbeit</b> (\${fmtE(commuteAmt)}): steuerpflichtiger GWV, \${commuteNote} → <b>\${fmtE(commuteTax)}</b> (Punkt 11).\`,
    \`<b>Privat</b> (\${fmtE(privAmt)}): vollständig steuerpflichtig (Punkt 12).\`];
  if(borneStep)steps.push(borneStep);
  return render({atn,status:atn>0?"warn":"ok",statusTxt:atn>0?"Steuerpflichtig":"Nicht steuerpflichtig",rows,steps});
}
function clampPct(v){v=parseFloat(v)||0;return Math.min(100,Math.max(0,Math.round(v)));}

function render({atn,status,statusTxt,rows,steps}){
  $("atnAmount").textContent=fmtE(atn);
  $("atnAmount").style.color=atn>0?"var(--warn)":"var(--accent)";
  const b=$("statusBadge");b.className="badge "+(status==="warn"?"warn":"ok");b.innerHTML='<span class="bd"></span> '+statusTxt;
  const bd=$("breakdown");bd.innerHTML="";
  rows.forEach(([l,v,cls])=>{const d=document.createElement('div');d.className="brow";d.innerHTML=\`<span class="bl">\${l}</span><span class="bv \${cls||''}">\${v}</span>\`;bd.appendChild(d);});
  const t=document.createElement('div');t.className="brow total";t.innerHTML=\`<span class="bl">Gesamter steuerpflichtiger GWV</span><span class="bv \${atn>0?'tax':'free'}">\${fmtE(atn)}</span>\`;bd.appendChild(t);
  if(_aside){const a=document.createElement('div');a.className="aside-wrap";a.innerHTML=_aside;bd.appendChild(a);}
  const ol=$("steps");ol.innerHTML="";steps.forEach(s=>{const li=document.createElement('li');li.innerHTML=s;ol.appendChild(li);});
}

function refreshVisibility(){
  const arr=val("arr");$("rembBlock").style.display=arr==="fourn"?"none":"block";
  const veh=val("veh"),lieu=val("lieu");
  const exceptionEligible=(veh==="societe"&&lieu==="domicile");
  $("condBlock").classList.toggle("show",exceptionEligible);
  const comm=exceptionEligible?val("comm")==="oui":false,policy=exceptionEligible?val("policy")==="oui":false;
  const exceptionApplies=exceptionEligible&&comm&&policy;
  $("splitBlock").classList.toggle("show",arr==="remb"&&!exceptionApplies);
  $("commuteOpts").style.display=(clampPct($("pCommute").value)>0)?"block":"none";
  $("borneBlock").classList.toggle("show",arr==="remb"&&veh==="societe");
  $("subWrap").classList.toggle("show",arr==="remb"&&veh==="societe");
  $("borneValWrap").classList.toggle("show",val("trf")==="oui");
  const baseNote=document.getElementById("baseNote");
  if(baseNote) baseNote.style.display=(exceptionEligible&&val("base")==="reel")?"block":"none";
  $("rateWrap").style.display=val("meth")==="rate"?"block":"none";
  $("totalWrap").style.display=val("meth")==="total"?"block":"none";
}
document.addEventListener("input",()=>{refreshVisibility();compute();});
document.addEventListener("change",()=>{refreshVisibility();compute();});
$("fillCreg").addEventListener("click",()=>{const m=cregFor($("region").value,$("quarter").value);
  document.querySelector('input[name="meth"][value="rate"]').checked=true;$("rate").value=m.toFixed(2);refreshVisibility();compute();});
refreshVisibility();compute();
`

// ─────────────────────────────────────────────────────────────────────────────
// Textes UI par locale (auth gate + share button)
// ─────────────────────────────────────────────────────────────────────────────
const AUTH_STRINGS: Record<string, { title: string; desc: string; cta: string; back: string; shareBtn: string; shareCopied: string }> = {
  fr: {
    title: 'Outil réservé aux membres',
    desc: "Le calculateur ATN \u00ab recharge électrique payée par l'employeur (BE) \u00bb est accessible gratuitement aux membres connectés. Connectez-vous ou créez un compte en 30 secondes \u2014 puis partagez le lien à un collègue ou un ami (il lui suffira d'être connecté pour l'ouvrir).",
    cta: "Se connecter / s'inscrire \u2192",
    back: '\u2190 Tous les outils',
    shareBtn: '\ud83d\udd17 Partager à un ami',
    shareCopied: 'Lien copié \u2014 envoyez-le à un ami \u2713',
  },
  en: {
    title: 'Members-only tool',
    desc: 'The BIK calculator \u201cemployer-paid home charging (BE)\u201d is free for logged-in members. Sign in or create an account in 30 seconds \u2014 then share the link with a colleague or friend (they only need to be logged in to open it).',
    cta: 'Sign in / create account \u2192',
    back: '\u2190 All tools',
    shareBtn: '\ud83d\udd17 Share with a friend',
    shareCopied: 'Link copied \u2014 send it to a friend \u2713',
  },
  nl: {
    title: 'Enkel voor leden',
    desc: "De VAV-calculator \u00ab door de werkgever betaald thuisladen (BE) \u00bb is gratis voor ingelogde leden. Meld u aan of maak in 30 seconden een account aan \u2014 deel dan de link met een collega of vriend (hij hoeft alleen maar ingelogd te zijn om hem te openen).",
    cta: 'Aanmelden / account aanmaken \u2192',
    back: '\u2190 Alle tools',
    shareBtn: '\ud83d\udd17 Delen met een vriend',
    shareCopied: 'Link gekopieerd \u2014 stuur het naar een vriend \u2713',
  },
  de: {
    title: 'Nur für Mitglieder',
    desc: 'Der SV-Rechner \u201evom Arbeitgeber bezahltes Heimladen (BE)\u201c ist kostenlos für eingeloggte Mitglieder. Melden Sie sich an oder erstellen Sie in 30 Sekunden ein Konto \u2014 teilen Sie dann den Link mit einem Kollegen oder Freund (er muss nur eingeloggt sein, um ihn zu öffnen).',
    cta: 'Anmelden / Konto erstellen \u2192',
    back: '\u2190 Alle Tools',
    shareBtn: '\ud83d\udd17 Mit einem Freund teilen',
    shareCopied: 'Link kopiert \u2014 senden Sie ihn an einen Freund \u2713',
  },
}

const TOOL_HTML_MAP: Record<string, string> = {
  fr: TOOL_HTML,
  en: TOOL_HTML_EN,
  nl: TOOL_HTML_NL,
  de: TOOL_HTML_DE,
}

const TOOL_SCRIPT_MAP: Record<string, string> = {
  en: TOOL_SCRIPT_EN,
  nl: TOOL_SCRIPT_NL,
  de: TOOL_SCRIPT_DE,
}

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
  const { isReady, isBootstrapped, userId } = useUserContext()
  const pathname = usePathname()
  const locale = useLocale()
  const [mounted, setMounted] = useState(false)
  const [shareMsg, setShareMsg] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const s = AUTH_STRINGS[locale] || AUTH_STRINGS['fr']

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted || !userId) return
    const root = rootRef.current
    if (!root) return

    if (locale === 'fr') {
      const cleanup = runCalculator(root)
      return cleanup
    }

    // EN / NL / DE : le script calculateur est injecté après que le markup
    // soit dans le DOM (via dangerouslySetInnerHTML → toolHtml).
    const scriptContent = TOOL_SCRIPT_MAP[locale]
    if (!scriptContent) return
    const el = document.createElement('script')
    el.textContent = scriptContent
    document.body.appendChild(el)
  }, [mounted, userId, locale])

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
      setShareMsg(s.shareCopied)
      setTimeout(() => setShareMsg(''), 3500)
    } catch {
      setShareMsg(url)
    }
  }

  if (!mounted || !isReady || !isBootstrapped) {
    return <div style={{ minHeight: '60vh' }} />
  }

  if (!userId) {
    return (
      <section style={{ maxWidth: 560, margin: '0 auto', padding: '64px 22px', textAlign: 'center' }}>
        <div style={{ fontSize: '2.6rem', marginBottom: 14 }}>🔒</div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 12, color: 'var(--color-text)' }}>
          {s.title}
        </h1>
        <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 26 }}>
          {s.desc}
        </p>
        <Link
          href={`/espace-membres?next=${encodeURIComponent(pathname)}`}
          style={{
            display: 'inline-block', background: 'var(--color-primary)', color: '#fff',
            fontWeight: 700, padding: '12px 26px', borderRadius: 10, textDecoration: 'none',
          }}
        >
          {s.cta}
        </Link>
        <div style={{ marginTop: 18 }}>
          <Link href="/outils" style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
            {s.back}
          </Link>
        </div>
      </section>
    )
  }

  const toolHtml = TOOL_HTML_MAP[locale] || TOOL_HTML

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
          {s.shareBtn}
        </button>
      </div>
      <main className="m-tool" ref={rootRef} dangerouslySetInnerHTML={{ __html: toolHtml }} />
    </>
  )
}
