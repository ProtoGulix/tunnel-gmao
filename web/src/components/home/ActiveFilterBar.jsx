/**
 * @fileoverview Filtre actif de l'accueil direction, avec son effacement.
 * @module components/home/ActiveFilterBar
 */
import PropTypes from 'prop-types';
import { Button, Flex, Text } from '@radix-ui/themes';
import { X } from 'lucide-react';

export default function ActiveFilterBar({ label, onClear }) {
  return (
    <Flex align="center" gap="3" px="4" pt="4">
      <Text size="2">Filtre : <Text weight="bold">{label}</Text></Text>
      <Button size="1" variant="soft" color="gray" onClick={onClear}><X size={12} aria-hidden /> Effacer</Button>
    </Flex>
  );
}

ActiveFilterBar.propTypes = { label: PropTypes.string.isRequired, onClear: PropTypes.func.isRequired };
