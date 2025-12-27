import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Text, Separator } from "@radix-ui/themes";
import { AnomalyContainer, AnomalyHeader, SingleActionDetail } from "./AnomalyHelpers";

// DTO-friendly accessors with legacy fallback
const getInterventionId = (item) => item?.interventionId ?? item?.intervention_id;
const getIntervention = (item) => item?.intervention ?? item?.intervention_code ?? "N/A";
const getInterventionTitle = (item) => item?.interventionTitle ?? item?.intervention_title ?? "Sans titre";
const getSeverity = (item) => item?.severity ?? "medium";
const getTime = (item) => Number(item?.time ?? item?.timeSpent ?? item?.time_spent ?? 0);
const getCategoryName = (item) => item?.categoryName ?? item?.category_name ?? "—";
const getCategory = (item) => item?.category ?? "—";
const getMachine = (item) => item?.machine ?? item?.machine_name ?? "—";

/**
 * Type C - Actions trop longues
 * Affiche les actions de plus de 4h sur catégories normalement simples
 * 
 * @component
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.item - Données de l'anomalie
 * @param {string|number} props.item.interventionId - ID de l'intervention
 * @param {string} props.item.intervention - Code de l'intervention
 * @param {string} [props.item.interventionTitle] - Titre de l'intervention
 * @param {string} props.item.severity - Niveau de sévérité ('high', 'medium', 'low')
 * @param {string|number} props.item.time - Temps passé en heures
 * @param {string} props.item.categoryName - Nom de la catégorie
 * @param {string} props.item.category - Code catégorie
 * @param {string} props.item.machine - Nom de la machine
 * @param {string} props.item.tech - Nom du technicien
 * @param {string} props.item.date - Date de l'action
 * @param {string} [props.item.description] - Description de l'action
 * @returns {JSX.Element} Composant d'anomalie de type C
 * 
 * @example
 * <AnomalyTypeC 
 *   item={{
 *     interventionId: 1,
 *     intervention: 'INT-001',
 *     interventionTitle: 'Réparation urgente',
 *     severity: 'high',
 *     time: 5.5,
 *     categoryName: 'Graissage',
 *     category: 'GR',
 *     machine: 'Presse hydraulique',
 *     tech: 'Jean Dupont',
 *     date: '2024-01-15T10:30:00Z',
 *     description: 'Intervention longue'
 *   }}
 * />
 */
export default function AnomalyTypeC({ item }) {
  const severity = getSeverity(item);
  const severityColor = severity === 'high' ? 'red' : 'orange';
  
  return (
    <AnomalyContainer severity={severity}>
      <AnomalyHeader
        title={getIntervention(item)}
        subtitle={getInterventionTitle(item)}
        severity={severity}
        badges={[
          { color: severityColor, label: `${getTime(item)}h`, size: "2" }
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
          {getCategoryName(item)} ({getCategory(item)}) • Machine: {getMachine(item)}
        </Text>
      </AnomalyHeader>
      
      <Separator size="4" style={{ margin: '8px 0' }} />
      
      <SingleActionDetail
        item={item}
        warningColor="orange"
        warningMessage="⚠️ Durée anormalement longue pour cette catégorie"
      />
    </AnomalyContainer>
  );
}

AnomalyTypeC.displayName = "AnomalyTypeC";

AnomalyTypeC.propTypes = {
  item: PropTypes.shape({
    // DTO field names (camelCase)
    interventionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    intervention_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    intervention: PropTypes.string,
    intervention_code: PropTypes.string,
    interventionTitle: PropTypes.string,
    intervention_title: PropTypes.string,
    severity: PropTypes.oneOf(['high', 'medium', 'low']),
    time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    timeSpent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    time_spent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    categoryName: PropTypes.string,
    category_name: PropTypes.string,
    category: PropTypes.string,
    machine: PropTypes.string,
    machine_name: PropTypes.string,
    tech: PropTypes.string,
    technician: PropTypes.string,
    technician_name: PropTypes.string,
    date: PropTypes.string,
    created_at: PropTypes.string,
    description: PropTypes.string
  })
};