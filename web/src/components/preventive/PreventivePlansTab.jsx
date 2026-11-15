/**
 * @fileoverview Onglet admin — liste et CRUD des plans préventifs
 * @module components/preventive/PreventivePlansTab
 */

import { useCallback, useState } from 'react';
import { Badge, Box, Button, Flex, Switch, Text } from '@radix-ui/themes';
import PlanInactiveBadge from '@/components/preventive/PlanInactiveBadge';
import PlanActivationButton from '@/components/preventive/PlanActivationButton';
import { CheckCircle2, ClipboardCheck, Pencil, Plus } from 'lucide-react';
import { usePreventivePlans } from '@/hooks/preventive/usePreventivePlans';
import TableHeader from '@/components/ui/TableHeader';
import DataTable from '@/components/ui/DataTable';
import ErrorState from '@/components/ui/ErrorState';
import PlanDeactivateDialog from '@/components/preventive/PlanDeactivateDialog';
import StatusCallout from '@/components/ui/StatusCallout';
import { usePlanActionError } from '@/hooks/preventive/usePlanActionError';
import PreventivePlanForm from '@/components/preventive/PreventivePlanForm';
import GammeStepsPanel from '@/components/preventive/GammeStepsPanel';
import { triggerLabel } from '@/config/preventiveConfig';
import { usePermissions } from '@/auth/usePermissions';
import { PERM } from '@/auth/permissionCodes';

export default function PreventivePlansTab() {
  const { can } = usePermissions();
  const [activeOnly, setActiveOnly] = useState(true);
  const { plans, loading, error, refresh, createPlan, updatePlan, deactivatePlan, reactivatePlan, saveSteps } =
    usePreventivePlans({ active_only: activeOnly });
  const [mode, setMode] = useState(null);
  const [editing, setEditing] = useState(null);
  const [stepsFor, setStepsFor] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toDeactivate, setToDeactivate] = useState(null);
  const { actionError, setActionError, reportFailure } = usePlanActionError();

  const reset = () => { setMode(null); setEditing(null); setStepsFor(null); };

  const handleCreate = async (data) => {
    try { setSaving(true); await createPlan(data); setMode(null); } finally { setSaving(false); }
  };

  const handleEdit = async (data) => {
    try { setSaving(true); await updatePlan(editing.id, data); setEditing(null); } finally { setSaving(false); }
  };

  const handleDeactivate = useCallback(async () => {
    if (!toDeactivate) return;
    const plan = toDeactivate;
    setToDeactivate(null); // la confirmation se ferme avant que la fenêtre de motif s'ouvre
    setActionError(null);
    try {
      await deactivatePlan(plan.id);
    } catch (err) {
      reportFailure(err, 'Impossible de désactiver le plan');
    }
  }, [toDeactivate, deactivatePlan, reportFailure]);

  const handleReactivate = useCallback(async (plan) => {
    setActionError(null);
    try {
      await reactivatePlan(plan.id);
    } catch (err) {
      reportFailure(err, 'Impossible de réactiver le plan');
    }
  }, [reactivatePlan, reportFailure]);

  const handleSaveSteps = async (id, steps) => {
    try {
      setSaving(true);
      setActionError(null);
      const updated = await saveSteps(id, steps);
      setStepsFor((prev) => ({ ...prev, steps: updated }));
    } catch (err) {
      reportFailure(err, "Impossible d'enregistrer les étapes");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      key: 'code', header: 'Code', width: 100,
      render: (r) => <Badge variant="soft" color="blue" style={{ fontFamily: 'monospace' }}>{r.code}</Badge>,
    },
    {
      key: 'label', header: 'Libellé',
      render: (r) => (
        <Flex align="center" gap="2">
          <Text size="2" weight="medium">{r.label}</Text>
          <PlanInactiveBadge plan={r} />
        </Flex>
      ),
    },
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
          {can(PERM.preventive.updatePlan) && (
            <Button size="1" variant="ghost" color="blue" title="Modifier"
              onClick={() => { setEditing(r); setMode(null); setStepsFor(null); }}>
              <Pencil size={12} />
            </Button>
          )}
          {can(PERM.preventive.replaceSteps) && (
            <Button size="1" variant="soft" color="indigo" title="Gérer les étapes"
              onClick={() => { setStepsFor(r); setEditing(null); setMode(null); }}>
              <CheckCircle2 size={12} />Étapes
            </Button>
          )}
          <PlanActivationButton
            plan={r}
            compact
            onDeactivate={setToDeactivate}
            onReactivate={handleReactivate}
          />
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
            {can(PERM.preventive.createPlan) && (
              <Button size="2" color="blue" onClick={() => { reset(); setMode('create'); }}>
                <Plus size={14} />Nouveau plan
              </Button>
            )}
          </Flex>
        }
      />
      {actionError && <StatusCallout type="error">{actionError}</StatusCallout>}
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
      <PlanDeactivateDialog plan={toDeactivate} onConfirm={handleDeactivate} onClose={() => setToDeactivate(null)} />
    </Box>
  );
}
