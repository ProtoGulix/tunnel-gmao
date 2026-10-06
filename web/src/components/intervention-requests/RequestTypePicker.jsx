/**
 * @fileoverview Sélecteur du type de DI (standard / idée d'amélioration)
 * pour InterventionRequestForm.
 * @module components/intervention-requests/RequestTypePicker
 */

import PropTypes from 'prop-types';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { ClipboardList, Lightbulb } from 'lucide-react';

const REQUEST_TYPE_OPTIONS = [
  { value: 'standard', label: 'Demande d\'intervention', icon: ClipboardList },
  { value: 'amelioration', label: 'Idée d\'amélioration', icon: Lightbulb },
];

export default function RequestTypePicker({ value, onChange }) {
  return (
    <Box>
      <Text as="label" size="2" weight="bold" style={{ display: 'block', marginBottom: '0.5rem' }}>
        Type
      </Text>
      <Flex gap="2">
        {REQUEST_TYPE_OPTIONS.map(({ value: optValue, label, icon: Icon }) => (
          <Button
            key={optValue}
            type="button"
            variant={value === optValue ? 'solid' : 'soft'}
            color={value === optValue ? 'blue' : 'gray'}
            size="2"
            onClick={() => onChange(optValue)}
          >
            <Icon size={14} />
            {label}
          </Button>
        ))}
      </Flex>
    </Box>
  );
}

RequestTypePicker.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
