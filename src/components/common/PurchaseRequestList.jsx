/**
 * @fileoverview Composant d'affichage de liste de demandes d'achat avec suppression inline
 * @module components/common/PurchaseRequestList
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */
import { Flex, Text, Badge, Button } from "@radix-ui/themes";
import { ShoppingCart, Trash2, AlertTriangle, X, Check, Package } from "lucide-react";
import PropTypes from "prop-types";
import { useState } from "react";
import StockRefLink from "@/components/common/StockRefLink";
import { derivePurchaseRequestStatus } from "@/lib/purchasing/purchaseRequestStatusUtils";

/** Configuration des badges de statut */
const STATUS_BADGE_CONFIG = {
  pooling: { color: 'purple', label: 'Mutualisation' },
  sent: { color: 'blue', label: 'Devis envoyé' },
  ordered: { color: 'green', label: 'Commandée' },
  received: { color: 'green', label: 'Reçue' },
  cancelled: { color: 'red', label: 'Annulée' },
  open: { color: 'blue', label: 'En attente' },
  in_progress: { color: 'blue', label: 'En attente' },
  default: { color: 'gray', label: 'Ouverte' }
};

/**
 * Récupère le numéro du panier sélectionné depuis les relations supplier_order
 * @param {Object} pr - Purchase request avec relations supplier_order_line_ids
 * @returns {string|null} Numéro du panier ou null si non trouvé
 */
const getSelectedBasketInfo = (pr) => {
  const orderLineRelations = pr.supplier_order_line_ids || pr.supplierOrderLineIds || [];
  const selectedLine = orderLineRelations.find(relation => {
    const lineData = relation.supplier_order_line_id || relation.supplierOrderLineId;
    return lineData && (lineData.is_selected === true || lineData.isSelected === true);
  });
  
  if (selectedLine) {
    const lineData = selectedLine.supplier_order_line_id || selectedLine.supplierOrderLineId;
    const supplierOrder = lineData?.supplier_order_id || lineData?.supplierOrderId;
    return supplierOrder?.order_number || supplierOrder?.orderNumber || null;
  }
  return null;
};

/**
 * Détermine les props du badge de statut (couleur + label)
 * @param {string} statusId - Identifiant du statut
 * @returns {{color: string, label: string}} Configuration du badge
 */
const getStatusBadgeProps = (statusId) => {
  return STATUS_BADGE_CONFIG[statusId] || STATUS_BADGE_CONFIG.default;
};

/**
 * Élément individuel de demande d'achat avec confirmation de suppression inline
 * @component
 * @param {Object} props
 * @param {Object} props.pr - Purchase request avec relations et données
 * @param {Function} [props.onDelete] - Callback de suppression (requestId)
 * @returns {JSX.Element} Item de demande d'achat
 * @example
 * <PurchaseRequestItem 
 *   pr={purchaseRequest} 
 *   onDelete={(id) => handleDelete(id)}
 * />
 */
function PurchaseRequestItem({ pr, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Dériver le statut depuis supplier_order
  const derivedStatus = pr.derived_status || derivePurchaseRequestStatus(pr);
  const statusId = typeof derivedStatus === "string" ? derivedStatus : derivedStatus?.id;

  const basketNumber = getSelectedBasketInfo(pr);
  const statusBadge = getStatusBadgeProps(statusId);

  const handleDeleteClick = () => {
    setShowConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(pr.id);
    } catch (error) {
      console.error('Error deleting purchase request:', error);
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleCancelDelete = () => {
    setShowConfirm(false);
  };

  const isToQualify = !pr.stockItemId || pr.itemLabel === "À qualifier";

  // Récupérer la référence stock
  const stockRef = pr.stockItemRef || pr.stock_item_ref || pr.stockItemCode;

  return (
    <Flex 
      align="center" 
      gap="2" 
      style={{ 
        padding: '8px', 
        backgroundColor: isToQualify ? 'var(--amber-2)' : 'var(--gray-2)', 
        borderRadius: '4px',
        position: 'relative'
      }}
    >
      <ShoppingCart size={14} color={isToQualify ? "var(--amber-9)" : "var(--orange-9)"} style={{ flexShrink: 0 }} />
      
      {stockRef && (
        <StockRefLink 
          reference={stockRef}
          tab="stock"
          color="gray"
          variant="outline"
          size="1"
        />
      )}

      <Text 
        size="2" 
        weight="medium" 
        style={{ 
          flex: 1, 
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}
      >
        {pr.itemLabel}
      </Text>

      {isToQualify && (
        <Flex align="center" gap="1" style={{ flexShrink: 0 }}>
          <AlertTriangle size={12} color="var(--amber-9)" />
          <Text size="1" color="amber">
            À qualifier
          </Text>
        </Flex>
      )}

      <Flex gap="1" align="center" style={{ flexShrink: 0 }}>
        <Badge color="blue" variant="soft" size="1">
          {pr.quantity} {pr.unit}
        </Badge>
        <Badge 
          color={pr.urgency === 'urgent' ? 'red' : pr.urgency === 'high' ? 'orange' : 'gray'} 
          variant="soft" 
          size="1"
        >
          {pr.urgency}
        </Badge>
        <Badge 
          color={statusBadge.color} 
          variant="soft" 
          size="1"
        >
          {statusBadge.label}
        </Badge>
        {basketNumber && (
          <Badge 
            color="indigo" 
            variant="outline" 
            size="1"
          >
            <Flex align="center" gap="1">
              <Package size={12} />
              {basketNumber}
            </Flex>
          </Badge>
        )}
        {onDelete && !showConfirm && (
          <button
            title="Supprimer cette demande d'achat"
            onClick={handleDeleteClick}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--red-9)',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Trash2 size={14} />
          </button>
        )}

        {onDelete && showConfirm && (
          <Flex gap="1" align="center">
            <Button
              size="1"
              variant="solid"
              color="red"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              style={{ cursor: isDeleting ? 'wait' : 'pointer' }}
            >
              {isDeleting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ 
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    border: '2px solid white',
                    borderTopColor: 'transparent',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite'
                  }} />
                  Suppression...
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={12} />
                  Confirmer
                </span>
              )}
            </Button>
            <Button
              size="1"
              variant="soft"
              color="gray"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              <X size={12} />
              Annuler
            </Button>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
}

PurchaseRequestItem.propTypes = {
  pr: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    itemLabel: PropTypes.string.isRequired,
    stockItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    stockItemCode: PropTypes.string,
    stockItemRef: PropTypes.string,
    stock_item_ref: PropTypes.string,
    quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    unit: PropTypes.string.isRequired,
    urgency: PropTypes.string.isRequired,
    derived_status: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    supplier_order_line_ids: PropTypes.array,
    supplierOrderLineIds: PropTypes.array,
  }).isRequired,
  onDelete: PropTypes.func,
};

/**
 * Liste de demandes d'achat liées à une action/intervention
 * @component
 * @param {Object} props
 * @param {Array} [props.purchaseRequests] - Liste des demandes d'achat
 * @param {Function} [props.onDelete] - Callback de suppression (requestId)
 * @returns {JSX.Element|null} Liste des demandes ou null si vide
 * @example
 * <PurchaseRequestList 
 *   purchaseRequests={requests}
 *   onDelete={(id) => handleDelete(id)}
 * />
 */
export default function PurchaseRequestList({ purchaseRequests, onDelete }) {
  if (!purchaseRequests || purchaseRequests.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--gray-5)' }}>
      <Flex direction="column" gap="2">
        <Text size="2" weight="bold" color="gray">
          Demandes d&apos;achat liées ({purchaseRequests.length})
        </Text>
        {purchaseRequests.map(pr => (
          <PurchaseRequestItem 
            key={pr.id} 
            pr={pr} 
            onDelete={onDelete}
          />
        ))}
      </Flex>
    </div>
  );
}

PurchaseRequestList.displayName = "PurchaseRequestList";

PurchaseRequestList.propTypes = {
  purchaseRequests: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      itemLabel: PropTypes.string.isRequired,
      stockItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      stockItemCode: PropTypes.string,
      stockItemRef: PropTypes.string,
      stock_item_ref: PropTypes.string,
      quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      unit: PropTypes.string.isRequired,
      urgency: PropTypes.string.isRequired,
      derived_status: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      supplier_order_line_ids: PropTypes.array,
      supplierOrderLineIds: PropTypes.array,
    })
  ),
  onDelete: PropTypes.func,
};
