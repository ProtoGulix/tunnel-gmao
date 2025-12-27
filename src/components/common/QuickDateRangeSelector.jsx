import DateRangeFilter from "@/components/common/DateRangeFilter";
import PropTypes from "prop-types";

/**
 * Wrapper de compatibilité vers DateRangeFilter (mode complet)
 * Conserve l'API existante et délègue au composant unifié
 */
export default function QuickDateRangeSelector({ onFilterChange, selectedRange = "all", totalItems = 0, filteredItems = 0 }) {
  return (
    <DateRangeFilter
      mode="full"
      selectedRange={selectedRange}
      onFilterChange={onFilterChange}
      totalItems={totalItems}
      filteredItems={filteredItems}
    />
  );
}

QuickDateRangeSelector.propTypes = {
  onFilterChange: PropTypes.func,
  selectedRange: PropTypes.string,
  totalItems: PropTypes.number,
  filteredItems: PropTypes.number,
};
import { useEffect, useState } from "react";
import { Box, Flex, Text, Button, Badge, Separator, TextField } from "@radix-ui/themes";

/**
 * Sélecteur rapide de période temporelle
 * Permet de choisir une plage de dates prédéfinie ou personnalisée
 */
export default function QuickDateRangeSelector({ 
  onFilterChange = () => {},
  selectedRange = "all",
  totalItems = 0,
  filteredItems = 0
}) {
  const [selected, setSelected] = useState(selectedRange);
  const [customMode, setCustomMode] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    setSelected(selectedRange);
  }, [selectedRange]);

  /**
   * Calcule la date de début selon la période sélectionnée
   */
  const getDateRange = (range) => {
    const now = new Date();
    const end = new Date(now);
    let start = new Date(now);

    switch (range) {
      case '7days':
        start.setDate(now.getDate() - 7);
        break;
      case '30days':
        start.setDate(now.getDate() - 30);
        break;
      case '90days':
        start.setDate(now.getDate() - 90);
        break;
      case '6months':
        start.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        start.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
      default:
        return null;
    }

    return { start, end };
  };

  /**
   * Gère le changement de période rapide
   */
  const handleQuickSelect = (value) => {
    setSelected(value);
    setCustomMode(false);
    setCustomStart('');
    setCustomEnd('');
    const range = getDateRange(value);
    onFilterChange({ range, key: value });
  };

  /**
   * Applique la période personnalisée
   */
  const applyCustomRange = () => {
    if (customStart && customEnd) {
      setCustomMode(true);
      setSelected('custom');
      const range = {
        start: new Date(customStart),
        end: new Date(customEnd)
      };
      onFilterChange({ range, key: 'custom' });
    }
  };

  const periods = [
    { value: 'all', label: 'Toutes' },
    { value: '7days', label: '7 jours', days: 7 },
    { value: '30days', label: '30 jours', days: 30 },
    { value: '90days', label: '3 mois', days: 90 },
    { value: '6months', label: '6 mois', days: 180 },
    { value: '1year', label: '1 an', days: 365 }
  ];

  const selectedPeriod = periods.find(p => p.value === selected);
  const dayCount = selectedPeriod?.days;

  return (
    <Box>
      {/* Sélection rapide */}
      <Flex gap="2" wrap="wrap" mb="3">
        {periods.map(period => (
          <Button
            key={period.value}
            variant={selected === period.value && !customMode ? 'solid' : 'soft'}
            size="2"
            color={selected === period.value && !customMode ? 'blue' : 'gray'}
            onClick={() => handleQuickSelect(period.value)}
          >
            {period.label}
          </Button>
        ))}
      </Flex>

      <Separator size="4" mb="3" />

      {/* Période personnalisée */}
      <Box mb="3">
        <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>
          Période personnalisée
        </Text>
        <Flex gap="2" align="end" wrap="wrap">
          <Box style={{ flex: '1 1 120px' }}>
            <Text size="1" color="gray" style={{ display: 'block', marginBottom: '4px' }}>
              Date début
            </Text>
            <TextField.Root
              type="date"
              value={customStart}
              onChange={(e) => {
                setCustomStart(e.target.value);
                setCustomMode(true);
                setSelected('custom');
              }}
              size="2"
            />
          </Box>
          <Box style={{ flex: '1 1 120px' }}>
            <Text size="1" color="gray" style={{ display: 'block', marginBottom: '4px' }}>
              Date fin
            </Text>
            <TextField.Root
              type="date"
              value={customEnd}
              onChange={(e) => {
                setCustomEnd(e.target.value);
                setCustomMode(true);
                setSelected('custom');
              }}
              size="2"
            />
          </Box>
          <Button
            size="2"
            onClick={applyCustomRange}
            disabled={!customStart || !customEnd}
            color="blue"
          >
            Appliquer
          </Button>
        </Flex>
      </Box>

      {/* Rappel de la sélection */}
      {!customMode && dayCount && (
        <Box 
          p="2" 
          style={{ 
            background: 'var(--blue-3)', 
            borderRadius: '6px',
            borderLeft: '3px solid var(--blue-9)'
          }}
          mb="3"
        >
          <Text size="2" weight="medium">
            📅 Analyse sur les <strong>{dayCount} derniers jours</strong>
          </Text>
        </Box>
      )}

      {customMode && customStart && customEnd && (
        <Box 
          p="2" 
          style={{ 
            background: 'var(--blue-3)', 
            borderRadius: '6px',
            borderLeft: '3px solid var(--blue-9)'
          }}
          mb="3"
        >
          <Text size="2" weight="medium">
            📅 Du <strong>{new Date(customStart).toLocaleDateString('fr-FR')}</strong> au <strong>{new Date(customEnd).toLocaleDateString('fr-FR')}</strong>
          </Text>
        </Box>
      )}

      {/* Statistiques du filtre */}
      {totalItems > 0 && (
        <Flex gap="2" wrap="wrap">
          <Badge color="blue" size="2">
            {filteredItems} élément{filteredItems > 1 ? 's' : ''} affiché{filteredItems > 1 ? 's' : ''}
          </Badge>
          {selected !== 'all' && totalItems > filteredItems && (
            <Badge color="gray" size="2">
              {totalItems - filteredItems} filtré{totalItems - filteredItems > 1 ? 's' : ''}
            </Badge>
          )}
        </Flex>
      )}
    </Box>
  );
}
