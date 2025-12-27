import { useEffect, useState, useCallback, useMemo } from "react";
import { Box, Flex, Text, Button, Badge, Separator, TextField, Popover } from "@radix-ui/themes";
import { CalendarDays } from "lucide-react";
import PropTypes from "prop-types";

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📅 DateRangeFilter.jsx - Composant unifié de sélection de plage de dates
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Composant polyvalent pour filtrage temporel avec 2 modes d'affichage :
 * - Mode "compact" : Boutons rapides + popover dates custom (idéal headers/toolbars)
 * - Mode "full" : Affichage inline complet avec stats et rappels visuels
 * 
 * ✅ Implémenté :
 * - Deux modes responsive (compact/full) avec UI adaptée
 * - Périodes rapides configurables (7j/30j/90j/6mois/1an/all)
 * - Dates personnalisées avec popover (compact) ou inline (full)
 * - API callback unifiée : { range: {start, end} | null, key: string }
 * - Rappels visuels : badge de période, compteurs filtrés/total
 * - PropTypes complets avec valeurs par défaut
 * - Support state sync bidirectionnel (selectedRange prop → state)
 * - useCallback et useMemo pour optimisation performances
 * 
 * 🎯 Usages :
 * - PageHeader : mode="compact" (via wrapper HeaderDateRangeFilter)
 * - QuickDateRangeSelector : mode="full" (wrapper de compatibilité)
 * - ActionsPage : filtrage temporel des actions
 * 
 * 📋 TODO : Améliorations futures
 * - [ ] Présets sauvegardés : permettre utilisateur de créer ses propres périodes favorites
 * - [ ] Comparaison périodes : afficher delta vs période précédente (▲ +15%)
 * - [ ] Validation dates : empêcher dates futures, start > end, plages > 2 ans
 * - [ ] Export iCal : générer fichier .ics pour intégration calendrier externe
 * - [ ] Keyboard shortcuts : Ctrl+1-7 pour sélection rapide périodes
 * - [ ] Historique filtres : breadcrumb des 5 derniers filtres appliqués
 * - [ ] Mode "relative" : "il y a X jours/semaines/mois" au lieu de dates absolues
 * - [ ] Animation transitions : smooth fade entre sélections de périodes
 * - [ ] Accessibilité ARIA : labels descriptifs sur popover et dates custom
 * - [ ] Tests unitaires : Jest + React Testing Library pour les 2 modes
 * - [ ] Storybook stories : documentation interactive avec tous les cas d'usage
 * - [ ] Internationalisation : support multi-langues (en/fr/es/de)
 * 
 * @module components/common/DateRangeFilter
 * @requires @radix-ui/themes
 * @requires lucide-react
 * @see PageHeader.jsx - Utilise mode compact pour filtrage header
 * @see ActionsPage.jsx - Intégration avec filtrage d'actions
 */

/**
 * Composant unifié de sélection de plage de dates
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {string} [props.mode='compact'] - Mode d'affichage : "compact" (popover) | "full" (inline)
 * @param {string} [props.selectedRange='all'] - Période sélectionnée par défaut
 * @param {Function} [props.onFilterChange] - Callback appelé lors du changement : ({ range, key }) => void
 * @param {Array} [props.periods] - Liste des périodes rapides configurables
 * @param {number} [props.totalItems=0] - Nombre total d'éléments (pour stats en mode full)
 * @param {number} [props.filteredItems=0] - Nombre d'éléments filtrés (pour stats en mode full)
 * @param {string} [props.buttonSize] - Taille des boutons : "1" | "2" | "3" (auto selon mode si omis)
 * 
 * @returns {JSX.Element} Interface de sélection de dates (compact ou full)
 * 
 * @example
 * // Mode compact (header)
 * <DateRangeFilter 
 *   mode="compact"
 *   selectedRange="7days"
 *   onFilterChange={({ range, key }) => console.log(range)}
 * />
 * 
 * @example
 * // Mode full avec stats
 * <DateRangeFilter 
 *   mode="full"
 *   totalItems={150}
 *   filteredItems={45}
 *   onFilterChange={handleFilter}
 * />
 * 
 * @example
 * // Périodes personnalisées
 * <DateRangeFilter 
 *   periods={[
 *     { value: "all", label: "Tout" },
 *     { value: "today", label: "Aujourd'hui", days: 1 },
 *     { value: "week", label: "Cette semaine", days: 7 }
 *   ]}
 * />
 */
export default function DateRangeFilter({
  mode = "compact", // "compact" | "full"
  selectedRange = "all",
  onFilterChange = () => {},
  periods = [
    { value: "all", label: "Toutes" },
    { value: "7days", label: "7 jours", days: 7 },
    { value: "30days", label: "30 jours", days: 30 },
    { value: "90days", label: "3 mois", days: 90 },
    { value: "6months", label: "6 mois", days: 180 },
    { value: "1year", label: "1 an", days: 365 },
  ],
  // Stats (optionnel, utile en mode full)
  totalItems = 0,
  filteredItems = 0,
  buttonSize = mode === "compact" ? "1" : "2",
}) {
  const [selected, setSelected] = useState(selectedRange);
  const [customMode, setCustomMode] = useState(false);
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  useEffect(() => {
    setSelected(selectedRange);
  }, [selectedRange]);

  // Mémoïser le calcul de plage de dates
  const getDateRange = useCallback((range) => {
    const now = new Date();
    const end = new Date(now);
    let start = new Date(now);

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
      case "all":
      default:
        return null;
    }

    return { start, end };
  }, []);

  const handleQuickSelect = useCallback((value) => {
    setSelected(value);
    setCustomMode(false);
    setCustomStart("");
    setCustomEnd("");
    const range = getDateRange(value);
    onFilterChange({ range, key: value });
  }, [getDateRange, onFilterChange]);

  const applyCustomRange = useCallback(() => {
    if (customStart && customEnd) {
      setCustomMode(true);
      setSelected("custom");
      const range = {
        start: new Date(customStart),
        end: new Date(customEnd),
      };
      onFilterChange({ range, key: "custom" });
    }
  }, [customStart, customEnd, onFilterChange]);

  // Mémoïser les valeurs dérivées
  const selectedPeriod = useMemo(
    () => periods.find((p) => p.value === selected),
    [periods, selected]
  );
  const dayCount = selectedPeriod?.days;

  // ---------- Compact (Header) ----------
  if (mode === "compact") {
    return (
      <Flex gap="1" align="center">
        {periods.map((period) => (
          <Button
            key={period.value}
            variant={selected === period.value && !customMode ? "solid" : "soft"}
            size={buttonSize}
            color={selected === period.value && !customMode ? "blue" : "gray"}
            onClick={() => handleQuickSelect(period.value)}
          >
            {period.label}
          </Button>
        ))}

        <Popover.Root>
          <Popover.Trigger>
            <Button
              variant={selected === "custom" ? "solid" : "soft"}
              size={buttonSize}
              color={selected === "custom" ? "blue" : "gray"}
              aria-label="Ouvrir le sélecteur de dates personnalisées"
            >
              <CalendarDays size={14} />
              Perso
            </Button>
          </Popover.Trigger>
          <Popover.Content style={{ width: "320px", padding: "12px" }}>
            <Flex direction="column" gap="2">
              <Box>
                <Text size="1" color="gray" mb="1" style={{ display: "block" }}>
                  Date début
                </Text>
                <TextField.Root
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  size="2"
                  aria-label="Sélectionner la date de début"
                />
              </Box>
              <Box>
                <Text size="1" color="gray" mb="1" style={{ display: "block" }}>
                  Date fin
                </Text>
                <TextField.Root
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  size="2"
                  aria-label="Sélectionner la date de fin"
                />
              </Box>
              <Button 
                size="2" 
                onClick={applyCustomRange} 
                disabled={!customStart || !customEnd} 
                color="blue"
                aria-label="Appliquer la plage de dates personnalisée"
              >
                Appliquer
              </Button>
            </Flex>
          </Popover.Content>
        </Popover.Root>
      </Flex>
    );
  }

  // ---------- Full (Inline + Stats + Reminder) ----------
  return (
    <Box>
      <Flex gap="2" wrap="wrap" mb="3">
        {periods.map((period) => (
          <Button
            key={period.value}
            variant={selected === period.value && !customMode ? "solid" : "soft"}
            size={buttonSize}
            color={selected === period.value && !customMode ? "blue" : "gray"}
            onClick={() => handleQuickSelect(period.value)}
          >
            {period.label}
          </Button>
        ))}
      </Flex>

      <Separator size="4" mb="3" />

      <Box mb="3">
        <Text size="2" weight="bold" mb="2" style={{ display: "block" }}>
          Période personnalisée
        </Text>
        <Flex gap="2" align="end" wrap="wrap">
          <Box style={{ flex: "1 1 120px" }}>
            <Text size="1" color="gray" style={{ display: "block", marginBottom: "4px" }}>
              Date début
            </Text>
            <TextField.Root
              type="date"
              value={customStart}
              onChange={(e) => {
                setCustomStart(e.target.value);
                setCustomMode(true);
                setSelected("custom");
              }}
              size="2"
              aria-label="Date de début de la période personnalisée"
            />
          </Box>
          <Box style={{ flex: "1 1 120px" }}>
            <Text size="1" color="gray" style={{ display: "block", marginBottom: "4px" }}>
              Date fin
            </Text>
            <TextField.Root
              type="date"
              value={customEnd}
              onChange={(e) => {
                setCustomEnd(e.target.value);
                setCustomMode(true);
                setSelected("custom");
              }}
              size="2"
              aria-label="Date de fin de la période personnalisée"
            />
          </Box>
          <Button 
            size="2" 
            onClick={applyCustomRange} 
            disabled={!customStart || !customEnd} 
            color="blue"
            aria-label="Confirmer et appliquer la période personnalisée"
          >
            Appliquer
          </Button>
        </Flex>
      </Box>

      {!customMode && dayCount && (
        <Box
          role="status"
          aria-label={`Période sélectionnée : ${dayCount} derniers jours`}
          p="2"
          style={{ background: "var(--blue-3)", borderRadius: "6px", borderLeft: "3px solid var(--blue-9)" }}
          mb="3"
        >
          <Text size="2" weight="medium">
            📅 Analyse sur les <strong>{dayCount} derniers jours</strong>
          </Text>
        </Box>
      )}

      {customMode && customStart && customEnd && (
        <Box
          role="status"
          p="2"
          style={{ background: "var(--blue-3)", borderRadius: "6px", borderLeft: "3px solid var(--blue-9)" }}
          mb="3"
        >
          <Text size="2" weight="medium">
            📅 Du <strong>{new Date(customStart).toLocaleDateString("fr-FR")}</strong> au
            <strong> {new Date(customEnd).toLocaleDateString("fr-FR")}</strong>
          </Text>
        </Box>
      )}

      {totalItems > 0 && (
        <Flex gap="2" wrap="wrap">
          <Badge color="blue" size="2">
            {filteredItems} élément{filteredItems > 1 ? "s" : ""} affiché{filteredItems > 1 ? "s" : ""}
          </Badge>
          {selected !== "all" && totalItems > filteredItems && (
            <Badge color="gray" size="2">
              {totalItems - filteredItems} filtré{totalItems - filteredItems > 1 ? "s" : ""}
            </Badge>
          )}
        </Flex>
      )}
    </Box>
  );
}

DateRangeFilter.propTypes = {
  mode: PropTypes.oneOf(["compact", "full"]),
  selectedRange: PropTypes.string,
  onFilterChange: PropTypes.func,
  periods: PropTypes.arrayOf(
    PropTypes.shape({ value: PropTypes.string.isRequired, label: PropTypes.string.isRequired, days: PropTypes.number })
  ),
  totalItems: PropTypes.number,
  filteredItems: PropTypes.number,
  buttonSize: PropTypes.oneOf(["1", "2", "3"]),
};
