/**
 * @fileoverview Page détail d'un équipement
 * @module pages/equipements/EquipementDetailPage
 *
 * Affiche le détail complet d'un équipement avec onglets
 */

import { useParams } from 'react-router-dom';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import EquipementDetailTab from '@/components/equipements/tabs/EquipementDetailTab';
import { useEquipementDetail } from '@/hooks/equipements/useEquipementDetail';

export default function EquipementDetailPage() {
  const { id } = useParams();
  const {
    equipement, loading, error, health,
    stats, statsLoading, interventions, childrenCount, parent,
    manualRefresh,
  } = useEquipementDetail(id);

  if (error && !equipement) {
    return (
      <PageContainer>
        <PageHeader title="Équipement" />
        <ErrorState error={error} />
      </PageContainer>
    );
  }

  if (loading && !equipement) {
    return (
      <PageContainer>
        <PageHeader title="Équipement" />
        <LoadingState message="Chargement de l'équipement..." />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`${equipement?.code || '—'} – ${equipement?.name || 'Équipement'}`}
        subtitle={health.reason}
        onRefresh={manualRefresh}
      />

      <EquipementDetailTab
        id={id}
        equipement={equipement}
        loading={loading}
        error={error}
        health={health}
        stats={stats}
        statsLoading={statsLoading}
        interventions={interventions}
        childrenCount={childrenCount}
        parent={parent}
      />
    </PageContainer>
  );
}
