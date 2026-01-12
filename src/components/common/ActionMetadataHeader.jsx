import { Flex, Text, Badge } from "@radix-ui/themes";
import { Clock, User } from "lucide-react";
import PropTypes from "prop-types";

/**
 * ActionMetadataHeader - Displays action metadata (category, time, complexity, technician, timestamp)
 */
export default function ActionMetadataHeader({
  subcategory,
  timeSpent,
  complexityScore,
  complexityInfo,
  complexityFactors,
  complexityFactorsList,
  technician,
  createdAt,
  getCategoryColor,
}) {
  return (
    <Flex align="center" gap="2" wrap="wrap" style={{ flex: 1, minWidth: 0 }}>
      {/* Catégorie */}
      {subcategory && (
        <Badge 
          variant="soft" 
          size="2"
          style={{ 
            flexShrink: 0,
            backgroundColor: getCategoryColor(subcategory) || '#6b7280',
            color: 'white'
          }}
        >
          {subcategory?.code ?? "—"}
        </Badge>
      )}

      {/* Temps */}
      {timeSpent > 0 && (
        <Flex align="center" gap="1">
          <Clock size={14} color="var(--gray-9)" />
          <Text size="2" weight="medium">
            {timeSpent}h
          </Text>
        </Flex>
      )}

      {/* Complexité */}
      {complexityScore > 0 && (
        <Badge 
          color={complexityInfo.color} 
          variant="soft" 
          size="1"
          title={`Complexité: ${complexityScore}/10 (${complexityInfo.label})`}
        >
          {complexityScore}/10
        </Badge>
      )}

      {/* Facteurs de complexité */}
      {complexityFactors.length > 0 && complexityFactorsList && (
        <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
          ({complexityFactors.map((code) => {
            const factor = complexityFactorsList.find(f => f.id === code);
            return factor?.label || code;
          }).join(', ')})
        </Text>
      )}

      {/* Technicien */}
      {technician && (
        <Flex align="center" gap="1">
          <User size={14} color="var(--gray-8)" />
          <Text size="2" color="gray">
            {technician.firstName ?? technician.first_name ?? "—"} {technician.lastName ?? technician.last_name ?? "—"}
          </Text>
        </Flex>
      )}

      {/* Horaire */}
      {createdAt && (
        <Text size="2" color="gray">
          {new Date(createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </Flex>
  );
}

ActionMetadataHeader.displayName = "ActionMetadataHeader";

ActionMetadataHeader.propTypes = {
  subcategory: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    code: PropTypes.string,
    name: PropTypes.string,
  }),
  timeSpent: PropTypes.number,
  complexityScore: PropTypes.number,
  complexityInfo: PropTypes.shape({
    color: PropTypes.string,
    label: PropTypes.string,
  }),
  complexityFactors: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  complexityFactorsList: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string,
  })),
  technician: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    firstName: PropTypes.string,
    first_name: PropTypes.string,
    lastName: PropTypes.string,
    last_name: PropTypes.string,
  }),
  createdAt: PropTypes.string,
  getCategoryColor: PropTypes.func.isRequired,
};
