/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 👥 TechnicianDistribution.jsx - Répartition temps techniciens
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Composant affichant la distribution du temps de travail par technicien:
 * - Grid responsive 1/2 colonnes (mobile/desktop)
 * - Card par technicien avec nom, temps, nombre d'actions
 * - Progress bar représentant % du temps total
 * - Tri automatique par temps décroissant
 * - Tooltip détails sur hover
 * - Badge dominant sur technicien avec plus de temps
 * - Clic card pour filtrer (callback optionnel)
 * - Format temps lisible (Xh Ym)
 * 
 * Props:
 * - timeByTech: {techId: {name, time, actions}} - Données par technicien
 * - totalTime: number - Temps total pour calcul pourcentages
 * - onTechnicianClick: (techId, techName) => void - Callback au clic
 * 
 * ✅ IMPLÉMENTÉ:
 * - Grid responsive (1 colonne mobile, 2 desktop)
 * - Progress bar avec pourcentage du total
 * - Format temps heures/minutes (formatTime)
 * - Background grisé pour cards actives
 * - Empty state styled si aucune donnée
 * - Protection division par zéro
 * - ✅ Tri automatique par temps décroissant (useMemo)
 * - ✅ Tooltip hover avec détails
 * - ✅ Badge dominant sur technicien max temps
 * - ✅ Icône Lucide Users au lieu emoji
 * - ✅ Clic card filtrage (onTechnicianClick callback)
 * - ✅ PropTypes validation
 * 
 * 📋 TODO:
 * - [ ] Affichage taux horaire (si données disponibles)
 * - [ ] Graphique temps par période (timeline)
 * - [ ] Export données CSV
 * - [ ] Comparaison période précédente (tendances)
 * - [ ] Filtres multiples (plusieurs techniciens)
 * 
 * @module components/machine/TechnicianDistribution
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import { useMemo } from "react";
import PropTypes from "prop-types";
import { Card, Box, Heading, Text, Flex, Progress, Grid, Badge, Tooltip } from "@radix-ui/themes";
import { Users } from "lucide-react";

/**
 * Formate un nombre d'heures en format lisible (Xh Ym)
 * @param {number} hours - Nombre d'heures décimal
 * @returns {string} Temps formaté
 * 
 * @example
 * formatTime(2.5) // "2h30m"
 * formatTime(1) // "1h"
 * formatTime(0.25) // "0h15m"
 */
const formatTime = (hours) => {
  if (!hours) return '0h';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h${m}m` : `${h}h`;
};

/**
 * Composant affichant la répartition du temps par technicien avec tri et interactions
 * 
 * @param {Object} props
 * @param {Object} props.timeByTech - Données par technicien {techId: {name, time, actions}}
 * @param {number} props.totalTime - Temps total pour calculer les pourcentages
 * @param {Function} [props.onTechnicianClick] - Callback au clic sur technicien (techId, techName) => void
 * @returns {JSX.Element} Grid de cards avec temps et progress bars
 * 
 * @example
 * <TechnicianDistribution 
 *   timeByTech={{'tech1': {name: 'Jean Dupont', time: 12.5, actions: 8}}}
 *   totalTime={25}
 *   onTechnicianClick={(id, name) => console.log(`Filtrer par ${name}`)}
 * />
 */
export default function TechnicianDistribution({ 
  timeByTech, 
  totalTime,
  onTechnicianClick = null 
}) {
  // Tri par temps décroissant (techniciens avec plus de temps en premier)
  const sortedTechs = useMemo(() => {
    const entries = Object.entries(timeByTech || {});
    return entries.sort((a, b) => b[1].time - a[1].time);
  }, [timeByTech]);

  // Trouver le technicien dominant (max temps)
  const dominantTechId = useMemo(() => {
    if (sortedTechs.length === 0) return null;
    const [id] = sortedTechs[0];
    return sortedTechs[0][1].time > 0 ? id : null;
  }, [sortedTechs]);

  return (
    <Card>
      <Box p="3">
        <Flex align="center" gap="2" mb="3">
          <Users size={20} color="var(--blue-9)" />
          <Heading size="4">Répartition par technicien</Heading>
        </Flex>
        <Grid columns={{ initial: '1', md: '2' }} gap="2">
          {sortedTechs.length > 0 ? (
            sortedTechs.map(([techId, data]) => {
              const percentage = totalTime > 0 ? (data.time / totalTime) * 100 : 0;
              const isDominant = techId === dominantTechId;
              const isClickable = onTechnicianClick && data.time > 0;
              const tooltipContent = `${data.name}: ${formatTime(data.time)} (${percentage.toFixed(1)}% du temps total) - ${data.actions} action${data.actions > 1 ? 's' : ''}`;

              return (
                <Tooltip key={techId} content={tooltipContent}>
                  <Card 
                    style={{ 
                      background: 'var(--gray-2)',
                      cursor: isClickable ? 'pointer' : 'default',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      border: isDominant ? '2px solid var(--blue-9)' : undefined
                    }}
                    onClick={() => isClickable && onTechnicianClick(techId, data.name)}
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
                      <Flex justify="between" align="start" mb="1">
                        {/* Informations du technicien */}
                        <Box>
                          <Flex align="center" gap="1">
                            <Text weight="bold" size="2">{data.name}</Text>
                            {isDominant && (
                              <Badge color="yellow" size="1">★</Badge>
                            )}
                          </Flex>
                          <Text size="1" color="gray">
                            {data.actions} action{data.actions > 1 ? 's' : ''}
                          </Text>
                        </Box>

                        {/* Temps total */}
                        <Heading size="4" color="blue">
                          {formatTime(data.time)}
                        </Heading>
                      </Flex>

                      {/* Barre de progression */}
                      <Progress 
                        value={percentage} 
                        color="blue" 
                        size="1"
                        aria-label={`${data.name}: ${percentage.toFixed(1)}%`}
                      />
                      
                      {/* Affichage pourcentage */}
                      {percentage > 0 && (
                        <Text size="1" color="gray" mt="1">
                          {percentage.toFixed(1)}% du temps total
                        </Text>
                      )}
                    </Box>
                  </Card>
                </Tooltip>
              );
            })
          ) : (
            <Box style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '16px' }}>
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
TechnicianDistribution.propTypes = {
  timeByTech: PropTypes.objectOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      time: PropTypes.number.isRequired,
      actions: PropTypes.number.isRequired
    })
  ).isRequired,
  totalTime: PropTypes.number.isRequired,
  onTechnicianClick: PropTypes.func
};