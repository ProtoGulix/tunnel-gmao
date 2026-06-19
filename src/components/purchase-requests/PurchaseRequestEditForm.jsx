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
import { fetchSuppliers } from '@/api/suppliers';
import { UNIT_OPTIONS } from '@/config/units';
import { useDebounce } from '@/hooks/useDebounce';
import { useStockFamilies } from '@/hooks/stock/useStockFamilies';
import { useStockSubFamilies } from '@/hooks/stock/useStockSubFamilies';
import StatusCallout from '@/components/ui/StatusCallout';

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
    <textarea rows={rows} {...props} style={{ ...inputStyle, height: 'auto', resize: 'vertical', lineHeight: 1.5 }} />
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

// ─── Section champs DA ────────────────────────────────────────────────────────

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
        <Text size="1" color="gray">Stock : {part.qty_in_stock ?? '—'} {part.unit || 'pcs'}</Text>
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

// ─── Onglet "Créer une pièce" ─────────────────────────────────────────────────

function useSuppliersList() {
  const [suppliers, setSuppliers] = useState([]);
  useEffect(() => {
    fetchSuppliers({}).then(d => setSuppliers(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);
  return suppliers;
}

function CreatePartTab({ onCreated }) {
  const { families, loading: familiesLoading } = useStockFamilies();
  const { subFamilies: allSubFamilies } = useStockSubFamilies();
  const suppliers = useSuppliersList();

  const [form, setForm] = useState({
    family_code: '',
    sub_family_code: '',
    manufacturer_name: '',
    manufacturer_ref: '',
    label: '',
    supplier_id: '',
    supplier_ref: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const subFamilies = allSubFamilies.filter(s => s.family_code === form.family_code);
  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }));
  const setVal = (field, val) => setForm(f => ({ ...f, [field]: val }));

  const handleCreate = async () => {
    if (!form.family_code) { setError('La famille est obligatoire.'); return; }
    if (!form.sub_family_code) { setError('La sous-famille est obligatoire.'); return; }
    if (!form.manufacturer_name.trim()) { setError('Le nom du fabricant est obligatoire.'); return; }
    if (!form.manufacturer_ref.trim()) { setError('La référence fabricant est obligatoire.'); return; }

    setSaving(true);
    setError(null);
    try {
      const part = await partsApi.createPart({
        family_code: form.family_code,
        sub_family_code: form.sub_family_code,
        manufacturer_refs: [{
          manufacturer_name: form.manufacturer_name.trim(),
          manufacturer_ref: form.manufacturer_ref.trim(),
          label: form.label.trim() || null,
          is_preferred: true,
        }],
      });

      if (form.supplier_id && form.supplier_ref.trim()) {
        const mfrRefId = part.manufacturer_refs?.[0]?.id;
        if (mfrRefId) {
          await partsApi.addSupplierRef(mfrRefId, {
            supplier_id: form.supplier_id,
            supplier_ref: form.supplier_ref.trim(),
            is_preferred: true,
          });
          const refreshed = await partsApi.fetchPartDetail(part.id);
          onCreated(refreshed);
          return;
        }
      }
      onCreated(part);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de la création de la pièce.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Flex direction="column" gap="3">
      {error && <StatusCallout type="error">{error}</StatusCallout>}

      {/* Famille / sous-famille */}
      <Flex gap="2">
        <Box style={{ flex: 1 }}>
          <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Famille *</Text>
          <Select.Root
            value={form.family_code || '__none__'}
            onValueChange={v => { setVal('family_code', v === '__none__' ? '' : v); setVal('sub_family_code', ''); }}
            disabled={familiesLoading}
          >
            <Select.Trigger style={{ width: '100%', height: 34 }} />
            <Select.Content>
              <Select.Item value="__none__">Choisir…</Select.Item>
              {families.map(f => (
                <Select.Item key={f.family_code} value={f.family_code}>
                  {f.family_code}{f.label ? ` — ${f.label}` : ''}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Box>
        <Box style={{ flex: 1 }}>
          <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Sous-famille *</Text>
          <Select.Root
            value={form.sub_family_code || '__none__'}
            onValueChange={v => setVal('sub_family_code', v === '__none__' ? '' : v)}
            disabled={!form.family_code}
          >
            <Select.Trigger style={{ width: '100%', height: 34 }} />
            <Select.Content>
              <Select.Item value="__none__">Choisir…</Select.Item>
              {subFamilies.map(s => (
                <Select.Item key={s.code} value={s.code}>
                  {s.code}{s.label ? ` — ${s.label}` : ''}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Box>
      </Flex>

      {/* Ref fabricant */}
      <Box style={{ padding: 10, background: 'var(--violet-2)', border: '1px solid var(--violet-4)', borderRadius: 'var(--radius-2)' }}>
        <Flex align="center" gap="1" mb="2">
          <Factory size={13} color="var(--violet-9)" />
          <Text size="1" weight="bold" color="violet">Référence fabricant *</Text>
        </Flex>
        <Flex gap="2" wrap="wrap">
          <Box style={{ flex: 1, minWidth: 130 }}>
            <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Fabricant *</Text>
            <FInput value={form.manufacturer_name} onChange={set('manufacturer_name')} placeholder="ex : SKF" />
          </Box>
          <Box style={{ flex: 1, minWidth: 130 }}>
            <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Référence *</Text>
            <FInput value={form.manufacturer_ref} onChange={set('manufacturer_ref')} placeholder="ex : 6205-2RS" />
          </Box>
        </Flex>
        <Box mt="2">
          <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Désignation</Text>
          <FInput value={form.label} onChange={set('label')} placeholder="ex : Roulement à billes..." />
        </Box>
      </Box>

      {/* Fournisseur optionnel */}
      <Box style={{ padding: 10, background: 'var(--blue-2)', border: '1px solid var(--blue-4)', borderRadius: 'var(--radius-2)' }}>
        <Text size="1" weight="bold" color="blue" style={{ display: 'block', marginBottom: 6 }}>Fournisseur (optionnel)</Text>
        <Box mb="2">
          <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Fournisseur</Text>
          <select
            value={form.supplier_id}
            onChange={e => setVal('supplier_id', e.target.value)}
            style={{ ...inputStyle }}
          >
            <option value="">Aucun pour l'instant</option>
            {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </Box>
        {form.supplier_id && (
          <Box>
            <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Référence fournisseur</Text>
            <FInput
              value={form.supplier_ref}
              onChange={set('supplier_ref')}
              placeholder="ex : P1115070"
              disabled={!form.supplier_id}
            />
          </Box>
        )}
      </Box>

      <Button size="2" color="blue" onClick={handleCreate} loading={saving}>
        <Plus size={14} /> Créer et lier cette pièce
      </Button>
    </Flex>
  );
}
CreatePartTab.propTypes = { onCreated: PropTypes.func.isRequired };

// ─── Card pièce catalogue (3 onglets) ────────────────────────────────────────

function PartCatalogCard({ currentPart, linkedPart, onLink, onUnlink }) {
  const [activeTab, setActiveTab] = useState(currentPart ? 'current' : 'search');

  const handleLink = (part) => {
    onLink(part);
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
              {linkedPart ? 'Pièce liée' : 'Non liée'}
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="search">Rechercher</Tabs.Trigger>
          <Tabs.Trigger value="create">
            <Flex align="center" gap="1"><Plus size={12} /> Créer</Flex>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="current">
          <CurrentPartTab part={linkedPart} onUnlink={onUnlink} />
        </Tabs.Content>
        <Tabs.Content value="search">
          <SearchPartTab onSelect={handleLink} />
        </Tabs.Content>
        <Tabs.Content value="create">
          <CreatePartTab onCreated={handleLink} />
        </Tabs.Content>
      </Tabs.Root>
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

  // Pièce liée : priorité à item.part (V4), fallback pour affichage legacy
  const [linkedPart, setLinkedPart] = useState(item.part || null);
  const [error, setError] = useState(null);

  const isToQualify = !item.part && !item.stock_item;

  const handleLinkPart = useCallback((part) => {
    setLinkedPart(part);
    const label = part?.preferred_label || part?.preferred_manufacturer_ref || part?.display_name;
    if (label) setState(s => ({ ...s, item_label: label }));
  }, []);

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

      {/* Layout 2 colonnes */}
      <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', alignItems: 'start' }}>
        <DaFieldsSection state={state} set={setState} />
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
};
