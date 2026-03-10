/**
 * Élément individuel de demande d'achat avec confirmation de suppression inline.
 * @module components/ui/PurchaseRequestItem
 */
import { Flex, Text, Badge, Button } from "@radix-ui/themes";
import { ShoppingCart, Trash2, AlertTriangle, X, Check, Package } from "lucide-react";
import PropTypes from "prop-types";
import { useState } from "react";
import StockRefLink from "@/components/ui/StockRefLink";
import { hexBadgeStyle } from "@/config/purchaseConfig";

const getSelectedBasketNumber = (pr) => {
  const selected = (pr.order_lines || []).find(l => l.is_selected === true);
  return selected?.supplier_order_number || null;
};

const derivePrStyle = (isToQualify, isConsultation) => ({
  bg: isToQualify ? 'var(--amber-2)' : isConsultation ? 'var(--sky-2)' : 'var(--gray-2)',
  icon: isToQualify ? 'var(--amber-9)' : isConsultation ? 'var(--sky-9)' : 'var(--orange-9)',
});

function UrgencyBadge({ urgency }) {
  const color = urgency === 'urgent' || urgency === 'critical' ? 'red' : urgency === 'high' ? 'orange' : 'gray';
  return <Badge color={color} variant="soft" size="1">{urgency}</Badge>;
}

UrgencyBadge.propTypes = { urgency: PropTypes.string };

function StatusBadge({ derivedStatus }) {
  const style = hexBadgeStyle(derivedStatus?.color);
  return (
    <Badge size="1" {...(style ? { style } : { color: 'gray', variant: 'soft' })}>
      {derivedStatus?.label || '—'}
    </Badge>
  );
}

StatusBadge.propTypes = { derivedStatus: PropTypes.object };

function DeleteButton({ onClick }) {
  return (
    <button title="Supprimer" onClick={onClick}
      style={{ background: 'none', border: 'none', color: 'var(--red-9)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      <Trash2 size={14} />
    </button>
  );
}

DeleteButton.propTypes = { onClick: PropTypes.func.isRequired };

function DeleteConfirm({ onConfirm, onCancel, isDeleting }) {
  return (
    <Flex gap="1" align="center">
      <Button size="1" variant="solid" color="red" onClick={onConfirm} disabled={isDeleting}
        style={{ cursor: isDeleting ? 'wait' : 'pointer' }}>
        {isDeleting ? 'Suppression...' : <><Check size={12} /> Confirmer</>}
      </Button>
      <Button size="1" variant="soft" color="gray" onClick={onCancel} disabled={isDeleting}>
        <X size={12} /> Annuler
      </Button>
    </Flex>
  );
}

DeleteConfirm.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isDeleting: PropTypes.bool,
};

function ConsultationHint({ count }) {
  return (
    <Flex align="center" gap="1" style={{ flexShrink: 0 }}>
      <Package size={12} color="var(--sky-9)" />
      <Text size="1" color="sky">{count} offre{count > 1 ? 's' : ''} en cours</Text>
    </Flex>
  );
}

ConsultationHint.propTypes = { count: PropTypes.number.isRequired };

function PrBadges({ quantity, unit, urgency, derivedStatus, basketNumber }) {
  return (
    <Flex gap="1" align="center" style={{ flexShrink: 0 }}>
      <Badge color="blue" variant="soft" size="1">{quantity} {unit}</Badge>
      <UrgencyBadge urgency={urgency} />
      <StatusBadge derivedStatus={derivedStatus} />
      {basketNumber && (
        <Badge color="indigo" variant="outline" size="1">
          <Flex align="center" gap="1"><Package size={12} />{basketNumber}</Flex>
        </Badge>
      )}
    </Flex>
  );
}

PrBadges.propTypes = {
  quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  unit: PropTypes.string,
  urgency: PropTypes.string,
  derivedStatus: PropTypes.object,
  basketNumber: PropTypes.string,
};

/* eslint-disable complexity */
export default function PurchaseRequestItem({ pr, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const itemLabel = pr.item_label || pr.itemLabel || '—';
  const quantity = pr.quantity;
  const unit = pr.unit || 'pcs';
  const urgency = pr.urgency || 'normal';
  const derivedStatus = pr.derived_status;
  const basketNumber = getSelectedBasketNumber(pr);

  const isToQualify = !pr.stock_item_id && !pr.stockItemId;
  const isConsultation = derivedStatus?.code === 'CONSULTATION';
  const consultationCount = isConsultation ? (pr.order_lines?.length ?? 0) : 0;
  const stockRef = pr.stock_item?.ref || pr.stockItemRef || pr.stock_item_ref || pr.stockItemCode;
  const { bg, icon } = derivePrStyle(isToQualify, isConsultation);

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(pr.id);
    } catch {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  return (
    <Flex align="center" gap="2"
      style={{ padding: '8px', backgroundColor: bg, borderRadius: '4px', position: 'relative' }}>
      <ShoppingCart size={14} color={icon} style={{ flexShrink: 0 }} />
      {stockRef && <StockRefLink reference={stockRef} tab="stock" color="gray" variant="outline" size="1" />}
      <Text size="2" weight="medium"
        style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {itemLabel}
      </Text>
      {isToQualify && (
        <Flex align="center" gap="1" style={{ flexShrink: 0 }}>
          <AlertTriangle size={12} color="var(--amber-9)" />
          <Text size="1" color="amber">À qualifier</Text>
        </Flex>
      )}
      {isConsultation && <ConsultationHint count={consultationCount} />}
      <PrBadges quantity={quantity} unit={unit} urgency={urgency} derivedStatus={derivedStatus} basketNumber={basketNumber} />
      {onDelete && !showConfirm && <DeleteButton onClick={() => setShowConfirm(true)} />}
      {onDelete && showConfirm && (
        <DeleteConfirm
          onConfirm={handleConfirmDelete}
          onCancel={() => setShowConfirm(false)}
          isDeleting={isDeleting}
        />
      )}
    </Flex>
  );
}

PurchaseRequestItem.propTypes = {
  pr: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    item_label: PropTypes.string,
    itemLabel: PropTypes.string,
    stock_item_id: PropTypes.string,
    stockItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    stockItemCode: PropTypes.string,
    stockItemRef: PropTypes.string,
    stock_item_ref: PropTypes.string,
    stock_item: PropTypes.shape({ ref: PropTypes.string }),
    quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    unit: PropTypes.string,
    urgency: PropTypes.string,
    derived_status: PropTypes.shape({ code: PropTypes.string, label: PropTypes.string, color: PropTypes.string }),
    order_lines: PropTypes.array,
  }).isRequired,
  onDelete: PropTypes.func,
};
