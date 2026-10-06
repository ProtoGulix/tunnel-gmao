/**
 * Onglet principal Qualité des Données
 */

import PropTypes from 'prop-types';
import { Box } from '@radix-ui/themes';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import {
  SynthesisCards,
  NoProblemsMessage,
  AnomalyTypeSection,
} from '../QualityDataComponents';
import { ANOMALY_TYPE_BY_CODE } from '../config';
import { useQualityData } from '@/hooks/quality-data/useQualityData';

export default function QualityDataTab({ filters }) {
  const { data, loading, error } = useQualityData(filters);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data) return null;

  // Grouper problèmes par type d'anomalie plutôt que par entité technique
  const groupedProblems = {};
  if (data.problems) {
    data.problems.forEach((problem) => {
      const type = ANOMALY_TYPE_BY_CODE[problem.code] || 'autre';
      if (!groupedProblems[type]) {
        groupedProblems[type] = [];
      }
      groupedProblems[type].push(problem);
    });
  }

  const entityCount = new Set((data.problems || []).map((p) => p.entity)).size;

  return (
    <Box>
      {/* KPIs de synthèse */}
      <SynthesisCards
        total={data.total}
        highCount={data.bySeverity.high}
        mediumCount={data.bySeverity.medium}
        entityCount={entityCount}
      />

      {/* Message si pas de problèmes */}
      {data.total === 0 && <NoProblemsMessage />}

      {/* Liste des problèmes par type d'anomalie */}
      {Object.entries(groupedProblems).map(([type, problems]) => (
        <AnomalyTypeSection key={type} type={type} problems={problems} />
      ))}
    </Box>
  );
}

QualityDataTab.propTypes = {
  filters: PropTypes.shape({
    severite: PropTypes.string,
    entite: PropTypes.string,
    code: PropTypes.string,
  }),
};
