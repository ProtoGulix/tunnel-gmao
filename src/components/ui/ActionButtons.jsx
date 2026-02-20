import { Flex, Badge } from "@radix-ui/themes";
import { Edit2, Copy, Trash2, ShoppingCart } from "lucide-react";
import PropTypes from "prop-types";

/**
 * ActionButtons - Action buttons for editing, duplicating, purchasing, deleting
 */
export default function ActionButtons({
  onEdit,
  onDuplicate,
  onPurchase,
  onDelete,
  purchaseRequestCount = 0,
}) {
  return (
    <Flex gap="1" style={{ flexShrink: 0 }}>
      {onEdit && (
        <button 
          title="Éditer cette action"
          style={{ background: 'none', border: 'none', color: 'var(--gray-9)', padding: '4px 6px', cursor: 'pointer' }}
          onClick={onEdit}
        >
          <Edit2 size={14} />
          <span className="action-button-text" style={{ marginLeft: 4, fontSize: 12 }}>Éditer</span>
        </button>
      )}
      
      {onDuplicate && (
        <button 
          title="Dupliquer cette action"
          style={{ background: 'none', border: 'none', color: 'var(--gray-9)', padding: '4px 6px', cursor: 'pointer' }}
          onClick={onDuplicate}
        >
          <Copy size={14} />
          <span className="action-button-text" style={{ marginLeft: 4, fontSize: 12 }}>Dupliquer</span>
        </button>
      )}
      
      {onPurchase && (
        <button 
          title="Créer une demande d'achat liée"
          style={{ background: 'none', border: 'none', color: 'var(--orange-9)', padding: '4px 6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          onClick={onPurchase}
        >
          <ShoppingCart size={14} />
          <span className="action-button-text" style={{ marginLeft: 4, fontSize: 12 }}>Demande d&apos;achat</span>
          {purchaseRequestCount > 0 && (
            <Badge color="orange" variant="solid" size="1" style={{ marginLeft: 2 }}>
              {purchaseRequestCount}
            </Badge>
          )}
        </button>
      )}
      
      {onDelete && (
        <button 
          title="Supprimer cette action"
          style={{ background: 'none', border: 'none', color: 'var(--red-9)', padding: '4px 6px', cursor: 'pointer' }}
          onClick={onDelete}
        >
          <Trash2 size={14} />
          <span className="action-button-text" style={{ marginLeft: 4, fontSize: 12 }}>Supprimer</span>
        </button>
      )}
    </Flex>
  );
}

ActionButtons.displayName = "ActionButtons";

ActionButtons.propTypes = {
  onEdit: PropTypes.func,
  onDuplicate: PropTypes.func,
  onPurchase: PropTypes.func,
  onDelete: PropTypes.func,
  purchaseRequestCount: PropTypes.number,
};
