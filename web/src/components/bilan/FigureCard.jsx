/**
 * @fileoverview Carte d'un chiffre clé du Bilan (onglets État et Audit) : libellé avec
 * définition au survol, valeur, détail court, badge de statut s'il y en a un, mini-courbe et
 * tendance. Hauteur régulière (ADR 0034, 0035).
 * @module components/bilan/FigureCard
 */

import PropTypes from 'prop-types';
import { Badge, Box, Flex, Text } from '@radix-ui/themes';
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, CheckCircle2, Info, XCircle } from 'lucide-react';
import InfoLabel from '@/components/ui/InfoLabel';
import Sparkline from '@/components/bilan/Sparkline';
import { trendView } from '@/hooks/bilan/figureNotes';

// Statut : icône et libellé, jamais la couleur seule
const STATUS = {
  ok: { color: 'green', Icon: CheckCircle2 },
  alert: { color: 'orange', Icon: AlertTriangle },
  critical: { color: 'red', Icon: XCircle },
  info: { color: 'gray', Icon: Info },
};

/** Niveau d'une couleur de statut venue de la configuration du service */
export function levelOfColor(color) {
  if (color === 'green') return 'ok';
  if (color === 'orange') return 'alert';
  if (color === 'red') return 'critical';
  return 'info';
}

function StatusBadge({ level, label }) {
  const { color, Icon } = STATUS[level];
  return (
    <Badge color={color} variant="soft" size="1">
      <Icon size={12} aria-hidden /> {label}
    </Badge>
  );
}
StatusBadge.propTypes = {
  level: PropTypes.oneOf(Object.keys(STATUS)).isRequired,
  label: PropTypes.string.isRequired,
};

const TREND_ICONS = { up: ArrowUpRight, stable: ArrowRight, down: ArrowDownRight };

// Tendance en gris : un fait, pas un jugement (le badge, s'il existe, porte le jugement)
function TrendMark({ trend }) {
  const view = trendView(trend);
  if (!view) return null;
  const Icon = TREND_ICONS[view.key];
  return (
    <Text size="1" color="gray" style={{ display: 'inline-flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}>
      <Icon size={12} aria-hidden /> {view.word}
    </Text>
  );
}
TrendMark.propTypes = { trend: PropTypes.string };

/**
 * @param {Object|null} status - { level: 'ok'|'alert'|'critical'|'info', label }
 * @param {Array<number|null>} series - série mensuelle ; omise ou d'un point : pas de courbe
 * @param {Function} seriesFormat - format des valeurs de la série (description accessible)
 * @param {string|null} [trend] - 'up', 'stable', 'down' (donné par l'API) ; sinon rien
 * @param {boolean} [compact] - sans emplacement de courbe (chiffres sans série)
 */
export default function FigureCard({ label, definition, value, detail, status, trend, series, seriesFormat, compact = false }) {
  return (
    <Flex
      direction="column" gap="1"
      style={{ border: '1px solid var(--gray-a5)', borderRadius: 'var(--radius-3)', padding: '10px 12px', minHeight: compact ? undefined : 124 }}
    >
      <InfoLabel label={label} definition={definition} color="gray" />
      <Flex align="center" justify="between" gap="2">
        <Text size="6" weight="bold">{value}</Text>
        {status && <StatusBadge level={status.level} label={status.label} />}
      </Flex>
      <Flex align="center" justify="between" gap="2" style={{ minHeight: 18 }}>
        <Text size="1" color="gray">{detail}</Text>
        <TrendMark trend={trend} />
      </Flex>
      {!compact && (
        <Box mt="auto" pt="1" style={{ height: 28 }}>
          {series && <Sparkline values={series} format={seriesFormat} />}
        </Box>
      )}
    </Flex>
  );
}
FigureCard.propTypes = {
  label: PropTypes.string.isRequired,
  definition: PropTypes.node.isRequired,
  value: PropTypes.string.isRequired,
  detail: PropTypes.string,
  status: PropTypes.shape({ level: PropTypes.string.isRequired, label: PropTypes.string.isRequired }),
  trend: PropTypes.string,
  series: PropTypes.arrayOf(PropTypes.number),
  seriesFormat: PropTypes.func,
  compact: PropTypes.bool,
};
