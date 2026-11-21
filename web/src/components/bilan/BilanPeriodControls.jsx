/**
 * @fileoverview Contrôles de période de l'en-tête du Bilan, au modèle de l'accueil : boutons
 * gris « soft » de taille 2, séparateur, libellé de la plage de dates (ADR 0033)
 * @module components/bilan/BilanPeriodControls
 */

import PropTypes from 'prop-types';
import { Button, Flex, Text } from '@radix-ui/themes';
import { formatDateRangeLabel } from '@/components/planning/planningUtils';
import { BILAN_PERIODS, periodStart, toDateString } from '@/hooks/bilan/bilanParams';

const SEPARATOR_STYLE = { width: 1, height: 20, background: 'var(--gray-5)', flexShrink: 0 };

/**
 * @param {number} months - période choisie, en mois calendaires
 * @param {Function} onChange - reçoit le nombre de mois choisi
 */
export default function BilanPeriodControls({ months, onChange }) {
  return (
    <Flex align="center" gap="2" wrap="wrap">
      <Flex gap="1" align="center" role="group" aria-label="Période">
        {BILAN_PERIODS.map((m) => (
          <Button
            key={m} size="2" variant="soft" color={m === months ? 'blue' : 'gray'}
            aria-pressed={m === months} onClick={() => onChange(m)}
          >
            {m} mois
          </Button>
        ))}
      </Flex>
      <div style={SEPARATOR_STYLE} />
      <Text size="2" weight="medium" style={{ whiteSpace: 'nowrap' }}>
        {formatDateRangeLabel(periodStart(months), toDateString(new Date()))}
      </Text>
    </Flex>
  );
}
BilanPeriodControls.propTypes = {
  months: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
};
