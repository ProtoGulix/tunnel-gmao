/**
 * @fileoverview Composants principaux pour la page ServiceStatus
 * 
 * @module components/service/ServiceStatusComponents
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text, Grid, Badge, Progress } from '@radix-ui/themes';
import KPICard from '@/components/common/KPICard';
import { SERVICE_TIME_TYPE_CATEGORIES } from '@/config/serviceTimeTypeCategories';

/**
 * Configuration visuelle des types de temps
 */
export const TIME_TYPE_CONFIG = {
  PROD: { 
    color: 'green', 
    icon: null, 
    label: 'Production' 
  },
  DEP: { 
    color: 'blue', 
    icon: null, 
    label: 'Dépannage' 
  },
  PILOT: { 
    color: 'purple', 
    icon: null, 
    label: 'Pilotage' 
  },
  FRAG: { 
    color: 'orange', 
    icon: null, 
    label: 'Fragmentation' 
  }
};

/**
 * Seuils pour colorisation automatique
 */
export const THRESHOLDS = {
  CHARGE: { NORMAL: 70, HIGH: 85 },
  FRAGMENTATION: { LOW: 15, MEDIUM: 25 },
  PILOTAGE: { CRITICAL: 15, LOW: 25 }
};

/**
 * Vue synthèse - Cards KPI
 */
export function SynthesisCards({ chargePercent, chargeText, chargeColor, fragPercent, fragText, fragColor, pilotPercent, pilotText, pilotColor }) {
  const clamp = (v) => Math.min(100, Math.max(0, v ?? 0));

  return (
    <Grid columns={{ initial: '1', sm: '3' }} gap="4" mb="4">
      <KPICard
        label="Charge service"
        value={`${chargePercent.toFixed(1)}%`}
        subtitle={chargeText}
        color={chargeColor}
        progress={clamp(chargePercent)}
        notice="Temps total heures / Capacité ETP proratisée sur la période. Charge > 85% : service saturé."
      />
      <KPICard
        label="Fragmentation"
        value={`${fragPercent.toFixed(1)}%`}
        subtitle={fragText}
        color={fragColor}
        progress={clamp(fragPercent)}
        notice="% temps fragmenté (support, actions courtes < 0,5h non-dépannage). Fragmentation > 25% : fuite organisationnelle."
      />
      <KPICard
        label="Temps de pilotage"
        value={`${pilotPercent.toFixed(1)}%`}
        subtitle={pilotText}
        color={pilotColor}
        progress={clamp(pilotPercent)}
        notice="% temps long protégé (documentation, préventif, dépannage réel). Pilotage < 15% : aucune capacité d'amélioration."
      />
    </Grid>
  );
}

SynthesisCards.propTypes = {
  chargePercent: PropTypes.number.isRequired,
  chargeText: PropTypes.string.isRequired,
  chargeColor: PropTypes.string.isRequired,
  fragPercent: PropTypes.number.isRequired,
  fragText: PropTypes.string.isRequired,
  fragColor: PropTypes.string.isRequired,
  pilotPercent: PropTypes.number.isRequired,
  pilotText: PropTypes.string.isRequired,
  pilotColor: PropTypes.string.isRequired
};

/**
 * Répartition du temps - 4 colonnes avec valeur et composition
 * 
 * Affiche pour chaque type de temps (PROD, DEP, PILOT, FRAG) :
 * - Une card avec la valeur (heures), le pourcentage et seuil
 * - Une card avec la composition (catégories incluses avec codes)
 */
export function TimeBreakdownSection({ timeBreakdown, totalHours }) {
  if (!timeBreakdown || typeof timeBreakdown !== 'object') {
    return (
      <Box mb="4">
        <Text color="gray">Aucune donnée de temps disponible</Text>
      </Box>
    );
  }

  const timeTypes = Object.keys(SERVICE_TIME_TYPE_CATEGORIES);

  return (
    <Box mb="4">
      <Text as="div" size="3" weight="bold" mb="3">
        Répartition du temps
        {typeof totalHours === 'number' && (
          <Text as="span" size="2" color="gray" ml="2">
            Total : {totalHours.toFixed(1)} h
          </Text>
        )}
      </Text>

      <Grid columns={{ initial: '1', sm: '2', md: '4' }} gap="4">
        {timeTypes.map((typeKey) => {
          const typeConfig = SERVICE_TIME_TYPE_CATEGORIES[typeKey];
          const hours = timeBreakdown[typeKey] ?? 0;
          const percent = totalHours && totalHours > 0 ? (hours / totalHours) * 100 : 0;
          const clampedPercent = Math.min(100, Math.max(0, percent));

          return (
            <Flex key={typeKey} direction="column" gap="0" style={{ flex: 1 }}>
              {/* Card 1: Valeur et seuil - Fond blanc, coins arrondis haut */}
              <Box
                style={{
                  background: 'var(--gray-1)',
                  borderRadius: '6px 6px 0 0',
                  padding: '12px',
                  borderTop: '1px solid var(--gray-4)',
                  borderLeft: '1px solid var(--gray-4)',
                  borderRight: '1px solid var(--gray-4)',
                }}
              >
                <Flex align="center" gap="2" mb="2">
                  <Badge
                    color={typeConfig.color}
                    size="2"
                    style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      padding: 0,
                    }}
                  />
                  <Text weight="bold" size="2">
                    {typeConfig.label}
                  </Text>
                </Flex>

                <Flex gap="2" align="baseline" mb="2">
                  <Text size="3" weight="bold">
                    {hours.toFixed(1)}h
                  </Text>
                  <Text size="1" color="gray">
                    ({percent.toFixed(1)}%)
                  </Text>
                </Flex>

                <Progress value={clampedPercent} mb="2" style={{ height: '6px' }} />

                <Box style={{ background: 'var(--gray-2)', padding: '0.5rem', borderRadius: '4px' }}>
                  <Text size="1" color="gray" as="div">
                    {typeKey === 'FRAG' && `Seuil critique : > 25%`}
                    {typeKey === 'PILOT' && `Minimum requis : > 15%`}
                    {typeKey !== 'FRAG' && typeKey !== 'PILOT' && `À optimiser selon priorité`}
                  </Text>
                </Box>
              </Box>

              {/* Card 2: Composition des catégories - Fond gris, coins arrondis bas, coins carrés haut */}
              <Box
                style={{
                  background: 'var(--gray-3)',
                  borderRadius: '0 0 6px 6px',
                  padding: '12px',
                  borderBottom: '1px solid var(--gray-4)',
                  borderLeft: '1px solid var(--gray-4)',
                  borderRight: '1px solid var(--gray-4)',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Text size="1" weight="bold" mb="2" color="gray" as="div">
                  Catégories
                </Text>
                <Box as="ul" style={{ margin: 0, paddingLeft: '1rem' }}>
                  {typeConfig.categories.map((cat, idx) => (
                    <li key={idx}>
                      <Flex gap="2" align="center" mb="1">
                        <Badge color={typeConfig.color} variant="soft" size="1">
                          {cat.code}
                        </Badge>
                        <Text size="1">{cat.name}</Text>
                      </Flex>
                    </li>
                  ))}
                </Box>

                {typeKey === 'FRAG' && (
                  <Box style={{ background: 'var(--orange-2)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.75rem' }}>
                    <Text size="1" color="gray" as="div" weight="medium">Calculé aussi :</Text>
                    <Box as="ul" style={{ margin: '0.25rem 0 0 0', paddingLeft: '1rem', fontSize: '0.875rem' }}>
                      <li>Actions courtes (&lt; 0,5h)</li>
                      <li>Sauf : Dépannage, Préventif</li>
                    </Box>
                  </Box>
                )}
              </Box>
            </Flex>
          );
        })}
      </Grid>
    </Box>
  );
}

TimeBreakdownSection.propTypes = {
  timeBreakdown: PropTypes.object.isRequired,
  totalHours: PropTypes.number
};