/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📊 PriorityDistribution.jsx - Répartition interventions par priorité
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Composant affichant la distribution des interventions par niveau de priorité:
 * - Cards flexibles responsive (flex: 1 1 150px)
 * - Badge coloré + icône selon PRIORITY_CONFIG
 * - Compteur interventions par priorité
 * - Tri automatique par count décroissant (plus importantes en premier)
 * - Affichage pourcentage à côté du compteur
 * - Clic card pour filtrer (callback optionnel)
 * - Comparaison période précédente avec flèches tendance
 * - Tooltip détails sur hover
 * - Empty state styled si aucune donnée
 * 
 * Configuration:
 * - PRIORITY_CONFIG: priorités et couleurs (urgent, high, medium, low)
 * 
 * ✅ IMPLÉMENTÉ:
 * - Flex gap="2" wrap="wrap" responsive
 * - Cards avec Badge color selon PRIORITY_CONFIG
 * - Compteur count avec Heading size="4"
 * - Tri automatique par count décroissant (useMemo)
 * - Calcul total interventions
 * - Affichage pourcentages (count / total * 100)
 * - Empty state avec message informatif
 * - Protection données nulles (byPriority || {})
 * - ✅ Icônes Lucide: AlertOctagon (urgent), AlertTriangle (high), AlertCircle (medium), Info (low)
 * - ✅ Clic card filtrer: onPriorityClick callback optionnel
 * - ✅ Comparaison période: previousByPriority avec flèches TrendingUp/Down
 * - ✅ Tooltip détails: count + percentage + tendance
 * 
 * 📋 TODO:
 * - [ ] Graphique camembert (Chart.js ou Recharts)
 * - [ ] Animation entrée cards (stagger effect)
 * - [ ] Export PNG graphique
 * - [ ] Mode compact (inline badges)
 * - [ ] Généralisation component (DistributionCards) pour réutilisation complète
 * 
 * 💡 POTENTIEL GÉNÉRALISATION:
 * Ce composant pourrait être généralisé en `common/DistributionCards.jsx`
 * pour afficher n'importe quelle distribution (type, statut, zone, etc.)
 * Props: { data, config, title, onItemClick, sortBy, previousData }
 * 
 * @module components/machine/PriorityDistribution
 * @requires config/interventionTypes - PRIORITY_CONFIG
 */

import PropTypes from "prop-types";
import { AlertOctagon, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { PRIORITY_CONFIG } from "@/config/interventionTypes";
import DistributionCards from "@/components/common/DistributionCards";

/**
 * Mapping icônes par priorité
 */
const PRIORITY_ICONS = {
  'urgent': AlertOctagon,
  'high': AlertTriangle,
  'medium': AlertCircle,
  'low': Info
};

/**
 * Affiche la répartition des interventions par priorité
 * 
 * @param {Object} props
 * @param {Object} props.byPriority - Nombre d'interventions par priorité {priority: count}
 * @param {Object} [props.previousByPriority] - Données période précédente pour comparaison
 * @param {Function} [props.onPriorityClick] - Callback au clic sur priorité (priority) => void
 * @returns {JSX.Element} Cards flexibles avec badges et compteurs
 * 
 * @example
 * <PriorityDistribution 
 *   byPriority={{ 'urgent': 3, 'high': 8, 'medium': 12, 'low': 5 }}
 *   previousByPriority={{ 'urgent': 2, 'high': 10, 'medium': 11, 'low': 6 }}
 *   onPriorityClick={(priority) => filterByPriority(priority)}
 * />
 */
export default function PriorityDistribution({
  byPriority,
  previousByPriority = null,
  onPriorityClick = null,
}) {
  // Construire la config pour DistributionCards à partir de PRIORITY_CONFIG et des icônes
  const config = Object.keys(byPriority || {}).reduce((acc, key) => {
    const k = (key || '').toLowerCase();
    acc[k] = {
      color: PRIORITY_CONFIG[k]?.color || 'gray',
      icon: PRIORITY_ICONS[k] || Info,
      label: key,
    };
    return acc;
  }, {});

  return (
    <DistributionCards
      title="Répartition par priorité"
      data={byPriority}
      config={config}
      previousData={previousByPriority}
      onItemClick={onPriorityClick}
      emptyMessage="Aucune donnée de priorité disponible"
    />
  );
}

// PropTypes pour validation runtime
PriorityDistribution.propTypes = {
 byPriority: PropTypes.objectOf(PropTypes.number).isRequired,
 previousByPriority: PropTypes.objectOf(PropTypes.number),
 onPriorityClick: PropTypes.func
};