/**
 * @fileoverview Bouts communs aux cartes kanban de la vue direction technique
 * (lien vers l'intervention liée, formatage de date).
 * @module pages/home/requestCardShared
 */

import PropTypes from 'prop-types';
import { Badge, Flex, Text } from '@radix-ui/themes';
import { EntityCodeLink } from '@/components/shared/EntityCodeLink';

export function formatDay(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function InterventionLinkCell({ request }) {
  const iv = request.intervention;
  if (!iv) {
    return <Text size="1" color="gray">—</Text>;
  }
  return (
    <Flex align="center" gap="1">
      <EntityCodeLink type="intervention" id={iv.id} code={iv.code} size={1} />
      <Badge size="1" variant="soft" style={{ backgroundColor: (iv.status_color || '#888') + '22', color: iv.status_color || '#888' }}>
        {iv.status_label}
      </Badge>
    </Flex>
  );
}

InterventionLinkCell.propTypes = {
  request: PropTypes.shape({
    intervention: PropTypes.shape({
      id: PropTypes.string,
      code: PropTypes.string,
      status_label: PropTypes.string,
      status_color: PropTypes.string,
    }),
  }).isRequired,
};
