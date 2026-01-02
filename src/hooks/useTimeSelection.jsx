/**
 * @fileoverview Hook personnalisé pour gérer l'état de la sélection temporelle
 *
 * @module hooks/useTimeSelection
 * @requires react
 */

import { useEffect, useMemo, useState, useCallback } from "react";
import TimeSelectionControl from "@/components/layout/TimeSelectionControl";

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
 * Hook pour gérer l'état et le rendu de la sélection temporelle
 *
 * Gère la synchronisation avec les valeurs externes, les options personnalisées
 * et fournit directement le composant de contrôle prêt à l'emploi.
 *
 * @param {Object|null} timeSelection - Configuration temporelle
 * @param {boolean} [timeSelection.enabled] - Activer la sélection
 * @param {string} [timeSelection.value] - Valeur contrôlée
 * @param {string} [timeSelection.defaultValue] - Valeur par défaut
 * @param {Function} [timeSelection.onChange] - Callback changement
 * @param {Array<{value: string, label: string}>} [timeSelection.options] - Options personnalisées
 * @returns {{timeSelectionControl: JSX.Element|null}} Composant de contrôle ou null
 *
 * @example
 * const { timeSelectionControl } = useTimeSelection({
 *   enabled: true,
 *   onChange: (value) => console.log(value)
 * });
 */
export default function useTimeSelection(timeSelection) {
  // Options personnalisées ou par défaut
  const selectionOptions = useMemo(() => {
    if (Array.isArray(timeSelection?.options) && timeSelection.options.length > 0) {
      return timeSelection.options;
    }
    return DEFAULT_OPTIONS;
  }, [timeSelection?.options]);

  // Valeur initiale
  const initialValue = useMemo(() => {
    return (
      timeSelection?.value ||
      timeSelection?.defaultValue ||
      selectionOptions[0]?.value ||
      "all"
    );
  }, [timeSelection?.value, timeSelection?.defaultValue, selectionOptions]);

  // État local
  const [selectValue, setSelectValue] = useState(initialValue);

  // Synchronisation avec les valeurs externes
  useEffect(() => {
    const newValue =
      timeSelection?.value ||
      timeSelection?.defaultValue ||
      selectionOptions[0]?.value ||
      "all";
    setSelectValue(newValue);
  }, [timeSelection?.value, timeSelection?.defaultValue, selectionOptions]);

  // Handler de changement
  const handleSelectChange = useCallback(
    (value) => {
      setSelectValue(value);
      timeSelection?.onChange?.(value);
    },
    [timeSelection]
  );

  // Composant de contrôle (null si non activé)
  const timeSelectionControl = useMemo(() => {
    if (!timeSelection?.enabled) {
      return null;
    }

    return (
      <TimeSelectionControl
        timeSelection={timeSelection}
        selectValue={selectValue}
        onSelectChange={handleSelectChange}
      />
    );
  }, [timeSelection, selectValue, handleSelectChange]);

  return { timeSelectionControl };
}

