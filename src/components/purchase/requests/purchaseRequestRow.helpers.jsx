import PropTypes from "prop-types";
import { Badge, Flex } from "@radix-ui/themes";
import { AlertCircle } from "lucide-react";
import { COLOR_USAGE } from "@/config/colorPalette";

/**
 * Convertit une couleur hex en nom de couleur Radix UI
 * @param {string} hexColor - Couleur hex du backend (ex: "#f59e0b")
 * @returns {string} Nom de couleur Radix UI
 */
const hexToRadixColor = (hexColor) => {
  if (!hexColor) return "gray";
  
  const colorMap = {
    "#f59e0b": "amber",  // TO_QUALIFY
    "#3b82f6": "blue",   // OPEN, QUOTED
    "#10b981": "green",  // ORDERED, PARTIAL, RECEIVED
    "#ef4444": "red",    // REJECTED
    "#f97316": "orange", // À relancer
  };
  
  return colorMap[hexColor.toLowerCase()] || "gray";
};

export const StatusBadges = ({ request, age }) => {
  // derived_status vient du backend avec structure {code, label, color}
  const derivedStatus = request.derived_status;
  
  if (!derivedStatus) {
    return <Badge variant="soft">Sans statut</Badge>;
  }

  const { code, label, color } = derivedStatus;
  const radixColor = hexToRadixColor(color);

  // Récupérer le numéro du panier sélectionné
  const getSelectedBasketInfo = () => {
    const orderLineRelations = request.supplier_order_line_ids || request.supplierOrderLineIds || [];
    const selectedLine = orderLineRelations.find(relation => {
      const lineData = relation.supplier_order_line_id || relation.supplierOrderLineId;
      return lineData && (lineData.is_selected === true || lineData.isSelected === true);
    });
    
    if (selectedLine) {
      const lineData = selectedLine.supplier_order_line_id || selectedLine.supplierOrderLineId;
      const supplierOrder = lineData?.supplier_order_id || lineData?.supplierOrderId;
      return supplierOrder?.order_number || supplierOrder?.orderNumber || null;
    }
    return null;
  };

  const basketNumber = getSelectedBasketInfo();

  // Cas spécial: OPEN avec age > 2 jours = À relancer
  if (code === "OPEN" && age > 2) {
    return (
      <Badge color="orange" variant="soft">
        <Flex align="center" gap="1">
          <AlertCircle size={12} />
          À relancer
        </Flex>
      </Badge>
    );
  }

  // Affichage standard: utiliser label et couleur du backend
  const badges = (
    <Badge color={radixColor} variant="soft">
      {label}
    </Badge>
  );

  // Ajouter le numéro de panier si disponible (pour QUOTED, ORDERED, PARTIAL, RECEIVED)
  if (basketNumber && ["QUOTED", "ORDERED", "PARTIAL", "RECEIVED"].includes(code)) {
    return (
      <Flex gap="1" wrap="wrap">
        {badges}
        <Badge color="gray" variant="outline">
          Panier {basketNumber}
        </Badge>
      </Flex>
    );
  }

  return badges;
};

StatusBadges.propTypes = {
  request: PropTypes.object.isRequired,
  age: PropTypes.number.isRequired,
};

export const renderUrgencyBadge = (urgency) => {
  const urgencyColor = COLOR_USAGE?.urgency?.[urgency] ?? COLOR_USAGE?.urgency?.normal;
  const label = urgency === "high" ? "URGENT" : urgency === "low" ? "Faible" : "Normal";
  const isSolid = urgency === "high";

  return (
    <Badge
      variant={isSolid ? "solid" : "soft"}
      style={{ backgroundColor: urgencyColor, color: "#fff" }}
    >
      {label}
    </Badge>
  );
};
