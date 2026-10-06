import PropTypes from 'prop-types';
import { Box, Flex, Text, Select, TextField } from '@radix-ui/themes';
import { UNIT_OPTIONS } from '@/config/units';

function DetailsRow({ quantity, onQuantityChange, unit, onUnitChange, urgency, onUrgencyChange, requestedBy, onRequestedByChange }) {
  return (
    <>
      <Flex gap="3" wrap="wrap">
        <Box style={{ flex: '0 0 140px', minWidth: '120px' }}>
          <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>Quantité</Text>
          <TextField.Root
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => onQuantityChange(e.target.value)}
            inputMode="numeric"
          />
        </Box>

        <Box style={{ flex: '0 0 120px', minWidth: '120px' }}>
          <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>Unité</Text>
          <Select.Root value={unit} onValueChange={onUnitChange}>
            <Select.Trigger style={{ width: '100%' }} />
            <Select.Content>
              {UNIT_OPTIONS.map(({ value, label }) => (
                <Select.Item key={value} value={value}>{label}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Box>

        <Box style={{ flex: '1', minWidth: '120px' }}>
          <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>Urgence</Text>
          <Select.Root value={urgency} onValueChange={onUrgencyChange}>
            <Select.Trigger style={{ width: '100%' }} />
            <Select.Content>
              <Select.Item value="normal">Normal</Select.Item>
              <Select.Item value="high">Élevée</Select.Item>
              <Select.Item value="critical">Critique</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>
      </Flex>

      <Box>
        <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>Demandeur</Text>
        <TextField.Root
          placeholder="Nom du demandeur"
          value={requestedBy}
          onChange={(e) => onRequestedByChange(e.target.value)}
        />
      </Box>
    </>
  );
}

DetailsRow.propTypes = {
  quantity: PropTypes.string.isRequired,
  onQuantityChange: PropTypes.func.isRequired,
  unit: PropTypes.string.isRequired,
  onUnitChange: PropTypes.func.isRequired,
  urgency: PropTypes.string.isRequired,
  onUrgencyChange: PropTypes.func.isRequired,
  requestedBy: PropTypes.string.isRequired,
  onRequestedByChange: PropTypes.func.isRequired,
};

export default DetailsRow;
