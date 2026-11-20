/**
 * Page Interventions — onglets Interventions / Demandes d'intervention
 * Chaque onglet a sa propre vue master-detail (liste filtrée + détail).
 */

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Flex, Tabs, Text } from '@radix-ui/themes';
import { ClipboardList, FileDown, Wrench } from 'lucide-react';
import ExportClosedInterventionsDialog from '@/components/interventions/ExportClosedInterventionsDialog';
import InterventionCreateModal from '@/components/interventions/InterventionCreateModal';
import { entityCodeUrl } from '@/components/shared/entityCodeUrl';
import PageHeader from '@/components/layout/PageHeader';
import InterventionsTabContent from '@/components/interventions/InterventionsTabContent';
import RequestsTabContent from '@/components/intervention-requests/RequestsTabContent';
import { usePermissions } from '@/auth/usePermissions';
import { PERM } from '@/auth/permissionCodes';

/* ── Page principale ────────────────────────────────────────────────────── */
export default function InterventionsListPage() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  // Incrémenté après un marquage de masse : l'onglet relance sa liste
  const [listVersion, setListVersion] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') ?? 'interventions';
  // Un seul param `id` dans l'URL : sa signification dépend de l'onglet actif (`tab`).
  // La sélection est dérivée de l'URL (pas d'état local) : un lien ou une notification
  // vers une autre `id` ouvre l'élément même quand la page est déjà affichée.
  const urlId = searchParams.get('id');
  const selectedInterventionId = activeTab === 'interventions' ? urlId : null;
  const selectedRequestId = activeTab === 'demandes' ? urlId : null;

  const setIdParam = (id) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set('id', id);
      else next.delete('id');
      return next;
    }, { replace: true });
  };

  const handleTabChange = (tab) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', tab);
      next.delete('id');
      next.delete('dtab');
      return next;
    }, { replace: true });
  };

  const handleSelectIntervention = (interv) => setIdParam(interv.id);

  const handleSelectRequest = (req) => {
    setIdParam(String(selectedRequestId) === String(req.id) ? null : req.id);
  };

  const handleDeselectRequest = () => setIdParam(null);

  return (
    <Flex direction="column" style={{ height: '100%', minHeight: 0 }}>
      <PageHeader
        title="Interventions"
        subtitle="Gestion des interventions de maintenance"
        icon={Wrench}
        onAdd={can(PERM.interventions.create) ? () => setIsCreateOpen(true) : undefined}
        addLabel="Nouvelle intervention"
        actions={can(PERM.interventions.exportClosed) ? [{
          label: 'Exporter les fiches fermées',
          icon: FileDown,
          onClick: () => setIsExportOpen(true),
        }] : undefined}
      />
      <InterventionCreateModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSuccess={(created) => navigate(entityCodeUrl('intervention', created.id))}
      />
      <ExportClosedInterventionsDialog
        open={isExportOpen} onClose={() => setIsExportOpen(false)}
        onMarked={() => setListVersion((v) => v + 1)}
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
            refreshToken={listVersion}
            onSelect={handleSelectIntervention}
            onCreate={() => setIdParam(null)}
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
