/**
 * @fileoverview Sélecteur rapide de période temporelle avec plages prédéfinies
 * 
 * Permet de choisir entre périodes rapides (7j, 30j, etc.) ou plage personnalisée.
 * Affiche statistiques de filtrage et rappel de la sélection active.
 * 
 * @module components/common/QuickDateRangeSelector
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 */

import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Box, Flex, Text, Button, Badge, Separator, TextField } from "@radix-ui/themes";

/** Plages de dates prédéfinies avec labels */
const PERIODS = [
  { value: "all", label: "Toutes" },
  { value: "7days", label: "7 jours", days: 7 },
  { value: "30days", label: "30 jours", days: 30 },
  { value: "90days", label: "3 mois", days: 90 },
  { value: "6months", label: "6 mois", days: 180 },
  { value: "1year", label: "1 an", days: 365 }
];

/** Style du banneau de sélection */
const BANNER_STYLE = {
  background: "var(--blue-3)",
  borderRadius: "6px",
  borderLeft: "3px solid var(--blue-9)"
};

/** Locale pour formatage des dates */
const DATE_LOCALE = "fr-FR";

/**
 * Calcule la date de début selon la période sélectionnée
 * @param {string} range - Clé de période ('7days', '30days', etc.)
 * @returns {Object|null} Objet {start, end} ou null si 'all'
 */
const getDateRange = (range) => {
  if (range === "all") return null;

  const now = new Date();
  const end = new Date(now);
  const start = new Date(now);

  switch (range) {
    case "7days":
      start.setDate(now.getDate() - 7);
      break;
    case "30days":
      start.setDate(now.getDate() - 30);
      break;
    case "90days":
      start.setDate(now.getDate() - 90);
      break;
    case "6months":
      start.setMonth(now.getMonth() - 6);
      break;
    case "1year":
      start.setFullYear(now.getFullYear() - 1);
      break;
    default:
      return null;
  }

  return { start, end };
};

/**
 * Vérifie si plage personnalisée est complète
 * @param {string} customStart - Date début
 * @param {string} customEnd - Date fin
 * @returns {boolean} True si les deux dates sont fournies
 */
const isCustomRangeValid = (customStart, customEnd) => Boolean(customStart && customEnd);

/**
 * Pluralise un mot en fonction d'une quantité
 * @param {number} count - Nombre
 * @param {string} word - Mot à pluraliser
 * @returns {string} Texte au singulier ou pluriel
 */
const pluralize = (count, word) => `${count} ${word}${count > 1 ? "s" : ""}`;

/**
 * Rend le banneau de sélection approprié
 */
function renderSelectionBanner(customMode, dayCount, customStart, customEnd, hasCustom) {
  if (!customMode && dayCount) return <SelectionBanner type="days" value={dayCount} />;
  if (customMode && hasCustom) return <SelectionBanner type="custom" startDate={customStart} endDate={customEnd} />;
  return null;
}

/**
 * Hook de gestion de l'état et des callbacks du sélecteur de plages
 * @param {string} initialRange - Plage initialement sélectionnée
 * @param {Function} onFilterChange - Callback au changement
 * @returns {Object} État et handlers
 */
function useDateRangeState(initialRange, onFilterChange) {
  const [selected, setSelected] = useState(initialRange);
  const [customMode, setCustomMode] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    setSelected(initialRange);
  }, [initialRange]);

  return {
    selected,
    customMode,
    customStart,
    customEnd,
    handleQuickSelect: (value) => {
      setSelected(value);
      setCustomMode(false);
      setCustomStart("");
      setCustomEnd("");
      onFilterChange({ range: getDateRange(value), key: value });
    },
    handleCustomChange: (field, value) => {
      if (field === "start") setCustomStart(value);
      if (field === "end") setCustomEnd(value);
      setCustomMode(true);
      setSelected("custom");
    },
    applyCustomRange: () => {
      if (isCustomRangeValid(customStart, customEnd)) {
        setSelected("custom");
        onFilterChange({ range: { start: new Date(customStart), end: new Date(customEnd) }, key: "custom" });
      }
    }
  };
}

/**
 * Sélecteur rapide de période temporelle
 * @component
 * @param {Object} props
 * @param {Function} [props.onFilterChange=() => {}] - Callback au changement de plage
 * @param {string} [props.selectedRange="all"] - Plage initialement sélectionnée
 * @param {number} [props.totalItems=0] - Nombre total d'items
 * @param {number} [props.filteredItems=0] - Nombre d'items après filtre
 * @returns {JSX.Element} Box avec sélecteur et statistiques
 * @example
 * <QuickDateRangeSelector selectedRange="30days" totalItems={150} filteredItems={45} />
 */
function QuickDateRangeSelector({
  onFilterChange = () => {},
  selectedRange = "all",
  totalItems = 0,
  filteredItems = 0
}) {
  const state = useDateRangeState(selectedRange, onFilterChange);
  const selectedPeriod = PERIODS.find((p) => p.value === state.selected);
  const hasCustom = isCustomRangeValid(state.customStart, state.customEnd);

  return (
    <Box>
      <QuickSelectButtons periods={PERIODS} selected={state.selected} customMode={state.customMode} onSelect={state.handleQuickSelect} />
      <Separator size="4" mb="3" />
      <CustomRangeInputs customStart={state.customStart} customEnd={state.customEnd} onStartChange={(v) => state.handleCustomChange("start", v)} onEndChange={(v) => state.handleCustomChange("end", v)} onApply={state.applyCustomRange} isValid={hasCustom} />
      {renderSelectionBanner(state.customMode, selectedPeriod?.days, state.customStart, state.customEnd, hasCustom)}
      {totalItems > 0 && <FilterStats totalItems={totalItems} filteredItems={filteredItems} isFiltered={state.selected !== "all"} />}
    </Box>
  );
}

/**
 * Boutons de sélection rapide
 */
function QuickSelectButtons({ periods, selected, customMode, onSelect }) {
  return (
    <Flex gap="2" wrap="wrap" mb="3">
      {periods.map((p) => (
        <Button key={p.value} variant={selected === p.value && !customMode ? "solid" : "soft"} size="2" color={selected === p.value && !customMode ? "blue" : "gray"} onClick={() => onSelect(p.value)}>
          {p.label}
        </Button>
      ))}
    </Flex>
  );
}

QuickSelectButtons.propTypes = {
  periods: PropTypes.arrayOf(PropTypes.object).isRequired,
  selected: PropTypes.string.isRequired,
  customMode: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
};

/**
 * Champs de saisie de plage personnalisée
 */
function CustomRangeInputs({ customStart, customEnd, onStartChange, onEndChange, onApply, isValid }) {
  return (
    <Box mb="3">
      <Text size="2" weight="bold" mb="2" style={{ display: "block" }}>
        Période personnalisée
      </Text>
      <Flex gap="2" align="end" wrap="wrap">
        <Box style={{ flex: "1 1 120px" }}>
          <Text size="1" color="gray" style={{ display: "block", marginBottom: "4px" }}>
            Date début
          </Text>
          <TextField.Root type="date" value={customStart} onChange={(e) => onStartChange(e.target.value)} size="2" />
        </Box>
        <Box style={{ flex: "1 1 120px" }}>
          <Text size="1" color="gray" style={{ display: "block", marginBottom: "4px" }}>
            Date fin
          </Text>
          <TextField.Root type="date" value={customEnd} onChange={(e) => onEndChange(e.target.value)} size="2" />
        </Box>
        <Button size="2" onClick={onApply} disabled={!isValid} color="blue">Appliquer</Button>
      </Flex>
    </Box>
  );
}

CustomRangeInputs.propTypes = {
  customStart: PropTypes.string.isRequired,
  customEnd: PropTypes.string.isRequired,
  onStartChange: PropTypes.func.isRequired,
  onEndChange: PropTypes.func.isRequired,
  onApply: PropTypes.func.isRequired,
  isValid: PropTypes.bool.isRequired,
};

/**
 * Banneau de rappel de la sélection active
 */
function SelectionBanner({ type, value, startDate, endDate }) {
  const text = type === "days" ? `📅 Analyse sur les ${value} derniers jours` : `📅 Du ${new Date(startDate).toLocaleDateString(DATE_LOCALE)} au ${new Date(endDate).toLocaleDateString(DATE_LOCALE)}`;
  return (
    <Box p="2" style={BANNER_STYLE} mb="3">
      <Text size="2" weight="medium">{text}</Text>
    </Box>
  );
}

SelectionBanner.propTypes = {
  type: PropTypes.oneOf(["days", "custom"]).isRequired,
  value: PropTypes.number,
  startDate: PropTypes.string,
  endDate: PropTypes.string,
};

/**
 * Badges de statistiques du filtre
 */
function FilterStats({ totalItems, filteredItems, isFiltered }) {
  return (
    <Flex gap="2" wrap="wrap">
      <Badge color="blue" size="2">
        {pluralize(filteredItems, "élément")} affiché{filteredItems > 1 ? "s" : ""}
      </Badge>
      {isFiltered && totalItems > filteredItems && <Badge color="gray" size="2">{pluralize(totalItems - filteredItems, "élément")} filtré</Badge>}
    </Flex>
  );
}

FilterStats.propTypes = {
  totalItems: PropTypes.number.isRequired,
  filteredItems: PropTypes.number.isRequired,
  isFiltered: PropTypes.bool.isRequired,
};

QuickDateRangeSelector.propTypes = {
  onFilterChange: PropTypes.func,
  selectedRange: PropTypes.string,
  totalItems: PropTypes.number,
  filteredItems: PropTypes.number,
};

export default QuickDateRangeSelector;
