/**
 * @fileoverview Panel qualification / édition d'une demande d'achat (V4)
 *
 * Deux chemins :
 *  - Qualifier (isToQualify=true) : rechercher ou créer une pièce du catalogue part V4
 *  - Modifier  (isToQualify=false) : éditer les champs de la DA + changer la pièce liée
 *
 * La pièce liée est désormais un `part` (internal_ref P000001) — plus de stock_item.
 * stock_item_id reste passé en lecture seule si héritage legacy.
 *
 * @module components/purchase-requests/PurchaseRequestEditForm
 */

import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Flex, Select, Separator, Tabs, Text, TextField } from '@radix-ui/themes';
import { CheckCircle2, Edit2, Factory, Link2Off, Package, Plus, ShoppingCart, X } from 'lucide-react';
import * as partsApi from '@/api/parts';
import { UNIT_OPTIONS } from '@/config/units';
import { useDebounce } from '@/hooks/useDebounce';
import PartForm from '@/components/stock/PartForm';
import StatusCallout from '@/components/ui/StatusCallout';
import Drawer from '@/components/ui/Drawer';
import { fetchActiveUsers } from '@/api/planning';

// ─── Primitives ──────────────────────────────────────────────────────────────

const inputStyle = {
  width: '100%', padding: '7px 10px',
  borderRadius: '6px', border: '1px solid var(--gray-7)',
  fontSize: '13px', fontFamily: 'inherit', boxSizing: 'border-box', height: '34px',
  background: 'var(--color-background)',
};

function F({ label, htmlFor, required, error, children }) {
  return (
    <Box>
      <Text as="label" htmlFor={htmlFor} size="1" weight="bold" mb="1" style={{ display: 'block', color: 'var(--gray-11)' }}>
        {label}{required && <span style={{ color: 'var(--red-9)' }}> *</span>}
      </Text>
      {children}
      {error && (
        <Text size="1" color="red" mt="1" style={{ display: 'block' }} role="alert">
          {error}
        </Text>
      )}
    </Box>
  );
}
F.propTypes = {
  label: PropTypes.string.isRequired,
  htmlFor: PropTypes.string,
  required: PropTypes.bool,
  error: PropTypes.string,
  children: PropTypes.node.isRequired,
};

function FInput({ id, invalid, ...props }) {
  return (
    <input
      id={id}
      aria-invalid={invalid || undefined}
      {...props}
      style={{ ...inputStyle, ...(invalid ? { borderColor: 'var(--red-8)' } : {}), ...props.style }}
    />
  );
}
FInput.propTypes = { id: PropTypes.string, invalid: PropTypes.bool, style: PropTypes.object };

function FTextarea({ id, rows = 2, ...props }) {
  return (
    <textarea id={id} rows={rows} {...props} style={{ ...inputStyle, height: 'auto', resize: 'vertical', lineHeight: 1.5 }} />
  );
}
FTextarea.propTypes = { id: PropTypes.string, rows: PropTypes.number };

function SectionHeader({ icon: Icon, title, color = 'var(--gray-9)' }) {
  return (
    <Flex align="center" gap="2" pb="2" mb="2" style={{ borderBottom: '1px solid var(--gray-4)' }}>
      <Icon size={14} color={color} />
      <Text size="2" weight="medium" color="gray">{title}</Text>
    </Flex>
  );
}
SectionHeader.propTypes = { icon: PropTypes.elementType.isRequired, title: PropTypes.string.isRequired, color: PropTypes.string };

function userLabel(user) {
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
  return user.initial ? `${user.initial} - ${name}` : name || user.id;
}

const NO_USER = '__none__';

function UserSelect({ id, users, value, onChange, placeholder }) {
  return (
    <Select.Root value={value ?? NO_USER} onValueChange={(v) => onChange(v === NO_USER ? null : v)}>
      <Select.Trigger id={id} placeholder={placeholder} style={{ width: '100%', height: '34px' }} />
      <Select.Content>
        <Select.Item value={NO_USER}>—</Select.Item>
        {users.map((user) => (
          <Select.Item key={user.id} value={String(user.id)}>{userLabel(user)}</Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}
UserSelect.propTypes = {
  id: PropTypes.string,
  users: PropTypes.array.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

// ─── Section champs DA ────────────────────────────────────────────────────────

const URGENCY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Élevée' },
  { value: 'critical', label: 'Critique' },
];

function DaFieldsSection({ state, set, errors, touched, touch, users }) {
  return (
    <Card size="2" variant="surface" style={{ overflow: 'hidden' }}>
      <SectionHeader icon={ShoppingCart} title="Informations de la demande" color="var(--blue-9)" />
      <Flex direction="column" gap="3">

        <F label="Désignation" htmlFor="pr-item-label" required error={touched.item_label ? errors.item_label : null}>
          <FInput
            id="pr-item-label"
            invalid={touched.item_label && !!errors.item_label}
            value={state.item_label}
            onChange={e => set(s => ({ ...s, item_label: e.target.value }))}
            onBlur={() => touch('item_label')}
            placeholder="Nom de l'article ou de la pièce"
          />
        </F>

        <Flex gap="2">
          <F label="Quantité" htmlFor="pr-quantity" required error={touched.quantity ? errors.quantity : null}>
            <FInput
              id="pr-quantity"
              invalid={touched.quantity && !!errors.quantity}
              type="number" min="1" style={{ width: 90 }}
              value={state.quantity}
              onChange={e => set(s => ({ ...s, quantity: e.target.value }))}
              onBlur={() => touch('quantity')}
            />
          </F>
          <Box style={{ flex: 1 }}>
            <F label="Unité" htmlFor="pr-unit">
              <Select.Root value={state.unit} onValueChange={v => set(s => ({ ...s, unit: v }))}>
                <Select.Trigger id="pr-unit" style={{ width: '100%', height: '34px' }} />
                <Select.Content>
                  {UNIT_OPTIONS.map(({ value, label }) => (
                    <Select.Item key={value} value={value}>{label}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </F>
          </Box>
          <Box style={{ flex: 1 }}>
            <F label="Urgence" htmlFor="pr-urgency">
              <Select.Root value={state.urgency} onValueChange={v => set(s => ({ ...s, urgency: v }))}>
                <Select.Trigger id="pr-urgency" style={{ width: '100%', height: '34px' }} />
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
            <F label="Demandeur" htmlFor="pr-requested-by" required error={touched.requested_by ? errors.requested_by : null}>
              <UserSelect
                id="pr-requested-by"
                users={users}
                value={state.requested_by_id}
                onChange={(v) => { set(s => ({ ...s, requested_by_id: v })); touch('requested_by'); }}
                placeholder="Sélectionner un demandeur"
              />
            </F>
          </Box>
          <Box style={{ flex: 1 }}>
            <F label="Atelier" htmlFor="pr-workshop">
              <FInput
                id="pr-workshop"
                value={state.workshop}
                onChange={e => set(s => ({ ...s, workshop: e.target.value }))}
                placeholder="Atelier concerné"
              />
            </F>
          </Box>
        </Flex>

        <F label="Motif" htmlFor="pr-reason">
          <FTextarea
            id="pr-reason"
            value={state.reason}
            onChange={e => set(s => ({ ...s, reason: e.target.value }))}
            placeholder="Raison de la demande..."
          />
        </F>

        <F label="Notes" htmlFor="pr-notes">
          <FTextarea
            id="pr-notes"
            value={state.notes}
            onChange={e => set(s => ({ ...s, notes: e.target.value }))}
            placeholder="Informations complémentaires..."
          />
        </F>

        <Separator size="4" />
        <Text size="1" color="gray" weight="medium">Approbation</Text>

        <Flex gap="2">
          <F label="Qté approuvée" htmlFor="pr-quantity-approved">
            <FInput
              id="pr-quantity-approved"
              type="number" min="0" style={{ width: 110 }}
              value={state.quantity_approved ?? ''}
              onChange={e => set(s => ({ ...s, quantity_approved: e.target.value === '' ? null : Number(e.target.value) }))}
              placeholder="—"
            />
          </F>
          <Box style={{ flex: 1 }}>
            <F label="Approuveur" htmlFor="pr-approver-id">
              <UserSelect
                id="pr-approver-id"
                users={users}
                value={state.approver_id}
                onChange={(v) => set(s => ({ ...s, approver_id: v }))}
                placeholder="Sélectionner un approbateur"
              />
            </F>
          </Box>
        </Flex>

      </Flex>
    </Card>
  );
}
DaFieldsSection.propTypes = {
  state: PropTypes.object.isRequired,
  set: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  touched: PropTypes.object.isRequired,
  touch: PropTypes.func.isRequired,
  users: PropTypes.array.isRequired,
};

// ─── Onglet "Pièce liée" (état actuel) ───────────────────────────────────────

function CurrentPartTab({ part, onUnlink }) {
  if (!part) {
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
        <Badge color="blue" variant="soft" size="1" style={{ fontFamily: 'monospace' }}>
          {part.internal_ref}
        </Badge>
      </Flex>
      <Text size="2" weight="medium">{part.display_name}</Text>
      {part.family_code && (
        <Text size="1" color="gray">
          {part.family_code}{part.sub_family_code ? ` / ${part.sub_family_code}` : ''}
        </Text>
      )}
      <Flex gap="4" mt="1">
        {part.location && <Text size="1" color="gray">📍 {part.location}</Text>}
        {part.supplier_refs_count != null && (
          <Text size="1" color="gray">{part.supplier_refs_count} fournisseur{part.supplier_refs_count > 1 ? 's' : ''}</Text>
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
CurrentPartTab.propTypes = { part: PropTypes.object, onUnlink: PropTypes.func.isRequired };

// ─── Onglet "Rechercher" ──────────────────────────────────────────────────────

function SearchPartTab({ onSelect }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const debounced = useDebounce(search, 400);

  useEffect(() => {
    if (debounced.length < 2) { setResults([]); return; }
    setLoading(true);
    partsApi.fetchParts({ search: debounced, limit: 10 })
      .then(d => setResults(Array.isArray(d) ? d : (d.items || [])))
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [debounced]);

  return (
    <Flex direction="column" gap="2">
      <TextField.Root
        value={search}
        onChange={e => { setSearch(e.target.value); setSelected(null); }}
        placeholder="Réf. interne, nom fabricant, réf. fabricant…"
        size="2"
      />

      {loading && <Text size="1" color="gray">Recherche…</Text>}

      {results.length > 0 && !selected && (
        <Flex direction="column" gap="1" style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--gray-4)', borderRadius: 'var(--radius-2)' }}>
          {results.map(item => {
            const mfrRef = item.preferred_manufacturer_ref;
            const mfrName = item.preferred_manufacturer_name;
            const label = item.preferred_label;
            return (
              <Box
                key={item.id}
                onClick={() => setSelected(item)}
                style={{
                  padding: '8px 10px',
                  cursor: 'pointer',
                  borderBottom: '1px solid var(--gray-3)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-2)'}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <Flex align="center" gap="2">
                  <Badge color="blue" variant="soft" size="1" style={{ fontFamily: 'monospace', flexShrink: 0 }}>
                    {item.internal_ref}
                  </Badge>
                  {mfrRef && (
                    <>
                      <Factory size={11} color="var(--violet-9)" />
                      <Text size="1" color="violet">{mfrRef}</Text>
                      {mfrName && <Text size="1" color="gray">{mfrName}</Text>}
                    </>
                  )}
                  <Text size="1" color="gray" style={{ marginLeft: 'auto' }}>
                    {item.family_code}/{item.sub_family_code}
                  </Text>
                </Flex>
                {label && (
                  <Text size="1" color="gray" style={{ marginLeft: 20, marginTop: 2, display: 'block' }}>
                    {label}
                  </Text>
                )}
              </Box>
            );
          })}
        </Flex>
      )}

      {results.length === 0 && debounced.length >= 2 && !loading && (
        <Text size="1" color="gray">Aucune pièce trouvée pour &quot;{debounced}&quot;</Text>
      )}

      {selected && (
        <Box style={{ padding: 10, background: 'var(--blue-2)', border: '1px solid var(--blue-6)', borderRadius: 'var(--radius-2)' }}>
          <Flex align="center" gap="2" mb="2">
            <Package size={14} color="var(--blue-9)" />
            <Badge color="blue" variant="soft" size="1" style={{ fontFamily: 'monospace' }}>{selected.internal_ref}</Badge>
            <Text size="2" weight="medium" style={{ flex: 1 }}>{selected.preferred_label || selected.preferred_manufacturer_ref || selected.internal_ref}</Text>
            <Button size="1" variant="ghost" color="gray" onClick={() => setSelected(null)}><X size={12} /></Button>
          </Flex>
          <Button size="2" color="blue" onClick={() => onSelect(selected)}>
            <CheckCircle2 size={14} /> Lier cette pièce
          </Button>
        </Box>
      )}
    </Flex>
  );
}
SearchPartTab.propTypes = { onSelect: PropTypes.func.isRequired };

// ─── Drawer "Créer une pièce" ─────────────────────────────────────────────────

function CreatePartDrawer({ open, onOpenChange, onCreated }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (payload) => {
    setSaving(true);
    setError(null);
    try {
      const part = await partsApi.createPartWithSupplierRef(payload);
      onCreated(part);
      onOpenChange(false);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de la création de la pièce.');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title="Créer une pièce catalogue" width={520}>
      <Flex direction="column" gap="2">
        {error && <StatusCallout type="error">{error}</StatusCallout>}
        <PartForm onSubmit={handleSubmit} onCancel={() => onOpenChange(false)} saving={saving} />
      </Flex>
    </Drawer>
  );
}
CreatePartDrawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onCreated: PropTypes.func.isRequired,
};

// ─── Card pièce catalogue (2 onglets + drawer de création) ───────────────────

function PartCatalogCard({ currentPart, linkedPart, onLink, onUnlink }) {
  const [activeTab, setActiveTab] = useState(currentPart ? 'current' : 'search');
  const [createOpen, setCreateOpen] = useState(false);

  const handleLink = (part) => {
    onLink(part);
    setActiveTab('current');
  };

  return (
    <Card size="2" variant="surface" style={{ overflow: 'hidden' }}>
      <Flex align="center" justify="between">
        <SectionHeader icon={Package} title="Pièce catalogue" color="var(--amber-9)" />
        <Button size="1" variant="soft" onClick={() => setCreateOpen(true)} mb="2">
          <Plus size={12} /> Créer une pièce
        </Button>
      </Flex>

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List mb="3">
          <Tabs.Trigger value="current">
            <Flex align="center" gap="1">
              <Package size={12} />
              {linkedPart ? 'Pièce liée' : 'Non liée'}
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="search">Rechercher</Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="current">
          <CurrentPartTab part={linkedPart} onUnlink={onUnlink} />
        </Tabs.Content>
        <Tabs.Content value="search">
          <SearchPartTab onSelect={handleLink} />
        </Tabs.Content>
      </Tabs.Root>

      <CreatePartDrawer open={createOpen} onOpenChange={setCreateOpen} onCreated={handleLink} />
    </Card>
  );
}
PartCatalogCard.propTypes = {
  currentPart: PropTypes.object,
  linkedPart: PropTypes.object,
  onLink: PropTypes.func.isRequired,
  onUnlink: PropTypes.func.isRequired,
};

// ─── Composant principal ──────────────────────────────────────────────────────

function validateState(state) {
  const errors = {};
  if (!state.item_label.trim()) errors.item_label = 'La désignation est obligatoire.';
  if (!state.requested_by_id) errors.requested_by = 'Le demandeur est obligatoire.';
  const qty = parseInt(state.quantity, 10);
  if (!state.quantity || Number.isNaN(qty) || qty < 1) errors.quantity = 'La quantité doit être un nombre ≥ 1.';
  return errors;
}

const orDefault = (value, fallback = '') => value || fallback;

function buildInitialState(item) {
  return {
    item_label: orDefault(item.item_label),
    quantity: String(item.quantity ?? 1),
    unit: orDefault(item.unit, 'pcs'),
    urgency: orDefault(item.urgency, 'normal'),
    requested_by_id: item.requested_by_user?.id ? String(item.requested_by_user.id) : null,
    workshop: orDefault(item.workshop),
    reason: orDefault(item.reason),
    notes: orDefault(item.notes),
    quantity_approved: item.quantity_approved ?? null,
    approver_id: item.approver_user?.id ? String(item.approver_user.id) : null,
  };
}

export default function PurchaseRequestEditForm({ item, onSubmit, loading = false, onCancel, onDirtyChange }) {
  const [initialState] = useState(() => buildInitialState(item));
  const [state, setState] = useState(initialState);
  const [touched, setTouched] = useState({});
  const [users, setUsers] = useState([]);

  useEffect(() => { fetchActiveUsers().then(setUsers).catch(() => setUsers([])); }, []);

  // Pièce liée : priorité à item.part (V4), fallback pour affichage legacy
  const [linkedPart, setLinkedPart] = useState(item.part || null);
  const [error, setError] = useState(null);

  const isToQualify = !item.part && !item.stock_item;
  const errors = validateState(state);
  const isValid = Object.keys(errors).length === 0;
  const isDirty = JSON.stringify(state) !== JSON.stringify(initialState)
    || (linkedPart?.id ?? null) !== (item.part?.id ?? null);

  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  const touch = useCallback((field) => setTouched(t => ({ ...t, [field]: true })), []);

  const handleLinkPart = useCallback((part) => {
    setLinkedPart(part);
    const label = part?.preferred_label || part?.preferred_manufacturer_ref || part?.display_name;
    if (label) setState(s => ({ ...s, item_label: label }));
  }, []);

  const handleSubmit = async () => {
    setError(null);
    setTouched({ item_label: true, quantity: true, requested_by: true });
    if (!isValid) return;
    try {
      await onSubmit({
        item_label: state.item_label.trim(),
        quantity: parseInt(state.quantity, 10),
        unit: state.unit,
        urgency: state.urgency,
        requested_by_id: state.requested_by_id,
        workshop: state.workshop.trim() || null,
        reason: state.reason.trim() || null,
        notes: state.notes.trim() || null,
        quantity_approved: state.quantity_approved,
        approver_id: state.approver_id,
        part_id: linkedPart?.id ?? null,
      });
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de la sauvegarde.');
    }
  };

  return (
    <Box p="4">
      {/* En-tête */}
      <Flex align="center" justify="between" gap="2" mb="4">
        <Flex align="center" gap="2">
          <Edit2 size={16} color="var(--amber-9)" />
          <Text size="3" weight="bold">
            {isToQualify ? 'Qualifier la demande' : 'Modifier la demande'}
          </Text>
          <Text size="2" color="gray">{item.code || item.item_label}</Text>
        </Flex>
        <Flex gap="2">
          <Button size="2" variant="soft" color="gray" onClick={onCancel}>
            <X size={14} /> Annuler
          </Button>
          <Button size="2" color="blue" onClick={handleSubmit} loading={loading} disabled={!isValid}>
            <CheckCircle2 size={14} /> Enregistrer
          </Button>
        </Flex>
      </Flex>

      {error && <StatusCallout type="error" mb="3">{error}</StatusCallout>}

      {/* Layout 2 colonnes */}
      <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', alignItems: 'start' }}>
        <DaFieldsSection state={state} set={setState} errors={errors} touched={touched} touch={touch} users={users} />
        <PartCatalogCard
          currentPart={item.part}
          linkedPart={linkedPart}
          onLink={handleLinkPart}
          onUnlink={() => setLinkedPart(null)}
        />
      </Box>
    </Box>
  );
}

PurchaseRequestEditForm.propTypes = {
  item: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  onCancel: PropTypes.func,
  onDirtyChange: PropTypes.func,
};
