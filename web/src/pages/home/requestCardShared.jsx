/**
 * @fileoverview Bouts communs aux cartes kanban de la vue direction technique
 * (lien vers l'intervention liée, formatage de date).
 * @module pages/home/requestCardShared
 */

import PropTypes from 'prop-types';
import { Badge, Flex, Text } from '@radix-ui/themes';

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
    <a href={`/intervention/${iv.id}`} style={{ textDecoration: 'none' }}>
      <Flex align="center" gap="1">
        <Text size="1" style={{ fontFamily: 'monospace' }}>{iv.code}</Text>
        <Badge size="1" variant="soft" style={{ backgroundColor: (iv.status_color || '#888') + '22', color: iv.status_color || '#888' }}>
          {iv.status_label}
        </Badge>
      </Flex>
    </a>
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
