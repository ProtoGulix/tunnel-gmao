/**
 * @fileoverview Accueil « direction technique » : ce qui attend une décision (ADR 0047).
 * Bilan en une ligne, demandes à trancher, blocages à voir avec l'acheteur et la production,
 * côté maintenance, où ça s'entasse.
 * @module pages/home/TechnicalDirectionHomeView
 */

import { useState } from 'react';
import { Box, Flex, Grid } from '@radix-ui/themes';
import { ClipboardList } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/ui/LoadingState';
import SpontaneousInterventionRequestModal from '@/components/home/SpontaneousInterventionRequestModal';
import AcceptRequestDialog from '@/components/home/AcceptRequestDialog';
import SiteFilter from '@/components/home/SiteFilter';
import QueueNotices from '@/components/home/QueueNotices';
import BilanLine from '@/components/home/BilanLine';
import ToDecideList from '@/components/home/ToDecideList';
import BlockCard from '@/components/home/BlockCard';
import MaintenanceSide from '@/components/home/MaintenanceSide';
import PileUp from '@/components/home/PileUp';
import { useSiteOptions } from '@/hooks/home/useSiteOptions';
import { useDirectionHome } from '@/hooks/home/useDirectionHome';
import { useHomeFilter } from '@/hooks/home/useHomeFilter';
import { useRequestQueueActions } from '@/hooks/home/useRequestQueueActions';
import { purchaseCauses, productionCause } from '@/hooks/home/decisionQueue';

const partsCauses = (item) => purchaseCauses(item.purchase_requests);
const productionCauses = (item) => [productionCause(item.note)];

export default function TechnicalDirectionHomeView() {
  const { site, setSite } = useHomeFilter();
  const siteOptions = useSiteOptions();
  const home = useDirectionHome({ site });
  const { stats, requests, blocages, maintenance, failed, reload } = home;
  const [createModal, setCreateModal] = useState(false);
  const [accepting, setAccepting] = useState(null);
  const [actionError, setActionError] = useState(null);
  const actions = useRequestQueueActions({ onDone: reload });

  // Une décision refusée affiche son message ; la ligne ne quitte la liste qu'après succès
  const attempt = (decide) => async (...args) => {
    setActionError(null);
    try {
      return await decide(...args);
    } catch (err) {
      setActionError(err.message);
      return false;
    }
  };

  if (home.loading) return <LoadingState fullscreen message="Chargement…" />;
  const threshold = blocages.data?.threshold_days;

  return (
    <Flex direction="column" style={{ height: '100%', minHeight: 0, overflowY: 'auto' }}>
      <PageHeader
        title="Ce qui attend votre décision"
        subtitle="Direction technique"
        actions={[{ label: "Demande d'inter", icon: ClipboardList, onClick: () => setCreateModal(true) }]}
      />
      <SpontaneousInterventionRequestModal open={createModal} onOpenChange={setCreateModal} onSuccess={reload} />
      <AcceptRequestDialog
        request={accepting}
        onClose={() => setAccepting(null)}
        onAccept={async (request, data) => {
          setActionError(null);
          if (await actions.accept(request, data)) setAccepting(null);
        }}
      />
      <Flex direction="column" gap="4" px="4" pb="6">
        <QueueNotices actionError={actionError} failed={failed} />
        <SiteFilter options={siteOptions} value={site} onChange={setSite} />
        {stats.data && <BilanLine stats={stats.data} />}
        <Grid columns={{ initial: '1', md: '3fr 2fr' }} gap="5" align="start">
          <ToDecideList
            requests={requests.items}
            buckets={stats.data?.age_buckets}
            actions={{ onAccept: setAccepting, onHold: attempt(actions.hold), onReject: attempt(actions.reject) }}
          />
          <Flex direction="column" gap="4" style={{ minWidth: 0 }}>
            {blocages.data && (
              <>
                <BlockCard
                  title="À voir avec l’acheteur" subject="parts" items={blocages.data.parts}
                  thresholdDays={threshold} causesOf={partsCauses}
                />
                <BlockCard
                  title="À voir avec la production" subject="production" items={blocages.data.production}
                  thresholdDays={threshold} causesOf={productionCauses}
                />
              </>
            )}
            <MaintenanceSide data={maintenance.data} />
            {stats.data && <Box><PileUp sites={stats.data.sites} equipments={stats.data.equipments} /></Box>}
          </Flex>
        </Grid>
      </Flex>
    </Flex>
  );
}
