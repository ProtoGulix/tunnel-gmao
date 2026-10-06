/**
 * @fileoverview Aperçu du dispatch demande par demande, avant confirmation.
 *
 * Remplace la case à cocher globale "X demandes vont être dispatchées" par un
 * détail par demande : panier(s) cible(s), possibilité d'exclure, indication
 * de réversibilité.
 *
 * @module components/purchase/DispatchPreviewDialog
 */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { AlertDialog, Badge, Box, Button, Checkbox, Flex, Text } from '@radix-ui/themes';
import { AlertTriangle, Package, Zap } from 'lucide-react';
import LoadingState from '@/components/ui/LoadingState';
import { fetchDispatchPreview } from '@/api/purchaseRequests';

function TargetOrderBadge({ order }) {
  return (
    <Badge color={order.is_new_order ? 'amber' : 'blue'} variant="soft" size="1">
      <Package size={11} />
      {order.supplier_name || 'Fournisseur inconnu'}
      {order.is_new_order && ' (nouveau panier)'}
    </Badge>
  );
}
TargetOrderBadge.propTypes = {
  order: PropTypes.shape({
    supplier_name: PropTypes.string,
    is_new_order: PropTypes.bool,
  }).isRequired,
};

function PreviewRow({ item, excluded, onToggleExclude }) {
  const hasError = !!item.error;
  return (
    <Flex
      align="start" gap="2"
      style={{
        padding: '8px 10px',
        borderBottom: '1px solid var(--gray-4)',
        opacity: excluded ? 0.5 : 1,
      }}
    >
      <Checkbox
        checked={!excluded && !hasError}
        disabled={hasError}
        onCheckedChange={() => onToggleExclude(item.purchase_request_id)}
        mt="1"
      />
      <Box style={{ flex: 1, minWidth: 0 }}>
        <Flex align="center" gap="2" wrap="wrap">
          <Text size="2" weight="bold">{item.code || item.item_label}</Text>
          {item.code && <Text size="1" color="gray">{item.item_label}</Text>}
        </Flex>
        <Flex gap="1" mt="1" wrap="wrap">
          {hasError ? (
            <Badge color="red" variant="soft" size="1">
              <AlertTriangle size={11} /> {item.error}
            </Badge>
          ) : (
            item.target_orders.map((order) => (
              <TargetOrderBadge key={order.supplier_id} order={order} />
            ))
          )}
        </Flex>
      </Box>
    </Flex>
  );
}
PreviewRow.propTypes = {
  item: PropTypes.shape({
    purchase_request_id: PropTypes.string.isRequired,
    code: PropTypes.string,
    item_label: PropTypes.string.isRequired,
    target_orders: PropTypes.array.isRequired,
    error: PropTypes.string,
  }).isRequired,
  excluded: PropTypes.bool.isRequired,
  onToggleExclude: PropTypes.func.isRequired,
};

export default function DispatchPreviewDialog({ open, onOpenChange, onConfirm, dispatching }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [excludedIds, setExcludedIds] = useState(new Set());
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setLoadError(null);
    setExcludedIds(new Set());
    fetchDispatchPreview()
      .then((data) => setItems(data.items || []))
      .catch(() => setLoadError('Impossible de charger l’aperçu du dispatch.'))
      .finally(() => setLoading(false));
  }, [open]);

  const toggleExclude = (id) => {
    setExcludedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const dispatchableItems = items.filter((item) => !item.error);
  const includedCount = dispatchableItems.filter((item) => !excludedIds.has(item.purchase_request_id)).length;

  const handleConfirm = () => onConfirm(Array.from(excludedIds));

  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Content maxWidth="560px">
        <AlertDialog.Title>Aperçu du dispatch</AlertDialog.Title>
        <AlertDialog.Description size="2" mb="2">
          Chaque demande cochée sera envoyée vers le ou les paniers fournisseurs indiqués.
          Décochez une demande pour l&apos;exclure de ce dispatch — elle restera à dispatcher.
        </AlertDialog.Description>

        {loading && <LoadingState fullscreen={false} message="Calcul de l'aperçu…" />}
        {loadError && (
          <Flex align="center" gap="2" style={{ padding: 12, color: 'var(--red-11)' }}>
            <AlertTriangle size={14} /><Text size="2">{loadError}</Text>
          </Flex>
        )}

        {!loading && !loadError && (
          <Box style={{ maxHeight: 360, overflowY: 'auto', border: '1px solid var(--gray-4)', borderRadius: 'var(--radius-2)' }}>
            {items.length === 0 && (
              <Flex align="center" justify="center" style={{ padding: 24 }}>
                <Text size="2" color="gray">Aucune demande à dispatcher.</Text>
              </Flex>
            )}
            {items.map((item) => (
              <PreviewRow
                key={item.purchase_request_id}
                item={item}
                excluded={excludedIds.has(item.purchase_request_id)}
                onToggleExclude={toggleExclude}
              />
            ))}
          </Box>
        )}

        <Flex align="center" gap="1" mt="3" style={{ color: 'var(--gray-11)' }}>
          <AlertTriangle size={12} />
          <Text size="1">
            Action non réversible depuis cet écran : une fois dispatchée, une demande rejoint son panier fournisseur
            et doit être retirée depuis l&apos;onglet Paniers fournisseurs.
          </Text>
        </Flex>

        <Flex gap="3" mt="4" justify="end" align="center">
          <Text size="1" color="gray">{includedCount} demande{includedCount > 1 ? 's' : ''} sélectionnée{includedCount > 1 ? 's' : ''}</Text>
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray">Annuler</Button>
          </AlertDialog.Cancel>
          <Button color="blue" onClick={handleConfirm} disabled={includedCount === 0 || dispatching} loading={dispatching}>
            <Zap size={14} /> Confirmer le dispatch
          </Button>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}

DispatchPreviewDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  dispatching: PropTypes.bool,
};
