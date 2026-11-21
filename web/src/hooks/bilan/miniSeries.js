/**
 * @fileoverview Calculs d'affichage de l'onglet État du Bilan : points d'une mini-courbe et
 * parts d'une barre empilée. Ne calcule aucun agrégat métier : les valeurs viennent de l'API.
 * @module hooks/bilan/miniSeries
 */

/**
 * Points d'une mini-courbe, répartis sur toute la largeur. Un mois sans valeur (null) est sauté.
 * @param {Array<number|null>} values - une valeur par mois
 * @param {number} width
 * @param {number} height
 * @param {number} [pad=2] - marge pour ne pas rogner le trait
 * @returns {Array<{x: number, y: number}>|null} null : moins de deux points, pas de courbe
 */
export function sparklinePoints(values, width, height, pad = 2) {
  const known = values
    .map((value, index) => ({ value, index }))
    .filter((p) => p.value != null);
  if (known.length < 2) return null;
  const min = Math.min(...known.map((p) => p.value));
  const max = Math.max(...known.map((p) => p.value));
  const range = max - min;
  const lastIndex = values.length - 1;
  return known.map(({ value, index }) => ({
    x: pad + (index / lastIndex) * (width - 2 * pad),
    // Série plate : trait au milieu
    y: range === 0 ? height / 2 : pad + (1 - (value - min) / range) * (height - 2 * pad),
  }));
}

// Pentes (tangentes) d'une courbe monotone : jamais de dépassement entre deux points (Fritsch-Carlson)
function monotoneTangents(points) {
  const slopes = points.slice(1).map((p, i) => (p.y - points[i].y) / (p.x - points[i].x));
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === points.length - 1) return slopes[i - 1];
    return slopes[i - 1] * slopes[i] <= 0 ? 0 : (slopes[i - 1] + slopes[i]) / 2;
  });
  slopes.forEach((d, i) => {
    if (d === 0) {
      tangents[i] = 0;
      tangents[i + 1] = 0;
      return;
    }
    const a = tangents[i] / d;
    const b = tangents[i + 1] / d;
    const norm = a * a + b * b;
    if (norm > 9) {
      tangents[i] = (3 * a * d) / Math.sqrt(norm);
      tangents[i + 1] = (3 * b * d) / Math.sqrt(norm);
    }
  });
  return tangents;
}

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Chemin SVG d'une courbe lissée passant par tous les points (spline cubique monotone).
 * @param {Array<{x: number, y: number}>} points - abscisses strictement croissantes
 * @returns {string} attribut d du <path> ; vide si moins de deux points
 */
export function smoothPath(points) {
  if (!points || points.length < 2) return '';
  const tangents = monotoneTangents(points);
  const segments = points.slice(1).map((p, i) => {
    const q = points[i];
    const third = (p.x - q.x) / 3;
    const c1 = `${round2(q.x + third)},${round2(q.y + tangents[i] * third)}`;
    const c2 = `${round2(p.x - third)},${round2(p.y - tangents[i + 1] * third)}`;
    return `C${c1} ${c2} ${round2(p.x)},${round2(p.y)}`;
  });
  return `M${round2(points[0].x)},${round2(points[0].y)} ${segments.join(' ')}`;
}

/**
 * Contenu d'un segment de barre selon sa largeur : détail complet, part seule ou rien
 * (le détail complet reste toujours dans l'infobulle).
 * @param {number} share - part du segment en %
 * @returns {'full'|'share'|'none'}
 */
export function segmentDisplay(share) {
  if (share >= 22) return 'full';
  if (share >= 7) return 'share';
  return 'none';
}

/**
 * Parts d'une barre empilée. Si la somme dépasse le total, la somme sert de base pour que la
 * barre ne déborde pas.
 * @param {Array<{key: string, value: number}>} entries
 * @param {number} total - total de référence (heures)
 * @returns {Array<{key: string, value: number, share: number}>} share en % (1 décimale)
 */
export function stackShares(entries, total) {
  const sum = entries.reduce((acc, e) => acc + (e.value ?? 0), 0);
  const base = Math.max(total ?? 0, sum);
  return entries.map((e) => {
    const value = e.value ?? 0;
    return { ...e, value, share: base > 0 ? Math.round((value / base) * 1000) / 10 : 0 };
  });
}
