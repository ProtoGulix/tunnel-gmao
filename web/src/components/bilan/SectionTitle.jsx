/**
 * @fileoverview Titre de section de la page Bilan du service
 * @module components/bilan/SectionTitle
 */

import PropTypes from 'prop-types';
import { Text } from '@radix-ui/themes';

export default function SectionTitle({ children }) {
  return <Text as="div" size="4" weight="bold" mt="5" mb="3">{children}</Text>;
}
SectionTitle.propTypes = { children: PropTypes.node.isRequired };
