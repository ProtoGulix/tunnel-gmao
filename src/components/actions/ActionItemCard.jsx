import { Card, Flex, Text, Badge } from "@radix-ui/themes";
import { Clock, User, Edit2, Copy, Trash2 } from "lucide-react";
import PropTypes from "prop-types";
import { useCallback, useState, useEffect } from "react";
import ActionForm from "@/components/actions/ActionForm";
import { actions, actionSubcategories, interventions } from "@/lib/api/facade";
import { useAuth } from "@/auth/useAuth";

// DTO-friendly accessors with legacy fallback
const getComplexityScore = (action) => Number(action?.complexityScore ?? action?.complexity_score ?? 0);
const getTimeSpent = (action) => Number(action?.timeSpent ?? action?.time_spent ?? 0);
const getSubcategory = (action) => action?.subcategory ?? null;
const getTechnician = (action) => action?.technician ?? null;
const getCreatedAt = (action) => action?.createdAt ?? action?.created_at ?? null;
const getDescription = (action) => action?.description ?? "";
const getComplexityFactors = (action) => action?.complexityFactors ?? [];
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
  const { user } = useAuth();
  const [localAction, setLocalAction] = useState(action);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editDataLoaded, setEditDataLoaded] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [complexityFactors, setComplexityFactors] = useState([]);

  const complexityScore = getComplexityScore(localAction);
  const complexityInfo = getComplexityColor(complexityScore);
  const subcategory = getSubcategory(localAction);
  const technician = getTechnician(localAction);
  const createdAt = getCreatedAt(localAction);
  const timeSpent = getTimeSpent(localAction);
  const description = getDescription(localAction);
  const actionComplexityFactors = getComplexityFactors(localAction);

  // Sync localAction when action prop changes (e.g., parent refetch)
  useEffect(() => {
    setLocalAction(action);
  }, [action]);

  // Compute initial state fresh from current localAction
  const buildInitialEditState = () => {
    const dateIso = createdAt ? new Date(createdAt).toISOString().split('T')[0] : '';
    return {
      time: timeSpent || '',
      date: dateIso,
      category: subcategory?.id ? String(subcategory.id) : '',
      description: description || '',
      complexity: String(complexityScore || '5'),
      complexityFactors: Array.isArray(localAction?.complexityFactors) ? [...localAction.complexityFactors] : [],
    };
  };

  const handleOpenEdit = useCallback(async () => {
    setShowEditForm((prev) => !prev);
    if (!editDataLoaded) {
      try {
        const [subcatsData, factorsData] = await Promise.all([
          actionSubcategories.fetchActionSubcategories(),
          interventions.fetchComplexityFactors(),
        ]);
        setSubcategories(subcatsData || []);
        setComplexityFactors(factorsData || []);
        setEditDataLoaded(true);
      } catch (e) {
        // Silent fail: ActionForm will show metadata error card if needed
        setEditDataLoaded(true);
      }
    }
  }, [editDataLoaded]);

  const handleSubmitEdit = useCallback(async (formData) => {
    const updates = {
      description: formData.description,
      timeSpent: parseFloat(formData.time) || 0,
      date: formData.date || undefined,
      complexityScore: parseInt(formData.complexity) || undefined,
      subcategory: formData.category ? { id: String(formData.category) } : undefined,
      // Preserve or set technician
      technician: (localAction.technician?.id
        ? { id: localAction.technician.id }
        : (user?.id ? { id: user.id } : undefined)),
      // Ensure intervention context stays attached
      intervention: localAction.intervention?.id ? { id: String(localAction.intervention.id) } : undefined,
      // Always include complexityFactors to allow updates/clearing
      complexityFactors: Array.isArray(formData.complexityFactors) ? formData.complexityFactors : [],
    };
    const updated = await actions.updateAction(String(localAction.id), updates);
    setLocalAction(updated || localAction);
    setShowEditForm(false);
  }, [localAction, user?.id]);

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

          {/* Facteur de complexité */}
          {actionComplexityFactors.length > 0 && (
            <Text size="1" color="gray" style={{ fontStyle: 'italic' }}>
              ({actionComplexityFactors.map((code) => {
                const factor = complexityFactors.find(f => f.id === code);
                return factor?.label || code;
              }).join(', ')})
            </Text>
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
            onClick={handleOpenEdit}
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

      {/* EDIT FORM */}
      {showEditForm && (
        <ActionForm
          initialState={buildInitialEditState()}
          metadata={{ subcategories, complexityFactors }}
          onCancel={() => setShowEditForm(false)}
          onSubmit={handleSubmitEdit}
          style={{ marginTop: '0.75rem' }}
        />
      )}
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
