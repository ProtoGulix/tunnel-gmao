/**
 * @fileoverview Panel d'édition admin complet d'une demande d'achat
 *
 * Permet d'éditer toute la DA (champs, approbation) et de gérer la
 * liaison à une pièce du catalogue (voir lien actuel, rechercher, créer).
 *
 * @module components/purchase-requests/PurchaseRequestEditForm
 */

/* eslint-disable max-lines */
import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Flex, Select, Separator, Tabs, Text } from '@radix-ui/themes';
import { CheckCircle2, Edit2, ExternalLink, Link2Off, Package, Plus, ShoppingCart, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as stockApi from '@/api/stock';
import { fetchStockItemSupplierLinks } from '@/api/suppliers';
import StockItemForm from '@/components/stock/StockItemForm';
import { UNIT_OPTIONS } from '@/config/units';
import { useDebounce } from '@/hooks/useDebounce';
import SearchableSelect from '@/components/ui/SearchableSelect';
import SelectionSummary from '@/components/ui/SelectionSummary';
import StatusCallout from '@/components/ui/StatusCallout';
import { SuppliersSection } from '@/components/stock/StockItemSuppliers';

// ─── Primitives ──────────────────────────────────────────────────────────────

const inputStyle = {
  width: '100%', padding: '7px 10px',
  borderRadius: '6px', border: '1px solid var(--gray-7)',
  fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box', height: '34px',
  background: 'var(--color-background)',
};

function F({ label, required, children }) {
  return (
    <Box>
      <Text size="1" weight="bold" mb="1" style={{ display: 'block', color: 'var(--gray-11)' }}>
        {label}{required && <span style={{ color: 'var(--red-9)' }}> *</span>}
      </Text>
      {children}
    </Box>
  );
}
F.propTypes = { label: PropTypes.string.isRequired, required: PropTypes.bool, children: PropTypes.node.isRequired };

function FInput(props) {
  return <input {...props} style={{ ...inputStyle, ...props.style }} />;
}
FInput.propTypes = { style: PropTypes.object };

function FTextarea({ rows = 2, ...props }) {
  return (
    <textarea
      rows={rows}
      {...props}
      style={{ ...inputStyle, height: 'auto', resize: 'vertical', lineHeight: 1.5 }}
    />
  );
}
FTextarea.propTypes = { rows: PropTypes.number };

function SectionHeader({ icon: Icon, title, color = 'var(--gray-9)' }) {
  return (
    <Flex align="center" gap="2" pb="2" mb="2" style={{ borderBottom: '1px solid var(--gray-4)' }}>
      <Icon size={14} color={color} />
      <Text size="2" weight="medium" color="gray">{title}</Text>
    </Flex>
  );
}
SectionHeader.propTypes = { icon: PropTypes.elementType.isRequired, title: PropTypes.string.isRequired, color: PropTypes.string };

// ─── DA fields ───────────────────────────────────────────────────────────────

const URGENCY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Élevée' },
  { value: 'critical', label: 'Critique' },
];

function DaFieldsSection({ state, set }) {
  return (
    <Card size="2" variant="surface" style={{ overflow: 'hidden' }}>
      <SectionHeader icon={ShoppingCart} title="Informations de la demande" color="var(--blue-9)" />
      <Flex direction="column" gap="3">

        <F label="Désignation" required>
          <FInput
            value={state.item_label}
            onChange={e => set(s => ({ ...s, item_label: e.target.value }))}
            placeholder="Nom de l'article ou de la pièce"
          />
        </F>

        <Flex gap="2">
          <F label="Quantité" required>
            <FInput
              type="number" min="1" style={{ width: 90 }}
              value={state.quantity}
              onChange={e => set(s => ({ ...s, quantity: e.target.value }))}
            />
          </F>
          <Box style={{ flex: 1 }}>
            <F label="Unité">
              <Select.Root value={state.unit} onValueChange={v => set(s => ({ ...s, unit: v }))}>
                <Select.Trigger style={{ width: '100%', height: '34px' }} />
                <Select.Content>
                  {UNIT_OPTIONS.map(({ value, label }) => (
                    <Select.Item key={value} value={value}>{label}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </F>
          </Box>
          <Box style={{ flex: 1 }}>
            <F label="Urgence">
              <Select.Root value={state.urgency} onValueChange={v => set(s => ({ ...s, urgency: v }))}>
                <Select.Trigger style={{ width: '100%', height: '34px' }} />
                <Select.Content>
                  {URGENCY_OPTIONS.map(o => (
                    <Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </F>
          </Box>
        </Flex>

        <Flex gap="2">
          <Box style={{ flex: 1 }}>
            <F label="Demandeur">
              <FInput
                value={state.requested_by}
                onChange={e => set(s => ({ ...s, requested_by: e.target.value }))}
                placeholder="Nom du demandeur"
              />
            </F>
          </Box>
          <Box style={{ flex: 1 }}>
            <F label="Atelier">
              <FInput
                value={state.workshop}
                onChange={e => set(s => ({ ...s, workshop: e.target.value }))}
                placeholder="Atelier concerné"
              />
            </F>
          </Box>
        </Flex>

        <F label="Motif">
          <FTextarea
            value={state.reason}
            onChange={e => set(s => ({ ...s, reason: e.target.value }))}
            placeholder="Raison de la demande..."
          />
        </F>

        <F label="Notes">
          <FTextarea
            value={state.notes}
            onChange={e => set(s => ({ ...s, notes: e.target.value }))}
            placeholder="Informations complémentaires..."
          />
        </F>

        <Separator size="4" />
        <Text size="1" color="gray" weight="medium">Approbation</Text>

        <Flex gap="2">
          <F label="Qté approuvée">
            <FInput
              type="number" min="0" style={{ width: 110 }}
              value={state.quantity_approved ?? ''}
              onChange={e => set(s => ({ ...s, quantity_approved: e.target.value === '' ? null : Number(e.target.value) }))}
              placeholder="—"
            />
          </F>
          <Box style={{ flex: 1 }}>
            <F label="Approuveur">
              <FInput
                value={state.approver_name ?? ''}
                onChange={e => set(s => ({ ...s, approver_name: e.target.value || null }))}
                placeholder="Nom de l'approbateur"
              />
            </F>
          </Box>
        </Flex>

      </Flex>
    </Card>
  );
}
DaFieldsSection.propTypes = { state: PropTypes.object.isRequired, set: PropTypes.func.isRequired };

// ─── Stock item — current link tab ───────────────────────────────────────────

// eslint-disable-next-line complexity
function CurrentStockTab({ stockItem, unit, onUnlink }) {
  if (!stockItem) {
    return (
      <Flex direction="column" align="center" gap="2" py="5">
        <Package size={28} color="var(--amber-7)" />
        <Text size="2" color="gray" align="center">Aucune pièce catalogue liée</Text>
        <Text size="1" color="gray">Utilisez les onglets pour rechercher ou créer.</Text>
      </Flex>
    );
  }
  return (
    <Flex direction="column" gap="2">
      <Flex align="center" gap="2">
        <Badge color="blue" variant="soft" size="1">{stockItem.ref}</Badge>
        {stockItem.ref && (
          <Link to={`/stock?q=${encodeURIComponent(stockItem.ref)}`} style={{ display: 'flex' }}>
            <ExternalLink size={12} color="var(--blue-9)" />
          </Link>
        )}
      </Flex>
      <Text size="2" weight="medium">{stockItem.name}</Text>
      {stockItem.family_code && (
        <Text size="1" color="gray">
          {stockItem.family_code}{stockItem.sub_family_code ? ` / ${stockItem.sub_family_code}` : ''}
        </Text>
      )}
      <Flex gap="4" mt="1">
        {stockItem.location && <Text size="1" color="gray">📍 {stockItem.location}</Text>}
        <Text size="1" color="gray">Stock : {stockItem.quantity ?? '—'} {stockItem.unit || unit || 'pcs'}</Text>
        {stockItem.supplier_refs_count != null && (
          <Text size="1" color="gray">{stockItem.supplier_refs_count} fournisseur{stockItem.supplier_refs_count > 1 ? 's' : ''}</Text>
        )}
      </Flex>
      <Box mt="2">
        <Button size="1" variant="soft" color="red" onClick={onUnlink}>
          <Link2Off size={12} /> Délier cette pièce
        </Button>
      </Box>
    </Flex>
  );
}
CurrentStockTab.propTypes = { stockItem: PropTypes.object, unit: PropTypes.string, onUnlink: PropTypes.func.isRequired };

// ─── Stock item — search tab ──────────────────────────────────────────────────

function SearchStockTab({ onSelect }) {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const debounced = useDebounce(search, 600);

  useEffect(() => {
    if (debounced.length < 2) { setItems([]); return; }
    stockApi.fetchStockItems({ search: debounced })
      .then(r => setItems(Array.isArray(r) ? r : (r.items || [])))
      .catch(() => {});
  }, [debounced]);

  const handleSelect = (item) => { setSelected(item); };

  return (
    <Flex direction="column" gap="2">
      <Box style={{ position: 'relative', zIndex: 5 }}>
        <SearchableSelect
          items={items}
          label="Rechercher dans le catalogue"
          onChange={handleSelect}
          value={selected?.id ?? null}
          getDisplayText={i => i?.name || i?.ref || ''}
          getSearchableFields={i => [i?.name, i?.ref]}
          maxSuggestions={8}
          onSearchChange={setSearch}
          allowSpecialRequest={false}
          renderItem={i => (
            <Flex align="center" justify="between" gap="2">
              <Flex align="center" gap="2">
                <Badge color="blue" variant="soft" size="1">{i.ref}</Badge>
                <Text size="2" weight="bold">{i.name}</Text>
              </Flex>
              <Text size="1" color="gray">{i.quantity ?? 0} {i.unit || 'pcs'}</Text>
            </Flex>
          )}
        />
      </Box>
      {selected && (
        <>
          <SelectionSummary
            variant="stock"
            badgeText={selected.ref || ''}
            mainText={selected.name}
            rightText={`${selected.quantity ?? 0} ${selected.unit || 'pcs'}`}
            onClear={() => setSelected(null)}
          />
          <Button size="2" color="blue" onClick={() => onSelect(selected)}>
            <CheckCircle2 size={14} /> Lier cette pièce
          </Button>
        </>
      )}
    </Flex>
  );
}
SearchStockTab.propTypes = { onSelect: PropTypes.func.isRequired };

// ─── Stock item — create tab ──────────────────────────────────────────────────

function CreateStockTab({ onCreated }) {
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (payload) => {
    setSaving(true);
    try {
      const created = await stockApi.createStockItem(payload);
      onCreated(created);
    } finally {
      setSaving(false);
    }
  };

  return <StockItemForm item={null} onSubmit={handleSubmit} onCancel={() => {}} saving={saving} embedded />;
}
CreateStockTab.propTypes = { onCreated: PropTypes.func.isRequired };

// ─── Stock item card (3 tabs) ─────────────────────────────────────────────────

function StockItemCard({ currentStockItem, unit, linkedItem, onLink, onUnlink }) {
  const [activeTab, setActiveTab] = useState(currentStockItem ? 'current' : 'search');

  const handleLink = (item) => {
    onLink(item);
    setActiveTab('current');
  };

  return (
    <Card size="2" variant="surface" style={{ overflow: 'hidden' }}>
      <SectionHeader icon={Package} title="Pièce catalogue" color="var(--amber-9)" />

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List mb="3">
          <Tabs.Trigger value="current">
            <Flex align="center" gap="1">
              <Package size={12} />
              {linkedItem ? 'Pièce liée' : 'Non liée'}
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="search">
            <Flex align="center" gap="1">Rechercher</Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="create">
            <Flex align="center" gap="1"><Plus size={12} /> Créer</Flex>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="current">
          <CurrentStockTab stockItem={linkedItem} unit={unit} onUnlink={onUnlink} />
        </Tabs.Content>
        <Tabs.Content value="search">
          <SearchStockTab onSelect={handleLink} />
        </Tabs.Content>
        <Tabs.Content value="create">
          <CreateStockTab onCreated={handleLink} />
        </Tabs.Content>
      </Tabs.Root>
    </Card>
  );
}
StockItemCard.propTypes = {
  currentStockItem: PropTypes.object,
  unit: PropTypes.string,
  linkedItem: PropTypes.object,
  onLink: PropTypes.func.isRequired,
  onUnlink: PropTypes.func.isRequired,
};



// eslint-disable-next-line complexity
export default function PurchaseRequestEditForm({ item, onSubmit, loading = false, onCancel }) {
  const [state, setState] = useState({
    item_label: item.item_label || '',
    quantity: String(item.quantity ?? 1),
    unit: item.unit || 'pcs',
    urgency: item.urgency || 'normal',
    requested_by: item.requester_name || item.requested_by || '',
    workshop: item.workshop || '',
    reason: item.reason || '',
    notes: item.notes || '',
    quantity_approved: item.quantity_approved ?? null,
    approver_name: item.approver_name ?? null,
  });

  const [linkedStockItem, setLinkedStockItem] = useState(item.stock_item || null);
  const [error, setError] = useState(null);
  const [supplierRefs, setSupplierRefs] = useState([]);

  const loadSupplierRefs = useCallback(() => {
    if (!linkedStockItem?.id) { setSupplierRefs([]); return; }
    fetchStockItemSupplierLinks(linkedStockItem.id)
      .then(setSupplierRefs)
      .catch(() => setSupplierRefs([]));
  }, [linkedStockItem]);

  useEffect(() => { loadSupplierRefs(); }, [loadSupplierRefs]);

  const isToQualify = !item.stock_item;

  // eslint-disable-next-line complexity
  const handleSubmit = async () => {
    setError(null);
    if (!state.item_label.trim()) { setError('La désignation est obligatoire.'); return; }
    if (parseInt(state.quantity) < 1) { setError('La quantité doit être ≥ 1.'); return; }
    try {
      await onSubmit({
        item_label: state.item_label.trim(),
        quantity: parseInt(state.quantity, 10),
        unit: state.unit,
        urgency: state.urgency,
        requested_by: state.requested_by.trim() || 'Système',
        workshop: state.workshop.trim() || null,
        reason: state.reason.trim() || null,
        notes: state.notes.trim() || null,
        quantity_approved: state.quantity_approved,
        approver_name: state.approver_name,
        stock_item_id: linkedStockItem?.id ?? null,
      });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de la sauvegarde.');
    }
  };

  return (
    <Box p="4">
      {/* Header */}
      <Flex align="center" justify="between" gap="2" mb="4">
        <Flex align="center" gap="2">
          <Edit2 size={16} color="var(--amber-9)" />
          <Text size="3" weight="bold">
            {isToQualify ? 'Qualifier la demande' : 'Modifier la demande'}
          </Text>
          <Text size="2" color="gray">{item.item_label}</Text>
        </Flex>
        <Flex gap="2">
          <Button size="2" variant="soft" color="gray" onClick={onCancel}>
            <X size={14} /> Annuler
          </Button>
          <Button size="2" color="blue" onClick={handleSubmit} loading={loading}>
            <CheckCircle2 size={14} /> Enregistrer
          </Button>
        </Flex>
      </Flex>

      {error && <StatusCallout type="error" mb="3">{error}</StatusCallout>}

      {/* 2-column layout */}
      <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', alignItems: 'start' }}>
        <DaFieldsSection state={state} set={setState} />
        <Flex direction="column" gap="3">
          <StockItemCard
            currentStockItem={item.stock_item}
            unit={state.unit}
            linkedItem={linkedStockItem}
            onLink={si => {
              setLinkedStockItem(si);
              if (si?.name) setState(s => ({ ...s, item_label: si.name }));
            }}
            onUnlink={() => setLinkedStockItem(null)}
          />
          {linkedStockItem?.id && (
            <SuppliersSection suppliers={supplierRefs} stockItemId={String(linkedStockItem.id)} stockItemLabel={linkedStockItem.ref ? `${linkedStockItem.ref} — ${linkedStockItem.name || ''}` : linkedStockItem.name} onRefresh={loadSupplierRefs} />
          )}
        </Flex>
      </Box>
    </Box>
  );
}

PurchaseRequestEditForm.propTypes = {
  item: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  onCancel: PropTypes.func,
};
