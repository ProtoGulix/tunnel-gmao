/**
 * Mode comparateur fournisseurs pour une DA.
 * Affiche chaque ligne fournisseur en carte côte à côte.
 * Calcule en temps réel le meilleur prix et le meilleur délai.
 * Sauvegarde via PATCH /supplier-order-lines/{id}.
 *
 * @module components/purchase/PurchaseComparisonSection
 */

import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Flex, Text, TextField } from '@radix-ui/themes';
import { CheckCircle2, Clock, Save, Trophy } from 'lucide-react';
import { updateSupplierOrderLine } from '@/api/supplierOrders';

function computeWinners(orderLines, drafts) {
  const prices = orderLines
    .map(l => ({ id: l.id, v: parseFloat(drafts[l.id]?.unit_price) }))
    .filter(x => !isNaN(x.v) && x.v > 0);

  const delays = orderLines
    .map(l => ({ id: l.id, v: parseInt(drafts[l.id]?.lead_time_days) }))
    .filter(x => !isNaN(x.v) && x.v >= 0);

  let bestPriceId = null;
  if (prices.length >= 2) {
    const min = Math.min(...prices.map(x => x.v));
    const tied = prices.filter(x => x.v === min);
    if (tied.length === 1) bestPriceId = tied[0].id;
  }

  let bestDelayId = null;
  if (delays.length >= 2) {
    const min = Math.min(...delays.map(x => x.v));
    const tied = delays.filter(x => x.v === min);
    if (tied.length === 1) bestDelayId = tied[0].id;
  }

  return { bestPriceId, bestDelayId };
}

function cardStyle(line, isBestPrice, isBestDelay) {
  if (line.is_selected) return { border: '2px solid var(--green-7)', background: 'var(--green-1)' };
  if (isBestPrice && isBestDelay) return { border: '2px solid var(--amber-7)', background: 'var(--amber-1)' };
  if (isBestPrice) return { border: '2px solid var(--green-6)', background: 'var(--green-1)' };
  if (isBestDelay) return { border: '2px solid var(--blue-6)', background: 'var(--blue-1)' };
  return { border: '2px solid var(--gray-4)' };
}

export default function PurchaseComparisonSection({ orderLines, itemQuantity, itemUnit, onRefresh }) {
  const [drafts, setDrafts] = useState(() => {
    const d = {};
    orderLines.forEach(l => {
      d[l.id] = {
        unit_price: l.unit_price ?? l.quote_price ?? '',
        lead_time_days: l.lead_time_days ?? '',
      };
    });
    return d;
  });
  const [saving, setSaving] = useState({});
  const [errors, setErrors] = useState({});

  const changeDraft = (lineId, field, value) => {
    setDrafts(prev => ({ ...prev, [lineId]: { ...prev[lineId], [field]: value } }));
  };

  const saveLine = async (lineId) => {
    setSaving(prev => ({ ...prev, [lineId]: true }));
    setErrors(prev => ({ ...prev, [lineId]: null }));
    try {
      const draft = drafts[lineId];
      await updateSupplierOrderLine(lineId, {
        unit_price: draft.unit_price !== '' ? Number(draft.unit_price) : null,
        lead_time_days: draft.lead_time_days !== '' ? Number(draft.lead_time_days) : null,
      });
      onRefresh?.();
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        [lineId]: err?.response?.data?.detail || 'Erreur lors de la sauvegarde',
      }));
    } finally {
      setSaving(prev => ({ ...prev, [lineId]: false }));
    }
  };

  const selectLine = async (lineId) => {
    setSaving(prev => ({ ...prev, [lineId]: true }));
    setErrors(prev => ({ ...prev, [lineId]: null }));
    try {
      await updateSupplierOrderLine(lineId, { is_selected: true });
      onRefresh?.();
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        [lineId]: err?.response?.data?.detail || 'Erreur lors de la sélection',
      }));
    } finally {
      setSaving(prev => ({ ...prev, [lineId]: false }));
    }
  };

  const { bestPriceId, bestDelayId } = useMemo(
    () => computeWinners(orderLines, drafts),
    [orderLines, drafts],
  );

  const cols = Math.min(orderLines.length, 3);

  return (
    <Box
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 'var(--space-3)',
        alignItems: 'start',
      }}
    >
      {orderLines.map(line => {
        const draft = drafts[line.id] || {};
        const qty = line.quantity_allocated ?? itemQuantity ?? 1;
        const priceNum = parseFloat(draft.unit_price);
        const localTotal = !isNaN(priceNum) && priceNum > 0 ? (priceNum * qty).toFixed(2) : null;
        const isBestPrice = bestPriceId === line.id;
        const isBestDelay = bestDelayId === line.id;
        const isDirty =
          String(draft.unit_price) !== String(line.unit_price ?? line.quote_price ?? '') ||
          String(draft.lead_time_days) !== String(line.lead_time_days ?? '');

        return (
          <Card
            key={line.id}
            size="2"
            variant="surface"
            style={{ ...cardStyle(line, isBestPrice, isBestDelay), transition: 'border-color 0.15s, background 0.15s' }}
          >
            {/* En-tête fournisseur */}
            <Flex
              direction="column"
              gap="1"
              pb="3"
              mb="3"
              style={{ borderBottom: '1px solid var(--gray-4)' }}
            >
              <Text size="3" weight="bold">{line.supplier?.name || 'Fournisseur inconnu'}</Text>
              {line.supplier?.code && (
                <Text size="1" color="gray">{line.supplier.code}</Text>
              )}
              <Flex gap="1" wrap="wrap" mt="1">
                {line.supplier_order_number && (
                  <Badge color="blue" variant="soft" size="1">N° {line.supplier_order_number}</Badge>
                )}
                {line.is_selected && (
                  <Badge color="green" variant="solid" size="1">
                    <CheckCircle2 size={10} /> Sélectionné
                  </Badge>
                )}
                {line.quote_received && !line.is_selected && (
                  <Badge color="orange" variant="soft" size="1">Devis reçu</Badge>
                )}
              </Flex>
            </Flex>

            {/* Saisie prix + délai */}
            <Flex direction="column" gap="3" mb="3">
              <Box>
                <Text size="1" color="gray" mb="1" as="div">Prix unitaire</Text>
                <Flex align="center" gap="1">
                  <TextField.Root
                    size="2"
                    type="number"
                    min="0"
                    step="0.01"
                    value={draft.unit_price ?? ''}
                    placeholder="0.00"
                    onChange={e => changeDraft(line.id, 'unit_price', e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <Text size="1" color="gray">€</Text>
                </Flex>
              </Box>

              <Box>
                <Text size="1" color="gray" mb="1" as="div">Délai livraison (jours)</Text>
                <TextField.Root
                  size="2"
                  type="number"
                  min="0"
                  step="1"
                  value={draft.lead_time_days ?? ''}
                  placeholder="—"
                  onChange={e => changeDraft(line.id, 'lead_time_days', e.target.value)}
                  style={{ width: '100%' }}
                />
              </Box>

              {/* Total calculé localement à partir du draft */}
              <Flex
                align="center"
                justify="between"
                pt="2"
                style={{ borderTop: '1px solid var(--gray-3)' }}
              >
                <Text size="1" color="gray">Total ({qty} {itemUnit || 'pcs'})</Text>
                <Text size="3" weight="bold" color={isBestPrice ? 'green' : 'gray'}>
                  {localTotal != null ? `${localTotal} €` : '—'}
                </Text>
              </Flex>
            </Flex>

            {/* Badges gagnant */}
            {(isBestPrice || isBestDelay) && (
              <Flex gap="1" wrap="wrap" mb="3">
                {isBestPrice && (
                  <Badge color="green" variant="soft" size="1">
                    <Trophy size={10} /> Meilleur prix
                  </Badge>
                )}
                {isBestDelay && (
                  <Badge color="blue" variant="soft" size="1">
                    <Clock size={10} /> Délai le plus court
                  </Badge>
                )}
              </Flex>
            )}

            {errors[line.id] && (
              <Text size="1" color="red" mb="2" as="div">{errors[line.id]}</Text>
            )}

            {/* Actions */}
            <Flex direction="column" gap="2">
              {isDirty && (
                <Button
                  size="1"
                  variant="soft"
                  color="blue"
                  loading={!!saving[line.id]}
                  onClick={() => saveLine(line.id)}
                  style={{ width: '100%' }}
                >
                  <Save size={11} /> Enregistrer les prix
                </Button>
              )}
              {!line.is_selected && (
                <Button
                  size="1"
                  variant={isBestPrice ? 'solid' : 'outline'}
                  color="green"
                  loading={!!saving[line.id]}
                  disabled={!!saving[line.id]}
                  onClick={() => selectLine(line.id)}
                  style={{ width: '100%' }}
                >
                  <CheckCircle2 size={11} /> Sélectionner ce fournisseur
                </Button>
              )}
            </Flex>
          </Card>
        );
      })}
    </Box>
  );
}

PurchaseComparisonSection.propTypes = {
  orderLines: PropTypes.array.isRequired,
  itemQuantity: PropTypes.number,
  itemUnit: PropTypes.string,
  onRefresh: PropTypes.func,
};
