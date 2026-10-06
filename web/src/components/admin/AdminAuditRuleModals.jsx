/**
 * @fileoverview Modaux de création/édition des règles d'audit
 * @module components/admin/AdminAuditRuleModals
 */

import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Dialog, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { ENTITY_LABELS, ENTITY_OPTIONS } from '@/config/auditRuleEntities';
import { useAuditKnownFields } from '@/hooks/admin/useAuditRules';

const _DEFAULT_RULE_VALUE = '__default__';
const _OTHER_FIELD_VALUE = '__other__';

// ---- Sélecteur de champ : règle par défaut, champs connus, ou saisie libre ----
function FieldSelect({ entityType, field, setField }) {
  const { fields: knownFields, loading } = useAuditKnownFields(entityType);
  const isKnown = field === '' || knownFields.includes(field);
  const selectValue = field === '' ? _DEFAULT_RULE_VALUE : (isKnown ? field : _OTHER_FIELD_VALUE);

  const handleSelect = (value) => {
    if (value === _DEFAULT_RULE_VALUE) setField('');
    else if (value === _OTHER_FIELD_VALUE) setField(' '); // valeur non vide, hors liste connue → bascule en saisie libre
    else setField(value);
  };

  return (
    <label>
      <Text size="2" weight="bold" mb="1" as="div">Champ</Text>
      <Select.Root value={selectValue} onValueChange={handleSelect}>
        <Select.Trigger style={{ width: '100%' }} placeholder={loading ? 'Chargement...' : undefined} />
        <Select.Content>
          <Select.Item value={_DEFAULT_RULE_VALUE}>— Règle par défaut de l&apos;entité —</Select.Item>
          {knownFields.map((f) => (
            <Select.Item key={f} value={f}>{f}</Select.Item>
          ))}
          <Select.Item value={_OTHER_FIELD_VALUE}>Autre (nouveau champ)...</Select.Item>
        </Select.Content>
      </Select.Root>

      {selectValue === _OTHER_FIELD_VALUE && (
        <TextField.Root
          mt="2"
          value={field.trim()}
          onChange={(e) => setField(e.target.value)}
          placeholder="Nom exact du champ (ex. assigned_to)"
          autoFocus
        />
      )}

      <Text size="1" color="gray">
        Champs déjà vus dans le journal d&apos;audit pour cette entité. Choisissez « règle par défaut »
        pour couvrir les créations, ou « autre » si le champ n&apos;a encore jamais été modifié.
      </Text>
    </label>
  );
}

FieldSelect.propTypes = {
  entityType: PropTypes.string.isRequired,
  field: PropTypes.string.isRequired,
  setField: PropTypes.func.isRequired,
};

// ---- Champs communs : nature (routine/sensible) + raison par défaut ----
function RoutineFields({ isRoutine, setIsRoutine, defaultReasonCode, setDefaultReasonCode, reasons }) {
  return (
    <>
      <label>
        <Flex align="center" gap="2">
          <input type="checkbox" checked={isRoutine} onChange={(e) => setIsRoutine(e.target.checked)} />
          <Text size="2" weight="bold">Routine (aucune justification demandée)</Text>
        </Flex>
      </label>

      {isRoutine && (
        <label>
          <Text size="2" weight="bold" mb="1" as="div">Raison par défaut *</Text>
          <Select.Root value={defaultReasonCode || undefined} onValueChange={setDefaultReasonCode}>
            <Select.Trigger style={{ width: '100%' }} placeholder="Choisir une raison" />
            <Select.Content>
              {reasons.map((r) => (
                <Select.Item key={r.code} value={r.code}>{r.label}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </label>
      )}
    </>
  );
}

RoutineFields.propTypes = {
  isRoutine: PropTypes.bool.isRequired,
  setIsRoutine: PropTypes.func.isRequired,
  defaultReasonCode: PropTypes.string,
  setDefaultReasonCode: PropTypes.func.isRequired,
  reasons: PropTypes.array.isRequired,
};

// ---- Modal de création ----
export function CreateRuleModal({ open, onOpenChange, reasons, onSubmit, submitting }) {
  const [entityType, setEntityType] = useState(ENTITY_OPTIONS[0]);
  const [field, setField] = useState('');
  const [isRoutine, setIsRoutine] = useState(true);
  const [defaultReasonCode, setDefaultReasonCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(null, {
      entity_type: entityType,
      field: field.trim() || null,
      is_routine: isRoutine,
      default_reason_code: isRoutine ? defaultReasonCode : null,
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 420 }}>
        <Dialog.Title>Nouvelle règle d&apos;audit</Dialog.Title>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mt="4">
            <label>
              <Text size="2" weight="bold" mb="1" as="div">Entité *</Text>
              <Select.Root value={entityType} onValueChange={setEntityType}>
                <Select.Trigger style={{ width: '100%' }} />
                <Select.Content>
                  {ENTITY_OPTIONS.map((e) => (
                    <Select.Item key={e} value={e}>{ENTITY_LABELS[e]}</Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </label>

            <FieldSelect entityType={entityType} field={field} setField={setField} />

            <RoutineFields
              isRoutine={isRoutine}
              setIsRoutine={setIsRoutine}
              defaultReasonCode={defaultReasonCode}
              setDefaultReasonCode={setDefaultReasonCode}
              reasons={reasons}
            />
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">Annuler</Button>
            </Dialog.Close>
            <Button type="submit" disabled={submitting || (isRoutine && !defaultReasonCode)}>
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

CreateRuleModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  reasons: PropTypes.array.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};

// ---- Modal d'édition (entité + champ figés) ----
export function EditRuleModal({ open, onOpenChange, rule, reasons, onSubmit, submitting }) {
  const [isRoutine, setIsRoutine] = useState(true);
  const [defaultReasonCode, setDefaultReasonCode] = useState('');

  useMemo(() => {
    setIsRoutine(rule?.is_routine ?? true);
    setDefaultReasonCode(rule?.default_reason_code ?? '');
  }, [rule]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(rule.id, {
      is_routine: isRoutine,
      default_reason_code: isRoutine ? defaultReasonCode : null,
    });
  };

  if (!rule) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content style={{ maxWidth: 420 }}>
        <Dialog.Title>Modifier la règle</Dialog.Title>
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3" mt="4">
            <Text size="2" color="gray">
              {ENTITY_LABELS[rule.entity_type] ?? rule.entity_type} — {rule.field ?? 'règle par défaut'}
            </Text>

            <RoutineFields
              isRoutine={isRoutine}
              setIsRoutine={setIsRoutine}
              defaultReasonCode={defaultReasonCode}
              setDefaultReasonCode={setDefaultReasonCode}
              reasons={reasons}
            />
          </Flex>

          <Flex gap="3" mt="4" justify="end">
            <Dialog.Close>
              <Button variant="soft" color="gray" type="button">Annuler</Button>
            </Dialog.Close>
            <Button type="submit" disabled={submitting || (isRoutine && !defaultReasonCode)}>
              {submitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </Flex>
        </form>
      </Dialog.Content>
    </Dialog.Root>
  );
}

EditRuleModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  rule: PropTypes.object,
  reasons: PropTypes.array.isRequired,
  onSubmit: PropTypes.func.isRequired,
  submitting: PropTypes.bool,
};
