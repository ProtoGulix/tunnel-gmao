import PropTypes from "prop-types";
import { Separator } from "@radix-ui/themes";
import { 
  AnomalyContainer, 
  AnomalyHeader, 
  InterventionsSection,
  groupActionsByIntervention 
} from "./AnomalyHelpers";

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
  const interventions = groupActionsByIntervention(item.actions);
  const severityColor = item.severity === 'high' ? 'red' : 'orange';
  
  return (
    <AnomalyContainer severity={item.severity}>
      <AnomalyHeader
        title={`${item.categoryName} (${item.category})`}
        subtitle={`Total: ${item.totalTime.toFixed(2)}h • Moyenne: ${item.avgTime}h/action`}
        severity={item.severity}
        badges={[
          { color: severityColor, label: `${item.count} actions`, size: "2" },
          { color: "blue", label: `${item.interventionCount} interv.`, size: "1" }
        ]}
      />
      
      <Separator size="4" style={{ margin: '8px 0' }} />
      
      <InterventionsSection interventions={interventions} actionTimeColor="orange" />
    </AnomalyContainer>
  );
}

AnomalyTypeB.propTypes = {
  item: PropTypes.shape({
    categoryName: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    totalTime: PropTypes.number.isRequired,
    avgTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    severity: PropTypes.oneOf(['high', 'medium', 'low']).isRequired,
    count: PropTypes.number.isRequired,
    interventionCount: PropTypes.number.isRequired,
    actions: PropTypes.arrayOf(
      PropTypes.shape({
        interventionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        interventionCode: PropTypes.string,
        interventionTitle: PropTypes.string,
        machine: PropTypes.string,
        timeSpent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        createdAt: PropTypes.string,
        description: PropTypes.string,
        technician: PropTypes.shape({
          firstName: PropTypes.string,
          lastName: PropTypes.string
        })
      })
    ).isRequired
  }).isRequired
};