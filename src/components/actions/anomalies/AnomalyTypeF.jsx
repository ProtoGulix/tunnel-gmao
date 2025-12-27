import PropTypes from "prop-types";
import { Separator, Text } from "@radix-ui/themes";
import { 
  AnomalyContainer, 
  AnomalyHeader, 
  InterventionsSection,
  groupActionsByIntervention 
} from "./AnomalyHelpers";

// DTO-friendly accessors with legacy fallback
const getCategoryName = (item) => item?.categoryName ?? item?.category_name ?? "—";
const getCategory = (item) => item?.category ?? "—";
const getSeverity = (item) => item?.severity ?? "medium";
const getTotalTime = (item) => Number(item?.totalTime ?? item?.total_time ?? 0);
const getInterventionCount = (item) => Number(item?.interventionCount ?? item?.intervention_count ?? 0);
const getMachineCount = (item) => Number(item?.machineCount ?? item?.machine_count ?? 0);
const getTechCount = (item) => Number(item?.techCount ?? item?.tech_count ?? 0);
const getCount = (item) => Number(item?.count ?? 0);
const getAvgTime = (item) => String(item?.avgTime ?? item?.avg_time ?? "0");
const getActions = (item) => item?.actions ?? [];

/**
 * Type F - Faible valeur + charge élevée
 * Affiche les catégories à faible valeur ajoutée avec plus de 30h cumulées (problème structurel)
 * 
 * @component
 * @param {Object} props - Propriétés du composant
 * @param {Object} props.item - Données de l'anomalie
 * @param {string} props.item.categoryName - Nom de la catégorie d'action
 * @param {string} props.item.category - Code de la catégorie
 * @param {string} props.item.severity - Niveau de sévérité ('high', 'medium', 'low')
 * @param {number} props.item.totalTime - Temps total cumulé en heures
 * @param {number} props.item.interventionCount - Nombre d'interventions concernées
 * @param {number} props.item.machineCount - Nombre de machines concernées
 * @param {number} props.item.techCount - Nombre de techniciens impliqués
 * @param {number} props.item.count - Nombre total d'actions
 * @param {string} props.item.avgTime - Temps moyen par action (formaté)
 * @param {Array<Object>} props.item.actions - Liste des actions à faible valeur
 * @returns {JSX.Element} Composant d'anomalie de type F
 * 
 * @example
 * <AnomalyTypeF 
 *   item={{
 *     categoryName: 'Graissage simple',
 *     category: 'GR',
 *     severity: 'high',
 *     totalTime: 35.5,
 *     interventionCount: 20,
 *     machineCount: 8,
 *     techCount: 5,
 *     count: 25,
 *     avgTime: '1.42',
 *     actions: [...]
 *   }}
 * />
 */
export default function AnomalyTypeF({ item }) {
  const severity = getSeverity(item);
  const severityColor = severity === 'high' ? 'red' : 'orange';
  const interventions = groupActionsByIntervention(getActions(item));
  
  return (
    <AnomalyContainer severity={severity}>
      <AnomalyHeader
        title={`${getCategoryName(item)} (${getCategory(item)})`}
        severity={severity}
        badges={[
          { color: severityColor, label: `${getTotalTime(item).toFixed(2)}h`, size: "2" },
          { color: "blue", label: `${getInterventionCount(item)} interv.`, size: "1" }
        ]}
      >
        <Text size="1" color="gray" style={{ display: 'block' }}>
          {getMachineCount(item)} machine{getMachineCount(item) > 1 ? 's' : ''} • {getTechCount(item)} technicien{getTechCount(item) > 1 ? 's' : ''}
        </Text>
        <Text size="1" color="gray" style={{ display: 'block' }}>
          {getCount(item)} actions • Temps moyen: {getAvgTime(item)}h/action
        </Text>
      </AnomalyHeader>
      
      <Separator size="4" style={{ margin: '8px 0' }} />
      
      <InterventionsSection interventions={interventions} actionTimeColor="red" />
    </AnomalyContainer>
  );
}

AnomalyTypeF.displayName = "AnomalyTypeF";

AnomalyTypeF.propTypes = {
  item: PropTypes.shape({
    // DTO field names (camelCase)
    categoryName: PropTypes.string,
    category_name: PropTypes.string,
    category: PropTypes.string,
    severity: PropTypes.oneOf(['high', 'medium', 'low']),
    totalTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    total_time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    interventionCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    intervention_count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    machineCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    machine_count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    techCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    tech_count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    avgTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    avg_time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
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
        })
      })
    )
  })
};