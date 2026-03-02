/**
 * @fileoverview Mise en page deux panneaux — liste à gauche, détail à droite
 * @module components/ui/TwoPanelLayout
 */

import PropTypes from 'prop-types';
import { Box, Flex, Separator } from '@radix-ui/themes';

/**
 * Disposition deux colonnes : panneau gauche fixe + panneau droit flexible.
 * Deux variantes disponibles selon le besoin de la mise en page.
 *
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.left - Contenu du panneau gauche (liste, navigation)
 * @param {React.ReactNode} [props.right] - Contenu du panneau droit. Si falsy, affiche emptyState
 * @param {React.ReactNode} [props.emptyState] - Affiché quand right est null/undefined
 * @param {boolean} [props.separator=true] - Affiche le séparateur vertical entre les panneaux
 * @param {'fixed-sidebar'|'proportional'} [props.variant='fixed-sidebar'] - Variante de mise en page
 * @param {number} [props.leftWidth=320] - Largeur fixe en px du panneau gauche (fixed-sidebar uniquement)
 * @returns {JSX.Element}
 *
 * @example
 * // Panneau gauche fixe avec état vide (ex: StockTemplatesTab)
 * <TwoPanelLayout
 *   left={<TemplatesList ... />}
 *   right={selected ? <TemplateDetail ... /> : null}
 *   emptyState={<EmptyState icon={...} title="..." description="..." />}
 * />
 *
 * @example
 * // Panneaux proportionnels sans séparateur (ex: StockFamiliesTab)
 * <TwoPanelLayout
 *   variant="proportional"
 *   separator={false}
 *   left={<FamiliesTable ... />}
 *   right={selected ? <FamilyDetail ... /> : null}
 * />
 */
export default function TwoPanelLayout({
  left,
  right,
  emptyState,
  separator = true,
  variant = 'fixed-sidebar',
  leftWidth = 320,
}) {
  const leftStyle =
    variant === 'fixed-sidebar'
      ? { width: leftWidth, flexShrink: 0 }
      : { flex: 1 };

  const rightStyle =
    variant === 'fixed-sidebar'
      ? { flex: 1, minWidth: 0 }
      : { flex: 2 };

  return (
    <Flex gap="4" direction={{ initial: 'column', md: 'row' }} align="start" mt="4">
      <Box style={leftStyle}>
        {left}
      </Box>

      {separator && <Separator orientation="vertical" style={{ alignSelf: 'stretch' }} />}

      <Box style={rightStyle}>
        {right ?? (emptyState ? <Box pt="4">{emptyState}</Box> : null)}
      </Box>
    </Flex>
  );
}

TwoPanelLayout.propTypes = {
  left: PropTypes.node.isRequired,
  right: PropTypes.node,
  emptyState: PropTypes.node,
  separator: PropTypes.bool,
  variant: PropTypes.oneOf(['fixed-sidebar', 'proportional']),
  leftWidth: PropTypes.number,
};
