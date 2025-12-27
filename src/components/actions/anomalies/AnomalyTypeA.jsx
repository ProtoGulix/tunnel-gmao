import PropTypes from "prop-types";
import { Separator } from "@radix-ui/themes";
import { 
  AnomalyContainer, 
  AnomalyHeader, 
  InterventionsSection,
  groupActionsByIntervention 
} from "./AnomalyHelpers";

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
  const interventions = groupActionsByIntervention(item.actions);
  const severityColor = item.severity === 'high' ? 'red' : 'orange';
  
  return (
    <AnomalyContainer severity={item.severity}>
      <AnomalyHeader
        title={`${item.categoryName} (${item.category})`}
        subtitle={`Machine : ${item.machine} • Période : ${item.month}`}
        severity={item.severity}
        badges={[
          { color: severityColor, label: `${item.count} fois`, size: "2" },
          { color: "blue", label: `${item.interventionCount} interv.`, size: "1" }
        ]}
      />
      
      <Separator size="4" style={{ margin: '8px 0' }} />
      
      <InterventionsSection interventions={interventions} actionTimeColor="red" />
    </AnomalyContainer>
  );
}

AnomalyTypeA.propTypes = {
  item: PropTypes.shape({
    categoryName: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    machine: PropTypes.string.isRequired,
    month: PropTypes.string.isRequired,
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