/**
 * @fileoverview Page détail d'un équipement — layout briefing filtré par équipement
 * @module pages/equipements/EquipementDetailPage
 */

import { useParams } from 'react-router-dom';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import BriefingPage from '@/pages/briefing/BriefingPage';
import EquipementInfoHeader from '@/components/equipements/EquipementInfoHeader';
import { useEquipementDetail } from '@/hooks/equipements/useEquipementDetail';

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
      <div style={{ flex: 1, minHeight: 0 }}>
        <BriefingPage
          equipementId={id}
          leftHeader={<EquipementInfoHeader equipement={equipement} health={health} />}
        />
      </div>
    </div>
  );
}
