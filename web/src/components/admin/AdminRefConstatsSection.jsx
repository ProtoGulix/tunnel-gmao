/**
 * @fileoverview Section « Constats » du référentiel (questions et choix, ADR 0045)
 * @module components/admin/AdminRefConstatsSection
 */

import { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Callout, Flex, Table, Text } from '@radix-ui/themes';
import { Lock, Pencil, Plus } from 'lucide-react';
import { usePermissions } from '@/auth/usePermissions';
import { PERM } from '@/auth/permissionCodes';
import { orderQuestions, parentChoiceLabel } from './constatReferentiel';
import { ChoiceEditDialog, ChoiceCreateDialog, QuestionLabelDialog } from './AdminRefConstatDialogs';

function ChoiceRow({ choice, typeLabel, canEdit, onEdit, onToggle }) {
  return (
    <Table.Row>
      <Table.Cell>
        <Text size="2" weight="medium">{choice.label}</Text>
        <Flex align="center" gap="1">
          <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>{choice.code}</Text>
          <Lock size={10} color="var(--gray-8)" />
        </Flex>
      </Table.Cell>
      <Table.Cell><Text size="2">{typeLabel || '—'}</Text></Table.Cell>
      <Table.Cell>{choice.creates_request ? <Badge variant="soft" color="blue">Oui</Badge> : <Text color="gray">—</Text>}</Table.Cell>
      <Table.Cell>{choice.is_exclusive ? <Badge variant="soft" color="orange">Oui</Badge> : <Text color="gray">—</Text>}</Table.Cell>
      <Table.Cell><Text size="2">{choice.sort_order}</Text></Table.Cell>
      <Table.Cell><Badge variant="soft" color={choice.is_active ? 'green' : 'red'}>{choice.is_active ? 'Actif' : 'Inactif'}</Badge></Table.Cell>
      <Table.Cell>
        {canEdit && (
          <Flex gap="1" justify="end">
            <Button size="1" variant="soft" onClick={() => onEdit(choice)}><Pencil size={12} /></Button>
            <Button size="1" variant="soft" color={choice.is_active ? 'red' : 'green'} onClick={() => onToggle(choice)}>
              {choice.is_active ? 'Désactiver' : 'Activer'}
            </Button>
          </Flex>
        )}
      </Table.Cell>
    </Table.Row>
  );
}

function QuestionBlock({ question, parentLabel, types, canEdit, handlers }) {
  const typeLabel = (code) => types.find((t) => t.code === code)?.label || code;
  return (
    <Box mb="5">
      <Flex align="center" gap="2" mb="2">
        <Text size="3" weight="bold">{question.label}</Text>
        {parentLabel && <Badge variant="soft" color="gray">Si « {parentLabel} »</Badge>}
        {canEdit.question && (
          <Button size="1" variant="soft" onClick={() => handlers.renameQuestion(question)}><Pencil size={12} /></Button>
        )}
        {canEdit.create && (
          <Button size="1" variant="soft" onClick={() => handlers.addChoice(question)}><Plus size={12} /> Choix</Button>
        )}
      </Flex>
      <Table.Root variant="surface" size="1">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Choix</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Type préconisé</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Demande</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Exclusif</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Ordre</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell />
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {(question.choices || []).map((c) => (
            <ChoiceRow
              key={c.id}
              choice={c}
              typeLabel={c.suggested_type_inter ? typeLabel(c.suggested_type_inter) : null}
              canEdit={canEdit.choice}
              onEdit={handlers.editChoice}
              onToggle={handlers.toggleChoice}
            />
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

export function ConstatsSection({ items, types, loading, onUpdateQuestion, onCreateChoice, onUpdateChoice }) {
  const { can } = usePermissions();
  const [dialog, setDialog] = useState(null);
  const close = useCallback(() => setDialog(null), []);
  const ordered = useMemo(() => orderQuestions(items), [items]);

  const handlers = useMemo(() => ({
    renameQuestion: (question) => setDialog({ kind: 'question', question }),
    addChoice: (question) => setDialog({ kind: 'create', question }),
    editChoice: (choice) => setDialog({ kind: 'choice', choice }),
    toggleChoice: (choice) => onUpdateChoice(choice.id, { is_active: !choice.is_active }),
  }), [onUpdateChoice]);

  const canEdit = {
    question: can(PERM.adminRef.patchConstatQuestion),
    create: can(PERM.adminRef.createConstatChoice),
    choice: can(PERM.adminRef.patchConstatChoice),
  };

  return (
    <Box mb="6">
      <Text size="4" weight="bold" as="div" mb="2">Constats</Text>
      <Callout.Root size="1" color="gray" mb="3">
        <Callout.Text>Un réglage ne vaut que pour les constats saisis ensuite.</Callout.Text>
      </Callout.Root>
      {loading && <Text color="gray">Chargement...</Text>}
      {ordered.map((q) => (
        <QuestionBlock
          key={q.id}
          question={q}
          parentLabel={parentChoiceLabel(q, items)}
          types={types}
          canEdit={canEdit}
          handlers={handlers}
        />
      ))}
      {dialog?.kind === 'choice' && <ChoiceEditDialog choice={dialog.choice} types={types} onClose={close} onSave={onUpdateChoice} />}
      {dialog?.kind === 'create' && <ChoiceCreateDialog question={dialog.question} types={types} onClose={close} onCreate={onCreateChoice} />}
      {dialog?.kind === 'question' && <QuestionLabelDialog question={dialog.question} onClose={close} onSave={onUpdateQuestion} />}
    </Box>
  );
}

ConstatsSection.propTypes = {
  items: PropTypes.array.isRequired,
  types: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onUpdateQuestion: PropTypes.func.isRequired,
  onCreateChoice: PropTypes.func.isRequired,
  onUpdateChoice: PropTypes.func.isRequired,
};
