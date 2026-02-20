// Centralized units configuration

export const DEFAULT_UNIT = "pcs";

// Canonical unit values with French labels for UI
export const UNIT_OPTIONS = [
  { value: "pcs", label: "Pièce" },
  { value: "box", label: "Boîte" },
  { value: "m", label: "Mètre" },
  { value: "mm", label: "Millimètre" },
  { value: "cm", label: "Centimètre" },
  { value: "kg", label: "Kilogramme" },
  { value: "g", label: "Gramme" },
  { value: "l", label: "Litre" },
  { value: "ml", label: "Millilitre" },
];

const KNOWN_UNITS_SET = new Set(UNIT_OPTIONS.map((u) => u.value));

export function resolveUnitForItem(item) {
  const u = item?.unit;
  return u && KNOWN_UNITS_SET.has(String(u).toLowerCase())
    ? String(u).toLowerCase()
    : DEFAULT_UNIT;
}

export function validateUnit(unit) {
  const u = String(unit || "").toLowerCase();
  return KNOWN_UNITS_SET.has(u) ? u : DEFAULT_UNIT;
}

// Optional: get label for a unit value
export function getUnitLabel(value) {
  const entry = UNIT_OPTIONS.find(
    (u) => u.value === String(value).toLowerCase()
  );
  return entry ? entry.label : value;
}
