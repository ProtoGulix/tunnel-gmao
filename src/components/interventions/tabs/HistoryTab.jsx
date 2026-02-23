/**
 * Onglet Historique - Timeline complète des actions et changements de statut
 *
 * Affiche un historique chronologique inversé (plus récent en haut).
 */

import { Box, Flex } from '@radix-ui/themes';
import PropTypes from 'prop-types';
import { useMemo } from 'react';
import { History } from '@/components/ui/GenericTabComponents';
import HistoryItem from '@/components/interventions/HistoryItem';

/**
 * Composant HistoryTab
 *
 * @param {Object} props
 * @param {Array} props.actions - Liste des actions
 * @param {Array} props.statusLog - Log des statuts
 */
export default function HistoryTab({ actions, statusLog }) {
  // Fusionner actions et statusLog dans une timeline
  const timeline = useMemo(() => {
    const items = [];

    actions.forEach((action) => {
      items.push({
        type: 'action',
        date: action.createdAt || action.date,
        data: action,
      });
    });

    statusLog.forEach((log) => {
      items.push({
        type: 'status',
        date: log.date,
        data: log,
      });
    });

    // Trier par date décroissante (plus récent en haut)
    return items.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [actions, statusLog]);

  return (
    <Box pt="4">
      <Flex direction="column" gap="3">
        <History 
          items={timeline} 
          renderItem={(item) => <HistoryItem item={item} />} 
        />
      </Flex>
    </Box>
  );
}

HistoryTab.propTypes = {
  actions: PropTypes.array.isRequired,
  statusLog: PropTypes.array.isRequired,
};
