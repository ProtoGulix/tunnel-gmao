/**
 * @fileoverview Mini-courbe SVG lissée d'une série mensuelle, sans axe ni bibliothèque (ADR 0034)
 * @module components/bilan/Sparkline
 */

import PropTypes from 'prop-types';
import { smoothPath, sparklinePoints } from '@/hooks/bilan/miniSeries';

const WIDTH = 100;
const HEIGHT = 24;

/**
 * Ne rend rien si la série compte moins de deux mois renseignés.
 * @param {Array<number|null>} values - une valeur par mois de la période
 * @param {Function} format - valeur vers texte, pour la description accessible
 */
export default function Sparkline({ values, format }) {
  const points = sparklinePoints(values, WIDTH, HEIGHT, 3);
  if (!points) return null;
  const known = values.filter((v) => v != null);
  const label = `Évolution sur la période : de ${format(known[0])} à ${format(known[known.length - 1])}`;
  const last = points[points.length - 1];
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={HEIGHT} preserveAspectRatio="none"
      role="img" aria-label={label} style={{ overflow: 'visible' }}
    >
      <path
        d={smoothPath(points)} fill="none" stroke="var(--accent-9)" strokeWidth="1"
        vectorEffect="non-scaling-stroke" strokeLinecap="round"
      />
      {/* Point d'arrivée : segment de longueur nulle, rond quelle que soit la déformation du SVG */}
      <path
        d={`M${last.x},${last.y} h0.01`} stroke="var(--accent-9)" strokeWidth="5"
        vectorEffect="non-scaling-stroke" strokeLinecap="round"
      />
    </svg>
  );
}
Sparkline.propTypes = {
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
  format: PropTypes.func.isRequired,
};
