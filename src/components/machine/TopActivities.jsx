/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🕐 TopActivities.jsx - Top activités par temps passé
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Composant affichant le top 5 (ou N) des activités/sous-catégories par temps:
 * - Liste verticale avec rang (#1, #2, etc.)
 * - Badge coloré par catégorie parent
 * - Nom + code + nombre d'actions
 * - Temps total formaté (Xh Ym)
 * - Progress bar avec pourcentage
 * - Temps moyen par action
 * - Tri déjà effectué côté parent (topSubcategories)
 * - Tooltip détails sur hover
 * - Clic card pour filtrer (callback optionnel)
 * - Badge dominant sur activité #1
 * 
 * Props:
 * - topSubcategories: Array<{id, name, code, time, count, categoryId}>
 * - totalTime: number - Temps total pour calcul pourcentages
 * - onActivityClick: (activityId, activityName) => void - Callback au clic
 * 
 * ✅ IMPLÉMENTÉ:
 * - Grid 1 colonne avec cards
 * - Progress bar colorée par catégorie
 * - Format temps Xh Ym (formatTime)
 * - Calcul temps moyen par action
 * - Badge rang #1, #2, etc.
 * - Empty state styled si aucune donnée
 * - Protection division par zéro
 * - ✅ Icône Lucide Clock au lieu emoji
 * - ✅ Tooltip hover avec détails
 * - ✅ Badge dominant sur #1
 * - ✅ Clic card filtrage (onActivityClick callback)
 * - ✅ PropTypes validation
 * - ✅ useMemo optimisation calculs
 * 
 * 📋 TODO:
 * - [ ] Graphique évolution temps par période
 * - [ ] Comparaison période précédente (tendances)
 * - [ ] Export données CSV
 * - [ ] Filtrage par catégorie parent
 * - [ ] Mode compact (inline display)
 * 
 * @module components/machine/TopActivities
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import { useMemo } from "react";
import PropTypes from "prop-types";
import { Card, Box, Heading, Text, Flex, Badge, Progress, Grid, Tooltip } from "@radix-ui/themes";
import { Clock } from "lucide-react";

/**
 * Couleurs par catégorie d'action (mapping ID catégorie → couleur Radix)
 */
const CATEGORY_COLORS = {
  19: 'red',      // Dépannage
  20: 'purple',   // Fabrication
  21: 'blue',     // Documentation
  22: 'green',    // Préventif
  23: 'orange',   // Support
  24: 'gray'      // Bâtiment
};

/**
 * Formate un nombre d'heures en format lisible (Xh Ym)
 * @param {number} hours - Nombre d'heures décimal
 * @returns {string} Temps formaté
 * 
 * @example
 * formatTime(7.5) // "7h30m"
 * formatTime(2) // "2h"
 * formatTime(0.25) // "0h15m"
 */
const formatTime = (hours) => {
  if (!hours) return '0h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h${m}m` : `${h}h`;
};

/**
 * Composant affichant le top N des activités par temps passé avec détails
 * 
 * @param {Object} props
 * @param {Array} props.topSubcategories - Liste triée des sous-catégories [{id, name, code, time, count, categoryId}]
 * @param {number} props.totalTime - Temps total pour calculer les pourcentages
 * @param {Function} [props.onActivityClick] - Callback au clic sur activité (activityId, activityName) => void
 * @returns {JSX.Element} Liste de cards avec temps et statistiques
 * 
 * @example
 * <TopActivities 
 *   topSubcategories={[{id: 1, name: 'Réparation', code: 'REP', time: 12.5, count: 8, categoryId: 19}]}
 *   totalTime={50}
 *   onActivityClick={(id, name) => console.log(`Filtrer par ${name}`)}
 * />
 */
export default function TopActivities({ 
  topSubcategories, 
  totalTime,
  onActivityClick = null 
}) {
  // Mémoïser les activités avec leurs métadonnées calculées
  const activitiesWithMetadata = useMemo(() => {
    if (!topSubcategories?.length) return [];
    
    return topSubcategories.map((subcat, index) => ({
      ...subcat,
      rank: index + 1,
      percentage: totalTime > 0 ? (subcat.time / totalTime) * 100 : 0,
      avgTimePerAction: subcat.count > 0 ? subcat.time / subcat.count : 0,
      color: CATEGORY_COLORS[subcat.categoryId] || 'blue',
      isDominant: index === 0 && subcat.time > 0
    }));
  }, [topSubcategories, totalTime]);

  return (
    <Card>
      <Box p="3">
        <Flex align="center" gap="2" mb="3">
          <Clock size={20} color="var(--blue-9)" />
          <Heading size="4">Top 5 - Où passe le temps ?</Heading>
        </Flex>
        <Grid columns="1" gap="2">
          {activitiesWithMetadata.length > 0 ? (
            activitiesWithMetadata.map((activity) => {
              const isClickable = onActivityClick && activity.time > 0;
              const tooltipContent = `${activity.name} (${activity.code}): ${formatTime(activity.time)} total (${activity.percentage.toFixed(1)}%) sur ${activity.count} action${activity.count > 1 ? 's' : ''} - Moy: ${formatTime(activity.avgTimePerAction)}/action`;
              
              return (
                <Tooltip key={activity.id} content={tooltipContent}>
                  <Card 
                    style={{ 
                      background: 'var(--gray-2)',
                      cursor: isClickable ? 'pointer' : 'default',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      border: activity.isDominant ? `2px solid var(--${activity.color}-9)` : undefined
                    }}
                    onClick={() => isClickable && onActivityClick(activity.id, activity.name)}
                    onMouseEnter={(e) => {
                      if (isClickable) {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isClickable) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '';
                      }
                    }}
                  >
                    <Box p="2">
                      {/* En-tête avec rang et nom */}
                      <Flex justify="between" align="start" mb="1">
                        <Flex align="center" gap="2">
                          <Badge color={activity.color} size="2">#{activity.rank}</Badge>
                          {activity.isDominant && (
                            <Badge color="yellow" size="1">★</Badge>
                          )}
                          <Box>
                            <Text weight="bold" size="2">{activity.name}</Text>
                            <Text size="1" color="gray" style={{ display: 'block' }}>
                              {activity.code} • {activity.count} action{activity.count > 1 ? 's' : ''}
                            </Text>
                          </Box>
                        </Flex>
                        <Text weight="bold" size="3">{formatTime(activity.time)}</Text>
                      </Flex>

                      {/* Barre de progression */}
                      <Progress 
                        value={activity.percentage} 
                        color={activity.color} 
                        size="2"
                        aria-label={`${activity.name}: ${activity.percentage.toFixed(1)}%`}
                      />

                      {/* Statistiques détaillées */}
                      <Text size="1" color="gray" mt="1">
                        {activity.percentage.toFixed(1)}% du temps total • Moy: {formatTime(activity.avgTimePerAction)} / action
                      </Text>
                    </Box>
                  </Card>
                </Tooltip>
              );
            })
          ) : (
            <Box style={{ textAlign: 'center', padding: '16px' }}>
              <Text 
                size="2" 
                color="gray" 
                style={{ fontStyle: 'italic' }}
              >
                Aucune donnée disponible
              </Text>
            </Box>
          )}
        </Grid>
      </Box>
    </Card>
  );
}

// PropTypes pour validation runtime
TopActivities.propTypes = {
  topSubcategories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      name: PropTypes.string.isRequired,
      code: PropTypes.string.isRequired,
      time: PropTypes.number.isRequired,
      count: PropTypes.number.isRequired,
      categoryId: PropTypes.number.isRequired
    })
  ).isRequired,
  totalTime: PropTypes.number.isRequired,
  onActivityClick: PropTypes.func
};