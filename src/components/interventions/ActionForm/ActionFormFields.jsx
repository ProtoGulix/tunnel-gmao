/**
 * ActionFormFields - Sous-composant
 * Métadonnées : Temps, Date, Catégorie
 * Props structurées : { formState, handlers, metadata }
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text, TextField, Select, Badge } from '@radix-ui/themes';
import { Clock, Activity, Tag } from 'lucide-react';
import { getCategoryId, getCategoryCode, getCategoryName, getCategoryColor } from './actionFormUtils';

function ActionFormFields({ formState, handlers, metadata }) {
  const { time, date, category } = formState;
  const { handleTimeChange, handleDateChange, handleCategoryChange } = handlers;
  const { subcategories = [] } = metadata;

  return (
    <Flex gap="2" wrap="wrap">
      {/* Temps passé */}
      <Box style={{ flex: '1', minWidth: '100px' }}>
        <Flex align="center" gap="1" mb="1">
          <Clock size={14} color="var(--gray-9)" />
          <Text size="1" weight="bold">Temps</Text>
        </Flex>
        <TextField.Root
          type="number"
          step="0.25"
          min="0"
          placeholder="0.5"
          value={time}
          onChange={(e) => handleTimeChange(e.target.value)}
          style={{ backgroundColor: 'white' }}
        >
          <TextField.Slot side="right">
            <Text size="1" color="gray">h</Text>
          </TextField.Slot>
        </TextField.Root>
      </Box>

      {/* Date de l'action */}
      <Box style={{ flex: '1', minWidth: '100px' }}>
        <Flex align="center" gap="1" mb="1">
          <Activity size={14} color="var(--gray-9)" />
          <Text size="1" weight="bold">Date</Text>
        </Flex>
        <TextField.Root
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          style={{ backgroundColor: 'white' }}
        />
      </Box>

      {/* Catégorie / Type d'action */}
      <Box style={{ flex: '1', minWidth: '150px' }}>
        <Flex align="center" gap="1" mb="1">
          <Tag size={14} color="var(--gray-9)" />
          <Text size="1" weight="bold">Type</Text>
        </Flex>
        <Select.Root value={category} onValueChange={handleCategoryChange}>
          <Select.Trigger
            placeholder="Sélectionner..."
            style={{ backgroundColor: 'white', width: '100%' }}
          />
          <Select.Content>
            {subcategories.map(cat => (
              <Select.Item
                key={`cat-${getCategoryId(cat)}`}
                value={String(getCategoryId(cat))}
              >
                <Flex align="center" gap="2">
                  <Badge
                    variant="soft"
                    size="1"
                    style={{
                      backgroundColor: getCategoryColor(cat) || '#6b7280',
                      color: 'white'
                    }}
                  >
                    {getCategoryCode(cat)}
                  </Badge>
                  <Text size="2">{getCategoryName(cat)}</Text>
                </Flex>
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
      </Box>
    </Flex>
  );
}

ActionFormFields.displayName = 'ActionFormFields';

ActionFormFields.propTypes = {
  formState: PropTypes.shape({
    time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    date: PropTypes.string,
    category: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  handlers: PropTypes.shape({
    handleTimeChange: PropTypes.func.isRequired,
    handleDateChange: PropTypes.func.isRequired,
    handleCategoryChange: PropTypes.func.isRequired
  }).isRequired,
  metadata: PropTypes.shape({
    subcategories: PropTypes.array
  }).isRequired
};

export default ActionFormFields;
