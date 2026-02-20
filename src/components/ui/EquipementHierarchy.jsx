/**
 * @fileoverview Affichage de l'arborescence équipement
 * @module EquipementHierarchy
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text, Link } from '@radix-ui/themes';
import { ChevronRight } from 'lucide-react';

/**
 * Affiche l'arborescence : équipement mère et enfants
 *
 * @component
 * @param {Object} props
 * @param {Object} [props.parentInfo] - Info équipement mère { id, code, name }
 * @param {Array} [props.childrenInfo] - Array d'enfants [{ id, code, name }]
 * @returns {JSX.Element|null} Hiérarchie ou null si aucun parent/enfant
 *
 * @example
 * <EquipementHierarchy
 *   parentInfo={{ id: '123', code: 'VLT', name: 'Site Villettes' }}
 *   childrenInfo={[{ id: '456', code: 'SCI011', name: 'Scie' }]}
 * />
 */
export default function EquipementHierarchy({ parentInfo = null, childrenInfo = [] }) {
  if (!parentInfo && childrenInfo.length === 0) {
    return null;
  }

  return (
    <Box>
      {parentInfo && (
        <Flex align="center" gap="2" mb="3">
          <Text size="2" color="gray">
            Équipement mère
          </Text>
          <ChevronRight size={16} />
          <Link href={`/equipements/${parentInfo.id}`}>
            <Text size="2" weight="medium">
              {parentInfo.code || '—'} – {parentInfo.name}
            </Text>
          </Link>
        </Flex>
      )}

      {childrenInfo.length > 0 && (
        <Box>
          <Text size="2" color="gray" mb="2">
            Sous-équipements ({childrenInfo.length})
          </Text>
          <Flex direction="column" gap="1">
            {childrenInfo.map((child) => (
              <Link key={child.id} href={`/equipements/${child.id}`}>
                <Flex align="center" gap="2">
                  <ChevronRight size={14} />
                  <Text size="2">
                    {child.code || '—'} – {child.name}
                  </Text>
                </Flex>
              </Link>
            ))}
          </Flex>
        </Box>
      )}
    </Box>
  );
}

EquipementHierarchy.propTypes = {
  parentInfo: PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string,
    name: PropTypes.string.isRequired,
  }),
  childrenInfo: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      code: PropTypes.string,
      name: PropTypes.string.isRequired,
    })
  ),
};
