import { Flex, Text, Badge, Button } from "@radix-ui/themes";
import { ShoppingCart, Trash2, AlertTriangle, X, Check } from "lucide-react";
import PropTypes from "prop-types";
import { useState } from "react";
import StockRefLink from "@/components/common/StockRefLink";

/**
 * PurchaseRequestItem - Individual purchase request item with inline delete confirmation
 */
function PurchaseRequestItem({ pr, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
      
      {pr.stockItemCode && (
        <StockRefLink 
          reference={pr.stockItemCode}
          tab="stock"
          color="gray"
          variant="outline"
          size="1"
        />
      )}

      <Text size="2" weight="medium" style={{ flex: 1, minWidth: 0 }}>
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
          color={pr.status === 'open' ? 'blue' : pr.status === 'ordered' ? 'orange' : 'green'} 
          variant="soft" 
          size="1"
        >
          {pr.status}
        </Badge>

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
    quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    unit: PropTypes.string.isRequired,
    urgency: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
  onDelete: PropTypes.func,
};

/**
 * PurchaseRequestList - Displays a list of linked purchase requests
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
      quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      unit: PropTypes.string.isRequired,
      urgency: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
    })
  ),
  onDelete: PropTypes.func,
};
