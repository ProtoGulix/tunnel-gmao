/**
 * @fileoverview En-tete d'un fournisseur (nom, code, contacts, statut)
 * @module components/suppliers/SupplierInfo
 */

import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Text } from '@radix-ui/themes';
import { Edit2 } from 'lucide-react';

export default function SupplierInfo({ supplier, onEdit }) {
  const contacts = [supplier.contact_name, supplier.email, supplier.phone].filter(Boolean);
  return (
    <Flex justify="between" align="start">
      <Box>
        <Flex align="baseline" gap="2">
          <Text size="4" weight="bold">{supplier.name}</Text>
          {supplier.code && <Text size="2" color="gray">[{supplier.code}]</Text>}
        </Flex>
        {contacts.length > 0 && (
          <Flex gap="3" mt="2" wrap="wrap">
            {contacts.map((c) => <Text key={c} size="2" color="gray">{c}</Text>)}
          </Flex>
        )}
        {supplier.address && <Text size="2" color="gray" mt="1" style={{ display: 'block' }}>{supplier.address}</Text>}
        {supplier.notes && <Text size="2" color="gray" mt="1" style={{ fontStyle: 'italic', display: 'block' }}>{supplier.notes}</Text>}
      </Box>
      <Flex gap="2" align="center">
        <Badge color={supplier.is_active ? 'green' : 'gray'} variant="soft">
          {supplier.is_active ? 'Actif' : 'Inactif'}
        </Badge>
        {onEdit && (
          <Button size="2" variant="soft" color="gray" onClick={onEdit}>
            <Edit2 size={14} /> Modifier
          </Button>
        )}
      </Flex>
    </Flex>
  );
}

SupplierInfo.propTypes = {
  supplier: PropTypes.shape({
    name: PropTypes.string.isRequired,
    code: PropTypes.string,
    contact_name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    address: PropTypes.string,
    notes: PropTypes.string,
    is_active: PropTypes.bool,
  }).isRequired,
  onEdit: PropTypes.func,
};
