/**
 * @fileoverview Vue d'accueil "direction technique" : file « à traiter », une section par
 * sujet (voir buildQueueSections), section vide masquée. Liste à gauche, détail de la ligne choisie à droite.
 * @module pages/home/TechnicalDirectionHomeView
 */

import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Box, Flex, Text } from '@radix-ui/themes';
import { ClipboardList, ListChecks } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/ui/LoadingState';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import SpontaneousInterventionRequestModal from '@/components/home/SpontaneousInterventionRequestModal';
import AcceptRequestDialog from '@/components/home/AcceptRequestDialog';
import SiteFilter from '@/components/home/SiteFilter';
import QueueSections from '@/components/home/QueueSections';
import QueueNotices from '@/components/home/QueueNotices';
import QueueDetail from '@/components/home/QueueDetail';
import { PERM } from '@/auth/permissionCodes';
import { usePermissions } from '@/auth/usePermissions';
import { useSiteOptions } from '@/hooks/home/useSiteOptions';
import { useTechnicalDirectionRequests } from '@/hooks/home/useTechnicalDirectionRequests';
import { useInterventionQueue, failedLabels } from '@/hooks/home/useInterventionQueue';
import { useQueueAnticipate } from '@/hooks/home/useQueueAnticipate';
import { useRequestQueueActions } from '@/hooks/home/useRequestQueueActions';
import { useQueueSelection } from '@/hooks/home/useQueueSelection';
import { buildQueueSections, flattenQueue, parseRowKey } from '@/hooks/home/requestQueue';

export default function TechnicalDirectionHomeView() {
  const [site, setSite] = useState('');
  const siteOptions = useSiteOptions();
  const requests = useTechnicalDirectionRequests({ siteId: site });
  const queue = useInterventionQueue({ siteId: site });
  const { can } = usePermissions();
  const reload = useCallback(
    () => Promise.all([requests.reload(), queue.reload()]),
    // Les deux reload sont stables (useCallback) ; la règle réclamerait les objets entiers
    [requests.reload, queue.reload], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const [createModal, setCreateModal] = useState(false);
  const [accepting, setAccepting] = useState(null);
  const actions = useRequestQueueActions({ onDone: reload });
  const anticipate = useQueueAnticipate({ onDone: reload });
  const sections = useMemo(
    () => buildQueueSections({ ...queue, requests: requests.items }),
    [queue.urgent, queue.waiting, queue.idle, queue.preventive, requests.items], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const lines = useMemo(() => flattenQueue(sections), [sections]);
  const keys = useMemo(() => lines.map((l) => l.key), [lines]);
  const failed = failedLabels({ ...queue.errors, ...(requests.error && { requests: requests.error }) });
  const [selectedKey, select] = useQueueSelection(keys, failed.length > 0);
  const target = parseRowKey(selectedKey);

  if ((requests.loading || queue.loading) && sections.length === 0) {
    return <LoadingState fullscreen message="Chargement de la file…" />;
  }

  return (
    <Flex direction="column" style={{ height: '100%', minHeight: 0 }}>
      <PageHeader
        title="Direction technique"
        subtitle="À traiter"
        actions={[
          {
            label: "Demande d'inter",
            icon: ClipboardList,
            onClick: () => setCreateModal(true),
          },
        ]}
      />

      <SpontaneousInterventionRequestModal
        open={createModal}
        onOpenChange={setCreateModal}
        onSuccess={reload}
      />

      <AcceptRequestDialog
        request={accepting}
        onClose={() => setAccepting(null)}
        onAccept={async (request, data) => {
          if (await actions.accept(request, data)) setAccepting(null);
        }}
      />

      <QueueNotices anticipateError={anticipate.error} failed={failed} />

      <Box px="4" pt="3" style={{ flex: 1, minHeight: 500, overflow: 'hidden' }}>
        <MasterDetailLayout
          freeDetail
          ratio="40% 1fr"
          masterProps={{
            icon: ListChecks,
            title: 'À traiter',
            count: lines.length,
            headerExtra: <SiteFilter options={siteOptions} value={site} onChange={setSite} />,
            children: lines.length === 0 && failed.length === 0
              ? <Text as="p" color="gray" m="3">Rien à traiter.</Text>
              : <QueueSections sections={sections} selectedKey={selectedKey} onSelect={select} />,
          }}
          detailChildren={target ? (
            <QueueDetail
              target={target}
              row={lines.find((l) => l.key === selectedKey)?.row}
              requests={requests.items}
              canAnticipate={can(PERM.preventive.anticipate)}
              anticipate={anticipate}
              onAccept={setAccepting}
              onChanged={reload}
            />
          ) : null}
          emptyLabel="Sélectionnez une ligne pour voir son détail"
        />
      </Box>

      <Flex justify="end" px="4" py="2">
        <Link to="/interventions?tab=demandes">Toutes les demandes</Link>
      </Flex>
    </Flex>
  );
}
