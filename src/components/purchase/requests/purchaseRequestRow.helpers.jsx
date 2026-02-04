import PropTypes from "prop-types";
import { Badge } from "@radix-ui/themes";
import { COLOR_USAGE } from "@/config/colorPalette";

const HEX_TO_RADIX = { "#f59e0b": "amber", "#3b82f6": "blue", "#10b981": "green", "#ef4444": "red", "#f97316": "orange" };
const hexToRadix = (h) => (h ? HEX_TO_RADIX[h.toLowerCase()] || "gray" : "gray");

export const StatusBadges = ({ request, age }) => {
  const ds = request.derived_status;
  if (!ds) return <Badge variant="soft">Sans statut</Badge>;

  const { code, label, color } = ds;
  return <Badge color={hexToRadix(color)} variant="soft">{label}</Badge>;
};

StatusBadges.propTypes = { request: PropTypes.object.isRequired, age: PropTypes.number.isRequired };

export const renderUrgencyBadge = (urgency) => {
  const col = COLOR_USAGE?.urgency?.[urgency] ?? COLOR_USAGE?.urgency?.normal;
  const lbl = urgency === "high" ? "URGENT" : urgency === "low" ? "Faible" : "Normal";
  return <Badge variant={urgency === "high" ? "solid" : "soft"} style={{ backgroundColor: col, color: "#fff" }}>{lbl}</Badge>;
};
