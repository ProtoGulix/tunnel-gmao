import PropTypes from 'prop-types';
import { Badge } from '@radix-ui/themes';

/** Statut de demande : la couleur du référentiel est un hexadécimal, pas un nom Radix. */
export default function RequestStatusBadge({ label, color }) {
  const hex = color || '#6b7280';
  return (
    <Badge style={{ backgroundColor: hex + '22', color: hex }} variant="soft" radius="full">
      {label}
    </Badge>
  );
}

RequestStatusBadge.propTypes = { label: PropTypes.string.isRequired, color: PropTypes.string };
