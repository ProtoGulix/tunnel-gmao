/**
 * @fileoverview Affichage des informations de l'article
 * @module components/purchase/orders/TwinLinesValidationAlert/ArticleInfo
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text, Badge } from '@radix-ui/themes';
import { Package } from 'lucide-react';

/**
 * Affiche les informations de l'article concerné
 * @component
 * @param {Object} props
 * @param {string} props.name - Nom de l'article
 * @param {string|null} props.ref - Référence de l'article
 */
export default function ArticleInfo({ name, ref }) {
  return (
    <Box mb="3" p="2" style={{ backgroundColor: 'var(--gray-4)', borderRadius: '4px' }}>
      <Flex align="center" gap="2">
        <Package size={16} />
        <Text size="2" weight="bold">Article :</Text>
        <Text size="2" weight="medium">{name}</Text>
        {ref && (
          <Badge color="gray" variant="soft" size="1">{ref}</Badge>
        )}
      </Flex>
    </Box>
  );
}

ArticleInfo.propTypes = {
  name: PropTypes.string.isRequired,
  ref: PropTypes.string,
};
