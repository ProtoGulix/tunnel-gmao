/**
 * Onglet comparateur de paniers fournisseurs.
 *
 * L'utilisateur choisit deux paniers ; leurs lignes sont matchées par article
 * (clé : part_id > stock_item_ref > nom). Les prix et délais sont éditables
 * en ligne. Les gagnants sont mis en évidence en temps réel à la frappe.
 *
 * @module components/purchase/tabs/SupplierOrderComparatorTab
 */

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Box, Button, Card, Flex, IconButton, Select, Separator, Table, Text } from '@radix-ui/themes';
import { ArrowLeftRight, Clock, Package, Save, Scale, ThumbsUp, Trophy } from 'lucide-react';
import {
  fetchSupplierOrders,
  fetchSupplierOrderDetail,
  updateSupplierOrderLine,
} from '@/api/supplierOrders';
import LoadingState from '@/components/ui/LoadingState';
import HexBadge from '@/components/ui/HexBadge';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function lineKey(line) {
  return line.part_id || line.stock_item_ref || line.stock_item_name || line.id;
}

function mergeLines(linesA, linesB) {
  const mapB = new Map(linesB.map(l => [lineKey(l), l]));
  const usedKeys = new Set();
  const rows = [];

  linesA.forEach(l => {
    const k = lineKey(l);
    const lineB = mapB.get(k) ?? null;
    if (lineB) usedKeys.add(k);
    rows.push({ key: k, lineA: l, lineB });
  });

  linesB.forEach(l => {
    const k = lineKey(l);
    if (!usedKeys.has(k)) rows.push({ key: k, lineA: null, lineB: l });
  });

  return rows;
}

function getDraftPrice(drafts, line) {
  if (!line) return NaN;
  return parseFloat(drafts[line.id]?.unit_price);
}

function getDraftDelay(drafts, line) {
  if (!line) return NaN;
  return parseInt(drafts[line.id]?.lead_time_days);
}

function rowWinners(row, drafts) {
  const { lineA, lineB } = row;
  if (!lineA || !lineB) return { price: null, delay: null };

  const pA = getDraftPrice(drafts, lineA);
  const pB = getDraftPrice(drafts, lineB);
  const dA = getDraftDelay(drafts, lineA);
  const dB = getDraftDelay(drafts, lineB);

  const price =
    !isNaN(pA) && !isNaN(pB) && pA > 0 && pB > 0
      ? pA < pB ? 'A' : pB < pA ? 'B' : 'tie'
      : null;

  const delay =
    !isNaN(dA) && !isNaN(dB) && dA >= 0 && dB >= 0
      ? dA < dB ? 'A' : dB < dA ? 'B' : 'tie'
      : null;

  return { price, delay };
}

// ─── Sous-composants ──────────────────────────────────────────────────────────

function PanierSelector({ label, value, onChange, orders, excludeId, loading }) {
  return (
    <Box style={{ flex: 1 }}>
      <Text size="1" weight="medium" color="gray" mb="1" as="div">{label}</Text>
      <Select.Root value={value || ''} onValueChange={v => onChange(v || null)} disabled={loading}>
        <Select.Trigger
          placeholder={loading ? 'Chargement…' : 'Choisir un panier…'}
          style={{ width: '100%' }}
        />
        <Select.Content position="popper">
          {orders
            .filter(o => o.id !== excludeId)
            .map(o => (
              <Select.Item key={o.id} value={o.id}>
                {o.order_number} — {o.supplier?.name || 'Fournisseur inconnu'}
              </Select.Item>
            ))}
        </Select.Content>
      </Select.Root>
    </Box>
  );
}

function OrderBadge({ order, statusMap }) {
  if (!order) return null;
  const statusInfo = statusMap[order.status] ?? { label: order.status, color: '#6b7280' };
  return (
    <Flex align="center" gap="2" mt="1">
      <HexBadge color={statusInfo.color} label={statusInfo.label} />
      <Text size="1" color="gray">{order.lines?.length ?? 0} ligne{order.lines?.length > 1 ? 's' : ''}</Text>
      {order.total_amount != null && (
        <Text size="1" color="gray">{Number(order.total_amount).toFixed(2)} €</Text>
      )}
    </Flex>
  );
}

function PriceField({ value, onChange }) {
  return (
    <Flex align="center" gap="1">
      <input
        type="number"
        min="0"
        step="0.01"
        value={value ?? ''}
        placeholder="0.00"
        onChange={e => onChange('unit_price', e.target.value)}
        style={{
          width: 80,
          fontSize: 'var(--font-size-2)',
          padding: '3px 6px',
          borderRadius: 'var(--radius-2)',
          border: '1px solid var(--gray-6)',
          background: 'var(--color-background)',
          color: 'var(--gray-12)',
          textAlign: 'right',
        }}
      />
      <Text size="1" color="gray">€</Text>
    </Flex>
  );
}

function DelayField({ value, onChange }) {
  return (
    <Flex align="center" gap="1">
      <input
        type="number"
        min="0"
        step="1"
        value={value ?? ''}
        placeholder="—"
        onChange={e => onChange('lead_time_days', e.target.value)}
        style={{
          width: 52,
          fontSize: 'var(--font-size-2)',
          padding: '3px 6px',
          borderRadius: 'var(--radius-2)',
          border: '1px solid var(--gray-6)',
          background: 'var(--color-background)',
          color: 'var(--gray-12)',
          textAlign: 'right',
        }}
      />
      <Text size="1" color="gray">j</Text>
    </Flex>
  );
}

function AbsentCell() {
  return (
    <Table.Cell colSpan={3} style={{ textAlign: 'center', verticalAlign: 'middle', background: 'var(--gray-2)' }}>
      <Text size="1" color="gray">Absent de ce panier</Text>
    </Table.Cell>
  );
}

function LineCells({ line, draft, onChange, side, winners, onSelect, selecting, isHovered, isMuted }) {
  if (!line) return <AbsentCell />;

  const price = draft?.unit_price;
  const delay = draft?.lead_time_days;
  const priceNum = parseFloat(price);
  const total = !isNaN(priceNum) && priceNum > 0 && line.quantity
    ? (priceNum * line.quantity).toFixed(2)
    : null;

  const isPriceWinner = winners.price === side;
  const isDelayWinner = winners.delay === side;
  const isSelected = !!line.is_selected;

  const selBg    = side === 'A' ? 'var(--blue-2)'  : 'var(--purple-2)';
  const selBorder = side === 'A' ? 'var(--blue-6)'  : 'var(--purple-6)';

  // Fond de chaque cellule : winner > sélectionné > rien
  const prixBg  = isPriceWinner  ? 'var(--green-3)' : isSelected ? selBg : undefined;
  const delayBg = isDelayWinner  ? 'var(--blue-3)'  : isSelected ? selBg : undefined;
  const selCellBg = isSelected ? selBg : undefined;

  // Bordure gauche uniquement sur la première cellule du bloc (prix)
  const blockBorderLeft = isSelected
    ? `3px solid ${selBorder}`
    : isPriceWinner ? '3px solid var(--green-7)' : '3px solid transparent';

  return (
    <>
      {/* Prix u. + total */}
      <Table.Cell style={{ verticalAlign: 'middle', background: prixBg, borderLeft: blockBorderLeft, opacity: isMuted ? 0.35 : 1, transition: 'opacity 0.2s ease' }}>
        <Flex align="center" gap="1" wrap="nowrap">
          <PriceField value={price} onChange={onChange} />
          {total != null && (
            <>
              {isPriceWinner && <Trophy size={11} color="var(--green-9)" style={{ flexShrink: 0 }} />}
              <Text size="1" weight={isPriceWinner ? 'bold' : undefined} color={isPriceWinner ? 'green' : 'gray'} style={{ whiteSpace: 'nowrap' }}>
                = {total} €
              </Text>
            </>
          )}
        </Flex>
      </Table.Cell>

      {/* Délai */}
      <Table.Cell style={{
        verticalAlign: 'middle',
        textAlign: 'center',
        background: delayBg,
        borderLeft: isDelayWinner ? '3px solid var(--blue-7)' : undefined,
        opacity: isMuted ? 0.35 : 1,
        transition: 'opacity 0.2s ease',
      }}>
        <DelayField value={delay} onChange={onChange} />
      </Table.Cell>

      {/* Sélection */}
      <Table.Cell style={{ verticalAlign: 'middle', textAlign: 'center', background: selCellBg, opacity: isMuted ? 0.35 : 1, transition: 'opacity 0.2s ease' }}>
        <IconButton
          size="1"
          variant="ghost"
          color={side === 'A' ? 'blue' : 'purple'}
          radius="full"
          style={{
            opacity: isHovered || isSelected ? 1 : 0,
            transition: 'opacity 0.15s ease',
            pointerEvents: isHovered || isSelected ? 'auto' : 'none',
            background: 'none',
          }}
          loading={selecting === line.id}
          disabled={!!selecting}
          onClick={onSelect}
          title={`Sélectionner le fournisseur ${side}`}
        >
          <ThumbsUp
            size={18}
            strokeWidth={2.5}
            color={isSelected
              ? (side === 'A' ? 'var(--blue-9)' : 'var(--purple-9)')
              : 'var(--gray-8)'}
            fill={isSelected
              ? (side === 'A' ? 'var(--blue-4)' : 'var(--purple-4)')
              : 'none'}
          />
        </IconButton>
      </Table.Cell>
    </>
  );
}

function WinnerCell({ winners, saving, isDirty, onSave, error }) {
  return (
    <Table.Cell style={{ verticalAlign: 'middle', minWidth: 100 }}>
      <Flex direction="column" gap="2" align="start">

        {/* Cas d'égalité */}
        {winners.price === 'tie' && (
          <Badge color="gray" variant="soft" size="1">Prix égal</Badge>
        )}
        {winners.delay === 'tie' && (
          <Badge color="gray" variant="soft" size="1">Délai égal</Badge>
        )}

        {isDirty && (
          <Button size="1" variant="soft" color="blue" loading={saving} onClick={onSave}>
            <Save size={10} /> Enregistrer
          </Button>
        )}
        {error && <Text size="1" color="red">{error}</Text>}
      </Flex>
    </Table.Cell>
  );
}

function ArticleCells({ row, rowSelected }) {
  const line = row.lineA || row.lineB;
  const mfrRef = row.lineA?.manufacturer?.ref || row.lineB?.manufacturer?.ref;
  const mfrName = row.lineA?.manufacturer?.name || row.lineB?.manufacturer?.name;

  const cellBase = {
    verticalAlign: 'middle',
    background: rowSelected ? 'var(--green-2)' : undefined,
  };

  return (
    <>
      {/* Code article fabricant — porte la bordure gauche du bloc */}
      <Table.Cell style={{ ...cellBase, whiteSpace: 'nowrap', borderLeft: rowSelected ? '3px solid var(--green-7)' : '3px solid transparent' }}>
        {mfrRef
          ? <Badge color="violet" variant="soft" size="1" style={{ fontFamily: 'monospace' }}>{mfrRef}</Badge>
          : <Text size="1" color="gray">—</Text>}
      </Table.Cell>

      {/* Fabricant */}
      <Table.Cell style={{ ...cellBase, whiteSpace: 'nowrap' }}>
        <Text size="2" color="gray">{mfrName || '—'}</Text>
      </Table.Cell>

      {/* Désignation */}
      <Table.Cell style={{ ...cellBase, minWidth: 180, maxWidth: 280 }}>
        <Flex align="center" gap="2" style={{ overflow: 'hidden' }}>
          {line?.stock_item_ref && (
            <Badge
              color={line?.part_id ? 'blue' : 'gray'}
              variant="soft" size="1"
              style={{ fontFamily: 'monospace', flexShrink: 0, opacity: 0.8 }}
            >
              {line.stock_item_ref}
            </Badge>
          )}
          <Text
            size="2" weight="medium"
            style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            title={line?.stock_item_name}
          >
            {line?.stock_item_name || '—'}
          </Text>
        </Flex>
      </Table.Cell>
    </>
  );
}

function QtyCell({ row, rowSelected }) {
  const lineA = row.lineA;
  const lineB = row.lineB;
  const line = lineA || lineB;
  const unit = line?.stock_item_unit || 'pcs';
  const qtyA = lineA?.quantity;
  const qtyB = lineB?.quantity;
  const differ = lineA && lineB && qtyA !== qtyB;

  return (
    <Table.Cell style={{ verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap', background: rowSelected ? 'var(--green-2)' : undefined }}>
      {differ ? (
        <Flex direction="column" align="end" gap="0">
          <Text size="1" color="blue">A : {qtyA}</Text>
          <Text size="1" color="purple">B : {qtyB}</Text>
          <Text size="1" color="gray">{unit}</Text>
        </Flex>
      ) : (
        <Flex align="center" justify="end" gap="1">
          <Text size="2" weight="medium">{line?.quantity ?? '—'}</Text>
          <Text size="1" color="gray">{unit}</Text>
        </Flex>
      )}
    </Table.Cell>
  );
}

function TotalsRow({ orderA, orderB, drafts }) {
  const sumFor = (order) => {
    if (!order) return null;
    let sum = 0;
    let any = false;
    (order.lines || []).forEach(l => {
      const p = parseFloat(drafts[l.id]?.unit_price);
      if (!isNaN(p) && p > 0 && l.quantity) { sum += p * l.quantity; any = true; }
    });
    return any ? sum : null;
  };

  const tA = sumFor(orderA);
  const tB = sumFor(orderB);
  const aWins = tA != null && tB != null && tA < tB;
  const bWins = tA != null && tB != null && tB < tA;

  const totalCellStyle = (wins) => ({
    textAlign: 'right',
    background: wins ? 'var(--green-3)' : 'var(--gray-2)',
    borderLeft: wins ? '3px solid var(--green-7)' : '3px solid transparent',
  });

  // 11 colonnes : 3 (article) + 1 (qté) + 3 (A: prix, délai, sél) + 3 (B: prix, délai, sél) + 1 (résultat)
  return (
    <Table.Row>
      <Table.Cell colSpan={3} style={{ background: 'var(--gray-2)' }}>
        <Text size="2" weight="bold" color="gray">Total panier</Text>
      </Table.Cell>
      <Table.Cell style={{ background: 'var(--gray-2)' }} /> {/* qté */}
      <Table.Cell style={totalCellStyle(aWins)}>
        {tA != null ? (
          <Flex align="center" gap="1">
            {aWins && <Trophy size={13} color="var(--green-9)" />}
            <Text size="3" weight="bold" color={aWins ? 'green' : 'gray'}>{tA.toFixed(2)} €</Text>
          </Flex>
        ) : <Text size="1" color="gray">—</Text>}
      </Table.Cell>
      <Table.Cell style={{ background: 'var(--gray-2)' }} /> {/* délai A */}
      <Table.Cell style={{ background: 'var(--gray-2)' }} /> {/* sél A */}
      <Table.Cell style={totalCellStyle(bWins)}>
        {tB != null ? (
          <Flex align="center" gap="1">
            {bWins && <Trophy size={13} color="var(--green-9)" />}
            <Text size="3" weight="bold" color={bWins ? 'green' : 'gray'}>{tB.toFixed(2)} €</Text>
          </Flex>
        ) : <Text size="1" color="gray">—</Text>}
      </Table.Cell>
      <Table.Cell style={{ background: 'var(--gray-2)' }} /> {/* délai B */}
      <Table.Cell style={{ background: 'var(--gray-2)' }} /> {/* sél B */}
      <Table.Cell style={{ background: 'var(--gray-2)' }}>
        {aWins && <Badge color="green" variant="solid" size="1"><Trophy size={9} /> A moins cher</Badge>}
        {bWins && <Badge color="green" variant="solid" size="1"><Trophy size={9} /> B moins cher</Badge>}
        {tA != null && tB != null && tA === tB && <Badge color="gray" variant="soft" size="1">Égalité</Badge>}
      </Table.Cell>
    </Table.Row>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function SupplierOrderComparatorTab() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [allOrders, setAllOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // IDs initialisés depuis les params URL (venant d'une DA ou d'un lien partagé)
  const [orderAId, setOrderAId] = useState(() => searchParams.get('a') || null);
  const [orderBId, setOrderBId] = useState(() => searchParams.get('b') || null);
  const [orderA, setOrderA] = useState(null);
  const [orderB, setOrderB] = useState(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState({});
  const [saveErrors, setSaveErrors] = useState({});
  const [selecting, setSelecting] = useState({});
  const [hoveredRowKey, setHoveredRowKey] = useState(null);

  // Statuts pour les badges
  const [statusMap, setStatusMap] = useState({});

  useEffect(() => {
    setLoadingOrders(true);
    fetchSupplierOrders({ limit: 500 })
      .then(({ items }) => {
        setAllOrders(items);

        // Fallback : si l'URL contient a_num / b_num (quand supplier_order_id n'est pas exposé),
        // on résout les IDs depuis la liste des paniers chargés.
        const aNum = searchParams.get('a_num');
        const bNum = searchParams.get('b_num');
        if (aNum && !searchParams.get('a')) {
          const found = items.find(o => o.order_number === aNum);
          if (found) setOrderAId(found.id);
        }
        if (bNum && !searchParams.get('b')) {
          const found = items.find(o => o.order_number === bNum);
          if (found) setOrderBId(found.id);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingOrders(false));

    import('@/api/supplierOrders').then(({ fetchSupplierOrderStatuses }) => {
      fetchSupplierOrderStatuses().then(list => {
        const map = {};
        list.forEach(s => { map[s.code] = s; });
        setStatusMap(map);
      }).catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronise l'URL quand l'utilisateur change de sélection manuellement
  const selectA = (id) => {
    setOrderAId(id || null);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (id) { next.set('a', id); next.delete('a_num'); } else { next.delete('a'); next.delete('a_num'); }
      return next;
    }, { replace: true });
  };

  const selectB = (id) => {
    setOrderBId(id || null);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (id) { next.set('b', id); next.delete('b_num'); } else { next.delete('b'); next.delete('b_num'); }
      return next;
    }, { replace: true });
  };

  const initDraftsForOrder = (data) => {
    setDrafts(prev => {
      const next = { ...prev };
      (data.lines || []).forEach(l => {
        if (!next[l.id]) {
          next[l.id] = {
            unit_price: l.unit_price ?? '',
            lead_time_days: l.lead_time_days ?? '',
          };
        }
      });
      return next;
    });
  };

  useEffect(() => {
    if (!orderAId) { setOrderA(null); return; }
    setLoadingA(true);
    fetchSupplierOrderDetail(orderAId)
      .then(data => { setOrderA(data); initDraftsForOrder(data); })
      .catch(() => setOrderA(null))
      .finally(() => setLoadingA(false));
  }, [orderAId]);

  useEffect(() => {
    if (!orderBId) { setOrderB(null); return; }
    setLoadingB(true);
    fetchSupplierOrderDetail(orderBId)
      .then(data => { setOrderB(data); initDraftsForOrder(data); })
      .catch(() => setOrderB(null))
      .finally(() => setLoadingB(false));
  }, [orderBId]);

  const rows = useMemo(() => {
    if (!orderA || !orderB) return [];
    return mergeLines(orderA.lines || [], orderB.lines || []);
  }, [orderA, orderB]);

  const changeDraft = (lineId, field, value) => {
    setDrafts(prev => ({ ...prev, [lineId]: { ...prev[lineId], [field]: value } }));
  };

  const isRowDirty = (row) => {
    const check = (line) => {
      if (!line) return false;
      const d = drafts[line.id] || {};
      return (
        String(d.unit_price) !== String(line.unit_price ?? '') ||
        String(d.lead_time_days) !== String(line.lead_time_days ?? '')
      );
    };
    return check(row.lineA) || check(row.lineB);
  };

  const saveRow = async (row) => {
    setSaving(prev => ({ ...prev, [row.key]: true }));
    setSaveErrors(prev => ({ ...prev, [row.key]: null }));
    try {
      const linesToSave = [row.lineA, row.lineB].filter(Boolean).filter(l => {
        const d = drafts[l.id] || {};
        return (
          String(d.unit_price) !== String(l.unit_price ?? '') ||
          String(d.lead_time_days) !== String(l.lead_time_days ?? '')
        );
      });
      await Promise.all(linesToSave.map(line => {
        const d = drafts[line.id] || {};
        return updateSupplierOrderLine(line.id, {
          unit_price: d.unit_price !== '' ? Number(d.unit_price) : null,
          lead_time_days: d.lead_time_days !== '' ? Number(d.lead_time_days) : null,
        });
      }));
      // Resync les deux paniers après sauvegarde
      const [dataA, dataB] = await Promise.all([
        orderAId ? fetchSupplierOrderDetail(orderAId) : null,
        orderBId ? fetchSupplierOrderDetail(orderBId) : null,
      ]);
      if (dataA) setOrderA(dataA);
      if (dataB) setOrderB(dataB);
    } catch (err) {
      setSaveErrors(prev => ({
        ...prev,
        [row.key]: err?.response?.data?.detail || 'Erreur lors de la sauvegarde',
      }));
    } finally {
      setSaving(prev => ({ ...prev, [row.key]: false }));
    }
  };

  const selectLine = async (row, lineId) => {
    setSelecting(prev => ({ ...prev, [row.key]: lineId }));
    try {
      await updateSupplierOrderLine(lineId, { is_selected: true });
      const [dataA, dataB] = await Promise.all([
        orderAId ? fetchSupplierOrderDetail(orderAId) : null,
        orderBId ? fetchSupplierOrderDetail(orderBId) : null,
      ]);
      if (dataA) setOrderA(dataA);
      if (dataB) setOrderB(dataB);
    } catch {
      // erreur silencieuse — l'état se remet à jour au prochain refresh
    } finally {
      setSelecting(prev => ({ ...prev, [row.key]: null }));
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const bothSelected = !!orderAId && !!orderBId;
  const bothLoaded = !!orderA && !!orderB;
  const isLoading = loadingA || loadingB;

  return (
    <Box pt="3">
      {/* Sélecteurs de paniers */}
      <Card size="2" variant="surface" mb="4">
        <Flex align="center" gap="2" mb="3">
          <Scale size={16} color="var(--blue-9)" />
          <Text size="3" weight="bold">Comparateur de paniers</Text>
        </Flex>

        <Flex gap="3" align="start" wrap="wrap">
          <Box style={{ flex: 1, minWidth: 220 }}>
            <PanierSelector
              label="Panier A"
              value={orderAId}
              onChange={selectA}
              orders={allOrders}
              excludeId={orderBId}
              loading={loadingOrders}
            />
            {orderA && <OrderBadge order={orderA} statusMap={statusMap} />}
          </Box>

          <Flex align="center" pt="4" style={{ flexShrink: 0 }}>
            <ArrowLeftRight size={18} color="var(--gray-8)" />
          </Flex>

          <Box style={{ flex: 1, minWidth: 220 }}>
            <PanierSelector
              label="Panier B"
              value={orderBId}
              onChange={selectB}
              orders={allOrders}
              excludeId={orderAId}
              loading={loadingOrders}
            />
            {orderB && <OrderBadge order={orderB} statusMap={statusMap} />}
          </Box>
        </Flex>
      </Card>

      {/* États intermédiaires */}
      {!bothSelected && (
        <Flex direction="column" align="center" justify="center" gap="3" py="8" style={{ opacity: 0.6 }}>
          <Scale size={40} color="var(--gray-7)" />
          <Text size="2" color="gray" align="center">
            Sélectionnez deux paniers fournisseurs pour comparer leurs lignes côte à côte
          </Text>
        </Flex>
      )}

      {bothSelected && isLoading && (
        <LoadingState fullscreen={false} message="Chargement des paniers…" />
      )}

      {/* Table de comparaison */}
      {bothLoaded && !isLoading && (
        <>
          {rows.length === 0 ? (
            <Flex direction="column" align="center" gap="2" py="6" style={{ opacity: 0.6 }}>
              <Package size={32} color="var(--gray-7)" />
              <Text size="2" color="gray">Ces paniers ne contiennent aucune ligne</Text>
            </Flex>
          ) : (
            <Box style={{ overflowX: 'auto' }}>
              <Table.Root size="1" variant="surface">
                <Table.Header>
                  {/* Ligne 1 : noms des paniers */}
                  <Table.Row>
                    <Table.ColumnHeaderCell rowSpan={2} style={{ verticalAlign: 'bottom', whiteSpace: 'nowrap' }}>
                      Code fab.
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell rowSpan={2} style={{ verticalAlign: 'bottom', whiteSpace: 'nowrap' }}>
                      Fabricant
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell rowSpan={2} style={{ minWidth: 220, verticalAlign: 'bottom' }}>
                      Désignation
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell rowSpan={2} style={{ verticalAlign: 'bottom', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      Qté
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell
                      colSpan={3}
                      style={{ textAlign: 'center', background: 'var(--blue-2)', borderBottom: '2px solid var(--blue-5)' }}
                    >
                      <Flex align="center" justify="center" gap="2">
                        <Text size="2" weight="bold" color="blue">
                          {orderA.order_number} — {orderA.supplier?.name || '—'}
                        </Text>
                        <Badge color="blue" variant="soft" size="1">A</Badge>
                      </Flex>
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell
                      colSpan={3}
                      style={{ textAlign: 'center', background: 'var(--purple-2)', borderBottom: '2px solid var(--purple-5)' }}
                    >
                      <Flex align="center" justify="center" gap="2">
                        <Text size="2" weight="bold" color="purple">
                          {orderB.order_number} — {orderB.supplier?.name || '—'}
                        </Text>
                        <Badge color="purple" variant="soft" size="1">B</Badge>
                      </Flex>
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell rowSpan={2} style={{ verticalAlign: 'bottom', minWidth: 110 }}>
                      Résultat
                    </Table.ColumnHeaderCell>
                  </Table.Row>

                  {/* Ligne 2 : colonnes détail */}
                  <Table.Row>
                    <Table.ColumnHeaderCell style={{ background: 'var(--blue-1)' }}>Prix u. / Total</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell style={{ background: 'var(--blue-1)', textAlign: 'center' }}>Délai</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell style={{ background: 'var(--blue-1)', textAlign: 'center', width: 36 }} />
                    <Table.ColumnHeaderCell style={{ background: 'var(--purple-1)' }}>Prix u. / Total</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell style={{ background: 'var(--purple-1)', textAlign: 'center' }}>Délai</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell style={{ background: 'var(--purple-1)', textAlign: 'center', width: 36 }} />
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {rows.map(row => {
                    const winners = rowWinners(row, drafts);
                    const dirty = isRowDirty(row);
                    const isHovered = hoveredRowKey === row.key;
                    const rowSelected = !!(row.lineA?.is_selected || row.lineB?.is_selected);
                    const selectedSide = row.lineA?.is_selected ? 'A' : row.lineB?.is_selected ? 'B' : null;
                    return (
                      <Table.Row
                        key={row.key}
                        onMouseEnter={() => setHoveredRowKey(row.key)}
                        onMouseLeave={() => setHoveredRowKey(null)}
                        style={rowSelected ? { boxShadow: 'inset 0 2px 0 var(--green-6), inset 0 -2px 0 var(--green-6)' } : undefined}
                      >
                        <ArticleCells row={row} rowSelected={rowSelected} />
                        <QtyCell row={row} rowSelected={rowSelected} />

                        <LineCells
                          line={row.lineA}
                          draft={drafts[row.lineA?.id]}
                          onChange={(field, val) => row.lineA && changeDraft(row.lineA.id, field, val)}
                          side="A"
                          winners={winners}
                          onSelect={() => row.lineA && selectLine(row, row.lineA.id)}
                          selecting={selecting[row.key]}
                          isHovered={isHovered}
                          isMuted={selectedSide === 'B'}
                        />

                        <LineCells
                          line={row.lineB}
                          draft={drafts[row.lineB?.id]}
                          onChange={(field, val) => row.lineB && changeDraft(row.lineB.id, field, val)}
                          side="B"
                          winners={winners}
                          onSelect={() => row.lineB && selectLine(row, row.lineB.id)}
                          selecting={selecting[row.key]}
                          isHovered={isHovered}
                          isMuted={selectedSide === 'A'}
                        />

                        <WinnerCell
                          winners={winners}
                          saving={!!saving[row.key]}
                          isDirty={dirty}
                          onSave={() => saveRow(row)}
                          error={saveErrors[row.key]}
                        />
                      </Table.Row>
                    );
                  })}

                  <TotalsRow orderA={orderA} orderB={orderB} drafts={drafts} />
                </Table.Body>
              </Table.Root>
            </Box>
          )}

          {/* Légende */}
          <Flex gap="3" mt="3" wrap="wrap">
            <Flex align="center" gap="1">
              <Box style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--green-3)', border: '1px solid var(--green-6)' }} />
              <Text size="1" color="gray">Meilleur prix</Text>
            </Flex>
            <Flex align="center" gap="1">
              <Box style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--blue-3)', border: '1px solid var(--blue-6)' }} />
              <Text size="1" color="gray">Délai le plus court</Text>
            </Flex>
            <Flex align="center" gap="1">
              <Box style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--amber-3)', border: '1px solid var(--amber-6)' }} />
              <Text size="1" color="gray">Meilleur prix ET délai</Text>
            </Flex>
            <Separator orientation="vertical" />
            <Text size="1" color="gray">
              Les prix saisis ici sont enregistrés dans les paniers respectifs.
            </Text>
          </Flex>
        </>
      )}
    </Box>
  );
}
