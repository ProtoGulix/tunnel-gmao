/**
 * @fileoverview Barre empilée compacte : un segment par catégorie, libellé, heures et part écrits dans le segment
 * @module components/bilan/StackedBar
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text } from '@radix-ui/themes';
import InfoLabel from '@/components/ui/InfoLabel';
import { segmentDisplay, stackShares } from '@/hooks/bilan/miniSeries';
import { formatHours, formatPct } from '@/hooks/organisation/organisationFormat';

// Texte blanc sur la couleur du segment, avec une ombre légère pour rester lisible sur les teintes claires
const SEGMENT_TEXT = { color: 'white', textShadow: '0 1px 2px rgba(0, 0, 0, 0.45)', lineHeight: 1.25 };

// Détail complet en infobulle et pour les lecteurs d'écran, même quand le segment est trop étroit
function Segment({ part, segment, formatValue }) {
  const detail = `${segment.label} : ${formatValue(part.value)} (${formatPct(part.share)})`;
  const display = segmentDisplay(part.share);
  return (
    <Flex
      direction="column" justify="center" title={detail} aria-label={detail} role="img"
      style={{
        width: `${part.share}%`, background: segment.color, padding: '0 6px', overflow: 'hidden',
        borderRight: '2px solid var(--color-panel-solid)', whiteSpace: 'nowrap',
      }}
    >
      {display === 'full' && (
        <>
          <Text size="1" weight="bold" style={SEGMENT_TEXT}>{segment.label}</Text>
          <Text size="1" style={SEGMENT_TEXT}>{formatValue(part.value)} · {formatPct(part.share)}</Text>
        </>
      )}
      {display === 'share' && <Text size="1" weight="bold" style={SEGMENT_TEXT}>{formatPct(part.share)}</Text>}
    </Flex>
  );
}
Segment.propTypes = {
  part: PropTypes.shape({ value: PropTypes.number.isRequired, share: PropTypes.number.isRequired }).isRequired,
  segment: PropTypes.shape({ label: PropTypes.string.isRequired, color: PropTypes.string.isRequired }).isRequired,
  formatValue: PropTypes.func.isRequired,
};

/**
 * @param {string} title - Titre de la barre
 * @param {React.ReactNode} definition - Texte de l'infobulle du titre
 * @param {Array<{key: string, label: string, color: string, value: number}>} segments
 * @param {number} total - Total de référence (heures par défaut)
 * @param {Function} [formatValue] - format d'une valeur (heures par défaut)
 * @param {string} [totalLabel] - texte du total (« Total : » et heures par défaut)
 */
export default function StackedBar({ title, definition, segments, total, formatValue = formatHours, totalLabel }) {
  const parts = stackShares(segments, total);
  return (
    <Box mb="3">
      <Flex align="baseline" gap="2" mb="1">
        <InfoLabel label={title} definition={definition} size="2" weight="bold" />
        <Text size="1" color="gray">{totalLabel ?? `Total : ${formatHours(total)}`}</Text>
      </Flex>
      <Flex style={{ height: 40, borderRadius: 'var(--radius-2)', overflow: 'hidden', background: 'var(--gray-a4)' }}>
        {parts.map((p, i) => p.share > 0 && <Segment key={p.key} part={p} segment={segments[i]} formatValue={formatValue} />)}
      </Flex>
    </Box>
  );
}
StackedBar.propTypes = {
  title: PropTypes.string.isRequired,
  definition: PropTypes.node.isRequired,
  segments: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired, label: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired, value: PropTypes.number,
  })).isRequired,
  total: PropTypes.number.isRequired,
  formatValue: PropTypes.func,
  totalLabel: PropTypes.string,
};
