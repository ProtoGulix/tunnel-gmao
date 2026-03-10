/**
 * @fileoverview Formulaire création/édition d'une pièce référencée
 * @module components/stock/StockItemForm
 */

import PropTypes from 'prop-types';
import { Box, Button, Card, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { Edit2, Package, Plus } from 'lucide-react';
import { UNIT_OPTIONS } from '@/config/units';
import CharacteristicsFields from '@/components/stock/CharacteristicsFields';
import FormErrors from '@/components/shared/FormErrors';
import { buildPayload } from '@/lib/utils/stockItemPayload';
import { useStockItemForm } from '@/hooks/stock/useStockItemForm';
import { handleAPIError } from '@/lib/api/errors';

function validateField(field, val) {
  const filled = val !== undefined && String(val).trim() !== '';
  if (field.required && !filled) return `Le champ "${field.label}" est obligatoire.`;
  if (filled && field.field_type === 'number' && isNaN(Number(val))) return `Le champ "${field.label}" doit être une valeur numérique.`;
  return null;
}

function validate(form, template) {
  const errs = [];
  if (!form.name.trim() || form.name.trim().length < 2) errs.push('Le nom doit contenir au moins 2 caractères.');
  if (isNaN(Number(form.quantity)) || Number(form.quantity) < 0) errs.push('La quantité doit être un nombre positif.');
  if (template) (template.fields || []).forEach((field) => { const err = validateField(field, form.characteristics?.[field.key]); if (err) errs.push(err); });
  return errs;
}

function RefDisplay({ isEdit, itemRef, suggestedRef }) {
  const ref = isEdit ? itemRef : suggestedRef;
  return (
    <Box style={{ flex: 1, minWidth: 140 }}>
      <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>{isEdit ? 'Référence' : 'Référence générée'}</Text>
      <Box style={{ padding: '0 10px', height: 32, display: 'flex', alignItems: 'center', background: 'var(--gray-2)', border: '1px solid var(--gray-5)', borderRadius: 'var(--radius-2)' }}>
        <Text size="2" weight="medium" color={ref ? undefined : 'gray'} style={{ fontFamily: 'monospace' }}>{ref || '—'}</Text>
      </Box>
    </Box>
  );
}

RefDisplay.propTypes = {
  isEdit: PropTypes.bool,
  itemRef: PropTypes.string,
  suggestedRef: PropTypes.string,
};

function FormActions({ isEdit, saving, onCancel }) {
  return (
    <Flex gap="2" justify="end">
      <Button type="button" variant="soft" color="gray" onClick={onCancel} disabled={saving}>Annuler</Button>
      <Button type="submit" color="blue" loading={saving}>
        {isEdit ? <><Edit2 size={14} /> Enregistrer</> : <><Plus size={14} /> Créer</>}
      </Button>
    </Flex>
  );
}

FormActions.propTypes = {
  isEdit: PropTypes.bool,
  saving: PropTypes.bool,
  onCancel: PropTypes.func.isRequired,
};

export default function StockItemForm({ item, onSubmit, onCancel, saving, embedded = false, noActions = false, registerSubmit }) {
  const isEdit = !!item;
  const { form, errors, setErrors, families, familiesLoading, subFamilies, template, suggestedRef, set, setVal, setChar, handleFamilyChange, handleSubFamilyChange } = useStockItemForm(item);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (noActions) return; // soumission pilotée par ItemForm via registerSubmit
    const errs = validate(form, isEdit ? null : template);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    try {
      await onSubmit(buildPayload(form, template, isEdit));
    } catch (err) {
      const typed = handleAPIError(err, 'StockItemForm');
      setErrors([typed.message || 'Une erreur est survenue.']);
    }
  };

  // Enregistrement du handler pour ItemForm (appelé à chaque render — closure toujours à jour)
  if (registerSubmit) {
    registerSubmit(async () => {
      const errs = validate(form, isEdit ? null : template);
      if (errs.length) { setErrors(errs); return null; } // erreurs affichées via FormErrors
      setErrors([]);
      try {
        return await onSubmit(buildPayload(form, template, isEdit));
      } catch (err) {
        const typed = handleAPIError(err, 'StockItemForm');
        setErrors([typed.message || 'Une erreur est survenue.']);
        return null;
      }
    });
  }

  const content = (
    <form onSubmit={handleSubmit}>
      <Flex direction="column" gap="3">
        {!embedded && (
          <Flex align="center" gap="2">
            {isEdit ? <Edit2 size={18} /> : <Package size={18} />}
            <Text size="4" weight="bold">{isEdit ? 'Modifier la pièce' : 'Nouvelle pièce'}</Text>
          </Flex>
        )}

        <FormErrors errors={errors} />

          <Flex gap="3" wrap="wrap">
            <RefDisplay isEdit={isEdit} itemRef={item?.ref} suggestedRef={suggestedRef} />
            <Box style={{ flex: 2, minWidth: 200 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Nom *</Text>
              <TextField.Root value={form.name} onChange={set('name')} placeholder="Roulement SKF 6205" />
            </Box>
          </Flex>

          <Flex gap="3" wrap="wrap">
            <Box style={{ flex: 1, minWidth: 130 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Famille</Text>
              <Select.Root value={form.family_code || '__none__'} onValueChange={handleFamilyChange} disabled={isEdit || familiesLoading}>
                <Select.Trigger variant="soft" style={{ width: '100%' }} />
                <Select.Content>
                  <Select.Item value="__none__">— Aucune —</Select.Item>
                  {families.map((f) => <Select.Item key={f.family_code} value={f.family_code}>{f.family_code}</Select.Item>)}
                </Select.Content>
              </Select.Root>
            </Box>
            <Box style={{ flex: 1, minWidth: 130 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Sous-famille</Text>
              <Select.Root value={form.sub_family_code || '__none__'} onValueChange={handleSubFamilyChange} disabled={isEdit || !form.family_code || familiesLoading}>
                <Select.Trigger variant="soft" style={{ width: '100%' }} />
                <Select.Content>
                  <Select.Item value="__none__">— Aucune —</Select.Item>
                  {subFamilies.map((s) => <Select.Item key={s.code} value={s.code}>{s.code}</Select.Item>)}
                </Select.Content>
              </Select.Root>
            </Box>
          </Flex>

          <CharacteristicsFields
            template={template}
            characteristics={form.characteristics}
            onCharChange={setChar}
            spec={form.spec}
            dimension={form.dimension}
            onSpecChange={set('spec')}
            onDimChange={set('dimension')}
            readonly={isEdit && !!template}
          />

          <Flex gap="3" wrap="wrap">
            <Box style={{ flex: 1, minWidth: 100 }}>
              <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Quantité</Text>
              <TextField.Root type="number" min="0" value={form.quantity} onChange={set('quantity')} />
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
              <TextField.Root value={form.location} onChange={set('location')} placeholder="A-23" />
            </Box>
          </Flex>

          {!noActions && <FormActions isEdit={isEdit} saving={saving} onCancel={onCancel} />}
        </Flex>
      </form>
    );

  if (embedded) return content;
  return <Card>{content}</Card>;
}

StockItemForm.propTypes = {
  item: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  embedded: PropTypes.bool,
  noActions: PropTypes.bool,
  registerSubmit: PropTypes.func,
};
