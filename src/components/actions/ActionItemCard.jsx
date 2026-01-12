import { Card, Text } from "@radix-ui/themes";
import PropTypes from "prop-types";
import { useCallback, useState, useEffect } from "react";
import { Flex } from "@radix-ui/themes";
import ActionForm from "@/components/actions/ActionForm";
import PurchaseRequestForm from "@/components/purchase/requests/PurchaseRequestForm";
import ActionMetadataHeader from "@/components/common/ActionMetadataHeader";
import ActionButtons from "@/components/common/ActionButtons";
import PurchaseRequestList from "@/components/common/PurchaseRequestList";
import { actions, actionSubcategories, interventions, stock } from "@/lib/api/facade";
import { api } from "@/lib/api/client";
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

export default function ActionItemCard({ action, interventionId, getCategoryColor, sanitizeDescription }) {
  const { user } = useAuth();
  const [localAction, setLocalAction] = useState(action);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [editDataLoaded, setEditDataLoaded] = useState(false);
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

  // Load purchase requests when action has linked requests
  useEffect(() => {
    const loadPurchaseRequests = async () => {
      if (localAction?.purchaseRequestIds && localAction.purchaseRequestIds.length > 0) {
        try {
          const [allRequests, allStockItems] = await Promise.all([
            stock.fetchPurchaseRequests(),
            stock.fetchStockItems()
          ]);
          
          const requests = localAction.purchaseRequestIds
            .map(id => allRequests.find(pr => pr.id === id))
            .filter(Boolean)
            .map(pr => {
              // Add stockItemCode if stockItemId exists
              if (pr.stockItemId) {
                const stockItem = allStockItems.find(item => item.id === pr.stockItemId);
                return {
                  ...pr,
                  stockItemCode: stockItem?.ref || null
                };
              }
              return pr;
            });
          
          setPurchaseRequests(requests);
        } catch (error) {
          console.error('Error loading purchase requests:', error);
        }
      } else {
        setPurchaseRequests([]);
      }
    };
    loadPurchaseRequests();
  }, [localAction?.purchaseRequestIds]);

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

  const handleSubmitPurchaseRequest = useCallback(async (requestData) => {
    try {
      // Get action ID (always present)
      const actionId = localAction?.id || action?.id;

      if (!interventionId || !actionId) {
        throw new Error(`Impossible de créer la demande: ${!actionId ? 'action' : 'intervention'} absente`);
      }

      // Create purchase request with intervention context
      const purchaseRequest = {
        item_label: requestData.item_label,
        quantity: requestData.quantity,
        unit: requestData.unit,
        urgency: requestData.urgency,
        requested_by: requestData.requested_by,
        stock_item_id: requestData.stock_item_id || null,
        intervention_id: interventionId,
      };

      // Call API to create purchase request
      const created = await stock.createPurchaseRequest(purchaseRequest);

      // Link purchase request to action via nested PATCH on intervention
      if (created?.id) {
        await api.patch(`/items/intervention/${interventionId}`, {
          action: {
            create: [],
            update: [{
              purchase_request_ids: {
                create: [{
                  intervention_action_id: actionId,
                  purchase_request_id: { id: created.id }
                }],
                update: [],
                delete: []
              },
              id: actionId
            }],
            delete: []
          }
        });
      }

      // Close the form on success
      setShowPurchaseForm(false);
    } catch (error) {
      console.error('Error creating purchase request:', error);
    }
  }, [localAction, action, interventionId]);

  const handleDeletePurchaseRequest = useCallback(async (purchaseRequestId) => {
    try {
      const actionId = localAction?.id || action?.id;

      if (!interventionId || !actionId) {
        throw new Error('Impossible de supprimer la demande: intervention ou action absente');
      }

      // Find and delete the M2M junction record directly
      // First, fetch the junction record to get its ID
      const junctionResponse = await api.get('/items/intervention_action_purchase_request', {
        params: {
          filter: {
            intervention_action_id: { _eq: actionId },
            purchase_request_id: { _eq: purchaseRequestId }
          },
          fields: 'id'
        }
      });

      const junctionRecords = junctionResponse.data?.data || [];
      
      // Delete each junction record found
      for (const record of junctionRecords) {
        await api.delete(`/items/intervention_action_purchase_request/${record.id}`);
      }

      // Delete the purchase request itself
      await stock.deletePurchaseRequest(purchaseRequestId);

      // Update local state to remove the deleted request
      setPurchaseRequests(prev => prev.filter(pr => pr.id !== purchaseRequestId));
    } catch (error) {
      console.error('Error deleting purchase request:', error);
      throw error; // Re-throw to let the dialog handle the error state
    }
  }, [localAction, action, interventionId]);

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
          initialState={buildInitialEditState()}
          metadata={{ subcategories, complexityFactors }}
          onCancel={() => setShowEditForm(false)}
          onSubmit={handleSubmitEdit}
          style={{ marginTop: '0.75rem' }}
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
};
