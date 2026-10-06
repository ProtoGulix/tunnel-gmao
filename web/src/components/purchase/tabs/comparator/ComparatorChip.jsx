/**
 * Bouton de retrait partagé (croix) — utilisé par ComparatorTableHeader
 * sur chaque colonne panier du tableau comparateur.
 * @module components/purchase/tabs/comparator/ComparatorChip
 */
import { Box } from '@radix-ui/themes';
import { X } from 'lucide-react';
import PropTypes from 'prop-types';

export function RemoveButton({ orderNumber, onRemove }) {
  return (
    <Box
      role="button" tabIndex={0}
      onClick={(e) => { e.stopPropagation(); onRemove(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onRemove(); } }}
      style={{ cursor: 'pointer', display: 'flex', opacity: 0.6 }}
      aria-label={`Retirer ${orderNumber} de la comparaison`}
    >
      <X size={12} />
    </Box>
  );
}
RemoveButton.propTypes = { orderNumber: PropTypes.string.isRequired, onRemove: PropTypes.func.isRequired };
