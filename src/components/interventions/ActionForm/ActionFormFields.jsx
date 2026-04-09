/**
 * ActionFormFields - Sous-composant
 * Plage horaire, Date, Catégorie sur une même ligne
 * Props structurées : { formState, handlers, metadata, timeRange, onTimeRangeChange }
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text, TextField, Select, Badge } from '@radix-ui/themes';
import { Activity, Clock, Tag } from 'lucide-react';
import TimeRangePicker from '@/components/planning/TimeRangePicker';
import LockedBadge from '@/components/ui/LockedBadge';
import { getCategoryCode, getCategoryName, getCategoryColor } from './actionFormUtils';

function computeDuration(start, end) {
  if (!start || !end) return '';
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  const totalMin = (eh * 60 + em) - (sh * 60 + sm);
  if (totalMin <= 0) return '';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

function ActionFormFields({ formState, handlers, metadata, timeRange, onTimeRangeChange, manualTimeSpent, onManualTimeSpentChange, lockedDate }) {
  const { date, category } = formState;
  const { handleDateChange, handleCategoryChange } = handlers;
  const { subcategories = [] } = metadata;

  const hasBounds = Boolean(timeRange?.start && timeRange?.end);
  const durationValue = hasBounds
    ? computeDuration(timeRange.start, timeRange.end)
    : (manualTimeSpent ?? '');

  return (
    <Flex gap="2" wrap="wrap" align="end">
      {/* Plage horaire */}
      <Box style={{ minWidth: '180px' }}>
        <Text size="1" weight="bold" mb="1" style={{ display: 'block' }}>
          Plage horaire
        </Text>
        <TimeRangePicker value={timeRange} onChange={onTimeRangeChange} />
      </Box>

      {/* Durée — calculée depuis les bornes ou saisie manuelle (ancien format) */}
      <Box style={{ minWidth: '80px', maxWidth: '90px' }}>
        <Flex align="center" gap="1" mb="1">
          <Clock size={14} color={hasBounds ? 'var(--gray-7)' : 'var(--gray-9)'} />
          <Text size="1" weight="bold" color={hasBounds ? 'gray' : undefined}>
            Durée {!hasBounds && <Text as="span" color="red">*</Text>}
          </Text>
        </Flex>
        <TextField.Root
          type={hasBounds ? 'text' : 'number'}
          value={durationValue}
          readOnly={hasBounds}
          onChange={!hasBounds ? (e) => onManualTimeSpentChange(e.target.value) : undefined}
          min={!hasBounds ? '0.25' : undefined}
          step={!hasBounds ? '0.25' : undefined}
          placeholder={!hasBounds ? '1.5' : ''}
          style={{
            backgroundColor: hasBounds ? 'var(--gray-3)' : 'white',
            color: hasBounds ? 'var(--gray-10)' : undefined,
            cursor: hasBounds ? 'default' : 'text',
          }}
        />
      </Box>

      {/* Date de l'action */}
      <Box style={{ flex: '1', minWidth: '120px' }}>
        <Flex align="center" gap="1" mb="1">
          <Activity size={14} color="var(--gray-9)" />
          <Text size="1" weight="bold">Date</Text>
        </Flex>
        {lockedDate
          ? <LockedBadge icon={Activity} label={date} />
          : (
            <TextField.Root
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              style={{ backgroundColor: 'white' }}
            />
          )
        }
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
            {subcategories &&
              subcategories.map((group, groupIndex) => {
                // Vérifier si c'est une catégorie avec sous-catégories imbriquées
                if (group.subcategories && Array.isArray(group.subcategories) && group.subcategories.length > 0) {
                  return (
                    <div
                      key={`category-${groupIndex}-${group.id || 'unknown'}`}
                      style={{
                        borderTop: groupIndex > 0 ? '1px solid var(--gray-4)' : 'none',
                      }}
                    >
                      {/* Titre de catégorie (non sélectionnable) */}
                      <div
                        style={{
                          padding: '8px 12px',
                          backgroundColor: 'var(--gray-3)',
                          fontWeight: 'bold',
                          fontSize: '12px',
                          color: 'var(--gray-11)',
                          pointerEvents: 'none',
                          borderLeft: `4px solid ${group.color || '#6b7280'}`,
                        }}
                      >
                        {group.name}
                      </div>

                      {/* Sous-catégories */}
                      {group.subcategories.map((subcat, subcatIndex) => (
                        <Select.Item
                          key={`subcat-${groupIndex}-${subcatIndex}-${subcat.id || 'unknown'}`}
                          value={String(subcat.id)}
                        >
                          <Flex align="center" gap="2" pl="2">
                            <Badge
                              variant="soft"
                              size="1"
                              style={{
                                backgroundColor: group.color || '#6b7280',
                                color: 'white',
                              }}
                            >
                              {subcat.code}
                            </Badge>
                            <Text size="2">{subcat.name}</Text>
                          </Flex>
                        </Select.Item>
                      ))}
                    </div>
                  );
                }

                // Fallback: afficher directement les sous-catégories si pas imbriquées
                return (
                  <Select.Item
                    key={`direct-subcat-${groupIndex}-${group.id || 'unknown'}`}
                    value={String(group.id)}
                  >
                    <Flex align="center" gap="2">
                      <Badge
                        variant="soft"
                        size="1"
                        style={{
                          backgroundColor: getCategoryColor(group) || '#6b7280',
                          color: 'white',
                        }}
                      >
                        {getCategoryCode(group)}
                      </Badge>
                      <Text size="2">{getCategoryName(group)}</Text>
                    </Flex>
                  </Select.Item>
                );
              })}
          </Select.Content>
        </Select.Root>
      </Box>
    </Flex>
  );
}

ActionFormFields.displayName = 'ActionFormFields';

ActionFormFields.propTypes = {
  formState: PropTypes.shape({
    date: PropTypes.string,
    lockedDate: PropTypes.bool,
    category: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  handlers: PropTypes.shape({
    handleDateChange: PropTypes.func.isRequired,
    handleCategoryChange: PropTypes.func.isRequired
  }).isRequired,
  metadata: PropTypes.shape({
    subcategories: PropTypes.array
  }).isRequired,
  timeRange: PropTypes.shape({
    start: PropTypes.string,
    end: PropTypes.string,
  }).isRequired,
  onTimeRangeChange: PropTypes.func.isRequired,
  manualTimeSpent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onManualTimeSpentChange: PropTypes.func,
};

export default ActionFormFields;
