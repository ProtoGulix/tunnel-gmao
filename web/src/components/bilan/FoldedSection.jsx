/**
 * @fileoverview Section repliée par défaut, titre accompagné d'une définition au survol (ADR 0034)
 * @module components/bilan/FoldedSection
 */

import PropTypes from 'prop-types';
import { Box } from '@radix-ui/themes';
import InfoLabel from '@/components/ui/InfoLabel';

export default function FoldedSection({ title, definition, children }) {
  return (
    <Box asChild mt="3">
      <details>
        <summary style={{ cursor: 'pointer' }}>
          <InfoLabel label={title} definition={definition} size="2" weight="bold" />
        </summary>
        <Box mt="2">{children}</Box>
      </details>
    </Box>
  );
}
FoldedSection.propTypes = {
  title: PropTypes.string.isRequired,
  definition: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
};
