/* eslint-disable complexity, max-lines, react/prop-types */
import { Card, Text } from "@radix-ui/themes";
import PropTypes from "prop-types";
import { useCallback, useState, useEffect } from "react";
import { Flex } from "@radix-ui/themes";
import ActionForm from "@/components/interventions/ActionForm";
import PurchaseRequestForm from "@/components/purchase-requests/PurchaseRequestForm";
import ActionMetadataHeader from "@/components/ui/ActionMetadataHeader";
import ActionButtons from "@/components/ui/ActionButtons";
import PurchaseRequestList from "@/components/ui/PurchaseRequestList";
import * as actionsApi from "@/api/actions";
import * as actionCategoriesApi from "@/api/actionCategories";
import * as complexityFactorsApi from "@/api/complexityFactors";
import * as stockApi from "@/api/stock";
import { useAuth } from "@/auth/useAuth";

// DTO-friendly accessors with legacy fallback
const getComplexityScore = (action) => Number(action?.complexityScore ?? action?.complexity_score ?? 0);
const getTimeSpent = (action) => Number(action?.timeSpent ?? action?.time_spent ?? 0);
const getSubcategory = (action) => action?.subcategory ?? null;
const getTechnician = (action) => action?.technician ?? null;
const getCreatedAt = (action) => action?.createdAt ?? action?.created_at ?? null;
const getDescription = (action) => action?.description ?? "";
const getComplexityFactors = (action) => {
  const factors = action?.complexityFactors ?? [];
  // Extraire les codes si ce sont des objets {code: "PCE"}
  return Array.isArray(factors) ? factors.map((f) => (typeof f === 'string' ? f : f?.code)).filter(Boolean) : [];
};

const getComplexityColor = (score) => {
  const complexityScore = parseInt(score);
  if (complexityScore <= 3) return { color: 'gray', label: 'Banale' };
  if (complexityScore <= 6) return { color: 'orange', label: 'Moyen' };
  return { color: 'red', label: 'Complexe' };
};

export default function ActionItemCard({ action, interventionId, getCategoryColor, sanitizeDescription, onPurchaseRequestCreated }) {
  const { user } = useAuth();
  const [localAction, setLocalAction] = useState(action);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [purchaseFormLoading, setPurchaseFormLoading] = useState(false);
  const [editDataLoaded, setEditDataLoaded] = useState(false);
  const [fetchedAction, setFetchedAction] = useState(null);
  const [subcategories, setSubcategories] = useState([]);
  const [complexityFactors, setComplexityFactors] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);

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

  // Use purchase requests directly from action (already complete objects from API)
  useEffect(() => {
    if (localAction?.purchaseRequests && Array.isArray(localAction.purchaseRequests)) {
      setPurchaseRequests(localAction.purchaseRequests);
    } else {
      setPurchaseRequests([]);
    }
  }, [localAction?.purchaseRequests]);

  // Compute initial state — prefer full action data fetched from GET /intervention-actions/{id}
  const buildInitialEditState = () => {
    const source = fetchedAction ?? localAction;
    const sourceCreatedAt = getCreatedAt(source);
    const dateIso = sourceCreatedAt ? new Date(sourceCreatedAt).toISOString().split('T')[0] : '';
    return {
      date: dateIso,
      category: getSubcategory(source)?.id ? String(getSubcategory(source).id) : '',
      description: getDescription(source) || '',
      complexity: getComplexityScore(source) ? String(getComplexityScore(source)) : '',
      complexityFactors: getComplexityFactors(source),
      actionStart: source?.actionStart ?? null,
      actionEnd: source?.actionEnd ?? null,
    };
  };

  const handleOpenEdit = useCallback(async () => {
    if (showEditForm) {
      setShowEditForm(false);
      return;
    }

    const shouldLoadMeta = !editDataLoaded;
    try {
      const [actionData, categoriesData, factorsData] = await Promise.all([
        actionsApi.fetchAction(String(localAction.id)),
        shouldLoadMeta ? actionCategoriesApi.fetchActionCategories() : Promise.resolve(null),
        shouldLoadMeta ? complexityFactorsApi.fetchComplexityFactors() : Promise.resolve(null),
      ]);
      setFetchedAction(actionData);
      if (shouldLoadMeta && categoriesData) {
        setSubcategories(categoriesData || []);
        setComplexityFactors(factorsData || []);
        setEditDataLoaded(true);
      }
    } catch {
      // Silent fail: ActionForm will show metadata error card if needed
      if (shouldLoadMeta) setEditDataLoaded(true);
    } finally {
      setShowEditForm(true);
    }
  }, [showEditForm, editDataLoaded, localAction]);

  const handleSubmitEdit = useCallback(async (formData) => {
    const updates = {
      description: formData.description,
      // Bornes horaires (nouveau format) ou time_spent (ancien format)
      ...(formData.action_start && formData.action_end
        ? { actionStart: formData.action_start, actionEnd: formData.action_end }
        : { timeSpent: parseFloat(formData.time_spent) || 0 }
      ),
      date: formData.created_at || undefined,
      complexityScore: formData.complexity_score || undefined,
      subcategory: formData.action_subcategory ? { id: String(formData.action_subcategory) } : undefined,
      // Preserve or set technician
      technician: (localAction.technician?.id
        ? { id: localAction.technician.id }
        : (user?.id ? { id: user.id } : undefined)),
      // Ensure intervention context stays attached
      intervention: interventionId ? { id: String(interventionId) } : undefined,
      // Always include complexityFactors to allow updates/clearing
      complexityFactors: formData.complexity_factor ? [formData.complexity_factor] : [],
    };
    const updated = await actionsApi.updateAction(String(localAction.id), updates);
    setLocalAction(updated || localAction);
    setShowEditForm(false);
  }, [localAction, user?.id, interventionId]);

  const handleSubmitPurchaseRequest = useCallback(async (requestData) => {
    try {
      setPurchaseFormLoading(true);
      const created = await stockApi.createPurchaseRequest({
        item_label: requestData.item_label,
        quantity: requestData.quantity,
        unit: requestData.unit,
        urgency: requestData.urgency,
        requested_by: requestData.requested_by,
        stock_item_id: requestData.stock_item_id || null,
        intervention_action_id: localAction.id,
      });

      if (created?.id) {
        setPurchaseRequests(prev => [...prev, created]);
        onPurchaseRequestCreated?.(created);
      }

      setShowPurchaseForm(false);
    } catch (error) {
      console.error('Error creating purchase request:', error);
    } finally {
      setPurchaseFormLoading(false);
    }
  }, [localAction.id, onPurchaseRequestCreated]);

  const handleDeletePurchaseRequest = useCallback(async (purchaseRequestId) => {
    try {
      await stockApi.deletePurchaseRequest(purchaseRequestId);
      setPurchaseRequests(prev => prev.filter(pr => pr.id !== purchaseRequestId));
    } catch (error) {
      console.error('Error deleting purchase request:', error);
      throw error;
    }
  }, []);

  // Couleur de bordure selon la complexité
  const borderColor = complexityScore > 5 ? 'var(--red-7)' : 'var(--gray-6)';
  const hoverBorderColor = complexityScore > 5 ? 'var(--red-9)' : 'var(--blue-6)';
  
  return (
    <Card 
      key={action.id}
      size="2"
      style={{
        marginBottom: '0.75rem',
        border: `2px solid ${borderColor}`,
        transition: 'all 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
        backgroundColor: complexityScore > 5 ? 'var(--red-1)' : 'white'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = hoverBorderColor;
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = borderColor;
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
        <ActionMetadataHeader
          subcategory={subcategory}
          timeSpent={timeSpent}
          complexityScore={complexityScore}
          complexityInfo={complexityInfo}
          complexityFactors={actionComplexityFactors}
          complexityFactorsList={complexityFactors}
          technician={technician}
          createdAt={createdAt}
          getCategoryColor={getCategoryColor}
        />

        <ActionButtons
          onEdit={handleOpenEdit}
          onDuplicate={undefined}
          onPurchase={() => setShowPurchaseForm(!showPurchaseForm)}
          onDelete={undefined}
          purchaseRequestCount={purchaseRequests.length}
        />
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
          key={localAction.id}
          initialState={buildInitialEditState()}
          metadata={{ subcategories, complexityFactors }}
          onCancel={() => setShowEditForm(false)}
          onSubmit={handleSubmitEdit}
          style={{ marginTop: '0.75rem' }}
          interventionId={interventionId ? String(interventionId) : null}
          legacyTimeSpent={timeSpent || null}
        />
      )}

      {/* PURCHASE REQUEST FORM DROPDOWN */}
      {showPurchaseForm && (
        <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--gray-5)' }}>
          <PurchaseRequestForm
            interventionId={localAction.intervention?.id || action.intervention?.id}
            actionId={localAction.id || action.id}
            onSubmit={handleSubmitPurchaseRequest}
            onCancel={() => setShowPurchaseForm(false)}
            loading={purchaseFormLoading}
            compact
          />
        </div>
      )}

      {/* PURCHASE REQUESTS LIST */}
      <PurchaseRequestList 
        purchaseRequests={purchaseRequests} 
        onDelete={handleDeletePurchaseRequest}
      />
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
  interventionId: PropTypes.string,
  getCategoryColor: PropTypes.func.isRequired,
  sanitizeDescription: PropTypes.func.isRequired,
  onPurchaseRequestCreated: PropTypes.func,
};
