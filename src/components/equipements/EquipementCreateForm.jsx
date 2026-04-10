/**
 * @fileoverview Formulaire inline de création d'un équipement
 * @module components/equipements/EquipementCreateForm
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Card, Flex, Text, Button, TextField, Select, Switch, Badge } from '@radix-ui/themes';
import { Plus, Link2, X } from 'lucide-react';
import { fetchEquipementClasses } from '@/api/equipementClasses';
import { fetchEquipementStatuts, fetchEquipements } from '@/api/equipements';
import AsyncSearchSelect from '@/components/ui/AsyncSearchSelect';

const DEFAULT_FORM = {
  name: '',
  code_suffix: '',   // partie numérique saisie par l'utilisateur
  code_override: '', // si l'utilisateur édite manuellement le code généré
  no_machine: '',
  affectation: '',
  fabricant: '',
  numero_serie: '',
  date_mise_service: '',
  notes: '',
  is_mere: false,
  equipement_class_id: '',
  statut_id: '',
  parent_id: '',
};

function Field({ label, required, hint, children }) {
  return (
    <Box>
      <Flex align="baseline" gap="2" mb="1">
        <Text size="2" weight="bold">{label}{required && <Text as="span" color="red"> *</Text>}</Text>
        {hint && <Text size="1" color="gray">{hint}</Text>}
      </Flex>
      {children}
    </Box>
  );
}

Field.propTypes = {
  label: PropTypes.string.isRequired,
  required: PropTypes.bool,
  hint: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default function EquipementCreateForm({ onCancel, onSubmit }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedParent, setSelectedParent] = useState(null);
  const [classes, setClasses] = useState([]);
  const [statuts, setStatuts] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState([]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  useEffect(() => {
    fetchEquipementClasses().then(setClasses).catch(() => {});
    fetchEquipementStatuts().then(setStatuts).catch(() => {});
  }, []);

  // Génération auto du code = classeCode-suffix
  const generatedCode = selectedClass && form.code_suffix.trim()
    ? `${selectedClass.code}-${form.code_suffix.trim()}`
    : '';
  // Le code final : override manuel prioritaire, sinon généré
  const finalCode = form.code_override.trim() || generatedCode;

  const handleClassChange = (v) => {
    const cls = v === '__none__' ? null : classes.find((c) => c.id === v) ?? null;
    setSelectedClass(cls);
    setForm((f) => ({ ...f, equipement_class_id: cls?.id ?? '', code_override: '' }));
  };

  const handleParentChange = (eq) => {
    setSelectedParent(eq);
    setForm((f) => ({ ...f, parent_id: eq?.id ?? '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setErrors(['Le nom est obligatoire.']); return; }
    try {
      setSubmitting(true);
      setErrors([]);
      const payload = { name: form.name.trim() };
      if (finalCode) payload.code = finalCode;
      if (form.no_machine.trim()) payload.no_machine = form.no_machine.trim();
      if (form.affectation.trim()) payload.affectation = form.affectation.trim();
      if (form.fabricant.trim()) payload.fabricant = form.fabricant.trim();
      if (form.numero_serie.trim()) payload.numero_serie = form.numero_serie.trim();
      if (form.date_mise_service) payload.date_mise_service = form.date_mise_service;
      if (form.notes.trim()) payload.notes = form.notes.trim();
      if (form.is_mere) payload.is_mere = true;
      if (form.equipement_class_id) payload.equipement_class_id = form.equipement_class_id;
      if (form.statut_id) payload.statut_id = parseInt(form.statut_id, 10);
      if (form.parent_id) payload.parent_id = form.parent_id;
      await onSubmit(payload);
    } catch (err) {
      setErrors([err.response?.data?.detail ?? err.message ?? 'Erreur lors de la création.']);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          <Plus size={20} color="var(--blue-9)" />
          <Text size="3" weight="bold">Nouvel équipement</Text>
        </Flex>

        {errors.length > 0 && (
          <Box style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: '6px', padding: '12px' }}>
            <Text color="red" weight="bold" size="2">Erreurs de validation</Text>
            {errors.map((err, idx) => (
              <Text key={idx} color="red" size="1" as="div">• {err}</Text>
            ))}
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">

            {/* Ligne 1 — Identification */}
            <Flex gap="3" wrap="wrap">
              <Box style={{ flex: '3', minWidth: '200px' }}>
                <Field label="Nom" required>
                  <TextField.Root
                    value={form.name}
                    onChange={set('name')}
                    placeholder="Ex : Scie principale, Pont roulant A…"
                    autoFocus
                  />
                </Field>
              </Box>
              <Box style={{ flex: '1', minWidth: '120px' }}>
                <Field label="N° Machine">
                  <TextField.Root value={form.no_machine} onChange={set('no_machine')} placeholder="M-042" />
                </Field>
              </Box>
            </Flex>

            {/* Ligne 2 — Code machine (généré) */}
            <Flex gap="3" wrap="wrap" align="end">
              <Box style={{ flex: '1', minWidth: '160px' }}>
                <Field label="Classe">
                  <Select.Root
                    value={form.equipement_class_id || '__none__'}
                    onValueChange={handleClassChange}
                  >
                    <Select.Trigger style={{ width: '100%' }} />
                    <Select.Content>
                      <Select.Item value="__none__">Aucune classe</Select.Item>
                      {classes.map((c) => (
                        <Select.Item key={c.id} value={c.id}>{c.code} — {c.label}</Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Field>
              </Box>
              <Box style={{ flex: '1', minWidth: '100px' }}>
                <Field label="Numéro" hint="assemblé avec la classe">
                  <TextField.Root
                    value={form.code_suffix}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, code_suffix: e.target.value, code_override: '' }));
                    }}
                    placeholder="01, 042…"
                  />
                </Field>
              </Box>
              <Box style={{ flex: '1', minWidth: '140px' }}>
                <Field label="Code généré">
                  <TextField.Root
                    value={form.code_override || generatedCode}
                    onChange={(e) => setForm((f) => ({ ...f, code_override: e.target.value }))}
                    placeholder="—"
                    style={generatedCode && !form.code_override ? { color: 'var(--blue-11)', fontWeight: 500 } : {}}
                  />
                </Field>
              </Box>
            </Flex>

            {/* Ligne 3 — Classification et affectation */}
            <Flex gap="3" wrap="wrap">
              <Box style={{ flex: '1', minWidth: '160px' }}>
                <Field label="Statut">
                  <Select.Root
                    value={form.statut_id || '__none__'}
                    onValueChange={(v) => setForm((f) => ({ ...f, statut_id: v === '__none__' ? '' : v }))}
                  >
                    <Select.Trigger style={{ width: '100%' }} />
                    <Select.Content>
                      <Select.Item value="__none__">Aucun statut</Select.Item>
                      {statuts.map((s) => (
                        <Select.Item key={s.id} value={String(s.id)}>{s.label}</Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Field>
              </Box>
              <Box style={{ flex: '2', minWidth: '200px' }}>
                <Field label="Affectation">
                  <TextField.Root value={form.affectation} onChange={set('affectation')} placeholder="Atelier A" />
                </Field>
              </Box>
            </Flex>

            {/* Ligne 4 — Données techniques */}
            <Flex gap="3" wrap="wrap">
              <Box style={{ flex: '1', minWidth: '150px' }}>
                <Field label="Fabricant">
                  <TextField.Root value={form.fabricant} onChange={set('fabricant')} placeholder="Bosch" />
                </Field>
              </Box>
              <Box style={{ flex: '1', minWidth: '150px' }}>
                <Field label="N° Série">
                  <TextField.Root value={form.numero_serie} onChange={set('numero_serie')} placeholder="SN-99887" />
                </Field>
              </Box>
              <Box style={{ flex: '1', minWidth: '150px' }}>
                <Field label="Mise en service">
                  <TextField.Root type="date" value={form.date_mise_service} onChange={set('date_mise_service')} />
                </Field>
              </Box>
              <Flex align="center" gap="2" style={{ paddingTop: '1.5rem' }}>
                <Switch
                  checked={form.is_mere}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, is_mere: v }))}
                  size="2"
                />
                <Text size="2">Machine mère</Text>
              </Flex>
            </Flex>

            {/* Équipement parent */}
            <Field label="Équipement parent" hint="optionnel">
              {selectedParent ? (
                <Flex align="center" gap="2" style={{ padding: '6px 10px', border: '1px solid var(--blue-7)', borderRadius: '6px', background: 'var(--blue-2)' }}>
                  <Link2 size={14} color="var(--blue-9)" />
                  <Text size="2" weight="medium">{selectedParent.code ? `${selectedParent.code} – ` : ''}{selectedParent.name}</Text>
                  <Button size="1" variant="ghost" color="gray" type="button" onClick={() => handleParentChange(null)} style={{ marginLeft: 'auto' }}>
                    <X size={12} />
                  </Button>
                </Flex>
              ) : (
                <AsyncSearchSelect
                  fetchFn={(q) => fetchEquipements({ search: q, limit: 8 }).then((r) => r.items ?? [])}
                  onSelect={handleParentChange}
                  renderItem={(eq) => (
                    <Flex align="center" gap="2">
                      {eq.code && <Badge variant="outline" size="1" color="gray">{eq.code}</Badge>}
                      <Text size="2">{eq.name}</Text>
                      {eq.equipement_class && <Text size="1" color="gray">· {eq.equipement_class.code}</Text>}
                    </Flex>
                  )}
                  placeholder="Rechercher par code ou nom…"
                  debounceMs={300}
                  minChars={2}
                />
              )}
            </Field>

            {/* Notes */}
            <Field label="Notes">
              <TextField.Root value={form.notes} onChange={set('notes')} placeholder="Observations, remarques…" />
            </Field>

            <Flex justify="end" gap="2">
              <Button size="2" type="button" variant="soft" color="gray" onClick={onCancel} disabled={submitting}>
                Annuler
              </Button>
              <Button size="2" type="submit" color="blue" disabled={submitting}>
                <Plus size={16} />
                {submitting ? 'Création…' : 'Enregistrer'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

EquipementCreateForm.propTypes = {
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};
