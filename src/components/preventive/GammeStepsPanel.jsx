/**
 * @fileoverview Panneau de gestion des étapes de gamme d'un plan préventif
 * @module components/preventive/GammeStepsPanel
 */

import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Card, Checkbox, Flex, Separator, Text, TextField } from '@radix-ui/themes';
import { ArrowDown, ArrowUp, CheckCircle, Plus, Trash2 } from 'lucide-react';

function StepRow({ step, index, total, onMoveUp, onMoveDown, onRemove }) {
  return (
    <Flex align="center" gap="2" py="2" style={{ borderBottom: '1px solid var(--gray-4)' }}>
      <Text size="1" color="gray" style={{ width: 24, textAlign: 'right', flexShrink: 0 }}>{step.sort_order}</Text>
      <Text size="2" style={{ flex: 1 }}>{step.label}</Text>
      {step.optional && <Badge color="amber" variant="soft" size="1">Optionnelle</Badge>}
      <Flex gap="1">
        <Button size="1" variant="ghost" color="gray" disabled={index === 0} onClick={() => onMoveUp(index)}>
          <ArrowUp size={12} />
        </Button>
        <Button size="1" variant="ghost" color="gray" disabled={index === total - 1} onClick={() => onMoveDown(index)}>
          <ArrowDown size={12} />
        </Button>
        <Button size="1" variant="ghost" color="red" onClick={() => onRemove(index)}>
          <Trash2 size={12} />
        </Button>
      </Flex>
    </Flex>
  );
}
StepRow.propTypes = {
  step: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  onMoveUp: PropTypes.func.isRequired,
  onMoveDown: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
};

export default function GammeStepsPanel({ plan, onSave, onClose, saving }) {
  const [steps, setSteps] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newOptional, setNewOptional] = useState(false);

  useEffect(() => {
    const sorted = [...(plan.steps ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    setSteps(sorted.map((s, i) => ({ ...s, sort_order: i + 1 })));
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
    const list = steps.filter((_, idx) => idx !== i);
    reorder(list);
  }, [steps, reorder]);

  const addStep = useCallback(() => {
    if (!newLabel.trim()) return;
    const next = steps.length + 1;
    setSteps((prev) => [...prev, { id: null, label: newLabel.trim(), sort_order: next, optional: newOptional }]);
    setNewLabel('');
    setNewOptional(false);
    setDirty(true);
  }, [newLabel, newOptional, steps.length]);

  const handleSave = async () => {
    const payload = steps.map(({ label, sort_order, optional }) => ({ label, sort_order, optional }));
    await onSave(plan.id, payload);
    setDirty(false);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Card style={{ border: '1px solid var(--gray-6)' }}>
      <Flex direction="column" gap="3">
        <Flex align="center" justify="between">
          <Flex align="center" gap="2">
            <CheckCircle size={18} color="var(--blue-9)" />
            <Text size="3" weight="bold">Étapes — {plan.label}</Text>
            <Badge color="blue" variant="soft" size="1">{steps.length} étape{steps.length !== 1 ? 's' : ''}</Badge>
          </Flex>
          <Button size="1" variant="ghost" color="gray" onClick={handleClose}>✕</Button>
        </Flex>

        <Separator size="4" />

        {steps.length === 0 ? (
          <Text size="2" color="gray" style={{ textAlign: 'center', padding: '24px 0' }}>Aucune étape — ajoutez-en ci-dessous</Text>
        ) : (
          <Box>
            {steps.map((s, i) => (
              <StepRow key={i} step={s} index={i} total={steps.length} onMoveUp={moveUp} onMoveDown={moveDown} onRemove={remove} />
            ))}
          </Box>
        )}

        <Separator size="4" />

        {/* Ajout inline */}
        <Flex gap="2" align="end" wrap="wrap">
          <Box style={{ flex: 1, minWidth: 200 }}>
            <Text size="1" color="gray" style={{ display: 'block', marginBottom: 4 }}>Label de l'étape</Text>
            <TextField.Root
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Ex : Contrôle de la tension de la lame"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addStep(); } }}
            />
          </Box>
          <Flex align="center" gap="2" style={{ paddingBottom: 2 }}>
            <Checkbox checked={newOptional} onCheckedChange={(v) => setNewOptional(!!v)} size="2" />
            <Text size="2">Optionnelle</Text>
          </Flex>
          <Button size="2" color="gray" variant="soft" onClick={addStep} disabled={!newLabel.trim()}>
            <Plus size={14} />Ajouter
          </Button>
        </Flex>

        <Flex justify="end" gap="2" mt="1">
          <Button size="2" variant="soft" color="gray" onClick={handleClose} disabled={saving}>Fermer</Button>
          <Button size="2" color="blue" onClick={handleSave} disabled={saving || !dirty}>
            <CheckCircle size={14} />
            {saving ? 'Enregistrement…' : 'Enregistrer les étapes'}
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}

GammeStepsPanel.propTypes = {
  plan: PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string.isRequired, steps: PropTypes.array }).isRequired,
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
