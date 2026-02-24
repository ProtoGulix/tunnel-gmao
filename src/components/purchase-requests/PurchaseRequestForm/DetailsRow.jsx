import PropTypes from 'prop-types';
import { Box, Flex, Text, Select } from '@radix-ui/themes';
import { UNIT_OPTIONS } from '@/config/units';

function DetailsRow({
  compact,
  quantity,
  onQuantityChange,
  unit,
  onUnitChange,
  urgency,
  onUrgencyChange,
  requestedBy,
  onRequestedByChange
}) {
  const labelMargin = compact ? '1' : '2';
  const inputHeight = '44px';

  return (
    <>
      <Flex gap='3' wrap='wrap' mt={compact ? '2' : undefined}>
        <Box style={{ flex: '0 0 140px', minWidth: '120px' }}>
          <Text size='2' weight='bold' mb={labelMargin} style={{ display: 'block' }}>
            Quantité
          </Text>
          <input
            type='number'
            min='1'
            value={quantity}
            onChange={(e) => onQuantityChange(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--gray-7)',
              fontSize: '14px',
              fontFamily: 'inherit',
              boxSizing: 'border-box',
              height: inputHeight
            }}
            inputMode='numeric'
            pattern='[0-9]*'
            aria-label='Quantité'
          />
        </Box>

        <Box style={{ flex: '0 0 120px', minWidth: '120px' }}>
          <Text size='2' weight='bold' mb={labelMargin} style={{ display: 'block' }}>
            Unité
          </Text>
          <Select.Root value={unit} onValueChange={onUnitChange}>
            <Select.Trigger aria-label='Unité' style={{ height: inputHeight }} />
            <Select.Content>
              {UNIT_OPTIONS.map(({ value, label }) => (
                <Select.Item key={value} value={value}>
                  {label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Box>

        <Box style={{ flex: '1', minWidth: '120px' }}>
          <Text size='2' weight='bold' mb={labelMargin} style={{ display: 'block' }}>
            Urgence
          </Text>
          <Select.Root value={urgency} onValueChange={onUrgencyChange}>
            <Select.Trigger aria-label='Urgence' style={{ height: inputHeight }} />
            <Select.Content>
              <Select.Item value='low'>Faible</Select.Item>
              <Select.Item value='normal'>Normal</Select.Item>
              <Select.Item value='urgent'>Urgent</Select.Item>
            </Select.Content>
          </Select.Root>
        </Box>
      </Flex>

      <Box mt={compact ? '2' : '3'}>
        <Text size='2' weight='bold' mb={labelMargin} style={{ display: 'block' }}>
          Demandeur (optionnel)
        </Text>
        <input
          type='text'
          placeholder='Votre nom'
          value={requestedBy}
          onChange={(e) => onRequestedByChange(e.target.value)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid var(--gray-7)',
            fontSize: '14px',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            height: inputHeight
          }}
          aria-label='Nom du demandeur'
        />
        <Text size='1' color='gray' mt='1' style={{ display: 'block' }}>
          Laissez vide pour utiliser &quot;Système&quot;
        </Text>
      </Box>
    </>
  );
}

DetailsRow.propTypes = {
  compact: PropTypes.bool,
  quantity: PropTypes.string.isRequired,
  onQuantityChange: PropTypes.func.isRequired,
  unit: PropTypes.string.isRequired,
  onUnitChange: PropTypes.func.isRequired,
  urgency: PropTypes.string.isRequired,
  onUrgencyChange: PropTypes.func.isRequired,
  requestedBy: PropTypes.string.isRequired,
  onRequestedByChange: PropTypes.func.isRequired
};

DetailsRow.defaultProps = {
  compact: false
};

export default DetailsRow;
