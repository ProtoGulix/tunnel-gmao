/**
 * @fileoverview Onglet admin — liste et CRUD des plans préventifs
 * @module components/preventive/PreventivePlansTab
 */

import { useCallback, useState } from 'react';
import { AlertDialog, Badge, Box, Button, Flex, Switch, Text } from '@radix-ui/themes';
import { CheckCircle2, ClipboardCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import { usePreventivePlans } from '@/hooks/preventive/usePreventivePlans';
import TableHeader from '@/components/ui/TableHeader';
import DataTable from '@/components/ui/DataTable';
import ErrorState from '@/components/ui/ErrorState';
import PreventivePlanForm from '@/components/preventive/PreventivePlanForm';
import GammeStepsPanel from '@/components/preventive/GammeStepsPanel';

function triggerLabel(row) {
  return row.trigger_type === 'periodicity'
    ? `Périodicité ${row.periodicity_days}j`
    : `Compteur ${row.hours_threshold}h`;
}

export default function PreventivePlansTab() {
  const [activeOnly, setActiveOnly] = useState(true);
  const { plans, loading, error, refresh, createPlan, updatePlan, deactivatePlan, saveSteps } =
    usePreventivePlans({ active_only: activeOnly });
  const [mode, setMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [stepsFor, setStepsFor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toDeactivate, setToDeactivate] = useState(null);

  const reset = () => { setMode(null); setEditing(null); setStepsFor(null); };

  const handleCreate = async (data) => {
    try { setSaving(true); await createPlan(data); setMode(null); } finally { setSaving(false); }
  };

  const handleEdit = async (data) => {
    try { setSaving(true); await updatePlan(editing.id, data); setEditing(null); } finally { setSaving(false); }
  };

  const handleDeactivate = useCallback(async () => {
    if (!toDeactivate) return;
    await deactivatePlan(toDeactivate.id);
    setToDeactivate(null);
  }, [toDeactivate, deactivatePlan]);

  const handleSaveSteps = async (id, steps) => {
    try {
      setSaving(true);
      const updated = await saveSteps(id, steps);
      setStepsFor((prev) => ({ ...prev, steps: updated }));
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'code', header: 'Code', width: 100,
      render: (r) => <Badge variant="soft" color="blue" style={{ fontFamily: 'monospace' }}>{r.code}</Badge>,
    },
    { key: 'label', header: 'Libellé', render: (r) => <Text size="2" weight="medium">{r.label}</Text> },
    {
      key: 'class', header: 'Classe', width: 130,
      render: (r) => <Text size="1" color="gray">{r.equipement_class_label || '—'}</Text>,
    },
    { key: 'trigger', header: 'Déclencheur', width: 150, render: (r) => <Text size="1">{triggerLabel(r)}</Text> },
    {
      key: 'auto', header: 'Auto', width: 60,
      render: (r) => <Badge color={r.auto_accept ? 'green' : 'gray'} variant="soft" size="1">{r.auto_accept ? 'Oui' : 'Non'}</Badge>,
    },
    { key: 'steps', header: 'Étapes', width: 70, render: (r) => <Text size="1" color="gray">{(r.steps ?? []).length}</Text> },
    {
      key: 'actions', header: '', width: 180,
      render: (r) => (
        <Flex gap="1" justify="end" onClick={(e) => e.stopPropagation()}>
          <Button size="1" variant="ghost" color="blue" title="Modifier"
            onClick={() => { setEditing(r); setMode(null); setStepsFor(null); }}>
            <Pencil size={12} />
          </Button>
          <Button size="1" variant="soft" color="indigo" title="Gérer les étapes"
            onClick={() => { setStepsFor(r); setEditing(null); setMode(null); }}>
            <CheckCircle2 size={12} />Étapes
          </Button>
          <Button size="1" variant="ghost" color="red" title="Désactiver"
            onClick={() => setToDeactivate(r)}>
            <Trash2 size={12} />
          </Button>
        </Flex>
      ),
    },
  ];

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  return (
    <Box>
      <TableHeader
        icon={ClipboardCheck}
        title="Plans Préventifs"
        count={plans.length}
        loading={loading}
        showSearchInput={false}
        showRefreshButton={false}
        rightActions={
          <Flex align="center" gap="3">
            <Flex align="center" gap="1">
              <Switch checked={activeOnly} onCheckedChange={setActiveOnly} size="1" />
              <Text size="1" color="gray">Actifs</Text>
            </Flex>
            <Button size="2" color="blue" onClick={() => { reset(); setMode('create'); }}>
              <Plus size={14} />Nouveau plan
            </Button>
          </Flex>
        }
      />
      {mode === 'create' && (
        <Box mb="3">
          <PreventivePlanForm plan={null} onSubmit={handleCreate} onCancel={() => setMode(null)} saving={saving} />
        </Box>
      )}
      {editing && (
        <Box mb="3">
          <PreventivePlanForm plan={editing} onSubmit={handleEdit} onCancel={() => setEditing(null)} saving={saving} />
        </Box>
      )}
      {stepsFor && (
        <Box mb="3">
          <GammeStepsPanel plan={stepsFor} onSave={handleSaveSteps} onClose={() => setStepsFor(null)} saving={saving} />
        </Box>
      )}
      <DataTable
        columns={columns}
        data={plans}
        loading={loading}
        getRowKey={(r) => r.id}
        emptyState={{ icon: ClipboardCheck, title: 'Aucun plan préventif', description: 'Créez un premier plan préventif.' }}
      />
      <AlertDialog.Root open={!!toDeactivate} onOpenChange={(open) => !open && setToDeactivate(null)}>
        <AlertDialog.Content maxWidth="420px">
          <AlertDialog.Title>Désactiver le plan</AlertDialog.Title>
          <AlertDialog.Description>
            Désactiver <strong>{toDeactivate?.label}</strong> ? Les occurrences futures ne seront plus générées.
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">Annuler</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="red" onClick={handleDeactivate}>Désactiver</Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
}
