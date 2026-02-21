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
  EntitySection,
} from '../QualityDataComponents';
import { useQualityData } from '@/hooks/quality-data/useQualityData';

export default function QualityDataTab({ filters }) {
  const { data, loading, error } = useQualityData(filters);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;
  if (!data) return null;

  // Grouper problèmes par entité
  const groupedProblems = {};
  if (data.problems) {
    data.problems.forEach((problem) => {
      if (!groupedProblems[problem.entity]) {
        groupedProblems[problem.entity] = [];
      }
      groupedProblems[problem.entity].push(problem);
    });
  }

  const entityCount = Object.keys(groupedProblems).length;

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

      {/* Liste des problèmes par entité */}
      {Object.entries(groupedProblems).map(([entity, problems]) => (
        <EntitySection key={entity} entity={entity} problems={problems} />
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
