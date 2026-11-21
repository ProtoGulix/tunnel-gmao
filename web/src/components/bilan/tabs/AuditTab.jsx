/**
 * @fileoverview Onglet « Audit » du Bilan : synthèse de l'audit au modèle de l'onglet État
 * (ADR 0032, 0033, 0035). Chiffres d'équipe uniquement, aucun détail par personne.
 * @module components/bilan/tabs/AuditTab
 */

import PropTypes from 'prop-types';
import { Box, Flex } from '@radix-ui/themes';
import ErrorState from '@/components/ui/ErrorState';
import InfoLabel from '@/components/ui/InfoLabel';
import LoadingState from '@/components/ui/LoadingState';
import AuditKeyFigures from '@/components/bilan/AuditKeyFigures';
import FoldedSection from '@/components/bilan/FoldedSection';
import { MonthlyTable, DecisionsTable } from '@/components/audit-synthese/AuditSyntheseFigures';
import { DEFINITIONS } from '@/components/audit-synthese/definitions';
import { useAuditSynthese } from '@/hooks/audit-synthese/useAuditSynthese';

const MONTHLY_DEFINITION = "Valeur de chaque indicateur pour chacun des mois de la période. Un mois à données incomplètes est signalé.";

// Une ligne courte : garant et exécutants d'abord, mention de données incomplètes si besoin
function NotesLine({ hasIncomplete }) {
  return (
    <Flex wrap="wrap" gap="1" mb="3" style={{ columnGap: 16 }}>
      <InfoLabel label="Garant et exécutants" definition={DEFINITIONS.roles} color="gray" />
      {hasIncomplete && (
        <InfoLabel label="Données incomplètes sur certains mois" definition={DEFINITIONS.incomplete} color="gray" />
      )}
    </Flex>
  );
}
NotesLine.propTypes = { hasIncomplete: PropTypes.bool.isRequired };

function Body({ data }) {
  return (
    <>
      <AuditKeyFigures data={data} />
      <NotesLine hasIncomplete={data.monthly.some((m) => m.incomplete_data)} />
      <FoldedSection title="Valeurs par mois" definition={MONTHLY_DEFINITION}>
        <MonthlyTable monthly={data.monthly} />
      </FoldedSection>
      <FoldedSection title="Décisions hors travail normal, par type et motif" definition={DEFINITIONS.decisions}>
        <DecisionsTable decisions={data.decisions} monthly={data.monthly} />
      </FoldedSection>
    </>
  );
}
Body.propTypes = { data: PropTypes.object.isRequired };

export default function AuditTab({ months }) {
  const { data, loading, error, reload } = useAuditSynthese(months);
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data) return <LoadingState fullscreen={false} message="Chargement…" />;
  return <Box style={{ opacity: loading ? 0.6 : 1 }}><Body data={data} /></Box>;
}
AuditTab.propTypes = { months: PropTypes.number.isRequired };
