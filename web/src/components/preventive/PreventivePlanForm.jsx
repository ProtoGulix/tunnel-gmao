/**
 * @fileoverview Formulaire création / édition d'un plan préventif
 * @module components/preventive/PreventivePlanForm
 */

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Flex, Select, Switch, Text, TextField } from '@radix-ui/themes';
import { Edit2, Plus } from 'lucide-react';
import { fetchEquipementClasses } from '@/api/equipementClasses';
import FormErrors from '@/components/shared/FormErrors';

function Field({ label, required, children }) {
  return (
    <Box>
      <Text size="2" weight="bold" as="label">
        {label}{required && <Text as="span" color="red"> *</Text>}
      </Text>
      <Box mt="1">{children}</Box>
    </Box>
  );
}
Field.propTypes = { label: PropTypes.string.isRequired, required: PropTypes.bool, children: PropTypes.node.isRequired };

const empty = {
  code: '',
  label: '',
  equipement_class_id: '',
  trigger_type: 'periodicity',
  periodicity_days: '',
  hours_threshold: '',
  auto_accept: false,
};

function fromPlan(plan) {
  if (!plan) return { ...empty };
  return {
    code: plan.code || '',
    label: plan.label || '',
    equipement_class_id: plan.equipement_class_id || '',
    trigger_type: plan.trigger_type || 'periodicity',
    periodicity_days: plan.periodicity_days != null ? String(plan.periodicity_days) : '',
    hours_threshold: plan.hours_threshold != null ? String(plan.hours_threshold) : '',
    auto_accept: plan.auto_accept ?? false,
  };
}

function validate(form) {
  const errs = [];
  if (!form.code.trim()) errs.push('Le code est obligatoire.');
  else if (!/^[A-Z0-9_]+$/.test(form.code.trim())) errs.push('Le code ne peut contenir que des lettres majuscules, chiffres et tirets bas.');
  if (!form.label.trim()) errs.push('Le libellé est obligatoire.');
  if (!form.equipement_class_id) errs.push('La classe d\'équipement est obligatoire.');
  if (form.trigger_type === 'periodicity') {
    if (!form.periodicity_days || isNaN(Number(form.periodicity_days)) || Number(form.periodicity_days) < 1)
      errs.push('Le nombre de jours doit être un entier ≥ 1.');
  } else {
    if (!form.hours_threshold || isNaN(Number(form.hours_threshold)) || Number(form.hours_threshold) < 1)
      errs.push('Le seuil en heures doit être un entier ≥ 1.');
  }
  return errs;
}

export default function PreventivePlanForm({ plan, onSubmit, onCancel, saving }) {
  const isEdit = !!plan;
  const [form, setForm] = useState(() => fromPlan(plan));
  const [classes, setClasses] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    fetchEquipementClasses().then((c) => setClasses(Array.isArray(c) ? c : [])).catch(() => {});
  }, []);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setCode = (e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    try {
      const payload = {
        label: form.label.trim(),
        equipement_class_id: form.equipement_class_id,
        trigger_type: form.trigger_type,
        auto_accept: form.auto_accept,
      };
      if (!isEdit) payload.code = form.code.trim();
      if (form.trigger_type === 'periodicity') payload.periodicity_days = Number(form.periodicity_days);
      else payload.hours_threshold = Number(form.hours_threshold);
      await onSubmit(payload);
    } catch (err) {
      setErrors([err?.message || 'Une erreur est survenue.']);
    }
  };

  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          {isEdit ? <Edit2 size={20} color="var(--blue-9)" /> : <Plus size={20} color="var(--blue-9)" />}
          <Text size="3" weight="bold">{isEdit ? 'Modifier le plan' : 'Nouveau plan préventif'}</Text>
          {isEdit && <Badge variant="outline" color="gray" size="1" style={{ fontFamily: 'monospace' }}>{plan.code}</Badge>}
        </Flex>

        <FormErrors errors={errors} />

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <Flex gap="3" wrap="wrap">
              <Box style={{ flex: '1', minWidth: '140px' }}>
                <Field label="Code" required>
                  {isEdit ? (
                    <Flex align="center" gap="2">
                      <Badge variant="soft" color="gray" style={{ fontFamily: 'monospace', fontSize: 13 }}>{plan.code}</Badge>
                      <Text size="1" color="gray">(immuable)</Text>
                    </Flex>
                  ) : (
                    <TextField.Root value={form.code} onChange={setCode} placeholder="PM-SCIE-H" />
                  )}
                </Field>
              </Box>
              <Box style={{ flex: '3', minWidth: '200px' }}>
                <Field label="Libellé" required>
                  <TextField.Root value={form.label} onChange={set('label')} placeholder="Maintenance hebdomadaire scies" />
                </Field>
              </Box>
            </Flex>

            <Field label="Classe d'équipement" required>
              <Select.Root value={form.equipement_class_id || '__none__'} onValueChange={(v) => setForm((f) => ({ ...f, equipement_class_id: v === '__none__' ? '' : v }))}>
                <Select.Trigger style={{ width: '100%' }} />
                <Select.Content>
                  <Select.Item value="__none__">— Choisir une classe —</Select.Item>
                  {classes.map((c) => <Select.Item key={c.id} value={c.id}>{c.code} — {c.label}</Select.Item>)}
                </Select.Content>
              </Select.Root>
            </Field>

            <Field label="Type de déclencheur" required>
              <Flex gap="3" wrap="wrap" mt="1">
                <Flex
                  align="center" gap="2" p="2" style={{
                    flex: 1, minWidth: 160, border: `2px solid ${form.trigger_type === 'periodicity' ? 'var(--blue-8)' : 'var(--gray-5)'}`,
                    borderRadius: 6, cursor: 'pointer', background: form.trigger_type === 'periodicity' ? 'var(--blue-2)' : 'transparent',
                  }}
                  onClick={() => setForm((f) => ({ ...f, trigger_type: 'periodicity' }))}
                >
                  <Box style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--blue-9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {form.trigger_type === 'periodicity' && <Box style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue-9)' }} />}
                  </Box>
                  <Text size="2">Périodicité (jours)</Text>
                </Flex>
                <Flex
                  align="center" gap="2" p="2" style={{
                    flex: 1, minWidth: 160, border: `2px solid ${form.trigger_type === 'hours' ? 'var(--blue-8)' : 'var(--gray-5)'}`,
                    borderRadius: 6, cursor: 'pointer', background: form.trigger_type === 'hours' ? 'var(--blue-2)' : 'transparent',
                  }}
                  onClick={() => setForm((f) => ({ ...f, trigger_type: 'hours' }))}
                >
                  <Box style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--blue-9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {form.trigger_type === 'hours' && <Box style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--blue-9)' }} />}
                  </Box>
                  <Text size="2">Compteur d'heures</Text>
                </Flex>
              </Flex>
            </Field>

            {form.trigger_type === 'periodicity' ? (
              <Field label="Nombre de jours" required>
                <TextField.Root type="number" min="1" value={form.periodicity_days} onChange={set('periodicity_days')} placeholder="7" style={{ maxWidth: 160 }} />
              </Field>
            ) : (
              <Field label="Seuil en heures" required>
                <TextField.Root type="number" min="1" value={form.hours_threshold} onChange={set('hours_threshold')} placeholder="250" style={{ maxWidth: 160 }} />
              </Field>
            )}

            <Flex align="center" gap="3" p="3" style={{ background: 'var(--gray-2)', borderRadius: 6 }}>
              <Switch checked={form.auto_accept} onCheckedChange={(v) => setForm((f) => ({ ...f, auto_accept: v }))} size="2" />
              <Box>
                <Text size="2" weight="medium">Création automatique</Text>
                <Text size="1" color="gray" style={{ display: 'block' }}>Créer l'intervention automatiquement sans validation RESP</Text>
              </Box>
            </Flex>

            <Flex justify="end" gap="2" mt="1">
              <Button size="2" type="button" variant="soft" color="gray" onClick={onCancel} disabled={saving}>Annuler</Button>
              <Button size="2" type="submit" color="blue" disabled={saving}>
                <Plus size={14} />
                {saving ? 'Enregistrement…' : isEdit ? 'Mettre à jour' : 'Créer le plan'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

PreventivePlanForm.propTypes = {
  plan: PropTypes.object,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
