/**
 * ev-charge-model.ts — Modèle PARAMÉTRIQUE de temps de charge DC.
 *
 * Contexte : OpenEV Data ne fournit AUCUNE courbe de charge (mesuré en Phase 0,
 * release v1.24.0 : 0/421). On reconstruit donc une courbe synthétique
 * « puissance / SOC » à partir des seuls champs disponibles :
 *   - puissance DC crête (dc_kw)
 *   - classe d'architecture (400 V / 800 V) — taper plus tardif en 800 V
 *   - capacité batterie utile (kWh)
 *
 * ⚠️ C'est une ESTIMATION, pas une mesure. Bien plus juste qu'une pause forfaitaire,
 * mais à présenter comme « estimé » dans l'UI. Le jour où des courbes réelles
 * existent (champ raw.charging.dc_charge_curve), basculer dessus en priorité.
 */

export type VoltageClass = "400v" | "800v" | "other";

export interface ChargeModelInput {
  battKwhNet: number;      // capacité utile (kWh)
  dcPeakKw: number;        // puissance DC crête du véhicule (kW)
  voltageClass?: VoltageClass;
  stationKw?: number;      // puissance max de la borne (kW). Défaut : illimité (= véhicule)
}

/**
 * Forme normalisée de la courbe : fraction de la puissance crête (0..1) en
 * fonction du SOC (0..100). Calibrée sur des profils publics typiques.
 * 800 V tient le plateau plus longtemps ; 400 V décroche plus tôt.
 */
const SHAPE: Record<"400v" | "800v", Array<[soc: number, frac: number]>> = {
  "400v": [
    [0, 0.80], [10, 0.95], [20, 1.0], [40, 0.92], [50, 0.80],
    [60, 0.66], [70, 0.52], [80, 0.40], [90, 0.27], [100, 0.15],
  ],
  "800v": [
    [0, 0.85], [10, 0.98], [20, 1.0], [45, 1.0], [55, 0.90],
    [65, 0.74], [75, 0.58], [85, 0.42], [92, 0.30], [100, 0.18],
  ],
};

function shapeFor(vc?: VoltageClass): Array<[number, number]> {
  return vc === "800v" ? SHAPE["800v"] : SHAPE["400v"];
}

/** Interpolation linéaire de la fraction de puissance crête à un SOC donné. */
export function powerFractionAtSoc(soc: number, vc?: VoltageClass): number {
  const pts = shapeFor(vc);
  const s = Math.max(0, Math.min(100, soc));
  for (let i = 1; i < pts.length; i++) {
    const [s0, f0] = pts[i - 1];
    const [s1, f1] = pts[i];
    if (s <= s1) {
      const t = (s - s0) / (s1 - s0);
      return f0 + (f1 - f0) * t;
    }
  }
  return pts[pts.length - 1][1];
}

const THERMAL_MARGIN = 1.10; // pertes + montée en température ~10 %

/**
 * Temps de charge estimé (minutes) de socFrom → socTo.
 * Intègre la courbe synthétique par pas de 1 % de SOC, en plafonnant la
 * puissance par celle de la borne.
 */
export function chargeTimeMin(
  input: ChargeModelInput,
  socFrom: number,
  socTo: number
): number {
  const { battKwhNet, dcPeakKw, voltageClass, stationKw } = input;
  if (!battKwhNet || !dcPeakKw || socTo <= socFrom) return 0;
  const cap = stationKw && stationKw > 0 ? stationKw : Infinity;

  const a = Math.max(0, Math.min(100, socFrom));
  const b = Math.max(0, Math.min(100, socTo));
  const stepKwh = battKwhNet * 0.01; // énergie par 1 % de SOC

  let minutes = 0;
  for (let soc = a; soc < b; soc += 1) {
    const pVeh = dcPeakKw * powerFractionAtSoc(soc + 0.5, voltageClass);
    const pEff = Math.min(pVeh, cap);
    if (pEff <= 0) continue;
    minutes += (stepKwh / pEff) * 60;
  }
  return Math.round(minutes * THERMAL_MARGIN);
}

/** Énergie (kWh) ajoutée entre deux SOC. */
export function energyAddedKwh(battKwhNet: number, socFrom: number, socTo: number): number {
  return battKwhNet * (Math.max(0, socTo - socFrom) / 100);
}

/**
 * Points de la courbe synthétique (pour tracé UI), en kW absolus vs SOC,
 * éventuellement plafonnés par la borne.
 */
export function syntheticCurve(
  input: ChargeModelInput,
  stepSoc = 5
): Array<{ soc: number; kw: number }> {
  const { dcPeakKw, voltageClass, stationKw } = input;
  const cap = stationKw && stationKw > 0 ? stationKw : Infinity;
  const out: Array<{ soc: number; kw: number }> = [];
  for (let soc = 0; soc <= 100; soc += stepSoc) {
    const kw = Math.min(dcPeakKw * powerFractionAtSoc(soc, voltageClass), cap);
    out.push({ soc, kw: Math.round(kw) });
  }
  return out;
}

/**
 * Aide trajet : nombre d'arrêts + temps total estimé pour parcourir distanceKm,
 * en rechargeant entre socLow et socHigh, conso en kWh/100km.
 * Hypothèse simple (pas de simulation fine d'itinéraire) — pour un ordre de grandeur.
 */
export function trajetRecharge(
  input: ChargeModelInput,
  distanceKm: number,
  consoKwhPer100: number,
  socLow = 10,
  socHigh = 80,
  socDepart = 90
): { arrets: number; minutesRecharge: number; kwhTotal: number } {
  const { battKwhNet } = input;
  const kwhTotal = (distanceKm * consoKwhPer100) / 100;
  const usableStart = battKwhNet * ((socDepart - socLow) / 100);
  if (kwhTotal <= usableStart) return { arrets: 0, minutesRecharge: 0, kwhTotal };

  const perStop = battKwhNet * ((socHigh - socLow) / 100);
  const reste = kwhTotal - usableStart;
  const arrets = Math.ceil(reste / perStop);
  const minutesRecharge = arrets * chargeTimeMin(input, socLow, socHigh);
  return { arrets, minutesRecharge, kwhTotal };
}
