/**
 * Onglet Résumé - Synthèse de l'intervention
 *
 * Affiche les statistiques et informations clés de l'intervention.
 */

import { Box, Flex, Card, Text } from '@radix-ui/themes';
import { TrendingUp, Clock, Package } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * Composant SummaryTab
 *
 * @param {Object} props
 * @param {Object} props.intervention - Données de l'intervention
 * @param {boolean} props.loading - État de chargement
 */
export default function SummaryTab({ intervention, loading }) {
  if (loading || !intervention) {
    return (
      <Box pt="4">
        <Text color="gray">Chargement des données...</Text>
      </Box>
    );
  }

  const stats = intervention.stats || {};

  return (
    <Box pt="4">
      <Flex direction="column" gap="4">
        <Text size="4" weight="bold">
          Résumé de l&apos;intervention
        </Text>

        {/* Cartes statistiques */}
        <Flex gap="3" wrap="wrap">
          <Card style={{ flex: '1 1 200px' }}>
            <Flex direction="column" gap="2" p="3">
              <Flex align="center" gap="2">
                <Clock size={20} color="var(--blue-11)" />
                <Text size="2" color="gray">
                  Temps total
                </Text>
              </Flex>
              <Text size="6" weight="bold">
                {stats.totalTime || 0}h
              </Text>
            </Flex>
          </Card>

          <Card style={{ flex: '1 1 200px' }}>
            <Flex direction="column" gap="2" p="3">
              <Flex align="center" gap="2">
                <TrendingUp size={20} color="var(--blue-11)" />
                <Text size="2" color="gray">
                  Nombre d&apos;actions
                </Text>
              </Flex>
              <Text size="6" weight="bold">
                {stats.actionCount || 0}
              </Text>
            </Flex>
          </Card>

          <Card style={{ flex: '1 1 200px' }}>
            <Flex direction="column" gap="2" p="3">
              <Flex align="center" gap="2">
                <Package size={20} color="var(--blue-11)" />
                <Text size="2" color="gray">
                  Demandes d&apos;achat
                </Text>
              </Flex>
              <Text size="6" weight="bold">
                {stats.purchaseCount || 0}
              </Text>
            </Flex>
          </Card>
        </Flex>

        {/* Informations de base */}
        <Card>
          <Flex direction="column" gap="3" p="4">
            <Text size="3" weight="bold">
              Informations
            </Text>

            <Flex direction="column" gap="2">
              <Flex justify="between">
                <Text color="gray">Code:</Text>
                <Text weight="medium">{intervention.code}</Text>
              </Flex>

              <Flex justify="between">
                <Text color="gray">Type:</Text>
                <Text weight="medium">{intervention.type}</Text>
              </Flex>

              <Flex justify="between">
                <Text color="gray">Priorité:</Text>
                <Text weight="medium">{intervention.priority}</Text>
              </Flex>

              <Flex justify="between">
                <Text color="gray">Date de signalement:</Text>
                <Text weight="medium">
                  {intervention.reportedDate
                    ? new Date(intervention.reportedDate).toLocaleDateString('fr-FR')
                    : '-'}
                </Text>
              </Flex>

              {intervention.reportedBy && (
                <Flex justify="between">
                  <Text color="gray">Signalé par:</Text>
                  <Text weight="medium">{intervention.reportedBy}</Text>
                </Flex>
              )}
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </Box>
  );
}

SummaryTab.propTypes = {
  intervention: PropTypes.object,
  loading: PropTypes.bool,
};

SummaryTab.defaultProps = {
  intervention: null,
  loading: false,
};
