/**
 * @fileoverview Ligne d'une demande à qualifier : code, équipement, début de description.
 * @module components/home/QualifyRequestRow
 */
import PropTypes from 'prop-types';
import { Badge, Text } from '@radix-ui/themes';
import QueueRow from '@/components/home/QueueRow';
import { ageInDays } from '@/hooks/home/requestQueue';

export default function QualifyRequestRow({ request, isSelected, onSelect }) {
  const eq = request.equipement;
  const subtitle = [request.description, `${ageInDays(request.created_at)} j`].filter(Boolean).join(', ');
  return (
    <QueueRow isSelected={isSelected} onSelect={onSelect} title={request.code || 'Demande'} subtitle={subtitle}>
      {eq && <Text size="1" color="gray">{[eq.code, eq.name].filter(Boolean).join(' - ')}</Text>}
      {request.constat_id && <Badge color="violet" variant="soft">Constat</Badge>}
    </QueueRow>
  );
}

QualifyRequestRow.propTypes = {
  request: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};
