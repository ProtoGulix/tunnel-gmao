import { Card, Flex, Text, Badge } from "@radix-ui/themes";
import { Clock, User, Edit2, Copy, Trash2 } from "lucide-react";
import PropTypes from "prop-types";

// DTO-friendly accessors with legacy fallback
const getComplexityScore = (action) => Number(action?.complexityScore ?? action?.complexity_score ?? 0);
const getTimeSpent = (action) => Number(action?.timeSpent ?? action?.time_spent ?? 0);
const getSubcategory = (action) => action?.subcategory ?? null;
const getTechnician = (action) => action?.technician ?? null;
const getCreatedAt = (action) => action?.createdAt ?? action?.created_at ?? null;
const getDescription = (action) => action?.description ?? "";
const getTechnicianFirstName = (technician) => technician?.firstName ?? technician?.first_name ?? "—";
const getTechnicianLastName = (technician) => technician?.lastName ?? technician?.last_name ?? "—";
const getSubcategoryCode = (subcategory) => subcategory?.code ?? "—";

const getComplexityColor = (score) => {
  const complexityScore = parseInt(score);
  if (complexityScore <= 3) return { color: 'gray', label: 'Banale' };
  if (complexityScore <= 6) return { color: 'orange', label: 'Moyen' };
  return { color: 'red', label: 'Complexe' };
};

export default function ActionItemCard({ action, getCategoryColor, sanitizeDescription }) {
  const complexityScore = getComplexityScore(action);
  const complexityInfo = getComplexityColor(complexityScore);
  const subcategory = getSubcategory(action);
  const technician = getTechnician(action);
  const createdAt = getCreatedAt(action);
  const timeSpent = getTimeSpent(action);
  const description = getDescription(action);

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
          {subcategory && (
            <Badge 
              variant="soft" 
              size="2"
              style={{ 
                flexShrink: 0,
                backgroundColor: getCategoryColor(subcategory) || '#6b7280',
                color: 'white'
              }}
            >
              {getSubcategoryCode(subcategory)}
            </Badge>
          )}

          {/* Temps */}
          {timeSpent > 0 && (
            <Flex align="center" gap="1">
              <Clock size={14} color="var(--gray-9)" />
              <Text size="2" weight="medium">
                {timeSpent}h
              </Text>
            </Flex>
          )}

          {/* Complexité */}
          {complexityScore > 0 && (
            <Badge 
              color={complexityInfo.color} 
              variant="soft" 
              size="1"
              title={`Complexité: ${complexityScore}/10 (${complexityInfo.label})`}
            >
              {complexityScore}/10
            </Badge>
          )}

          {/* Technicien */}
          {technician && (
            <Flex align="center" gap="1">
              <User size={14} color="var(--gray-8)" />
              <Text size="2" color="gray">
                {getTechnicianFirstName(technician)} {getTechnicianLastName(technician)}
              </Text>
            </Flex>
          )}

          {/* Horaire */}
          {createdAt && (
            <Text size="2" color="gray">
              {new Date(createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
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
        {sanitizeDescription(description)}
      </Text>
    </Card>
  );
}

ActionItemCard.displayName = "ActionItemCard";

ActionItemCard.propTypes = {
  action: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.string,
    timeSpent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    time_spent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    complexityScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    complexity_score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    createdAt: PropTypes.string,
    created_at: PropTypes.string,
    technician: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      firstName: PropTypes.string,
      first_name: PropTypes.string,
      lastName: PropTypes.string,
      last_name: PropTypes.string,
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
  }),
  getCategoryColor: PropTypes.func.isRequired,
  sanitizeDescription: PropTypes.func.isRequired,
};
