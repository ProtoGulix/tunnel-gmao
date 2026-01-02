/**
 * @fileoverview Select filtrable avec auto-sizing basé sur les options
 * 
 * @module components/common/FilterSelect
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * 
 * @example
 * // Select basique vertical
 * <FilterSelect
 *   label="Statut"
 *   value={status}
 *   onValueChange={setStatus}
 *   options={[
 *     { value: 'all', label: 'Tous' },
 *     { value: 'active', label: 'Actifs' }
 *   ]}
 * />
 * 
 * @example
 * // Select inline horizontal
 * <FilterSelect
 *   label="Priorité"
 *   value={priority}
 *   onValueChange={setPriority}
 *   options={priorityOptions}
 *   inline
 *   size="3"
 *   minWidth="200px"
 * />
 */
import { Box, Text, Select, Flex } from "@radix-ui/themes";
import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";

/** Taille par défaut du select */
const DEFAULT_SIZE = "2";

/** Largeur minimale par défaut */
const DEFAULT_MIN_WIDTH = "150px";

/** Padding approximatif pour chevron et espacement interne */
const PADDING_AND_ICON = 28;

/** Valeur de fallback pour minWidth en pixels */
const FALLBACK_MIN_WIDTH_PX = 150;

/**
 * Calcule le label le plus long parmi les options
 * @param {Array<{value: string, label: string}>} options - Options du select
 * @returns {string} Label le plus long
 */
const getLongestLabel = (options) => {
  if (!options?.length) return "";
  return options.reduce((max, opt) => {
    const optLabel = String(opt?.label ?? "");
    return optLabel.length > max.length ? optLabel : max;
  }, "");
};

/**
 * Parse une valeur minWidth en pixels numériques
 * @param {string|number} minWidth - Valeur à parser
 * @returns {number} Valeur en pixels
 */
const parseMinWidth = (minWidth) => {
  if (typeof minWidth === "number") return minWidth;
  const parsed = parseInt(String(minWidth), 10);
  return Number.isFinite(parsed) ? parsed : FALLBACK_MIN_WIDTH_PX;
};

/**
 * Détermine la taille de police selon la taille du select
 * @param {string} size - Taille du select ('1', '2', '3')
 * @returns {string} Taille de police CSS
 */
const getFontSize = (size) => {
  const sizes = { "1": "12px", "2": "14px", "3": "16px" };
  return sizes[size] || "14px";
};

/**
 * Composant de mesure caché pour calculer la largeur du texte
 * @param {Object} props
 * @param {Function} props.measureRef - Ref pour l'élément de mesure
 * @param {string} props.longestLabel - Label le plus long à mesurer
 * @param {string} props.size - Taille du select
 * @returns {JSX.Element} Span caché pour mesure
 */
function HiddenMeasurer({ measureRef, longestLabel, size }) {
  return (
    <span
      ref={measureRef}
      aria-hidden
      style={{
        position: "absolute",
        visibility: "hidden",
        whiteSpace: "nowrap",
        pointerEvents: "none",
        fontSize: getFontSize(size),
        fontFamily: "inherit",
        fontWeight: 400,
      }}
    >
      {longestLabel}
    </span>
  );
}

HiddenMeasurer.propTypes = {
  measureRef: PropTypes.object.isRequired,
  longestLabel: PropTypes.string.isRequired,
  size: PropTypes.string.isRequired,
};

/**
 * Composant Select avec options
 * @param {Object} props
 * @param {string} props.value - Valeur sélectionnée
 * @param {Function} props.onValueChange - Handler de changement
 * @param {string} props.size - Taille du select
 * @param {number} props.triggerWidth - Largeur du trigger
 * @param {Array} props.options - Options du select
 * @returns {JSX.Element} Select.Root avec trigger et items
 */
function SelectDropdown({ value, onValueChange, size, triggerWidth, options }) {
  return (
    <Select.Root value={value} onValueChange={onValueChange} size={size}>
      <Select.Trigger style={{ width: triggerWidth ? `${triggerWidth}px` : undefined }} />
      <Select.Content>
        {options.map((option) => (
          <Select.Item key={option.value} value={option.value}>
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}

SelectDropdown.propTypes = {
  value: PropTypes.string.isRequired,
  onValueChange: PropTypes.func.isRequired,
  size: PropTypes.string.isRequired,
  triggerWidth: PropTypes.number,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })).isRequired,
};

/**
 * Layout inline avec label et select sur la même ligne
 * @param {Object} props
 * @param {string} props.label - Label du filtre
 * @param {Object} props.selectProps - Props à passer au SelectDropdown
 * @returns {JSX.Element} Flex horizontal avec label et select
 */
function InlineLayout({ label, selectProps }) {
  return (
    <Flex align="center" gap="2">
      {label && <Text size="2" color="gray">{label}</Text>}
      <SelectDropdown {...selectProps} />
    </Flex>
  );
}

InlineLayout.propTypes = {
  label: PropTypes.string,
  selectProps: PropTypes.object.isRequired,
};

/**
 * Layout vertical avec label au-dessus du select
 * @param {Object} props
 * @param {string} props.label - Label du filtre
 * @param {Object} props.selectProps - Props à passer au SelectDropdown
 * @returns {JSX.Element} Fragment avec label et select empilés
 */
function VerticalLayout({ label, selectProps }) {
  return (
    <>
      {label && (
        <Text size="1" color="gray" mb="1" style={{ display: "block" }}>
          {label}
        </Text>
      )}
      <SelectDropdown {...selectProps} />
    </>
  );
}

VerticalLayout.propTypes = {
  label: PropTypes.string,
  selectProps: PropTypes.object.isRequired,
};

/**
 * Select filtrable avec auto-sizing basé sur les options
 * 
 * Composant de sélection avec label qui ajuste automatiquement sa largeur
 * en fonction de l'option la plus longue. Supporte deux layouts (inline/vertical)
 * et mesure dynamiquement le texte pour un rendu optimal sans overflow.
 * 
 * @component
 * @param {Object} props
 * @param {string} [props.label] - Label affiché (au-dessus ou à gauche selon layout)
 * @param {string} props.value - Valeur actuellement sélectionnée
 * @param {Function} props.onValueChange - Callback appelé lors du changement de sélection
 * @param {Array<{value: string, label: string}>} [props.options=[]] - Options disponibles
 * @param {string} [props.size="2"] - Taille du select ('1', '2', '3')
 * @param {string|number} [props.minWidth="150px"] - Largeur minimale du select
 * @param {boolean} [props.inline=false] - Mode inline (label à gauche) vs vertical (label au-dessus)
 * 
 * @returns {JSX.Element} Box contenant le select avec mesure automatique
 * 
 * @example
 * // Filtre de statut vertical
 * <FilterSelect
 *   label="Statut"
 *   value={filter.status}
 *   onValueChange={(v) => setFilter({ ...filter, status: v })}
 *   options={[
 *     { value: 'all', label: 'Tous les statuts' },
 *     { value: 'open', label: 'Ouvert' },
 *     { value: 'closed', label: 'Fermé' }
 *   ]}
 * />
 * 
 * @example
 * // Filtre de priorité inline compact
 * <FilterSelect
 *   label="Priorité:"
 *   value={priority}
 *   onValueChange={setPriority}
 *   options={priorityOptions}
 *   inline
 *   size="1"
 *   minWidth={120}
 * />
 * 
 * @example
 * // Select large avec longues options
 * <FilterSelect
 *   label="Technicien"
 *   value={techId}
 *   onValueChange={setTechId}
 *   options={technicians.map(t => ({ value: t.id, label: t.fullName }))}
 *   size="3"
 *   minWidth="250px"
 * />
 */
export default function FilterSelect(props) {
  const {
    label,
    value,
    onValueChange,
    options = [],
    size = DEFAULT_SIZE,
    minWidth = DEFAULT_MIN_WIDTH,
    inline = false,
  } = props;

  const longestLabel = useMemo(() => getLongestLabel(options), [options]);
  const minWidthPx = useMemo(() => parseMinWidth(minWidth), [minWidth]);

  const measureRef = useRef(null);
  const [triggerWidth, setTriggerWidth] = useState(null);

  useEffect(() => {
    const measure = () => {
      if (measureRef.current) {
        const w = Math.ceil(measureRef.current.offsetWidth || 0);
        const finalWidth = Math.max(minWidthPx, w + PADDING_AND_ICON);
        setTriggerWidth(finalWidth);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [longestLabel, minWidthPx]);

  const selectProps = { value, onValueChange, size, triggerWidth, options };
  const Layout = inline ? InlineLayout : VerticalLayout;

  return (
    <Box style={{ minWidth }}>
      <Layout label={label} selectProps={selectProps} />
      <HiddenMeasurer measureRef={measureRef} longestLabel={longestLabel} size={size} />
    </Box>
  );
}

FilterSelect.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string.isRequired,
  onValueChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
  })),
  size: PropTypes.oneOf(["1", "2", "3"]),
  minWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  inline: PropTypes.bool,
};
