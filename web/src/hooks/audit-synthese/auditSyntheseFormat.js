/**
 * @fileoverview Mise en forme de la synthèse de l'audit : libellés de décision et grille
 * décisions par mois. Ne calcule aucun indicateur : les valeurs viennent de l'API.
 * @module hooks/audit-synthese/auditSyntheseFormat
 */

import { AUDIT_DECISION_LABELS } from '../../config/interventionTypes.js';

/** Libellé français d'un type de décision ; le code brut à défaut de libellé connu */
export function decisionTypeLabel(type) {
  return AUDIT_DECISION_LABELS[type] ?? type ?? '—';
}

/** Libellé du motif ; le code à défaut de libellé */
export function reasonLabel(row) {
  return row.reason_label || row.reason_code || '—';
}

/**
 * Regroupe les décisions par (type, motif) avec le compte de chaque mois.
 * @param {Array} decisions - lignes {month, decision_type, reason_code, reason_label, count}
 * @returns {Array<{key, type, reason, byMonth: Object, total: number}>} triées par total décroissant
 */
export function groupDecisions(decisions) {
  const rows = new Map();
  for (const d of decisions) {
    const key = `${d.decision_type}|${d.reason_code}`;
    if (!rows.has(key)) {
      rows.set(key, { key, type: decisionTypeLabel(d.decision_type), reason: reasonLabel(d), byMonth: {}, total: 0 });
    }
    const row = rows.get(key);
    row.byMonth[d.month] = (row.byMonth[d.month] ?? 0) + d.count;
    row.total += d.count;
  }
  return [...rows.values()].sort((a, b) => b.total - a.total || a.key.localeCompare(b.key));
}
