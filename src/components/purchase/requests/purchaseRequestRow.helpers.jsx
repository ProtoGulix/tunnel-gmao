import PropTypes from "prop-types";
import { Badge, Flex } from "@radix-ui/themes";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { COLOR_USAGE } from "@/config/colorPalette";
import { derivePurchaseRequestStatus } from "@/lib/purchasing/purchaseRequestStatusUtils";

export const StatusBadges = ({ request, hasMissing, age }) => {
  const derivedStatus = request.derived_status || derivePurchaseRequestStatus(request);
  const statusId = typeof derivedStatus === "string" ? derivedStatus : derivedStatus?.id;

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

  if (hasMissing) {
    return (
      <Badge color="amber" variant="soft">
        <Flex align="center" gap="1">
          <AlertTriangle size={12} />
          À qualifier
        </Flex>
      </Badge>
    );
  }

  if (statusId === "in_progress" && age > 2) {
    return (
      <Badge color="orange" variant="soft">
        <Flex align="center" gap="1">
          <AlertCircle size={12} />
          À relancer
        </Flex>
      </Badge>
    );
  }

  if (statusId === "pooling") {
    return (
      <Flex gap="1" wrap="wrap">
        <Badge color="purple" variant="soft">
          Mutualisation
        </Badge>
        {basketNumber && (
          <Badge color="gray" variant="outline">
            Panier {basketNumber}
          </Badge>
        )}
      </Flex>
    );
  }

  if (statusId === "sent") {
    return (
      <Flex gap="1" wrap="wrap">
        <Badge color="blue" variant="soft">
          Devis envoyé
        </Badge>
        {basketNumber && (
          <Badge color="gray" variant="outline">
            Panier {basketNumber}
          </Badge>
        )}
      </Flex>
    );
  }

  if (statusId === "ordered") {
    return (
      <Flex gap="1" wrap="wrap">
        <Badge color="green" variant="soft">
          Commandée
        </Badge>
        {basketNumber && (
          <Badge color="gray" variant="outline">
            Panier {basketNumber}
          </Badge>
        )}
      </Flex>
    );
  }

  if (statusId === "received") {
    return (
      <Flex gap="1" wrap="wrap">
        <Badge color="green" variant="solid">
          Reçue
        </Badge>
        {basketNumber && (
          <Badge color="gray" variant="outline">
            Panier {basketNumber}
          </Badge>
        )}
      </Flex>
    );
  }

  if (statusId === "cancelled") {
    return (
      <Badge color="red" variant="soft">
        Annulée
      </Badge>
    );
  }

  if (statusId === "in_progress") {
    return (
      <Badge color="blue" variant="soft">
        En attente
      </Badge>
    );
  }

  return (
    <Badge variant="soft">
      Ouverte
    </Badge>
  );
};

StatusBadges.propTypes = {
  request: PropTypes.object.isRequired,
  hasMissing: PropTypes.bool.isRequired,
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
