/**
 * @fileoverview Cartes de synthèse des anomalies de saisie
 * @module components/anomalies/AnomalySummaryCards
 */

import PropTypes from 'prop-types';
import { Grid, Card, Box, Flex, Text, Badge } from '@radix-ui/themes';
import { AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * Cartes de synthèse des anomalies
 */
export function AnomalySummaryCards({ summary }) {
  if (!summary) return null;

  const { totalAnomalies, bySeverity } = summary;

  const cards = [
    {
      label: 'Total anomalies',
      value: totalAnomalies,
      icon: totalAnomalies > 0 ? AlertTriangle : CheckCircle2,
      color: totalAnomalies > 10 ? 'red' : totalAnomalies > 0 ? 'orange' : 'green',
    },
    {
      label: 'Sévérité haute',
      value: bySeverity.high,
      icon: AlertCircle,
      color: bySeverity.high > 0 ? 'red' : 'gray',
    },
    {
      label: 'Sévérité moyenne',
      value: bySeverity.medium,
      icon: AlertTriangle,
      color: bySeverity.medium > 0 ? 'orange' : 'gray',
    },
  ];

  return (
    <Grid columns={{ initial: '1', sm: '3' }} gap="4" mb="5">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Card key={i}>
            <Flex align="center" gap="3" p="2">
              <Box
                style={{
                  padding: 8,
                  borderRadius: 8,
                  background: `var(--${card.color}-3)`,
                }}
              >
                <Icon size={20} color={`var(--${card.color}-9)`} />
              </Box>
              <Flex direction="column">
                <Text size="1" color="gray">{card.label}</Text>
                <Text size="5" weight="bold" color={card.color}>{card.value}</Text>
              </Flex>
            </Flex>
          </Card>
        );
      })}
    </Grid>
  );
}

AnomalySummaryCards.propTypes = {
  summary: PropTypes.shape({
    totalAnomalies: PropTypes.number,
    bySeverity: PropTypes.shape({
      high: PropTypes.number,
      medium: PropTypes.number,
    }),
  }),
};
