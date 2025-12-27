import { Box, Text, Select, Flex } from "@radix-ui/themes";
import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Composant de sélection avec label pour les filtres
 * @param {string} label - Label affiché au-dessus du select
 * @param {string} value - Valeur sélectionnée
 * @param {function} onValueChange - Callback appelé lors du changement
 * @param {Array} options - Options [{value, label}]
 * @param {string} size - Taille du select (défaut: "2")
 * @param {string} minWidth - Largeur minimale (défaut: "150px")
 */
export default function FilterSelect({
  label,
  value,
  onValueChange,
  options = [],
  size = "2",
  minWidth = "150px",
  inline = false,
}) {
  // Compute the longest option label for width measurement
  const longestLabel = useMemo(() => {
    if (!options || options.length === 0) return "";
    return options.reduce((max, opt) =>
      (opt?.label?.length || 0) > (max?.length || 0) ? String(opt.label ?? "") : max
    , "");
  }, [options]);

  // Parse minWidth to a numeric px value for comparison
  const minWidthPx = useMemo(() => {
    if (typeof minWidth === "number") return minWidth;
    const parsed = parseInt(String(minWidth), 10);
    return Number.isFinite(parsed) ? parsed : 150;
  }, [minWidth]);

  // Measure the longest label and set trigger width accordingly
  const measureRef = useRef(null);
  const [triggerWidth, setTriggerWidth] = useState(null);

  useEffect(() => {
    const measure = () => {
      if (measureRef.current) {
        const w = Math.ceil(measureRef.current.offsetWidth || 0);
        // Add padding to account for Trigger internal padding + chevron
        const paddingAndIcon = 28; // approx
        const finalWidth = Math.max(minWidthPx, w + paddingAndIcon);
        setTriggerWidth(finalWidth);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [longestLabel, minWidthPx, inline, size]);

  return (
    <Box style={{ minWidth }}>
      {inline ? (
        <Flex align="center" gap="2">
          {label && (
            <Text size="2" color="gray">{label}</Text>
          )}
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
        </Flex>
      ) : (
        <>
          {label && (
            <Text size="1" color="gray" mb="1" style={{ display: "block" }}>
              {label}
            </Text>
          )}
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
        </>
      )}
      {/* Hidden measurer to compute max width based on longest label */}
      <span
        ref={measureRef}
        aria-hidden
        style={{
          position: "absolute",
          visibility: "hidden",
          whiteSpace: "nowrap",
          pointerEvents: "none",
          // Approximate Trigger font styling; inherits from context
          fontSize: size === "1" ? "12px" : size === "3" ? "16px" : "14px",
          fontFamily: "inherit",
          fontWeight: 400,
        }}
      >
        {longestLabel}
      </span>
    </Box>
  );
}
