/**
 * Réponses d'un constat : libellé à gauche, valeur à droite, une ligne par question.
 * `after` ajoute, sous un séparateur, des lignes alignées sur la même grille (la demande qui
 * découle du constat).
 */
import PropTypes from 'prop-types';
import { Box, Grid, Separator, Text } from '@radix-ui/themes';
import { groupAnswers } from './constatRules';

function line(l) {
  return [
    <Text key={`l-${l.key}`} size="2" color="gray">{l.label}</Text>,
    <Box key={`v-${l.key}`}>{l.value}</Box>,
  ];
}

export default function ConstatAnswers({ answers, after = [] }) {
  const answerLines = groupAnswers(answers).map((g) => ({
    key: `q-${g.question ?? ''}`,
    label: g.question ?? '',
    value: <Text size="2" weight="medium">{g.choices.map((a) => a.label).join(', ')}</Text>,
  }));
  return (
    <Grid columns="minmax(140px, max-content) 1fr" gapX="4" gapY="2" align="center">
      {answerLines.map(line)}
      {after.length > 0 && <Separator key="sep" size="4" my="1" style={{ gridColumn: '1 / -1' }} />}
      {after.map(line)}
    </Grid>
  );
}

ConstatAnswers.propTypes = {
  answers: PropTypes.array,
  after: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string, label: PropTypes.string, value: PropTypes.node })),
};
