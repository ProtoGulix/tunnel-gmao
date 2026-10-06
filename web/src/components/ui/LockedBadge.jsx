/**
 * Affiche un champ verrouillé (valeur fixée par le contexte parent).
 * Pattern partagé : fond gray-2, icône Lock amber + icône contexte, badge "fixé" amber.
 *
 * Usage :
 *   <LockedBadge icon={MapPin} label="ETU208 — Etuve BCL" />
 *   <LockedBadge icon={Building2} label="Fournisseur ACME" sublabel="Réf. FRN-001" />
 */
import PropTypes from 'prop-types';
import { Badge, Box, Flex, Text } from '@radix-ui/themes';
import { Lock } from 'lucide-react';

export default function LockedBadge({ icon: Icon, label, sublabel }) {
  return (
    <Flex align="center" gap="2" p="2" style={{
      background: 'var(--gray-2)',
      borderRadius: 'var(--radius-2)',
      border: '1px solid var(--gray-5)',
    }}>
      <Lock size={14} color="var(--amber-9)" />
      {Icon && <Icon size={14} color="var(--gray-9)" />}
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Text size="2" weight="medium">{label}</Text>
        {sublabel && <Text size="1" color="gray" style={{ display: 'block' }}>{sublabel}</Text>}
      </Box>
      <Badge size="1" color="amber" variant="soft">fixé</Badge>
    </Flex>
  );
}

LockedBadge.propTypes = {
  icon: PropTypes.elementType,
  label: PropTypes.string.isRequired,
  sublabel: PropTypes.string,
};
