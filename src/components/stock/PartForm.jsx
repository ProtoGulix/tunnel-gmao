/**
 * @fileoverview Formulaire création/édition d'une pièce V4
 *
 * En création  : pièce + au moins une ref fabricant obligatoire, chacune pouvant
 *                être liée à un fournisseur optionnel (sans ambiguïté de rattachement).
 * En édition   : champs scalaires seulement (familles, qty, loc, unité).
 *                Les refs fabricant se gèrent depuis PartManufacturerRefsPanel.
 *
 * @module components/stock/PartForm
 */

import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { Badge, Box, Button, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { ChevronDown, ChevronRight, Edit2, Factory, Package, Plus, Trash2 } from 'lucide-react';
import { UNIT_OPTIONS } from '@/config/units';
import { useStockFamilies } from '@/hooks/stock/useStockFamilies';
import { useStockSubFamilies } from '@/hooks/stock/useStockSubFamilies';
import FormErrors from '@/components/shared/FormErrors';
import { handleAPIError } from '@/lib/api/errors';
import { fetchSuppliers } from '@/api/suppliers';
import { buildSupplierRefPayload, initialSupplierRefFormState } from '@/components/stock/SupplierRefFormRow';

// ─── Fournisseurs optionnels rattachés à une ref fabricant (0..N) ─────────────

function GhostSupplierRow({ onClick }) {
  return (
    <Flex
      align="center" gap="2"
      onClick={onClick}
      style={{ cursor: 'pointer', padding: '4px 2px' }}
    >
      <Plus size={11} color="var(--gray-9)" />
      <Text size="1" color="gray">Lier un fournisseur à cette référence…</Text>
    </Flex>
  );
}

GhostSupplierRow.propTypes = { onClick: PropTypes.func.isRequired };

function SupplierRefEntry({ id, suppliers, entry, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(false);
  const set = (field) => (e) => onChange({ ...entry, [field]: e.target.value });

  return (
    <Box>
      <Flex align="center" gap="2">
        <Box
          onClick={() => setExpanded((v) => !v)}
          style={{ cursor: 'pointer', display: 'flex', flexShrink: 0 }}
          title="Plus d'options"
        >
          {expanded ? <ChevronDown size={13} color="var(--gray-9)" /> : <ChevronRight size={13} color="var(--gray-9)" />}
        </Box>
        <select
          value={entry.supplier_id}
          onChange={set('supplier_id')}
          style={{ flex: 1, minWidth: 0, height: 30, padding: '0 8px', borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-7)', fontSize: 'var(--font-size-1)', background: 'var(--color-background)' }}
        >
          <option value="">Fournisseur…</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <TextField.Root
          size="1"
          style={{ flex: 1, minWidth: 0 }}
          value={entry.supplier_ref}
          onChange={set('supplier_ref')}
          placeholder="Réf. fournisseur"
        />
        <Button type="button" size="1" variant="ghost" color="red" onClick={onRemove} style={{ flexShrink: 0 }}>
          <Trash2 size={11} />
        </Button>
      </Flex>

      {expanded && (
        <Flex gap="2" wrap="wrap" mt="2" pl="5">
          <Box style={{ flex: 1, minWidth: 70 }}>
            <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Qté min.</Text>
            <TextField.Root size="1" value={entry.min_order_quantity} onChange={set('min_order_quantity')} type="number" min="1" />
          </Box>
          <Box style={{ flex: 1, minWidth: 70 }}>
            <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Délai (j)</Text>
            <TextField.Root size="1" value={entry.delivery_time_days} onChange={set('delivery_time_days')} type="number" min="0" />
          </Box>
          <Box style={{ flex: 2, minWidth: 140 }}>
            <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>URL fiche produit</Text>
            <TextField.Root size="1" value={entry.product_url} onChange={set('product_url')} placeholder="https://…" type="url" />
          </Box>
          <Flex align="center" gap="1" style={{ flexBasis: '100%' }}>
            <input
              type="checkbox"
              id={`pref-${id}`}
              checked={entry.is_preferred}
              onChange={(e) => onChange({ ...entry, is_preferred: e.target.checked })}
            />
            <Text size="1" as="label" htmlFor={`pref-${id}`} color="gray">Préféré</Text>
          </Flex>
        </Flex>
      )}
    </Box>
  );
}

SupplierRefEntry.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  suppliers: PropTypes.array.isRequired,
  entry: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

function SupplierRefSection({ mfrIndex, suppliers, supplierRefs, onAdd, onChange, onRemove }) {
  return (
    <Flex direction="column" gap="2">
      {supplierRefs.map((entry, i) => (
        <SupplierRefEntry
          key={i}
          id={`${mfrIndex}-${i}`}
          suppliers={suppliers}
          entry={entry}
          onChange={(updated) => onChange(i, updated)}
          onRemove={() => onRemove(i)}
        />
      ))}
      <GhostSupplierRow onClick={onAdd} />
    </Flex>
  );
}

SupplierRefSection.propTypes = {
  mfrIndex: PropTypes.number.isRequired,
  suppliers: PropTypes.array.isRequired,
  supplierRefs: PropTypes.array.isRequired,
  onAdd: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

// ─── Formulaire inline d'une ref fabricant (en création seulement) ────────────

function MfrRefFields({ index, ref: mfrRef, onChange, onRemove, canRemove, suppliers }) {
  const set = (field) => (e) => onChange(index, { ...mfrRef, [field]: e.target.value });
  const toggle = (field) => (v) => onChange(index, { ...mfrRef, [field]: v });

  const addSupplierRef = () => {
    onChange(index, { ...mfrRef, supplierRefs: [...mfrRef.supplierRefs, initialSupplierRefFormState(null)] });
  };
  const changeSupplierRef = (supIdx, updated) => {
    onChange(index, {
      ...mfrRef,
      supplierRefs: mfrRef.supplierRefs.map((s, i) => (i === supIdx ? updated : s)),
    });
  };
  const removeSupplierRef = (supIdx) => {
    onChange(index, { ...mfrRef, supplierRefs: mfrRef.supplierRefs.filter((_, i) => i !== supIdx) });
  };

  return (
    <Box style={{ padding: 10, background: 'var(--violet-2)', border: '1px solid var(--violet-5)', borderRadius: 'var(--radius-2)' }}>
      <Flex align="center" justify="between" mb="2">
        <Flex align="center" gap="1">
          <Factory size={13} color="var(--violet-9)" />
          <Text size="2" weight="bold">Référence fabricant {index + 1}</Text>
        </Flex>
        <Flex gap="1">
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--font-size-1)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={mfrRef.is_preferred}
              onChange={(e) => toggle('is_preferred')(e.target.checked)}
            />
            Préférée
          </label>
          {canRemove && (
            <Button type="button" size="1" variant="ghost" color="red" onClick={() => onRemove(index)}>
              <Trash2 size={11} />
            </Button>
          )}
        </Flex>
      </Flex>
      <Flex gap="2" wrap="wrap">
        <Box style={{ flex: 1, minWidth: 130 }}>
          <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Fabricant *</Text>
          <TextField.Root value={mfrRef.manufacturer_name} onChange={set('manufacturer_name')} placeholder="ex: SKF" />
        </Box>
        <Box style={{ flex: 1, minWidth: 130 }}>
          <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Référence fabricant *</Text>
          <TextField.Root value={mfrRef.manufacturer_ref} onChange={set('manufacturer_ref')} placeholder="ex: 6205-2RS" />
        </Box>
      </Flex>
      <Box mt="2" mb="2">
        <Text size="1" color="gray" style={{ display: 'block', marginBottom: 3 }}>Désignation</Text>
        <TextField.Root value={mfrRef.label} onChange={set('label')} placeholder="ex: Roulement à billes à gorge profonde" />
      </Box>

      <Box style={{ borderTop: '1px solid var(--violet-5)', paddingTop: 8 }}>
        <SupplierRefSection
          mfrIndex={index}
          suppliers={suppliers}
          supplierRefs={mfrRef.supplierRefs}
          onAdd={addSupplierRef}
          onChange={changeSupplierRef}
          onRemove={removeSupplierRef}
        />
      </Box>
    </Box>
  );
}

MfrRefFields.propTypes = {
  index: PropTypes.number.isRequired,
  ref: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  canRemove: PropTypes.bool,
  suppliers: PropTypes.array.isRequired,
};

const newMfrRef = (isPreferred = false) => ({
  manufacturer_name: '', manufacturer_ref: '', label: '', is_preferred: isPreferred,
  supplierRefs: [],
});

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(form, mfrRefs, isEdit) {
  const errs = [];
  if (!form.family_code) errs.push('La famille est obligatoire.');
  if (!form.sub_family_code) errs.push('La sous-famille est obligatoire.');
  if (form.qty_in_stock !== '' && (isNaN(Number(form.qty_in_stock)) || Number(form.qty_in_stock) < 0))
    errs.push('La quantité doit être un nombre positif.');

  if (!isEdit) {
    mfrRefs.forEach((r, i) => {
      if (!r.manufacturer_name.trim()) errs.push(`Ref. fabricant ${i + 1} : nom fabricant obligatoire.`);
      if (!r.manufacturer_ref.trim()) errs.push(`Ref. fabricant ${i + 1} : référence obligatoire.`);
      r.supplierRefs.forEach((s, j) => {
        if (!s.supplier_id) errs.push(`Ref. fabricant ${i + 1}, fournisseur ${j + 1} : sélectionnez un fournisseur.`);
        if (!s.supplier_ref.trim()) errs.push(`Ref. fabricant ${i + 1}, fournisseur ${j + 1} : référence fournisseur obligatoire.`);
      });
    });
  }
  return errs;
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function PartForm({ part, onSubmit, onCancel, saving }) {
  const isEdit = !!part;
  const { families, loading: familiesLoading } = useStockFamilies();
  const { subFamilies: allSubFamilies } = useStockSubFamilies();

  const [form, setForm] = useState({
    family_code: part?.family_code || '',
    sub_family_code: part?.sub_family_code || '',
    unit: part?.unit || 'pcs',
    location: part?.location || '',
    qty_in_stock: part?.qty_in_stock != null ? String(part.qty_in_stock) : '0',
  });

  const [mfrRefs, setMfrRefs] = useState([newMfrRef(true)]);
  const [errors, setErrors] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  useEffect(() => {
    if (isEdit) return;
    fetchSuppliers({}).then((d) => setSuppliers(Array.isArray(d) ? d : [])).catch(() => {});
  }, [isEdit]);

  const subFamilies = allSubFamilies.filter((s) => s.family_code === form.family_code);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setVal = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const handleFamilyChange = (val) => {
    setForm((f) => ({ ...f, family_code: val === '__none__' ? '' : val, sub_family_code: '' }));
  };

  const updateMfrRef = (idx, updated) => {
    setMfrRefs((prev) => prev.map((r, i) => (i === idx ? updated : r)));
  };

  const removeMfrRef = (idx) => {
    setMfrRefs((prev) => prev.filter((_, i) => i !== idx));
  };

  const addMfrRef = () => {
    setMfrRefs((prev) => [...prev, newMfrRef(false)]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form, mfrRefs, isEdit);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);

    try {
      const payload = {
        family_code: form.family_code,
        sub_family_code: form.sub_family_code,
        unit: form.unit || null,
        location: form.location.trim() || null,
        qty_in_stock: form.qty_in_stock !== '' ? parseInt(form.qty_in_stock, 10) : 0,
      };

      if (!isEdit) {
        // S'assure qu'il y a une préférée
        const refs = mfrRefs.some((r) => r.is_preferred)
          ? mfrRefs
          : mfrRefs.map((r, i) => ({ ...r, is_preferred: i === 0 }));
        payload.manufacturer_refs = refs.map((r) => ({
          manufacturer_name: r.manufacturer_name.trim(),
          manufacturer_ref: r.manufacturer_ref.trim(),
          label: r.label.trim() || null,
          is_preferred: r.is_preferred,
        }));

        // Fournisseurs à lier après création, groupés par référence fabricant (identifiée par son index)
        const supplierRefsByMfrIndex = refs.flatMap((r, i) =>
          r.supplierRefs.map((s) => ({ mfrIndex: i, ...buildSupplierRefPayload(s), supplier_id: s.supplier_id }))
        );
        if (supplierRefsByMfrIndex.length > 0) {
          payload.supplier_refs_by_mfr_index = supplierRefsByMfrIndex;
        }
      }

      await onSubmit(payload);
    } catch (err) {
      const typed = handleAPIError(err, 'PartForm');
      setErrors([typed.message || 'Une erreur est survenue.']);
    }
  };

  return (
    <Box>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="3">
          <Flex align="center" gap="2">
            {isEdit ? <Edit2 size={18} /> : <Package size={18} />}
            <Text size="4" weight="bold">{isEdit ? 'Modifier la pièce' : 'Nouvelle pièce'}</Text>
          </Flex>

          <FormErrors errors={errors} />

          {/* Affiche la ref interne en édition */}
          {isEdit && (
            <Flex align="center" gap="2">
              <Text size="1" color="gray">Réf. interne :</Text>
              <Badge variant="outline" color="blue" size="1" style={{ fontFamily: 'monospace' }}>
                {part.internal_ref}
              </Badge>
            </Flex>
          )}

          {/* Famille / sous-famille */}
          <Flex gap="3" wrap="wrap">
            <Box style={{ flex: 1, minWidth: 130 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Famille *</Text>
              <Select.Root
                value={form.family_code || '__none__'}
                onValueChange={handleFamilyChange}
                disabled={isEdit || familiesLoading}
              >
                <Select.Trigger variant="soft" style={{ width: '100%' }} />
                <Select.Content>
                  <Select.Item value="__none__">Aucune</Select.Item>
                  {families.map((f) => (
                    <Select.Item key={f.family_code} value={f.family_code}>
                      <Flex align="center" gap="2">
                        <Badge variant="soft" color="gray" size="1" style={{ fontFamily: 'monospace' }}>
                          {f.family_code}
                        </Badge>
                        {f.label && <Text size="2">{f.label}</Text>}
                      </Flex>
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>
            <Box style={{ flex: 1, minWidth: 130 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Sous-famille *</Text>
              <Select.Root
                value={form.sub_family_code || '__none__'}
                onValueChange={(v) => setVal('sub_family_code')(v === '__none__' ? '' : v)}
                disabled={isEdit || !form.family_code || familiesLoading}
              >
                <Select.Trigger variant="soft" style={{ width: '100%' }} />
                <Select.Content>
                  <Select.Item value="__none__">Aucune</Select.Item>
                  {subFamilies.map((s) => (
                    <Select.Item key={s.code} value={s.code}>
                      <Flex align="center" gap="2">
                        <Badge variant="soft" color="gray" size="1" style={{ fontFamily: 'monospace' }}>{s.code}</Badge>
                        {s.label && <Text size="2">{s.label}</Text>}
                      </Flex>
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>
          </Flex>

          {/* Qty / unité / emplacement */}
          <Flex gap="3" wrap="wrap">
            <Box style={{ flex: 1, minWidth: 100 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Quantité</Text>
              <TextField.Root type="number" min="0" value={form.qty_in_stock} onChange={set('qty_in_stock')} disabled title="La gestion des quantités n'est pas encore disponible" />
            </Box>
            <Box style={{ flex: 1, minWidth: 120 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Unité</Text>
              <Select.Root value={form.unit} onValueChange={setVal('unit')}>
                <Select.Trigger variant="soft" style={{ width: '100%' }} />
                <Select.Content>
                  {UNIT_OPTIONS.map((u) => <Select.Item key={u.value} value={u.value}>{u.label}</Select.Item>)}
                </Select.Content>
              </Select.Root>
            </Box>
            <Box style={{ flex: 2, minWidth: 160 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Emplacement</Text>
              <TextField.Root value={form.location} onChange={set('location')} placeholder="ex: A-23" />
            </Box>
          </Flex>

          {/* Refs fabricant — uniquement à la création */}
          {!isEdit && (
            <Flex direction="column" gap="2">
              <Text size="2" weight="bold" color="gray">Références fabricant *</Text>
              {mfrRefs.map((r, i) => (
                <MfrRefFields
                  key={i}
                  index={i}
                  ref={r}
                  onChange={updateMfrRef}
                  onRemove={removeMfrRef}
                  canRemove={mfrRefs.length > 1}
                  suppliers={suppliers}
                />
              ))}
              <Button type="button" size="1" variant="ghost" color="violet" onClick={addMfrRef} style={{ alignSelf: 'flex-start' }}>
                <Plus size={12} /> Ajouter une référence fabricant
              </Button>
            </Flex>
          )}

          <Flex gap="2" justify="end">
            <Button type="button" variant="soft" color="gray" onClick={onCancel} disabled={saving}>Annuler</Button>
            <Button type="submit" color="blue" loading={saving}>
              {isEdit ? <><Edit2 size={14} /> Enregistrer</> : <><Plus size={14} /> Créer</>}
            </Button>
          </Flex>
        </Flex>
      </form>
    </Box>
  );
}

PartForm.propTypes = {
  part: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
