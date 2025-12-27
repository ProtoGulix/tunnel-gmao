/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📊 InterventionTypeDistribution.jsx - Répartition par type d'intervention
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Composant affichant la distribution des interventions par type avec:
 * - Grid responsive 4 cards (2 mobile, 4 desktop)
 * - Badge coloré + compteur par type
 * - Barre de progression (pourcentage du total)
 * - Tri par count décroissant (types les plus fréquents en premier)
 * - Toggle affichage tous types OU seulement actifs
 * - Badge "dominant" sur type le plus fréquent
 * - Tooltip détails sur hover
 * - Clic sur card pour filtrer (callback optionnel)
 * - Comparaison période avec flèches tendance (si données fournies)
 * 
 * Configuration:
 * - Types définis dans INTERVENTION_TYPES (id, title, color)
 * - Couleurs appliquées aux badges et progress bars
 * 
 * ✅ IMPLÉMENTÉ:
 * - Grid responsive (columns={{ initial: '2', md: '4' }})
 * - Calcul automatique pourcentages (count / total * 100)
 * - Progress bar colorée par type avec color={type.color}
 * - Badge ID + Text title pour identification claire
 * - Background grisé conditionnel (count > 0)
 * - Protection division par zéro (total > 0 check)
 * - ✅ Tri par count décroissant (types fréquents en premier)
 * - ✅ Clic sur card filtrage (onTypeClick callback)
 * - ✅ Tooltip hover avec détails type
 * - ✅ Toggle affichage: tous types OU actifs uniquement
 * - ✅ Badge "dominant" sur type avec count max
 * - ✅ Comparaison période avec flèches ▲▼ (previousByType prop)
 * 
 * 📋 TODO:
 * - [ ] Animation Progress bar (transition smooth au chargement)
 * - [ ] Export PNG graphique (Chart.js camembert couleurs types)
 * - [ ] Mode compact (1 ligne par type, progress inline)
 * - [ ] Affichage exemples interventions dans tooltip (dernières 3)
 * - [ ] Filtres multiples (sélection plusieurs types simultanément)
 * - [ ] Sauvegarde préférence toggle (localStorage)
 * 
 * @module components/machine/InterventionTypeDistribution
 * @requires config/interventionTypes - Types et couleurs
 */

import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Box, Text, Progress, Button } from "@radix-ui/themes";
import { INTERVENTION_TYPES } from "@/config/interventionTypes";
import DistributionCards from "@/components/common/DistributionCards";

/**
 * Affiche la répartition des interventions par type avec progress bars
 * 
 * @param {Object} props
 * @param {Object} props.byType - Nombre d'interventions par type {typeId: count}
 * @param {number} props.total - Nombre total d'interventions
 * @param {Object} [props.previousByType] - Données période précédente pour comparaison
 * @param {Function} [props.onTypeClick] - Callback au clic sur type (typeId) => void
 * @returns {JSX.Element} Grid de cards avec badges, counts et progress bars
 * 
 * @example
 * <InterventionTypeDistribution 
 *   byType={{ 'COR': 12, 'PRE': 5, 'AME': 3 }} 
 *   total={20}
 *   previousByType={{ 'COR': 8, 'PRE': 6, 'AME': 2 }}
 *   onTypeClick={(typeId) => console.log('Filtrer par', typeId)}
 * />
 */
export default function InterventionTypeDistribution({
  byType,
  total,
  previousByType = null,
  onTypeClick = null,
}) {
  const [showOnlyActive, setShowOnlyActive] = useState(false);

  // Construire les données filtrées selon le toggle
  const data = useMemo(() => {
    const base = INTERVENTION_TYPES.reduce((acc, t) => {
      acc[t.id] = byType[t.id] || 0;
      return acc;
    }, {});
    if (!showOnlyActive) return base;
    return Object.fromEntries(Object.entries(base).filter(([, v]) => v > 0));
  }, [byType, showOnlyActive]);

  // Calculer le dominant sur l'ensemble (ou filtré si toggle)
  const dominantKey = useMemo(() => {
    const entries = Object.entries(data);
    if (entries.length === 0) return null;
    const [k] = entries.reduce((max, cur) => (cur[1] > max[1] ? cur : max), entries[0]);
    return data[k] > 0 ? k : null;
  }, [data]);

  // Config pour DistributionCards (couleur, label id, dominant)
  const config = useMemo(() => {
    const cfg = {};
    for (const t of INTERVENTION_TYPES) {
      cfg[t.id] = {
        color: t.color,
        label: t.id,
        dominant: dominantKey === t.id,
      };
    }
    return cfg;
  }, [dominantKey]);

  // Header extra: bouton toggle
  const headerExtras = (
    <Button size="1" variant="soft" onClick={() => setShowOnlyActive(!showOnlyActive)}>
      {showOnlyActive ? 'Afficher tous' : 'Actifs uniquement'}
    </Button>
  );

  // Footer: titre + progress bar
  const renderFooter = (key, count, percentageNum, cfg) => {
    const meta = INTERVENTION_TYPES.find(t => t.id === key);
    if (!meta) return null;
    return (
      <Box>
        <Text size="1" color="gray">{meta.title}</Text>
        <Progress
          value={percentageNum}
          color={cfg.color}
          mt="2"
          size="1"
          aria-label={`${meta.title}: ${percentageNum.toFixed(1)}%`}
        />
      </Box>
    );
  };

  // Empty if total === 0: déléguer à DistributionCards via data vide
  const previousData = previousByType || null;

  return (
    <DistributionCards
      title="Répartition par type d’intervention"
      data={data}
      config={config}
      previousData={previousData}
      onItemClick={onTypeClick}
      emptyMessage={total === 0 ? "Aucune intervention enregistrée pour cette machine" : "Aucune donnée disponible"}
      headerExtras={headerExtras}
      renderFooter={renderFooter}
      layout="grid"
      columns={{ initial: '2', md: '4' }}
    />
  );
}

// PropTypes pour validation runtime
InterventionTypeDistribution.propTypes = {
  byType: PropTypes.objectOf(PropTypes.number).isRequired,
  total: PropTypes.number.isRequired,
  previousByType: PropTypes.objectOf(PropTypes.number),
  onTypeClick: PropTypes.func
};