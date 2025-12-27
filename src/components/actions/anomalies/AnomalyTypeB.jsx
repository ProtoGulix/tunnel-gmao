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
const getTotalTime = (item) => Number(item?.totalTime ?? item?.total_time ?? 0);
const getAvgTime = (item) => (item?.avgTime ?? item?.avg_time ?? "0").toString();
const getSeverity = (item) => item?.severity ?? "medium";
const getCount = (item) => Number(item?.count ?? 0);
const getInterventionCount = (item) => Number(item?.interventionCount ?? item?.intervention_count ?? 0);
const getActions = (item) => item?.actions ?? item?.action_list ?? [];

/**
 * Type B - Actions fragmentées
 * Affiche les anomalies d'actions de moins d'1h répétées plus de 5 fois (travail mal organisé)
 * 
 * @component
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.item - Données de l'anomalie
 * @param {string} props.item.categoryName - Nom de la catégorie d'action
 * @param {string} props.item.category - Code de la catégorie
 * @param {number} props.item.totalTime - Temps total cumulé en heures
 * @param {string} props.item.avgTime - Temps moyen par action (formaté)
 * @param {string} props.item.severity - Niveau de sévérité ('high', 'medium', 'low')
 * @param {number} props.item.count - Nombre d'actions fragmentées
 * @param {number} props.item.interventionCount - Nombre d'interventions concernées
 * @param {Array<Object>} props.item.actions - Liste des actions fragmentées
 * @returns {JSX.Element} Composant d'anomalie de type B
 * 
 * @example
 * <AnomalyTypeB 
 *   item={{
 *     categoryName: 'Graissage',
 *     category: 'GR',
 *     totalTime: 4.5,
 *     avgTime: '0.75',
 *     severity: 'high',
 *     count: 6,
 *     interventionCount: 4,
 *     actions: [...]
 *   }}
 * />
 */
export default function AnomalyTypeB({ item }) {
  const interventions = groupActionsByIntervention(getActions(item));
  const severity = getSeverity(item);
  const severityColor = severity === 'high' ? 'red' : 'orange';
  
  return (
    <AnomalyContainer severity={severity}>
      <AnomalyHeader
        title={`${getCategoryName(item)} (${getCategory(item)})`}
        subtitle={`Total: ${getTotalTime(item).toFixed(2)}h • Moyenne: ${getAvgTime(item)}h/action`}
        severity={severity}
        badges={[
          { color: severityColor, label: `${getCount(item)} actions`, size: "2" },
          { color: "blue", label: `${getInterventionCount(item)} interv.`, size: "1" }
        ]}
      />
      
      <Separator size="4" style={{ margin: '8px 0' }} />
      
      <InterventionsSection interventions={interventions} actionTimeColor="orange" />
    </AnomalyContainer>
  );
}

AnomalyTypeB.propTypes = {
  item: PropTypes.shape({
    // DTO field names (camelCase)
    categoryName: PropTypes.string,
    category_name: PropTypes.string,
    category: PropTypes.string,
    totalTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    total_time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    avgTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    avg_time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
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

AnomalyTypeB.displayName = "AnomalyTypeB";