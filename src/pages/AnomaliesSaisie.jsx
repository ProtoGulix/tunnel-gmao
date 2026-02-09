/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🔍 AnomaliesSaisie.jsx - Contrôle qualité des saisies d'actions
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Outil de contrôle qualité pour détecter les anomalies de saisie des actions.
 * Identifie 6 types d'anomalies avec sévérité configurable côté serveur.
 * 
 * Types d'anomalies détectées :
 * - too_repetitive : Même action répétée excessivement
 * - too_fragmented : Actions courtes fragmentées
 * - too_long_for_category : Durée anormale pour la catégorie
 * - bad_classification : Classification incohérente avec la description
 * - back_to_back : Actions consécutives suspectes
 * - low_value_high_load : Charge élevée sur catégories à faible valeur
 * 
 * Objectif : Améliorer la qualité des données saisies
 * 
 * @module pages/AnomaliesSaisie
 * @requires hooks/useAnomaliesSaisie
 * @requires components/anomalies
 */

import { useState } from 'react';
import { Container, Box, Text, Callout } from '@radix-ui/themes';
import { CheckCircle2 } from 'lucide-react';

// Layout
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/common/LoadingState';
import ErrorDisplay from '@/components/ErrorDisplay';

// Composants spécifiques
import { AnomalySummaryCards, AnomalySection } from '@/components/anomalies';

// Hook
import { useAnomaliesSaisie } from '@/hooks/useAnomaliesSaisie';

/**
 * Page Anomalies de saisie
 */
export default function AnomaliesSaisie() {
  // État local pour la période (3 mois par défaut)
  const [startDate, setStartDate] = useState(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
  const [endDate, setEndDate] = useState(new Date());

  // Handler changement de période
  const handleDateRangeChange = ({ range }) => {
    if (range) {
      setStartDate(range.start);
      setEndDate(range.end);
    } else {
      setStartDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));
      setEndDate(new Date());
    }
  };

  // Chargement des données
  const { data, loading, error } = useAnomaliesSaisie(startDate, endDate);

  // États de chargement et erreur
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!data) {
    return (
      <Container size="4">
        <PageHeader
          title="Anomalies de saisie"
          subtitle="Contrôle qualité des actions"
          timeSelection={{
            enabled: true,
            mode: 'popover',
            component: 'daterange',
            onFilterChange: handleDateRangeChange,
          }}
        />
        <LoadingState message="Aucune donnée disponible pour cette période" />
      </Container>
    );
  }

  const { summary, anomalies } = data;
  const hasAnomalies = summary?.totalAnomalies > 0;

  return (
    <Container size="4">
      <PageHeader
        title="Anomalies de saisie"
        subtitle="Contrôle qualité des actions"
        timeSelection={{
          enabled: true,
          mode: 'popover',
          component: 'daterange',
          onFilterChange: handleDateRangeChange,
        }}
      />

      {/* Synthèse */}
      <AnomalySummaryCards summary={summary} />

      {/* Message si aucune anomalie */}
      {!hasAnomalies && (
        <Callout.Root color="green" mb="4">
          <Callout.Icon><CheckCircle2 size={18} /></Callout.Icon>
          <Callout.Text>
            <Text weight="bold">Aucune anomalie détectée</Text>
            <Text size="2" color="gray" style={{ display: 'block', marginTop: 4 }}>
              La qualité des saisies est conforme aux règles définies.
            </Text>
          </Callout.Text>
        </Callout.Root>
      )}

      {/* Sections par type d'anomalie */}
      {hasAnomalies && (
        <Box>
          <AnomalySection type="tooRepetitive" items={anomalies?.tooRepetitive} />
          <AnomalySection type="tooFragmented" items={anomalies?.tooFragmented} />
          <AnomalySection type="tooLongForCategory" items={anomalies?.tooLongForCategory} />
          <AnomalySection type="badClassification" items={anomalies?.badClassification} />
          <AnomalySection type="backToBack" items={anomalies?.backToBack} />
          <AnomalySection type="lowValueHighLoad" items={anomalies?.lowValueHighLoad} />
        </Box>
      )}
    </Container>
  );
}
