/**
 * @fileoverview Mise en forme des indicateurs des constats (ADR 0044) : fonctions pures
 * @module components/bilan/constatInsightsFormat
 */

import { shareOf } from '../../hooks/organisation/organisationFormat.js';

const GRAY = 'var(--gray-8)';

// Teintes des choix sans type d'intervention, par code (données de référence 0028)
const CHOICE_COLORS = {
  TRAINING: 'var(--amber-9)',
  MONITORING: 'var(--indigo-9)',
  SIGNAL_SEEN: 'var(--orange-9)',
  SIGNAL_NOT_REPORTED: 'var(--red-9)',
  SINCE_LT_1M: 'var(--blue-6)',
  SINCE_1_3M: 'var(--blue-9)',
  SINCE_GT_3M: 'var(--blue-11)',
};

// Un signal existait avant l'arrêt, vu ou non remonté
const SIGNAL_VISIBLE = ['SIGNAL_SEEN', 'SIGNAL_NOT_REPORTED'];
// Demande issue du constat retenue : acceptée, ou déjà traitée et clôturée
const RETAINED = ['acceptee', 'cloturee'];
const PENDING = ['nouvelle', 'en_attente'];

const sum = (items) => (items ?? []).reduce((acc, i) => acc + i.count, 0);
const countOf = (items, codes) => sum((items ?? []).filter((i) => codes.includes(i.code)));

/**
 * Segments d'une barre empilée (StackedBar) ; couleur du type d'intervention, sinon du code.
 * @param {Array<{code: string, label: string, count: number, color?: string, suggested_type_inter?: string}>} items
 * @param {(code: string) => string} typeColor - couleur d'un type d'intervention
 */
export function segmentsOf(items, typeColor) {
  return (items ?? []).map((i) => ({
    key: i.code,
    label: i.label,
    value: i.count,
    color: i.color || (i.suggested_type_inter ? typeColor(i.suggested_type_inter) : CHOICE_COLORS[i.code] ?? GRAY),
  }));
}

// Part d'une sélection de codes dans une liste : compte, base et pourcentage
function partOf(items, codes) {
  const count = countOf(items, codes);
  const of = sum(items);
  return { count, of, share: shareOf(count, of) };
}

/** Chiffres clés : total, signal visible, signal non remonté, suggestions retenues */
export function keyFigures(data) {
  const { total = 0, by_month: months = [], signals = [], outcomes = [] } = data ?? {};
  return {
    total,
    series: months.map((m) => m.count),
    visible: partOf(signals, SIGNAL_VISIBLE),
    notReported: partOf(signals, ['SIGNAL_NOT_REPORTED']),
    retained: partOf(outcomes, RETAINED),
    pending: countOf(outcomes, PENDING),
  };
}

/** Somme des comptes d'une liste (total d'une barre) */
export const totalOf = sum;

/** Aucun constat sur la période (ou réponse absente) */
export function isEmptyInsights(data) {
  return !data || !(data.total > 0);
}
