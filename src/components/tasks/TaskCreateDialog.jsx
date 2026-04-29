/**
 * @fileoverview Dialog de création de tâche — réutilisable depuis n'importe quel contexte.
 *
 * Comportement :
 * - Si `interventionId` est fourni → champ intervention verrouillé (badge)
 * - Sinon → sélecteur d'interventions ouvertes
 * - Charge les options (users + interventions) à l'ouverture via /tasks/workspace
 *
 * @module components/tasks/TaskCreateDialog
 */

import { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Badge, Box, Button, Dialog, Flex, Select, Spinner, Switch, Text, TextField,
} from '@radix-ui/themes';
import { createInterventionTask } from '@/api/interventionTasks';
import { fetchTasksWorkspace } from '@/api/tasks';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

const NO_ASSIGNEE = '__none__';
const NO_INTERVENTION = '__none__';

const EMPTY_FORM = {
  label: '',
  interventionId: NO_INTERVENTION,
  assignedTo: NO_ASSIGNEE,
  dueDate: '',
  optional: false,
};

/**
 * Dialog de création d'une tâche manuelle.
 *
 * @param {Object}   props
 * @param {boolean}  props.open               - Contrôle l'ouverture
 * @param {Function} props.onOpenChange        - Callback Radix open/close
 * @param {Function} [props.onSuccess]         - Appelé avec la tâche créée
 * @param {string}   [props.interventionId]    - Verrouille l'intervention
 * @param {string}   [props.interventionLabel] - Texte affiché quand verrouillé
 */
export default function TaskCreateDialog({
  open,
  onOpenChange,
  onSuccess,
  interventionId: lockedInterventionId = null,
  interventionLabel: lockedInterventionLabel = null,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [users, setUsers] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  /* ── Chargement des options à l'ouverture ─────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    setForm(EMPTY_FORM);
    setError(null);

    // Si intervention verrouillée, on n'a besoin que des users
    setOptionsLoading(true);
    fetchTasksWorkspace({ include_options: true, limit: 1 })
      .then((result) => {
        setUsers(result.options?.users ?? []);
        if (!lockedInterventionId) {
          setInterventions(result.options?.interventions ?? []);
        }
      })
      .catch(() => {})
      .finally(() => setOptionsLoading(false));
  }, [open, lockedInterventionId]);

  /* ── Helpers ──────────────────────────────────────────────────────────── */
  const set = useCallback((field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const resolvedInterventionId = lockedInterventionId ?? (
    form.interventionId !== NO_INTERVENTION ? form.interventionId : null
  );

  const canSubmit = form.label.trim() && resolvedInterventionId;

  /* ── Soumission ───────────────────────────────────────────────────────── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await createInterventionTask({
        intervention_id: resolvedInterventionId,
        label: form.label.trim(),
        assigned_to: form.assignedTo !== NO_ASSIGNEE ? form.assignedTo : undefined,
        due_date: form.dueDate || undefined,
        optional: form.optional,
        origin: 'tech',
      });
      onSuccess?.(created);
      onOpenChange(false);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors de la création de la tâche'));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Rendu ────────────────────────────────────────────────────────────── */
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 480 }}>
        <Dialog.Title>Nouvelle tâche</Dialog.Title>

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mt="4">

            {/* ── Intervention ── */}
            <Box>
              <Text size="2" weight="bold" mb="1" as="div">Intervention *</Text>
              {lockedInterventionId ? (
                <Badge color="blue" variant="soft" size="2">
                  {lockedInterventionLabel || lockedInterventionId}
                </Badge>
              ) : (
                <Select.Root
                  value={form.interventionId}
                  onValueChange={(v) => set('interventionId', v)}
                  disabled={optionsLoading}
                >
                  <Select.Trigger placeholder="Sélectionner une intervention" style={{ width: '100%' }} />
                  <Select.Content>
                    <Select.Item value={NO_INTERVENTION}>— Sélectionner —</Select.Item>
                    {interventions.map((i) => (
                      <Select.Item key={i.id} value={String(i.id)}>
                        {i.code || i.id}{i.title ? ` — ${i.title}` : ''}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              )}
            </Box>

            {/* ── Libellé ── */}
            <Box>
              <Text size="2" weight="bold" mb="1" as="div">Libellé *</Text>
              <TextField.Root
                value={form.label}
                onChange={(e) => set('label', e.target.value)}
                placeholder="Ex : Contrôle alignement capteur"
                autoFocus
              />
            </Box>

            {/* ── Assigné ── */}
            <Box>
              <Text size="2" weight="bold" mb="1" as="div">Assigné à</Text>
              <Select.Root
                value={form.assignedTo}
                onValueChange={(v) => set('assignedTo', v)}
                disabled={optionsLoading}
              >
                <Select.Trigger placeholder="Non assigné" style={{ width: '100%' }} />
                <Select.Content>
                  <Select.Item value={NO_ASSIGNEE}>Non assigné</Select.Item>
                  {users.map((u) => {
                    const initials = u.initials || u.initial || '';
                    const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                    const label = initials ? `${initials.toUpperCase()} — ${fullName}` : fullName;
                    return (
                      <Select.Item key={u.id} value={String(u.id)}>{label}</Select.Item>
                    );
                  })}
                </Select.Content>
              </Select.Root>
            </Box>

            {/* ── Échéance ── */}
            <Box>
              <Text size="2" weight="bold" mb="1" as="div">Échéance</Text>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => set('dueDate', e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: 'var(--radius-2)',
                  border: '1px solid var(--gray-6)',
                  background: 'var(--color-surface)',
                  color: 'var(--gray-12)',
                  fontSize: 14,
                }}
              />
            </Box>

            {/* ── Optionnelle ── */}
            <Flex align="center" gap="2">
              <Switch
                checked={form.optional}
                onCheckedChange={(v) => set('optional', v)}
                size="2"
              />
              <Text size="2">Tâche optionnelle</Text>
              <Text size="1" color="gray">(ne bloque pas la clôture)</Text>
            </Flex>

            {/* ── Erreur ── */}
            {error && (
              <Text size="2" color="red">{error}</Text>
            )}

          </Flex>

          <Flex gap="2" mt="5" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button" disabled={submitting}>
                Annuler
              </Button>
            </Dialog.Close>
            <Button type="submit" disabled={!canSubmit || submitting}>
              {submitting ? <><Spinner size="1" /> Création…</> : 'Créer la tâche'}
            </Button>
          </Flex>
        </form>

        {optionsLoading && (
          <Flex align="center" gap="2" mt="2">
            <Spinner size="1" />
            <Text size="1" color="gray">Chargement des options…</Text>
          </Flex>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}

TaskCreateDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  interventionId: PropTypes.string,
  interventionLabel: PropTypes.string,
};
