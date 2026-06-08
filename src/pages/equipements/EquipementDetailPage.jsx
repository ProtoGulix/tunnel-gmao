/**
 * @fileoverview Page détail d'un équipement — layout briefing filtré par équipement
 * @module pages/equipements/EquipementDetailPage
 */

import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import EquipementInfoHeader from '@/components/equipements/EquipementInfoHeader';
import { useEquipementDetail } from '@/hooks/equipements/useEquipementDetail';

const BriefingPage = lazy(() => import('@/pages/briefing/BriefingPage'));

export default function EquipementDetailPage() {
  const { id } = useParams();
  const { equipement, loading, error, health, manualRefresh } = useEquipementDetail(id);

  if (error && !equipement) {
    return (
      <>
        <PageHeader title="Équipement" />
        <ErrorState error={error} />
      </>
    );
  }

  if (loading && !equipement) {
    return (
      <>
        <PageHeader title="Équipement" />
        <LoadingState message="Chargement de l'équipement..." />
      </>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <PageHeader
        title={`${equipement?.code || '—'} – ${equipement?.name || 'Équipement'}`}
        subtitle={health?.reason}
        onRefresh={manualRefresh}
        noMargin
      />
      <div style={{ flex: 1, minHeight: 0, height: '100%' }}>
        <Suspense fallback={<LoadingState />}>
          <BriefingPage
            equipementId={id}
            leftHeader={<EquipementInfoHeader equipement={equipement} health={health} />}
          />
        </Suspense>
      </div>
    </div>
  );
}
