import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Text, Separator } from "@radix-ui/themes";
import { AnomalyContainer, AnomalyHeader, SingleActionDetail } from "./AnomalyHelpers";

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
  const severityColor = item.severity === 'high' ? 'red' : 'orange';
  
  return (
    <AnomalyContainer severity={item.severity}>
      <AnomalyHeader
        title={item.intervention || 'N/A'}
        subtitle={`${item.interventionTitle || 'Sans titre'}`}
        severity={item.severity}
        badges={[
          { color: severityColor, label: `${item.time}h`, size: "2" }
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
          {item.categoryName} ({item.category}) • Machine: {item.machine}
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

AnomalyTypeC.propTypes = {
  item: PropTypes.shape({
    interventionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    intervention: PropTypes.string.isRequired,
    interventionTitle: PropTypes.string,
    severity: PropTypes.oneOf(['high', 'medium', 'low']).isRequired,
    time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    categoryName: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    machine: PropTypes.string.isRequired,
    tech: PropTypes.string.isRequired,
    date: PropTypes.string.isRequired,
    description: PropTypes.string,
    action: PropTypes.shape({
      description: PropTypes.string
    })
  }).isRequired
};