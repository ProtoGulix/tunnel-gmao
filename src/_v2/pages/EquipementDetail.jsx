/**
 * @fileoverview Page détail d'un équipement
 * @module EquipementDetail
 */

import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Flex, Badge } from '@radix-ui/themes';
import { Plus } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import ErrorDisplay from '@/components/ErrorDisplay';
import LoadingState from '@/components/common/LoadingState';
import EquipementInfoBanner from '@/components/equipements/EquipementInfoBanner';
import EquipementDetailTabs from '@/components/equipements/EquipementDetailTabs';
import { useEquipementDetail } from '@/hooks/useEquipementDetail';

const HEALTH_COLORS = { ok: 'green', maintenance: 'orange', warning: 'yellow', critical: 'red' };
const HEADER_ACTIONS = [{ label: 'Créer une intervention', icon: Plus, onClick: () => {} }];

function buildHeaderStats(health) {
  const rules = health.rulesTriggered || [];
  const items = [
    { label: 'Santé', value: health.level.toUpperCase(), color: HEALTH_COLORS[health.level] || 'gray' },
  ];
  if (rules.length > 0) {
    items.push({
      label: 'Règles déclenchées',
      render: (
        <Flex gap="1" wrap="wrap" justify="end">
          {rules.map((rule) => (
            <Badge key={rule} variant="soft" color="gray" size="1">{rule}</Badge>
          ))}
        </Flex>
      ),
    });
  }
  return items;
}

export default function EquipementDetail() {
  const { id } = useParams();
  const detail = useEquipementDetail(id);
  const { equipement, eqLoading, eqError, health,
    parentInfo, childrenInfo, manualRefresh, reloadEquipement } = detail;

  const headerStats = useMemo(() => buildHeaderStats(health), [health]);

  if (eqError && !equipement) {
    return (
      <Container>
        <PageHeader title="Équipement" />
        <ErrorDisplay error={eqError} />
      </Container>
    );
  }

  if (eqLoading && !equipement) {
    return (
      <Container>
        <PageHeader title="Équipement" />
        <LoadingState message="Chargement de l'équipement..." fullscreen={false} />
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader
        title={`${equipement?.code || '—'} – ${equipement?.name || 'Équipement'}`}
        subtitle={health.reason}
        stats={headerStats}
        onRefresh={manualRefresh}
        actions={HEADER_ACTIONS}
      />

      <EquipementInfoBanner
        equipement={equipement}
        parentInfo={parentInfo}
        childrenInfo={childrenInfo}
        onSaved={reloadEquipement}
      />

      <EquipementDetailTabs detail={{ ...detail, machineId: id }} />
    </Container>
  );
}
