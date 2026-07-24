/**
 * @fileoverview Formulaire commun + modaux de création/édition des raisons d'audit
 * @module components/admin/AdminAuditReasonModals
 */

import PropTypes from 'prop-types';
import { Button, Dialog, Flex, Select, Text, TextArea, TextField } from '@radix-ui/themes';
import { Lock } from 'lucide-react';
import { ENTITY_LABELS, ENTITY_OPTIONS } from '@/config/auditRuleEntities';

export const CATEGORY_LABELS = { system: 'Système', manual: 'Manuelle', user: 'Utilisateur' };
export const CATEGORY_OPTIONS = Object.keys(CATEGORY_LABELS);

export const EMPTY_REASON_FORM = { code: '', label: '', category: 'manual', entity_types: [], color: '', description: '' };

function EntityTypesField({ value, onChange }) {
  const toggle = (entity) => {
    onChange(value.includes(entity) ? value.filter((e) => e !== entity) : [...value, entity]);
  };
  return (
    <label>
      <Text size="2" weight="bold" mb="1" as="div">Entités compatibles</Text>
      <Flex direction="column" gap="1">
        {ENTITY_OPTIONS.map((entity) => (
          <Flex key={entity} align="center" gap="2" as="label">
            <input type="checkbox" checked={value.includes(entity)} onChange={() => toggle(entity)} />
            <Text size="2">{ENTITY_LABELS[entity]}</Text>
          </Flex>
        ))}
      </Flex>
      <Text size="1" color="gray">Aucune case cochée = raison disponible pour toutes les entités.</Text>
    </label>
  );
}
EntityTypesField.propTypes = { value: PropTypes.array.isRequired, onChange: PropTypes.func.isRequired };

export function ReasonForm({ form, setForm, isEditMode, onSubmit, submitting, submitLabel }) {
  return (
    <form onSubmit={onSubmit}>
      <Flex direction="column" gap="3" mt="4">
        {!isEditMode ? (
          <label>
            <Text size="2" weight="bold" mb="1" as="div">Code * (ex: CLIENT_REQUEST)</Text>
            <TextField.Root
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              placeholder="CODE_RAISON"
              required
            />
          </label>
        ) : (
          <Flex align="center" gap="1">
            <Text size="2" color="gray" style={{ fontFamily: 'monospace' }}>{form.code}</Text>
            <Lock size={11} color="var(--gray-8)" />
          </Flex>
        )}

        <label>
          <Text size="2" weight="bold" mb="1" as="div">Libellé *</Text>
          <TextField.Root value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} required />
        </label>

        <label>
          <Text size="2" weight="bold" mb="1" as="div">Catégorie *</Text>
          <Select.Root value={form.category} onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}>
            <Select.Trigger style={{ width: '100%' }} />
            <Select.Content>
              {CATEGORY_OPTIONS.map((c) => (
                <Select.Item key={c} value={c}>{CATEGORY_LABELS[c]}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
          <Text size="1" color="gray">
            Système = réservé aux mutations automatiques. Manuelle/Utilisateur = affichée dans le picker.
          </Text>
        </label>

        <EntityTypesField
          value={form.entity_types}
          onChange={(v) => setForm((p) => ({ ...p, entity_types: v }))}
        />

        <label>
          <Text size="2" weight="bold" mb="1" as="div">Couleur</Text>
          <Flex align="center" gap="2">
            <input
              type="color"
              value={form.color || '#9ca3af'}
              onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
              style={{ width: 36, height: 32, border: 'none', cursor: 'pointer', borderRadius: 4 }}
            />
            <TextField.Root
              value={form.color}
              onChange={(e) => setForm((p) => ({ ...p, color: e.target.value }))}
              placeholder="#9ca3af"
              style={{ flex: 1 }}
            />
          </Flex>
        </label>

        <label>
          <Text size="2" weight="bold" mb="1" as="div">Description</Text>
          <TextArea value={form.description || ''} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} rows={2} />
        </label>
      </Flex>

      <Flex gap="3" mt="4" justify="end">
        <Dialog.Close><Button variant="soft" color="gray" type="button">Annuler</Button></Dialog.Close>
        <Button type="submit" disabled={submitting || !form.code.trim() || !form.label.trim()}>
          {submitting ? 'Enregistrement...' : submitLabel}
        </Button>
      </Flex>
    </form>
  );
}
ReasonForm.propTypes = {
  form: PropTypes.object.isRequired,
  setForm: PropTypes.func.isRequired,
  isEditMode: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
  submitLabel: PropTypes.string.isRequired,
};

export function CreateReasonModal({ open, onOpenChange, form, setForm, onSubmit, submitting }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 440 }}>
        <Dialog.Title>Nouvelle raison d&apos;audit</Dialog.Title>
        <ReasonForm form={form} setForm={setForm} isEditMode={false} onSubmit={onSubmit} submitting={submitting} submitLabel="Créer" />
      </Dialog.Content>
    </Dialog.Root>
  );
}
CreateReasonModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  form: PropTypes.object.isRequired,
  setForm: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

export function EditReasonModal({ open, onOpenChange, form, setForm, onSubmit, submitting }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 440 }}>
        <Dialog.Title>Modifier la raison</Dialog.Title>
        <ReasonForm form={form} setForm={setForm} isEditMode onSubmit={onSubmit} submitting={submitting} submitLabel="Enregistrer" />
      </Dialog.Content>
    </Dialog.Root>
  );
}
EditReasonModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  form: PropTypes.object.isRequired,
  setForm: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};
