import { useMemo } from "react";
import PropTypes from "prop-types";
import { Box, Flex } from "@radix-ui/themes";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📊 ActivitySparkline.jsx - Mini sparkline d'activité temporelle
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Composant SVG pur affichant la distribution temporelle des actions sous forme
 * de points colorés selon leur récence. Optimisé pour affichage inline dans tableaux.
 * 
 * ✅ Implémenté :
 * - Rendu SVG inline sans librairie externe
 * - Normalisation automatique des timestamps
 * - Groupement anti-superposition des points proches
 * - Gradient de couleur par récence (ancien → récent : gray → blue → accent)
 * - Placeholder élégant si aucune donnée (—)
 * - useMemo pour calculs normalisés (performances)
 * - PropTypes complets avec valeurs par défaut
 * - Accessibilité : aria-label descriptif, role="img"
 * - Dimensions configurables (width, height, pointRadius)
 * 
 * 📋 TODO : Améliorations futures
 * - [ ] Mode "line" : ligne continue au lieu de points
 * - [ ] Tooltip interactif : afficher date/heure sur hover des points
 * - [ ] Animation d'apparition progressive (fade-in + scale)
 * - [ ] Indicateurs temporels : marqueurs début/milieu/fin période
 * - [ ] Couleurs personnalisables via props (ancienne/récente)
 * - [ ] Densité variable : adaptation automatique si >100 points
 * - [ ] Export PNG du sparkline (download mini-graph)
 * - [ ] Clustering intelligent : regrouper par jour si période >30j
 * - [ ] Variantes visuelles : bars verticales, heatmap, pulse
 * 
 * @module components/interventions/ActivitySparkline
 * @requires react
 * @requires @radix-ui/themes
 */

/**
 * Mini sparkline d'activité en points SVG
 * Affiche la distribution temporelle des actions avec gradient de couleur
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {Date[]} props.timestamps - Array de dates (Date objects) à visualiser
 * @param {number} [props.width=50] - Largeur du SVG en pixels
 * @param {number} [props.height=20] - Hauteur du SVG en pixels
 * @param {number} [props.pointRadius=2] - Rayon des points en pixels
 * 
 * @returns {JSX.Element} SVG sparkline avec points colorés ou placeholder si vide
 * 
 * @example
 * // Sparkline avec données
 * const actionDates = actions.map(a => new Date(a.created_at));
 * <ActivitySparkline timestamps={actionDates} />
 * 
 * @example
 * // Sparkline vide (affiche placeholder)
 * <ActivitySparkline timestamps={[]} />
 * 
 * @example
 * // Sparkline personnalisé (plus large)
 * <ActivitySparkline 
 *   timestamps={dates} 
 *   width={80} 
 *   height={30} 
 *   pointRadius={3}
 * />
 */
export default function ActivitySparkline({ 
  timestamps = [], 
  width = 50, 
  height = 20, 
  pointRadius = 2 
}) {
  // Mémoïser les calculs de normalisation et positionnement des points
  const groupedPoints = useMemo(() => {
    if (timestamps.length === 0) return [];

    // Normaliser les timestamps
    const sorted = [...timestamps].sort((a, b) => a - b);
    const minTime = sorted[0].getTime();
    const maxTime = sorted[sorted.length - 1].getTime();
    const timeRange = maxTime - minTime || 1;

    // Créer les points SVG avec positions normalisées
    const points = sorted.map((date, idx) => {
      const normalizedTime = (date.getTime() - minTime) / timeRange;
      const x = normalizedTime * (width - pointRadius * 2) + pointRadius;
      const y = height / 2;
      
      return { x, y, idx, date };
    });

    // Grouper les points proches pour éviter superposition
    const grouped = [];
    let lastX = -10;
    
    points.forEach(point => {
      if (point.x - lastX >= pointRadius * 3) {
        grouped.push(point);
        lastX = point.x;
      }
    });

    return grouped;
  }, [timestamps, width, height, pointRadius]);

  if (timestamps.length === 0) {
    return (
      <Box 
        role="img"
        aria-label="Aucune activité enregistrée"
        style={{
          width: `${width}px`,
          height: `${height}px`,
          background: 'var(--gray-2)',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box 
          aria-hidden="true"
          style={{
            fontSize: '10px',
            color: 'var(--gray-8)',
            fontWeight: 'bold'
          }}
        >
          —
        </Box>
      </Box>
    );
  }

  // Couleur basée sur la récence
  const getColor = (idx) => {
    const progress = idx / groupedPoints.length;
    if (progress < 0.33) return 'var(--gray-6)';
    if (progress < 0.66) return 'var(--blue-9)';
    return 'var(--accent-9)';
  };

  return (
    <Flex align="center" justify="center">
      <svg
        role="img"
        aria-label={`Distribution de ${timestamps.length} action${timestamps.length > 1 ? 's' : ''} dans le temps`}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ 
          background: 'var(--gray-2)',
          borderRadius: '4px'
        }}
      >
        {/* Ligne de base */}
        <line
          x1="0"
          y1={height / 2}
          x2={width}
          y2={height / 2}
          stroke="var(--gray-5)"
          strokeWidth="0.5"
          opacity="0.5"
          aria-hidden="true"
        />

        {/* Points d'activité */}
        {groupedPoints.map((point, idx) => (
          <circle
            key={idx}
            cx={point.x}
            cy={point.y}
            r={pointRadius}
            fill={getColor(idx)}
            opacity="0.8"
          />
        ))}
      </svg>
    </Flex>
  );
}

ActivitySparkline.propTypes = {
  /** Array de timestamps (Date objects) à visualiser dans le sparkline */
  timestamps: PropTypes.arrayOf(PropTypes.instanceOf(Date)),
  /** Largeur du SVG en pixels */
  width: PropTypes.number,
  /** Hauteur du SVG en pixels */
  height: PropTypes.number,
  /** Rayon des points en pixels */
  pointRadius: PropTypes.number
};