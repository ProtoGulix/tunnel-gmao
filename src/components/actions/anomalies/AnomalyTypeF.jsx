import PropTypes from "prop-types";
import { Separator, Text } from "@radix-ui/themes";
import { 
  AnomalyContainer, 
  AnomalyHeader, 
  InterventionsSection,
  groupActionsByIntervention 
} from "./AnomalyHelpers";

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
  const interventions = groupActionsByIntervention(item.actions);
  const severityColor = item.severity === 'high' ? 'red' : 'orange';
  
  return (
    <AnomalyContainer severity={item.severity}>
      <AnomalyHeader
        title={`${item.categoryName} (${item.category})`}
        severity={item.severity}
        badges={[
          { color: severityColor, label: `${item.totalTime.toFixed(2)}h`, size: "2" },
          { color: "blue", label: `${item.interventionCount} interv.`, size: "1" }
        ]}
      >
        <Text size="1" color="gray" style={{ display: 'block' }}>
          {item.machineCount} machine{item.machineCount > 1 ? 's' : ''} • {item.techCount} technicien{item.techCount > 1 ? 's' : ''}
        </Text>
        <Text size="1" color="gray" style={{ display: 'block' }}>
          {item.count} actions • Temps moyen: {item.avgTime}h/action
        </Text>
      </AnomalyHeader>
      
      <Separator size="4" style={{ margin: '8px 0' }} />
      
      <InterventionsSection interventions={interventions} actionTimeColor="red" />
    </AnomalyContainer>
  );
}

AnomalyTypeF.propTypes = {
  item: PropTypes.shape({
    categoryName: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    severity: PropTypes.oneOf(['high', 'medium', 'low']).isRequired,
    totalTime: PropTypes.number.isRequired,
    interventionCount: PropTypes.number.isRequired,
    machineCount: PropTypes.number.isRequired,
    techCount: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired,
    avgTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
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