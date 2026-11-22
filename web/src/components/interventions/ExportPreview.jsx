/**
 * Résumé de la sélection (export, impression, archivage) dans un encadré : nombre de fiches
 * et période au format français. Le backend fournit count, max et over_limit ; son message
 * d'erreur est affiché tel quel.
 */

import PropTypes from 'prop-types';
import { Callout, Flex, Spinner, Text } from '@radix-ui/themes';
import { formatInterventionDate } from '@/lib/utils/interventionUtils';

// Premier jour sans l'année quand elle est la même que celle du dernier (« 01/11 au 22/11/2026 »)
export function formatPeriod(dateFrom, dateTo) {
  const from = formatInterventionDate(dateFrom);
  const to = formatInterventionDate(dateTo);
  const sameYear = from.slice(-4) === to.slice(-4);
  return `du ${sameYear ? from.slice(0, 5) : from} au ${to}`;
}

function previewMessage(preview, period) {
  if (preview.over_limit) {
    return { color: 'red', text: `Plus de ${preview.max} fiches : réduisez la période ou choisissez un équipement` };
  }
  if (preview.count === 0) return { color: 'gray', text: 'Aucune fiche sur cette période' };
  const noun = preview.count > 1 ? 'fiches fermées' : 'fiche fermée';
  return { color: 'green', text: `${preview.count} ${noun} ${period}` };
}

function SummaryBox({ color, children, role }) {
  return (
    <Callout.Root color={color} size="1" variant="surface" role={role} aria-live="polite">
      <Callout.Text>{children}</Callout.Text>
    </Callout.Root>
  );
}

SummaryBox.propTypes = {
  color: PropTypes.string.isRequired,
  children: PropTypes.node,
  role: PropTypes.string,
};

export default function ExportPreview({ preview, loading, error, dateFrom, dateTo }) {
  if (loading) {
    return (
      <SummaryBox color="gray" role="status">
        <Flex gap="2" align="center">
          <Spinner size="1" />
          <Text size="2">Calcul du nombre de fiches…</Text>
        </Flex>
      </SummaryBox>
    );
  }
  if (error) return <SummaryBox color="red" role="alert">{error}</SummaryBox>;
  if (!preview) return null;
  const { color, text } = previewMessage(preview, formatPeriod(dateFrom, dateTo));
  return <SummaryBox color={color} role="status"><Text weight="bold">{text}</Text></SummaryBox>;
}

ExportPreview.propTypes = {
  preview: PropTypes.shape({ count: PropTypes.number, max: PropTypes.number, over_limit: PropTypes.bool }),
  loading: PropTypes.bool,
  error: PropTypes.string,
  dateFrom: PropTypes.string,
  dateTo: PropTypes.string,
};
