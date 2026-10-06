/**
 * Affichage générique d'un diff old_value → new_value d'une entrée audit_log.
 * Extrait de AdminAuditLogSection.jsx pour être réutilisable (ex: onglets Historique).
 * @module components/ui/AuditValueDiff
 */
import { Flex, Text } from '@radix-ui/themes';
import PropTypes from 'prop-types';

function serializeDiffEntry(val) {
  if (val === null || val === undefined) return '—';
  if (typeof val !== 'object') return String(val);
  // Objet utilisateur hydraté
  if (val.initials || val.first_name) {
    return val.initials ?? [val.first_name, val.last_name].filter(Boolean).join(' ') ?? val.id ?? '?';
  }
  // Objet générique : join des valeurs primitives
  return Object.values(val)
    .filter((v) => v !== null && typeof v !== 'object')
    .join(', ') || JSON.stringify(val);
}

function serializeDiff(diffObj) {
  if (!diffObj) return null;
  return Object.values(diffObj).map(serializeDiffEntry).join(', ') || null;
}

export default function AuditValueDiff({ oldValue, newValue }) {
  if (!oldValue && !newValue) return <Text size="1" color="gray">—</Text>;

  const oldStr = serializeDiff(oldValue);
  const newStr = serializeDiff(newValue);

  if (!oldStr) return <Text size="1" color="green">{newStr}</Text>;
  if (!newStr) return <Text size="1" color="red" style={{ textDecoration: 'line-through' }}>{oldStr}</Text>;

  return (
    <Flex align="center" gap="1" wrap="wrap">
      <Text size="1" color="gray" style={{ textDecoration: 'line-through', opacity: 0.6 }}>{oldStr}</Text>
      <Text size="1" color="gray">→</Text>
      <Text size="1" color="blue">{newStr}</Text>
    </Flex>
  );
}

AuditValueDiff.propTypes = {
  oldValue: PropTypes.object,
  newValue: PropTypes.object,
};
