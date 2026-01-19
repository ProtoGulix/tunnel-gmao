import PropTypes from "prop-types";
import { Badge, Flex } from "@radix-ui/themes";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { COLOR_USAGE } from "@/config/colorPalette";

export const StatusBadges = ({ request, hasMissing, age }) => {
  const statusId = typeof request.status === "string" ? request.status : request.status?.id;

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

  if (statusId === "ordered") {
    return (
      <Badge color="green" variant="soft">
        Commandée
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

  if (statusId === "sent") {
    return (
      <Badge color="blue" variant="soft">
        Devis envoyé
      </Badge>
    );
  }

  return <Badge variant="soft">-</Badge>;
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
