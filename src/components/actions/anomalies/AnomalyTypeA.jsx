import PropTypes from "prop-types";
import { Separator } from "@radix-ui/themes";
import { 
  AnomalyContainer, 
  AnomalyHeader, 
  InterventionsSection,
  groupActionsByIntervention 
} from "./AnomalyHelpers";

// DTO-friendly accessors with legacy fallback
const getCategoryName = (item) => item?.categoryName ?? item?.category_name ?? "—";
const getCategory = (item) => item?.category ?? "—";
const getMachine = (item) => item?.machine ?? item?.machine_name ?? "—";
const getMonth = (item) => item?.month ?? item?.period ?? "—";
const getSeverity = (item) => item?.severity ?? "medium";
const getCount = (item) => Number(item?.count ?? 0);
const getInterventionCount = (item) => Number(item?.interventionCount ?? item?.intervention_count ?? 0);
const getActions = (item) => item?.actions ?? item?.action_list ?? [];

/**
 * Type A - Actions répétitives
 * Affiche les anomalies où la même catégorie d'action se répète sur la même machine plus de 3 fois par mois
 * 
 * @component
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.item - Données de l'anomalie
 * @param {string} props.item.categoryName - Nom de la catégorie d'action
 * @param {string} props.item.category - Code de la catégorie
 * @param {string} props.item.machine - Nom de la machine concernée
 * @param {string} props.item.month - Période (mois/année)
 * @param {string} props.item.severity - Niveau de sévérité ('high', 'medium', 'low')
 * @param {number} props.item.count - Nombre de répétitions détectées
 * @param {number} props.item.interventionCount - Nombre d'interventions concernées
 * @param {Array<Object>} props.item.actions - Liste des actions répétitives
 * @returns {JSX.Element} Composant d'anomalie de type A
 * 
 * @example
 * <AnomalyTypeA 
 *   item={{
 *     categoryName: 'Graissage',
 *     category: 'GR',
 *     machine: 'Presse hydraulique',
 *     month: 'Janvier 2025',
 *     severity: 'high',
 *     count: 5,
 *     interventionCount: 3,
 *     actions: [...]
 *   }}
 * />
 */
export default function AnomalyTypeA({ item }) {
  const interventions = groupActionsByIntervention(getActions(item));
  const severity = getSeverity(item);
  const severityColor = severity === 'high' ? 'red' : 'orange';
  
  return (
    <AnomalyContainer severity={severity}>
      <AnomalyHeader
        title={`${getCategoryName(item)} (${getCategory(item)})`}
        subtitle={`Machine : ${getMachine(item)} • Période : ${getMonth(item)}`}
        severity={severity}
        badges={[
          { color: severityColor, label: `${getCount(item)} fois`, size: "2" },
          { color: "blue", label: `${getInterventionCount(item)} interv.`, size: "1" }
        ]}
      />
      
      <Separator size="4" style={{ margin: '8px 0' }} />
      
      <InterventionsSection interventions={interventions} actionTimeColor="red" />
    </AnomalyContainer>
  );
}

AnomalyTypeA.propTypes = {
  item: PropTypes.shape({
    // DTO field names (camelCase)
    categoryName: PropTypes.string,
    category_name: PropTypes.string,
    category: PropTypes.string,
    machine: PropTypes.string,
    machine_name: PropTypes.string,
    month: PropTypes.string,
    period: PropTypes.string,
    severity: PropTypes.oneOf(['high', 'medium', 'low']),
    count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    interventionCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    intervention_count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        interventionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        intervention_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        interventionCode: PropTypes.string,
        intervention_code: PropTypes.string,
        interventionTitle: PropTypes.string,
        intervention_title: PropTypes.string,
        machine: PropTypes.string,
        machine_name: PropTypes.string,
        timeSpent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        time_spent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        createdAt: PropTypes.string,
        created_at: PropTypes.string,
        description: PropTypes.string,
        technician: PropTypes.shape({
          firstName: PropTypes.string,
          first_name: PropTypes.string,
          lastName: PropTypes.string,
          last_name: PropTypes.string
        }),
        tech: PropTypes.string,
      })
    ),
    action_list: PropTypes.arrayOf(PropTypes.object),
  }).isRequired
};

AnomalyTypeA.displayName = "AnomalyTypeA";