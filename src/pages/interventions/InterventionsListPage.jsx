/**
 * Page Interventions — onglets Interventions / Demandes d'intervention
 * Chaque onglet a sa propre vue master-detail (liste filtrée + détail).
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Flex, Tabs, Text } from '@radix-ui/themes';
import { ClipboardList, Wrench } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import InterventionsTabContent from '@/components/interventions/InterventionsTabContent';
import RequestsTabContent from '@/components/intervention-requests/RequestsTabContent';

/* ── Page principale ────────────────────────────────────────────────────── */
export default function InterventionsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'interventions';
  // Un seul param `id` dans l'URL : sa signification dépend de l'onglet actif (`tab`).
  const [selectedInterventionId, setSelectedInterventionId] = useState(
    () => (activeTab === 'interventions' ? searchParams.get('id') : null)
  );
  const [selectedRequestId, setSelectedRequestId] = useState(
    () => (activeTab === 'demandes' ? searchParams.get('id') : null)
  );

  const setIdParam = (id) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set('id', id);
      else next.delete('id');
      return next;
    }, { replace: true });
  };

  const handleTabChange = (tab) => {
    // Réinitialise la sélection de l'onglet quitté pour ne pas empiler des ids obsolètes
    if (tab === 'demandes') setSelectedInterventionId(null);
    else if (tab === 'interventions') setSelectedRequestId(null);

    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      next.delete('id');
      return next;
    }, { replace: true });
  };

  const handleSelectIntervention = (interv) => {
    setSelectedInterventionId(String(interv.id));
    setIdParam(interv.id);
  };

  const handleSelectRequest = (req) => {
    setSelectedRequestId((prev) => {
      const next = prev === req.id ? null : req.id;
      setIdParam(next);
      return next;
    });
  };

  const handleDeselectRequest = () => {
    setSelectedRequestId(null);
    setIdParam(null);
  };

  return (
    <Flex direction="column" style={{ height: '100%', minHeight: 0 }}>
      <PageHeader
        title="Interventions"
        subtitle="Gestion des interventions de maintenance"
        icon={Wrench}
        onAdd={() => navigate('/intervention/new')}
        addLabel="Nouvelle intervention"
      />

      <Tabs.Root value={activeTab} onValueChange={handleTabChange} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Box px="4">
          <Tabs.List>
            <Tabs.Trigger value="interventions">
              <Flex align="center" gap="2"><Wrench size={14} /><Text>Interventions</Text></Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="demandes">
              <Flex align="center" gap="2"><ClipboardList size={14} /><Text>Demandes d&apos;intervention</Text></Flex>
            </Tabs.Trigger>
          </Tabs.List>
        </Box>

        {activeTab === 'interventions' && (
          <InterventionsTabContent
            selectedId={selectedInterventionId}
            onSelect={handleSelectIntervention}
            onCreate={() => setSelectedInterventionId(null)}
          />
        )}
        {activeTab === 'demandes' && (
          <RequestsTabContent
            selectedId={selectedRequestId}
            onSelect={handleSelectRequest}
            onDeselect={handleDeselectRequest}
          />
        )}
      </Tabs.Root>
    </Flex>
  );
}
