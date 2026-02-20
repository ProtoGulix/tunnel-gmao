/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📈 TechnicalWorkload.jsx - Charge technique : analyse du temps maintenance
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Outil d'aide à la décision pour analyser où passe le temps du service.
 * Distingue dépannage subi et évitable, identifie les leviers d'amélioration.
 * 
 * Objectif : Répondre à "Quelle part du temps est récupérable pour autre chose ?"
 * 
 * Structure :
 * - En-tête : Titre + sélecteur de période
 * - Synthèse : KPICards (charge totale, dépannage, constructif)
 * - Taux de dépannage évitable : Indicateur central avec seuils colorés
 * - Répartition des causes : Tableau par facteur de complexité
 * - Par classe d'équipement : Tableau détaillé par type de machine
 * - Guide de lecture : Aide à l'interprétation
 * 
 * Contraintes :
 * - Analyse par classe d'équipement (jamais par machine isolée)
 * - Pas d'analyse par technicien (pas un outil RH)
 * - Données issues uniquement de /stats/charge-technique
 * 
 * @module pages/TechnicalWorkload
 * @requires hooks/useTechnicalWorkload
 * @requires components/charge/TechnicalWorkloadComponents
 */

import { useState } from 'react';
import { Container } from '@radix-ui/themes';

// Layout
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/common/LoadingState';
import ErrorDisplay from '@/components/ErrorDisplay';

// Composants spécifiques
import {
  ChargesSynthesisCards,
  CauseBreakdownSection,
  EquipementClassTable,
  DecisionGuide,
} from '@/components/charge';

// Hook
import { useTechnicalWorkload } from '@/hooks/useTechnicalWorkload';

/**
 * Page Charge Technique
 */
export default function TechnicalWorkload() {
  // État local pour la période
  const [startDate, setStartDate] = useState(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)); // 3 mois
  const [endDate, setEndDate] = useState(new Date());

  // Handler changement de période
  const handleDateRangeChange = ({ range }) => {
    if (range) {
      setStartDate(range.start);
      setEndDate(range.end);
    } else {
      // "Toutes" - plage large
      setStartDate(new Date(Date.now() - 365 * 24 * 60 * 60 * 1000));
      setEndDate(new Date());
    }
  };

  // Chargement des données
  const { data, loading, error } = useTechnicalWorkload(startDate, endDate);

  // États de chargement et erreur
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorDisplay error={error} />;
  }

  if (!data || !data.current) {
    return (
      <Container size="4">
        <PageHeader
          title="Charge technique"
          subtitle="Analyse du temps de maintenance"
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

  // Extraction des données de la période courante
  const { charges, tauxDepannageEvitable, causeBreakdown, byEquipementClass } = data.current;
  const { guide } = data;

  return (
    <Container size="4">
      <PageHeader
        title="Charge technique"
        subtitle="Analyse du temps de maintenance"
        timeSelection={{
          enabled: true,
          mode: 'popover',
          component: 'daterange',
          onFilterChange: handleDateRangeChange,
        }}
      />

      {/* Synthèse des charges + Taux évitable */}
      <ChargesSynthesisCards 
        charges={charges} 
        tauxEvitable={tauxDepannageEvitable}
        seuils={guide?.seuilsTauxEvitable}
      />

      {/* Répartition des causes */}
      <CauseBreakdownSection 
        causes={causeBreakdown} 
        categorieColors={guide?.actionsParCategorie}
      />

      {/* Analyse par classe d'équipement */}
      <EquipementClassTable 
        data={byEquipementClass} 
        categorieColors={guide?.actionsParCategorie}
      />

      {/* Guide de lecture */}
      <DecisionGuide guide={guide} />
    </Container>
  );
}
