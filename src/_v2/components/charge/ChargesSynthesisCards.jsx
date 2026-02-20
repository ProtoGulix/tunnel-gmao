/**
 * @fileoverview Cartes KPI de synthèse des charges
 * @module components/charge/ChargesSynthesisCards
 */

import PropTypes from 'prop-types';
import { Box, Flex, Grid, Text, Card, Heading, Badge, Progress } from '@radix-ui/themes';
import { Activity, AlertTriangle } from 'lucide-react';
import KPICard from '@/components/common/KPICard';
import { formatHours, formatPercent } from './constants';

/**
 * Légende d'un seuil
 */
function SeuilLegend({ seuil }) {
  const label = seuil.max !== null
    ? `${seuil.min}-${seuil.max}%`
    : `>${seuil.min}%`;

  return (
    <Flex align="center" gap="1">
      <Box style={{ width: 12, height: 12, borderRadius: '50%', background: `var(--${seuil.color}-9)` }} />
      <Text size="1" color="gray">{label} : {seuil.label}</Text>
    </Flex>
  );
}

SeuilLegend.propTypes = {
  seuil: PropTypes.shape({
    min: PropTypes.number,
    max: PropTypes.number,
    color: PropTypes.string,
    label: PropTypes.string,
  }).isRequired,
};

/**
 * Cartes KPI de synthèse des charges
 */
export function ChargesSynthesisCards({ charges, tauxEvitable, seuils }) {
  if (!charges) return null;

  const { chargeTotale, chargeDepannage, chargeConstructive, chargeDepannageEvitable } = charges;
  const { taux, status } = tauxEvitable || {};

  // Couleur du taux de dépannage évitable (depuis status API)
  const tauxColor = status?.color || 'gray';

  return (
    <Box mb="5">
      <Heading size="4" mb="3">
        <Flex align="center" gap="2">
          <Activity size={20} />
          Synthèse des charges
        </Flex>
      </Heading>
      
      <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
        <KPICard
          label="Charge totale"
          value={formatHours(chargeTotale)}
          subtitle="Temps total service"
          color="blue"
        />
        <KPICard
          label="Dépannage"
          value={formatHours(chargeDepannage)}
          subtitle={`dont ${formatHours(chargeDepannageEvitable)} évitable`}
          color="orange"
        />
        <KPICard
          label="Constructif"
          value={formatHours(chargeConstructive)}
          subtitle="FAB + SUP + PREV + BAT"
          color="green"
        />
      </Grid>

      <Box mt="4">
        <Card>
          <Box p="4">
            <Flex justify="between" align="center" mb="3">
              <Flex align="center" gap="2">
                <AlertTriangle size={18} color={`var(--${tauxColor}-9)`} />
                <Text weight="bold" size="3">Taux de dépannage évitable</Text>
              </Flex>
              <Badge size="2" color={tauxColor}>
                {formatPercent(taux)}
              </Badge>
            </Flex>
            
            <Progress value={taux || 0} color={tauxColor} mb="3" />
            
            {seuils && seuils.length > 0 ? (
              <Flex gap="4" wrap="wrap">
                {seuils.map((seuil, i) => (
                  <SeuilLegend key={i} seuil={seuil} />
                ))}
              </Flex>
            ) : null}

            {status?.text && (
              <Text size="2" color={tauxColor} mt="2">
                {status.text}
              </Text>
            )}
          </Box>
        </Card>
      </Box>
    </Box>
  );
}

ChargesSynthesisCards.propTypes = {
  charges: PropTypes.shape({
    chargeTotale: PropTypes.number,
    chargeDepannage: PropTypes.number,
    chargeConstructive: PropTypes.number,
    chargeDepannageEvitable: PropTypes.number,
    chargeDepannageSubi: PropTypes.number,
  }),
  tauxEvitable: PropTypes.shape({
    taux: PropTypes.number,
    status: PropTypes.shape({
      color: PropTypes.string,
      text: PropTypes.string,
    }),
  }),
  seuils: PropTypes.arrayOf(PropTypes.shape({
    min: PropTypes.number,
    max: PropTypes.number,
    color: PropTypes.string,
    label: PropTypes.string,
  })),
};
