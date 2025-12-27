import { Link } from "react-router-dom";
import { Box, Flex, Text, Badge, Separator } from "@radix-ui/themes";
import { AnomalyContainer, AnomalyHeader } from "./AnomalyHelpers";
import { formatActionDate } from "@/lib/utils/actionUtils";
import SafeHtml from "@/components/common/SafeHtml";

/**
 * Type D - Mauvaise classification
 */
export default function AnomalyTypeD({ item, index }) {
  return (
    <AnomalyContainer severity={item.severity}>
      <AnomalyHeader
        title={item.intervention || 'N/A'}
        subtitle={`${item.interventionTitle || 'Sans titre'}`}
        severity={item.severity}
        badges={[
          { color: "purple", label: `${item.foundKeywords.length} indices`, size: "2" }
        ]}
      >
        {item.interventionId && (
          <Link to={`/intervention/${item.interventionId}`}>
            <Text size="2" color="blue" style={{ display: 'block', marginTop: '4px' }}>
              → Voir l'intervention
            </Text>
          </Link>
        )}
        <Text size="1" color="gray" style={{ display: 'block' }}>
          Catégorie: {item.category} • Machine: {item.machine}
        </Text>
      </AnomalyHeader>
      
      <Separator size="4" style={{ margin: '8px 0' }} />
      
      <Box>
        <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginBottom: '8px' }}>
          Détails de l'action :
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
                <Text weight="bold">Technicien:</Text> {item.tech}
              </Text>
              <Text size="1" color="gray">
                {formatActionDate(item.date)}
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
                {item.foundKeywords.map((keyword, idx) => (
                  <Badge key={idx} color="purple" size="1">
                    {keyword}
                  </Badge>
                ))}
              </Flex>
            </Box>
            
            {item.description && (
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
                <SafeHtml 
                  html={item.description}
                  style={{ 
                    fontSize: '12px',
                    color: 'var(--gray-11)',
                    fontStyle: 'italic',
                    lineHeight: '1.4'
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