/**
 * @fileoverview Fenêtres du référentiel des constats
 * @module components/admin/AdminRefConstatDialogs
 */

import { useState } from 'react';
import { Box, Button, Checkbox, Dialog, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { NONE, choiceToForm, choicePatch, isValidChoiceCode, newChoicePayload } from './constatReferentiel';

const EMPTY_NEW = { code: '', label: '', suggested_type_inter: NONE, creates_request: false, is_exclusive: false };

function TypeSelect({ value, types, onChange }) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger style={{ width: '100%' }} />
      <Select.Content>
        <Select.Item value={NONE}>Aucun</Select.Item>
        {types.map((t) => <Select.Item key={t.code} value={t.code}>{t.label}</Select.Item>)}
      </Select.Content>
    </Select.Root>
  );
}

function Flag({ label, checked, onChange }) {
  return (
    <Text as="label" size="2">
      <Flex gap="2" align="center">
        <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} />
        {label}
      </Flex>
    </Text>
  );
}

function FormActions({ submitting, label }) {
  return (
    <Flex gap="3" mt="4" justify="end">
      <Dialog.Close><Button variant="soft" color="gray" type="button">Annuler</Button></Dialog.Close>
      <Button type="submit" disabled={submitting}>{submitting ? 'En cours...' : label}</Button>
    </Flex>
  );
}

export function ChoiceEditDialog({ choice, types, onClose, onSave }) {
  const [form, setForm] = useState(() => choiceToForm(choice));
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const patch = choicePatch(choice, form);
      if (Object.keys(patch).length) await onSave(choice.id, patch);
      onClose();
    } finally { setSubmitting(false); }
  };

  return (
    <Dialog.Root open onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Content style={{ maxWidth: 400 }}>
        <Dialog.Title>Modifier le choix</Dialog.Title>
        <form onSubmit={submit}>
          <Flex direction="column" gap="3" mt="4">
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Libellé *</Text>
              <TextField.Root value={form.label} onChange={(e) => set('label')(e.target.value)} required />
            </label>
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Ordre</Text>
              <TextField.Root type="number" value={form.sort_order} onChange={(e) => setForm((p) => ({ ...p, sort_order: e.target.value }))} />
            </label>
            <Box>
              <Text size="2" weight="bold" mb="1" as="div">Type préconisé</Text>
              <TypeSelect value={form.suggested_type_inter} types={types} onChange={set('suggested_type_inter')} />
            </Box>
            <Flag label="Génère une demande" checked={form.creates_request} onChange={set('creates_request')} />
            <Flag label="Exclusif" checked={form.is_exclusive} onChange={set('is_exclusive')} />
          </Flex>
          <FormActions submitting={submitting} label="Enregistrer" />
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

export function ChoiceCreateDialog({ question, types, onClose, onCreate }) {
  const [form, setForm] = useState(EMPTY_NEW);
  const [submitting, setSubmitting] = useState(false);
  const set = (k) => (v) => setForm((p) => ({ ...p, [k]: v }));
  const codeOk = isValidChoiceCode(form.code.trim().toUpperCase());

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try { await onCreate(newChoicePayload(question.id, form)); onClose(); }
    finally { setSubmitting(false); }
  };

  return (
    <Dialog.Root open onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Content style={{ maxWidth: 400 }}>
        <Dialog.Title>Nouveau choix</Dialog.Title>
        <form onSubmit={submit}>
          <Flex direction="column" gap="3" mt="4">
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Code * (figé ensuite)</Text>
              <TextField.Root value={form.code} onChange={(e) => set('code')(e.target.value.toUpperCase())} placeholder="CODE" required />
              {form.code && !codeOk && <Text size="1" color="red">Majuscules, chiffres et _ ; 2 à 50 caractères.</Text>}
            </label>
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Libellé *</Text>
              <TextField.Root value={form.label} onChange={(e) => set('label')(e.target.value)} required />
            </label>
            <Box>
              <Text size="2" weight="bold" mb="1" as="div">Type préconisé</Text>
              <TypeSelect value={form.suggested_type_inter} types={types} onChange={set('suggested_type_inter')} />
            </Box>
            <Flag label="Génère une demande" checked={form.creates_request} onChange={set('creates_request')} />
            <Flag label="Exclusif" checked={form.is_exclusive} onChange={set('is_exclusive')} />
          </Flex>
          <FormActions submitting={submitting || !codeOk} label="Créer" />
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

export function QuestionLabelDialog({ question, onClose, onSave }) {
  const [label, setLabel] = useState(question.label || '');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try { await onSave(question.id, { label: label.trim() }); onClose(); }
    finally { setSubmitting(false); }
  };

  return (
    <Dialog.Root open onOpenChange={(v) => { if (!v) onClose(); }}>
      <Dialog.Content style={{ maxWidth: 400 }}>
        <Dialog.Title>Renommer la question</Dialog.Title>
        <form onSubmit={submit}>
          <Box mt="4">
            <Text size="2" weight="bold" mb="1" as="div">Libellé *</Text>
            <TextField.Root value={label} onChange={(e) => setLabel(e.target.value)} required />
          </Box>
          <FormActions submitting={submitting} label="Enregistrer" />
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}
