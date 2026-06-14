/**
 * @fileoverview Panneau de gestion des étapes de gamme d'un plan préventif
 * @module components/preventive/GammeStepsPanel
 */

import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Button, Checkbox, Flex, Table, Text, TextField } from '@radix-ui/themes';
import { ArrowDown, ArrowUp, CheckCircle, Plus, Save, Trash2 } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

export default function GammeStepsPanel({ plan, onSave, saving }) {
  const [steps, setSteps] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newOptional, setNewOptional] = useState(false);

  useEffect(() => {
    const sorted = [...(plan.steps ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    setSteps(sorted.map((s, i) => ({ ...s, sort_order: i + 1 })));
    setDirty(false);
  }, [plan.steps]);

  const reorder = useCallback((newList) => {
    setSteps(newList.map((s, i) => ({ ...s, sort_order: i + 1 })));
    setDirty(true);
  }, []);

  const moveUp = useCallback((i) => {
    const list = [...steps];
    [list[i - 1], list[i]] = [list[i], list[i - 1]];
    reorder(list);
  }, [steps, reorder]);

  const moveDown = useCallback((i) => {
    const list = [...steps];
    [list[i], list[i + 1]] = [list[i + 1], list[i]];
    reorder(list);
  }, [steps, reorder]);

  const remove = useCallback((i) => {
    reorder(steps.filter((_, idx) => idx !== i));
  }, [steps, reorder]);

  const addStep = useCallback(() => {
    if (!newLabel.trim()) return;
    setSteps((prev) => [...prev, { id: null, label: newLabel.trim(), sort_order: prev.length + 1, optional: newOptional }]);
    setNewLabel('');
    setNewOptional(false);
    setDirty(true);
  }, [newLabel, newOptional]);

  const handleSave = async () => {
    await onSave(plan.id, steps.map(({ label, sort_order, optional }) => ({ label, sort_order, optional })));
    setDirty(false);
  };

  return (
    <Flex direction="column" gap="3">
      <DataTable
        size="1"
        variant="ghost"
        stickyHeader={false}
        data={steps}
        getRowKey={(_, i) => i}
        emptyState={{ icon: CheckCircle, title: 'Aucune étape', description: 'Ajoutez des étapes ci-dessous' }}
        columns={[
          { key: 'n', header: 'N°', width: 36 },
          { key: 'label', header: 'Libellé' },
          { key: 'optional', header: '', width: 90 },
          { key: 'actions', header: '', width: 88 },
        ]}
        rowRenderer={(s, i) => (
          <Table.Row>
            <Table.Cell style={{ width: 36 }}>
              <Text size="1" color="gray" style={{ fontVariantNumeric: 'tabular-nums' }}>{i + 1}</Text>
            </Table.Cell>
            <Table.Cell>
              <Text size="2">{s.label}</Text>
            </Table.Cell>
            <Table.Cell style={{ width: 90 }}>
              {s.optional && <Badge color="amber" variant="soft" size="1">Optionnelle</Badge>}
            </Table.Cell>
            <Table.Cell style={{ width: 88 }}>
              <Flex gap="1" justify="end">
                <Button size="1" variant="ghost" color="gray" disabled={i === 0} onClick={() => moveUp(i)}>
                  <ArrowUp size={12} />
                </Button>
                <Button size="1" variant="ghost" color="gray" disabled={i === steps.length - 1} onClick={() => moveDown(i)}>
                  <ArrowDown size={12} />
                </Button>
                <Button size="1" variant="ghost" color="red" onClick={() => remove(i)}>
                  <Trash2 size={12} />
                </Button>
              </Flex>
            </Table.Cell>
          </Table.Row>
        )}
      />

      {/* Ligne d'ajout */}
      <Flex gap="2" align="center" style={{ borderTop: '1px solid var(--gray-4)', paddingTop: 10 }}>
        <TextField.Root
          style={{ flex: 1 }}
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Nouvelle étape…"
          size="2"
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStep(); } }}
        />
        <Flex align="center" gap="1" style={{ flexShrink: 0 }}>
          <Checkbox checked={newOptional} onCheckedChange={(v) => setNewOptional(!!v)} size="1" />
          <Text size="1" color="gray">Optionnelle</Text>
        </Flex>
        <Button size="2" variant="soft" color="gray" onClick={addStep} disabled={!newLabel.trim()} style={{ flexShrink: 0 }}>
          <Plus size={13} />
        </Button>
      </Flex>

      {/* Enregistrer */}
      <Flex justify="end">
        <Button size="2" color="blue" onClick={handleSave} disabled={saving || !dirty}>
          <Save size={13} />
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </Button>
      </Flex>
    </Flex>
  );
}

GammeStepsPanel.propTypes = {
  plan: PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired, steps: PropTypes.array }).isRequired,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
