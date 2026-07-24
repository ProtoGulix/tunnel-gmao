/**
 * @fileoverview Contenu master-detail de l'onglet Demandes d'intervention (page liste interventions)
 * @module components/intervention-requests/RequestsTabContent
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { ClipboardList } from 'lucide-react';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import ErrorState from '@/components/ui/ErrorState';
import InterventionRequestListItem from '@/components/intervention-requests/InterventionRequestListItem';
import InterventionRequestDetail from '@/components/intervention-requests/InterventionRequestDetail';
import { useInterventionRequests } from '@/hooks/intervention-requests/useInterventionRequests';
import { Box, Flex, Switch, Text } from '@radix-ui/themes';

export default function RequestsTabContent({ selectedId, onSelect, onDeselect }) {
  const { items, loading, error, search, setSearch, showOnlyCloturees, setShowOnlyCloturees, total, refresh } = useInterventionRequests();

  const masterList = useMemo(
    () => items.map((req) => (
      <InterventionRequestListItem
        key={req.id}
        request={req}
        isSelected={String(req.id) === String(selectedId)}
        onClick={() => onSelect(req)}
      />
    )),
    [items, selectedId] // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  return (
    <Box px="4" pt="3" style={{ flex: 1, minHeight: 500, overflow: 'hidden' }}>
      <MasterDetailLayout
        freeDetail
        ratio="35% 1fr"
        masterProps={{
          icon: ClipboardList,
          title: 'Demandes d\'intervention',
          count: total,
          search,
          onSearchChange: setSearch,
          loading,
          children: masterList,
          headerExtra: (
            <Flex align="center" gap="2" asChild>
              <Text as="label" size="1" color="gray">
                <Switch size="1" checked={showOnlyCloturees} onCheckedChange={setShowOnlyCloturees} />
                Voir les archivées (clôturées)
              </Text>
            </Flex>
          ),
        }}
        detailChildren={selectedId ? (
          <InterventionRequestDetail
            requestId={selectedId}
            onTransitionDone={refresh}
            onDeleted={() => { onDeselect?.(); refresh(); }}
          />
        ) : null}
        emptyLabel="Sélectionnez une demande pour voir son détail"
      />
    </Box>
  );
}

RequestsTabContent.propTypes = {
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onDeselect: PropTypes.func,
};
