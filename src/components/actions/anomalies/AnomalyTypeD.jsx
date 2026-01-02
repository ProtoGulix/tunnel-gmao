import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Box, Flex, Text, Badge, Separator } from "@radix-ui/themes";
import { AnomalyContainer, AnomalyHeader } from "./AnomalyHelpers";
import { formatActionDate } from "@/lib/utils/actionUtils";
import { sanitizeHtml } from "@/lib/utils/htmlUtils";

// DTO-friendly accessors with legacy fallback
const getIntervention = (item) => item?.intervention ?? item?.intervention_id ?? "N/A";
const getInterventionTitle = (item) => item?.interventionTitle ?? item?.intervention_title ?? "Sans titre";
const getInterventionId = (item) => item?.interventionId ?? item?.intervention_id;
const getTechnicianName = (item) => item?.tech ?? item?.technician ?? item?.technician_name ?? "—";
const getFoundKeywords = (item) => item?.foundKeywords ?? item?.found_keywords ?? [];
const getCategory = (item) => item?.category ?? "—";
const getMachine = (item) => item?.machine ?? item?.machine_name ?? "—";
const getDescription = (item) => item?.description ?? "";
const getSeverity = (item) => item?.severity ?? "medium";
const getDate = (item) => item?.date ?? item?.created_at ?? null;

/**
 * Type D - Mauvaise classification
 * Affiche une anomalie d'action mal classée (mauvaise catégorie ou sous-catégorie détectée)
 */
function AnomalyTypeD({ item }) {
  return (
    <AnomalyContainer severity={getSeverity(item)}>
      <AnomalyHeader
        title={getIntervention(item)}
        subtitle={getInterventionTitle(item)}
        severity={getSeverity(item)}
        badges={[
          { color: "purple", label: `${getFoundKeywords(item).length} indices`, size: "2" }
        ]}
      >
        {getInterventionId(item) && (
          <Link to={`/intervention/${getInterventionId(item)}`}>
            <Text size="2" color="blue" style={{ display: 'block', marginTop: '4px' }}>
              → Voir l&apos;intervention
            </Text>
          </Link>
        )}
        <Text size="1" color="gray" style={{ display: 'block' }}>
          Catégorie: {getCategory(item)} • Machine: {getMachine(item)}
        </Text>
      </AnomalyHeader>
      
      <Separator size="4" style={{ margin: '8px 0' }} />
      
      <Box>
        <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginBottom: '8px' }}>
          Détails de l&apos;action :
        </Text>
        <Box 
          p="2"
          style={{ 
            background: 'white',
            borderRadius: '4px',
            border: '1px solid var(--gray-4)'
          }}
        >
          <Flex direction="column" gap="1">
            <Flex justify="between" align="center">
              <Text size="1" color="gray">
                <Text weight="bold">Technicien:</Text> {getTechnicianName(item)}
              </Text>
              <Text size="1" color="gray">
                {getDate(item) && formatActionDate(getDate(item))}
              </Text>
            </Flex>

            <Box 
              p="2" 
              mt="2"
              style={{ 
                background: 'var(--purple-2)',
                borderRadius: '3px'
              }}
            >
              <Text size="1" weight="bold" color="purple" style={{ display: 'block', marginBottom: '4px' }}>
                Mots suspects détectés :
              </Text>
              <Flex gap="1" wrap="wrap">
                {getFoundKeywords(item).map((keyword, idx) => (
                  <Badge key={idx} color="purple" size="1">
                    {keyword}
                  </Badge>
                ))}
              </Flex>
            </Box>
            
            {getDescription(item) && (
              <Box 
                p="2" 
                mt="2"
                style={{ 
                  background: 'var(--gray-1)',
                  borderRadius: '3px'
                }}
              >
                <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginBottom: '4px' }}>
                  Description :
                </Text>
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--gray-11)',
                    fontStyle: 'italic',
                    lineHeight: '1.4',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                  dangerouslySetInnerHTML={{
                    __html: sanitizeHtml(getDescription(item)),
                  }}
                />
              </Box>
            )}

            <Box 
              p="1" 
              mt="2"
              style={{ 
                background: 'var(--purple-2)',
                borderRadius: '3px',
                textAlign: 'center'
              }}
            >
              <Text size="1" weight="bold" color="purple">
                🔍 Classification potentiellement incorrecte
              </Text>
            </Box>
          </Flex>
        </Box>
      </Box>
    </AnomalyContainer>
  );
}

AnomalyTypeD.propTypes = {
  item: PropTypes.shape({
    // DTO field names (camelCase)
    intervention: PropTypes.string,
    intervention_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    interventionTitle: PropTypes.string,
    intervention_title: PropTypes.string,
    interventionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    severity: PropTypes.oneOf(["low", "medium", "high", "critical"]),
    foundKeywords: PropTypes.arrayOf(PropTypes.string),
    found_keywords: PropTypes.arrayOf(PropTypes.string),
    category: PropTypes.string,
    machine: PropTypes.string,
    machine_name: PropTypes.string,
    tech: PropTypes.string,
    technician: PropTypes.string,
    technician_name: PropTypes.string,
    date: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    created_at: PropTypes.string,
    description: PropTypes.string,
  }).isRequired,
};

AnomalyTypeD.displayName = "AnomalyTypeD";

export default AnomalyTypeD;