import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Box, Flex, Text, Badge, Separator } from "@radix-ui/themes";
import { AnomalyContainer, AnomalyHeader } from "./AnomalyHelpers";
import { truncateHtml } from "@/lib/utils/htmlUtils";
import { formatActionDate } from "@/lib/utils/actionUtils";
import styles from "@/styles/modules/AnomalyTypeE.module.css";

// DTO-friendly accessors with legacy fallback
const getInterventionId = (item) => item?.interventionId ?? item?.intervention_id;
const getIntervention = (item) => item?.intervention ?? item?.intervention_code ?? "N/A";
const getInterventionTitle = (item) => item?.interventionTitle ?? item?.intervention_title ?? "Sans titre";
const getSeverity = (item) => item?.severity ?? "medium";
const getDaysDiff = (item) => Number(item?.daysDiff ?? item?.days_diff ?? 0);
const getTechnicianName = (item) => item?.tech ?? item?.technician ?? item?.technician_name ?? "—";
const getMachine = (item) => item?.machine ?? item?.machine_name ?? "—";
const getDate1 = (item) => item?.date1 ?? item?.first_date ?? null;
const getDate2 = (item) => item?.date2 ?? item?.second_date ?? null;
const getCategory1 = (item) => item?.category1 ?? item?.first_category ?? "—";
const getCategory2 = (item) => item?.category2 ?? item?.second_category ?? "—";
const getActions = (item) => item?.actions ?? [];

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
  const severity = getSeverity(item);
  
  return (
    <AnomalyContainer severity={severity}>
      <AnomalyHeader
        title={getIntervention(item)}
        subtitle={getInterventionTitle(item)}
        severity={severity}
        badges={[
          { color: "blue", label: `${getDaysDiff(item)}j`, size: "2" }
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
          Technicien: {getTechnicianName(item)} • Machine: {getMachine(item)}
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
          className={styles.actionsContainer}
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
                {formatActionDate(getDate1(item))}
              </Text>
            </Flex>
            
            <Box mb="2">
              <Text size="1" color="gray" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>
                Catégorie :
              </Text>
              <Badge color="purple" size="1">
                {getCategory1(item)}
              </Badge>
            </Box>
            
            {getActions(item)[0]?.description && (
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
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--gray-12)',
                      lineHeight: '1.4',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: truncateHtml(getActions(item)[0]?.description, 150),
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
            className={styles.arrowSeparator}
            style={{
              minHeight: '30px'
            }}
          >
            <Text className={styles.arrowDesktop} style={{ fontSize: '24px', display: 'none' }} color="blue" weight="bold">→</Text>
            <Text className={styles.arrowMobile} style={{ fontSize: '20px' }} color="blue" weight="bold">⬇️</Text>
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
                {formatActionDate(getDate2(item))}
              </Text>
            </Flex>
            
            <Box mb="2">
              <Text size="1" color="gray" weight="bold" style={{ display: 'block', marginBottom: '4px' }}>
                Catégorie :
              </Text>
              <Badge color="purple" size="1">
                {getCategory2(item)}
              </Badge>
            </Box>
            
            {getActions(item)[1]?.description && (
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
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'var(--gray-12)',
                      lineHeight: '1.4',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                    }}
                    dangerouslySetInnerHTML={{
                      __html: truncateHtml(getActions(item)[1]?.description, 150),
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
            🔄 Retour après {getDaysDiff(item)} jour{getDaysDiff(item) > 1 ? 's' : ''} - Travail potentiellement mal découpé
          </Text>
        </Box>
      </Box>
    </AnomalyContainer>
  );
}

AnomalyTypeE.displayName = "AnomalyTypeE";

AnomalyTypeE.propTypes = {
  item: PropTypes.shape({
    // DTO field names (camelCase)
    interventionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    intervention_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    intervention: PropTypes.string,
    intervention_code: PropTypes.string,
    interventionTitle: PropTypes.string,
    intervention_title: PropTypes.string,
    severity: PropTypes.oneOf(['high', 'medium', 'low']),
    daysDiff: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    days_diff: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tech: PropTypes.string,
    technician: PropTypes.string,
    technician_name: PropTypes.string,
    machine: PropTypes.string,
    machine_name: PropTypes.string,
    date1: PropTypes.string,
    first_date: PropTypes.string,
    category1: PropTypes.string,
    first_category: PropTypes.string,
    date2: PropTypes.string,
    second_date: PropTypes.string,
    category2: PropTypes.string,
    second_category: PropTypes.string,
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        description: PropTypes.string
      })
    )
  })
};