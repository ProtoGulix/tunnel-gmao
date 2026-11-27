/**
 * @fileoverview Vue d'accueil "direction technique" : bilan des demandes à qualifier (flux, âge, où),
 * tuiles de la file, puis, sur un clic, la liste filtrée à gauche et le détail à droite (ADR 0046).
 * @module pages/home/TechnicalDirectionHomeView
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Flex } from '@radix-ui/themes';
import { ClipboardList } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/ui/LoadingState';
import SpontaneousInterventionRequestModal from '@/components/home/SpontaneousInterventionRequestModal';
import AcceptRequestDialog from '@/components/home/AcceptRequestDialog';
import SiteFilter from '@/components/home/SiteFilter';
import FilteredQueue from '@/components/home/FilteredQueue';
import QueueNotices from '@/components/home/QueueNotices';
import DemandBilan from '@/components/home/DemandBilan';
import QueueTiles from '@/components/home/QueueTiles';
import ActiveFilterBar from '@/components/home/ActiveFilterBar';
import { PERM } from '@/auth/permissionCodes';
import { usePermissions } from '@/auth/usePermissions';
import { useSiteOptions } from '@/hooks/home/useSiteOptions';
import { useDirectionHome } from '@/hooks/home/useDirectionHome';
import { SECTION_TITLES } from '@/hooks/home/requestQueue';
import { tileCounts } from '@/hooks/home/bilanFilter';
import { filterLabel } from '@/hooks/home/bilanView';
import { useHomeFilter } from '@/hooks/home/useHomeFilter';
import { useQueueAnticipate } from '@/hooks/home/useQueueAnticipate';
import { useRequestQueueActions } from '@/hooks/home/useRequestQueueActions';

export default function TechnicalDirectionHomeView() {
  const { site, filter, setFilter, setSite } = useHomeFilter();
  const siteOptions = useSiteOptions();
  const home = useDirectionHome({ site, filter });
  const { stats, all, failed, reload } = home;
  const { can } = usePermissions();
  const [createModal, setCreateModal] = useState(false);
  const [accepting, setAccepting] = useState(null);
  const actions = useRequestQueueActions({ onDone: reload });
  const anticipate = useQueueAnticipate({ onDone: reload });
  if (home.loading) {
    return <LoadingState fullscreen message="Chargement du bilan…" />;
  }

  return (
    <Flex direction="column" style={{ height: '100%', minHeight: 0, overflowY: 'auto' }}>
      <PageHeader
        title="Direction technique"
        subtitle="Demandes à qualifier"
        actions={[{ label: "Demande d'inter", icon: ClipboardList, onClick: () => setCreateModal(true) }]}
      />
      <SpontaneousInterventionRequestModal open={createModal} onOpenChange={setCreateModal} onSuccess={reload} />
      <AcceptRequestDialog
        request={accepting}
        onClose={() => setAccepting(null)}
        onAccept={async (request, data) => {
          if (await actions.accept(request, data)) setAccepting(null);
        }}
      />
      <QueueNotices anticipateError={anticipate.error} failed={failed} />

      <Flex px="4" pt="2" justify="end"><SiteFilter options={siteOptions} value={site} onChange={setSite} /></Flex>
      {stats.data && <DemandBilan stats={stats.data} filter={filter} onSelect={setFilter} />}
      <QueueTiles
        titles={SECTION_TITLES} counts={tileCounts(all)}
        activeId={filter?.kind === 'tile' ? filter.value : undefined} onSelect={setFilter}
      />

      {filter && (
        <>
          <ActiveFilterBar label={filterLabel(filter, stats.data)} onClear={() => setFilter(null)} />
          <FilteredQueue
            title={filterLabel(filter, stats.data)} home={home} anticipate={anticipate}
            canAnticipate={can(PERM.preventive.anticipate)} onAccept={setAccepting}
          />
        </>
      )}

      <Flex justify="end" px="4" py="2" style={{ flexShrink: 0 }}>
        <Link to="/interventions?tab=demandes">Toutes les demandes</Link>
      </Flex>
    </Flex>
  );
}
