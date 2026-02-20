/**
 * @fileoverview Contrôle de sélection temporelle pour PageHeader
 *
 * @module components/layout/TimeSelectionControl
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import { useMemo } from "react";
import PropTypes from "prop-types";
import { Flex, Select } from "@radix-ui/themes";
import { CalendarDays } from "lucide-react";
import DateRangeFilter from "@/components/common/DateRangeFilter";

/** Options par défaut de sélection temporelle */
const DEFAULT_OPTIONS = [
  { value: "7days", label: "7 derniers jours" },
  { value: "30days", label: "30 derniers jours" },
  { value: "90days", label: "3 derniers mois" },
  { value: "6months", label: "6 derniers mois" },
  { value: "1year", label: "1 an" },
  { value: "all", label: "Toutes les données" },
];

/**
 * Contrôle de sélection temporelle (Select ou DateRangeFilter)
 * 
 * Affiche soit un Select avec périodes prédéfinies, soit un DateRangeFilter
 * en mode popover selon la configuration.
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.timeSelection - Configuration temporelle
 * @param {string} [props.timeSelection.mode='select'] - Mode d'affichage ('select' ou 'popover')
 * @param {string} [props.timeSelection.component] - Composant à utiliser ('daterange' pour DateRangeFilter)
 * @param {string} [props.timeSelection.value] - Valeur sélectionnée
 * @param {Function} [props.timeSelection.onChange] - Callback changement de sélection
 * @param {Function} [props.timeSelection.onFilterChange] - Callback filtre date range
 * @param {Array<{value: string, label: string}>} [props.timeSelection.options] - Options personnalisées
 * @param {string} props.selectValue - Valeur courante du select
 * @param {Function} props.onSelectChange - Callback changement select
 * @returns {JSX.Element|null} Contrôle de sélection ou null
 * 
 * @example
 * // Select simple
 * <TimeSelectionControl
 *   timeSelection={{ enabled: true, mode: 'select', onChange: handleChange }}
 *   selectValue="7days"
 *   onSelectChange={setSelectValue}
 * />
 * 
 * @example
 * // DateRangeFilter en popover
 * <TimeSelectionControl
 *   timeSelection={{
 *     enabled: true,
 *     mode: 'popover',
 *     component: 'daterange',
 *     onFilterChange: handleFilterChange
 *   }}
 *   selectValue=""
 *   onSelectChange={() => {}}
 * />
 */
export default function TimeSelectionControl(props) {
  const { timeSelection, selectValue, onSelectChange } = props;

  const options = useMemo(() => {
    if (Array.isArray(timeSelection?.options) && timeSelection.options.length > 0) {
      return timeSelection.options;
    }
    return DEFAULT_OPTIONS;
  }, [timeSelection?.options]);

  // Mode popover avec DateRangeFilter
  if (timeSelection?.mode === "popover" && timeSelection?.component === "daterange") {
    return (
      <DateRangeFilter
        mode="compact"
        onFilterChange={timeSelection.onFilterChange}
      />
    );
  }

  // Mode select standard
  return (
    <Flex align="center" gap="1" style={{ minWidth: "220px" }}>
      <CalendarDays size={18} aria-hidden="true" />
      <Select.Root value={selectValue} onValueChange={onSelectChange} size="2">
        <Select.Trigger
          style={{
            minWidth: "150px",
            borderRadius: "999px",
          }}
          aria-label="Sélectionner une période"
        />
        <Select.Content>
          {options.map((option) => (
            <Select.Item key={option.value} value={option.value}>
              {option.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}

TimeSelectionControl.propTypes = {
  timeSelection: PropTypes.shape({
    enabled: PropTypes.bool,
    mode: PropTypes.oneOf(["select", "popover"]),
    component: PropTypes.string,
    value: PropTypes.string,
    onChange: PropTypes.func,
    onFilterChange: PropTypes.func,
    options: PropTypes.arrayOf(
      PropTypes.shape({
        value: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
      })
    ),
  }).isRequired,
  selectValue: PropTypes.string.isRequired,
  onSelectChange: PropTypes.func.isRequired,
};
