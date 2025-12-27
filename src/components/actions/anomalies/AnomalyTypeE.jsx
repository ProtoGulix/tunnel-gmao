import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Box, Flex, Text, Badge, Separator } from "@radix-ui/themes";
import { AnomalyContainer, AnomalyHeader } from "./AnomalyHelpers";
import SafeHtml from "@/components/common/SafeHtml";
import { formatActionDate } from "@/lib/utils/actionUtils";

/**
 * Type E - Retours back-to-back
 * Affiche les anomalies où le même technicien revient sur la même intervention sous 24h
 * (travail mal découpé ou problème non résolu)
 * 
 * @component
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.item - Données de l'anomalie
 * @param {string|number} [props.item.interventionId] - ID de l'intervention
 * @param {string} props.item.intervention - Code de l'intervention
 * @param {string} [props.item.interventionTitle] - Titre de l'intervention
 * @param {string} props.item.severity - Niveau de sévérité ('high', 'medium', 'low')
 * @param {number} props.item.daysDiff - Nombre de jours entre les deux actions
 * @param {string} props.item.tech - Nom du technicien
 * @param {string} props.item.machine - Nom de la machine
 * @param {string} props.item.date1 - Date de la première action (ISO string)
 * @param {string} props.item.category1 - Catégorie de la première action
 * @param {string} props.item.date2 - Date de la deuxième action (ISO string)
 * @param {string} props.item.category2 - Catégorie de la deuxième action
 * @param {Array<Object>} props.item.actions - Tableau des 2 actions
 * @param {string} [props.item.actions[].description] - Description HTML de l'action
 * @returns {JSX.Element} Composant d'anomalie de type E
 * 
 * @example
 * <AnomalyTypeE 
 *   item={{
 *     interventionId: 123,
 *     intervention: 'INT-001',
 *     interventionTitle: 'Réparation presse',
 *     severity: 'high',
 *     daysDiff: 1,
 *     tech: 'Jean Dupont',
 *     machine: 'Presse hydraulique',
 *     date1: '2025-01-10T10:00:00Z',
 *     category1: 'GR',
 *     date2: '2025-01-11T14:00:00Z',
 *     category2: 'RE',
 *     actions: [
 *       { description: '<p>Graissage effectué</p>' },
 *       { description: '<p>Réparation suite à panne</p>' }
 *     ]
 *   }}
 * />
 */
export default function AnomalyTypeE({ item }) {
  return (
    <AnomalyContainer severity={item.severity}>
      <AnomalyHeader
        title={item.intervention || 'N/A'}
        subtitle={`${item.interventionTitle || 'Sans titre'}`}
        severity={item.severity}
        badges={[
          { color: "blue", label: `${item.daysDiff}j`, size: "2" }
        ]}
      >
        {item.interventionId && (
          <Link to={`/intervention/${item.interventionId}`}>
            <Text size="2" color="blue" style={{ display: 'block', marginTop: '4px' }}>
              → Voir l&apos;intervention
            </Text>
          </Link>
        )}
        <Text size="1" color="gray" style={{ display: 'block' }}>
          Technicien: {item.tech} • Machine: {item.machine}
        </Text>
      </AnomalyHeader>
      
      <Separator size="4" style={{ margin: '8px 0' }} />
      
      <Box>
        <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginBottom: '8px' }}>
          Actions successives :
        </Text>
        
        {/* Affichage côte à côte sur desktop, colonne sur mobile */}
        <Flex 
          gap="3"
          style={{
            flexDirection: 'column'
          }}
          className="actions-container"
        >
          {/* Première action */}
          <Box 
            p="2"
            style={{ 
              background: 'white',
              borderRadius: '4px',
              border: '2px solid var(--blue-7)',
              flex: 1
            }}
          >
            <Flex justify="between" align="center" mb="2">
              <Badge color="blue" size="2" variant="solid">
                1ère action
              </Badge>
              <Text size="1" color="gray">
                {formatActionDate(item.date1)}
              </Text>
            </Flex>
            
            <Box mb="2">
              <Text size="1" color="gray" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>
                Catégorie :
              </Text>
              <Badge color="purple" size="1">
                {item.category1}
              </Badge>
            </Box>
            
            {item.actions[0].description && (
              <Box>
                <Text size="1" color="gray" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>
                  Description :
                </Text>
                <Box 
                  p="2" 
                  style={{ 
                    background: 'var(--gray-2)',
                    borderRadius: '3px',
                    border: '1px solid var(--gray-4)'
                  }}
                >
                  <SafeHtml 
                    html={item.actions[0].description}
                    maxLength={150}
                    style={{ 
                      fontSize: '11px',
                      color: 'var(--gray-12)',
                      lineHeight: '1.4'
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>

          {/* Flèche centrale */}
          <Flex 
            align="center" 
            justify="center"
            className="arrow-separator"
            style={{
              minHeight: '30px'
            }}
          >
            <Text className="arrow-desktop" style={{ fontSize: '24px', display: 'none' }} color="blue" weight="bold">→</Text>
            <Text className="arrow-mobile" style={{ fontSize: '20px' }} color="blue" weight="bold">⬇️</Text>
          </Flex>

          {/* Deuxième action */}
          <Box 
            p="2"
            style={{ 
              background: 'white',
              borderRadius: '4px',
              border: '2px solid var(--blue-9)',
              flex: 1
            }}
          >
            <Flex justify="between" align="center" mb="2">
              <Badge color="blue" size="2" variant="solid">
                2ème action
              </Badge>
              <Text size="1" color="gray">
                {formatActionDate(item.date2)}
              </Text>
            </Flex>
            
            <Box mb="2">
              <Text size="1" color="gray" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>
                Catégorie :
              </Text>
              <Badge color="purple" size="1">
                {item.category2}
              </Badge>
            </Box>
            
            {item.actions[1].description && (
              <Box>
                <Text size="1" color="gray" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>
                  Description :
                </Text>
                <Box 
                  p="2" 
                  style={{ 
                    background: 'var(--gray-2)',
                    borderRadius: '3px',
                    border: '1px solid var(--gray-4)'
                  }}
                >
                  <SafeHtml 
                    html={item.actions[1].description}
                    maxLength={150}
                    style={{ 
                      fontSize: '11px',
                      color: 'var(--gray-12)',
                      lineHeight: '1.4'
                    }}
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Flex>

        {/* Message d'avertissement */}
        <Box 
          p="2" 
          mt="3"
          style={{ 
            background: 'var(--blue-3)',
            borderRadius: '4px',
            border: '1px solid var(--blue-7)',
            textAlign: 'center'
          }}
        >
          <Text size="2" weight="bold" color="blue">
            🔄 Retour après {item.daysDiff} jour{item.daysDiff > 1 ? 's' : ''} - Travail potentiellement mal découpé
          </Text>
        </Box>
      </Box>

      {/* CSS inline avec style tag classique */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 640px) {
          .actions-container {
            flex-direction: row !important;
          }
          .arrow-desktop {
            display: inline !important;
          }
          .arrow-mobile {
            display: none !important;
          }
          .arrow-separator {
            min-width: 40px;
            min-height: auto;
          }
        }
      `}} />
    </AnomalyContainer>
  );
}

AnomalyTypeE.propTypes = {
  item: PropTypes.shape({
    interventionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    intervention: PropTypes.string.isRequired,
    interventionTitle: PropTypes.string,
    severity: PropTypes.oneOf(['high', 'medium', 'low']).isRequired,
    daysDiff: PropTypes.number.isRequired,
    tech: PropTypes.string.isRequired,
    machine: PropTypes.string.isRequired,
    date1: PropTypes.string.isRequired,
    category1: PropTypes.string.isRequired,
    date2: PropTypes.string.isRequired,
    category2: PropTypes.string.isRequired,
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        description: PropTypes.string
      })
    ).isRequired
  }).isRequired
};