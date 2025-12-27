import { Card, Flex, Text, Badge } from "@radix-ui/themes";
import { Clock, User, Edit2, Copy, Trash2 } from "lucide-react";
import PropTypes from "prop-types";

const getComplexityColor = (score) => {
  const complexityScore = parseInt(score);
  if (complexityScore <= 3) return { color: 'gray', label: 'Banale' };
  if (complexityScore <= 6) return { color: 'orange', label: 'Moyen' };
  return { color: 'red', label: 'Complexe' };
};

export default function ActionItemCard({ action, getCategoryColor, sanitizeDescription }) {
  const complexityInfo = getComplexityColor(action.complexityScore);

  return (
    <Card 
      key={action.id}
      size="2"
      style={{
        marginBottom: '0.75rem',
        border: '1px solid var(--gray-6)',
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--blue-6)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--gray-6)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
      }}
    >
      {/* HEADER : Métadonnées + Actions */}
      <Flex 
        align="center" 
        justify="between"
        gap="2"
        wrap="wrap"
        style={{ 
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--gray-5)',
          marginBottom: '0.75rem'
        }}
      >
        <Flex align="center" gap="2" wrap="wrap" style={{ flex: 1, minWidth: 0 }}>
          {/* Catégorie */}
          {action.subcategory && (
            <Badge 
              variant="soft" 
              size="2"
              color={getCategoryColor(action.subcategory)}
              style={{ flexShrink: 0 }}
            >
              {action.subcategory.code || '—'}
            </Badge>
          )}

          {/* Temps */}
          {action.timeSpent && (
            <Flex align="center" gap="1">
              <Clock size={14} color="var(--gray-9)" />
              <Text size="2" weight="medium">
                {action.timeSpent}h
              </Text>
            </Flex>
          )}

          {/* Complexité */}
          {action.complexityScore && (
            <Badge 
              color={complexityInfo.color} 
              variant="soft" 
              size="1"
              title={`Complexité: ${action.complexityScore}/10 (${complexityInfo.label})`}
            >
              {action.complexityScore}/10
            </Badge>
          )}

          {/* Technicien */}
          {action.technician && (
            <Flex align="center" gap="1">
              <User size={14} color="var(--gray-8)" />
              <Text size="2" color="gray">
                {action.technician.firstName} {action.technician.lastName}
              </Text>
            </Flex>
          )}

          {/* Horaire */}
          {action.createdAt && (
            <Text size="2" color="gray">
              {new Date(action.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </Flex>

        {/* Actions rapides */}
        <Flex gap="1" style={{ flexShrink: 0 }}>
          <button 
            title="Éditer cette action"
            style={{ background: 'none', border: 'none', color: 'var(--gray-9)', padding: '4px 6px', cursor: 'pointer' }}
          >
            <Edit2 size={14} />
            <span className="action-button-text" style={{ marginLeft: 4, fontSize: 12 }}>Éditer</span>
          </button>
          <button 
            title="Dupliquer cette action"
            style={{ background: 'none', border: 'none', color: 'var(--gray-9)', padding: '4px 6px', cursor: 'pointer' }}
          >
            <Copy size={14} />
            <span className="action-button-text" style={{ marginLeft: 4, fontSize: 12 }}>Dupliquer</span>
          </button>
          <button 
            title="Supprimer cette action"
            style={{ background: 'none', border: 'none', color: 'var(--red-9)', padding: '4px 6px', cursor: 'pointer' }}
          >
            <Trash2 size={14} />
            <span className="action-button-text" style={{ marginLeft: 4, fontSize: 12 }}>Supprimer</span>
          </button>
        </Flex>
      </Flex>

      {/* CONTENT : Description */}
      <Text 
        size="2"
        style={{ lineHeight: '1.5', wordBreak: 'break-word' }}
      >
        {sanitizeDescription(action.description)}
      </Text>
    </Card>
  );
}

ActionItemCard.propTypes = {
  action: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    description: PropTypes.string.isRequired,
    timeSpent: PropTypes.number,
    complexityScore: PropTypes.number,
    createdAt: PropTypes.string,
    technician: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      firstName: PropTypes.string,
      lastName: PropTypes.string,
    }),
    subcategory: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      code: PropTypes.string,
      name: PropTypes.string,
      category_id: PropTypes.shape({
        code: PropTypes.string,
        name: PropTypes.string,
      }),
    }),
  }).isRequired,
  getCategoryColor: PropTypes.func.isRequired,
  sanitizeDescription: PropTypes.func.isRequired,
};
