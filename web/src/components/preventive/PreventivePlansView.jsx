/**
 * @fileoverview Vue « Plans » de la page Préventif — master-detail (liste plans + détail gamme/occurrences)
 * @module components/preventive/PreventivePlansView
 */

import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Box, Button, Flex, Switch, Text } from '@radix-ui/themes';
import PlanInactiveBadge from '@/components/preventive/PlanInactiveBadge';
import { ClipboardCheck, Plus } from 'lucide-react';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import ErrorState from '@/components/ui/ErrorState';
import PlanDeactivateDialog from '@/components/preventive/PlanDeactivateDialog';
import StatusCallout from '@/components/ui/StatusCallout';
import { usePlanActionError } from '@/hooks/preventive/usePlanActionError';
import { usePermissions } from '@/auth/usePermissions';
import { PERM } from '@/auth/permissionCodes';
import { usePreventivePlans } from '@/hooks/preventive/usePreventivePlans';
import PreventivePlanForm from '@/components/preventive/PreventivePlanForm';
import PreventivePlanDetail from '@/components/preventive/PreventivePlanDetail';
import { triggerLabel } from '@/config/preventiveConfig';

function PlanItem({ plan, isSelected, onClick }) {
  return (
    <Box
      px="3" py="2"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        borderBottom: '1px solid var(--gray-4)',
        background: isSelected ? 'var(--blue-2)' : 'transparent',
        borderLeft: isSelected ? '3px solid var(--blue-9)' : '3px solid transparent',
      }}
    >
      <Flex align="center" justify="between" gap="2">
        <Flex direction="column" gap="1" style={{ minWidth: 0 }}>
          <Flex align="center" gap="2">
            <Badge variant="soft" color="blue" size="1" style={{ fontFamily: 'monospace', flexShrink: 0 }}>{plan.code}</Badge>
            <Text size="2" weight="medium" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan.label}</Text>
            <PlanInactiveBadge plan={plan} />
          </Flex>
          <Text size="1" color="gray">{triggerLabel(plan)}</Text>
        </Flex>
        <Text size="1" color="gray" style={{ flexShrink: 0 }}>{(plan.steps ?? []).length} ét.</Text>
      </Flex>
    </Box>
  );
}

export default function PreventivePlansView() {
  const { can } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeOnly, setActiveOnly] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [mode, setMode] = useState(null); // null | 'create' | 'edit'
  const [saving, setSaving] = useState(false);
  const [toDeactivate, setToDeactivate] = useState(null);
  const { actionError, setActionError, reportFailure } = usePlanActionError();

  const { plans, loading, error, refresh, createPlan, updatePlan, deactivatePlan, reactivatePlan, saveSteps } =
    usePreventivePlans({ active_only: activeOnly });

  // Sélectionner le plan depuis l'URL une fois les données chargées
  useEffect(() => {
    if (loading || plans.length === 0) return;
    const planId = searchParams.get('plan');
    if (!planId) return;
    const found = plans.find((p) => p.id === planId);
    if (found && selectedPlan?.id !== found.id) setSelectedPlan(found);
  }, [plans, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectPlan = useCallback((plan) => {
    setSelectedPlan(plan);
    setMode(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (plan) next.set('plan', plan.id);
      else next.delete('plan');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleCreate = async (data) => {
    try { setSaving(true); await createPlan(data); setMode(null); } finally { setSaving(false); }
  };

  const handleEdit = async (data) => {
    try {
      setSaving(true);
      const updated = await updatePlan(selectedPlan.id, data);
      setSelectedPlan(updated ?? selectedPlan);
      setMode(null);
    } finally { setSaving(false); }
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
      return;
    }
    if (selectedPlan?.id === plan.id) selectPlan(null);
  }, [toDeactivate, deactivatePlan, selectedPlan, selectPlan, reportFailure]);

  const handleReactivate = useCallback(async (plan) => {
    setActionError(null);
    try {
      const updated = await reactivatePlan(plan.id);
      if (selectedPlan?.id === plan.id) setSelectedPlan(updated ?? { ...plan, active: true });
    } catch (err) {
      reportFailure(err, 'Impossible de réactiver le plan');
    }
  }, [reactivatePlan, selectedPlan, reportFailure]);

  const handleSaveSteps = useCallback(async (id, steps) => {
    try {
      setSaving(true);
      setActionError(null);
      const updated = await saveSteps(id, steps);
      setSelectedPlan((prev) => (prev?.id === id ? { ...prev, steps: updated } : prev));
    } catch (err) {
      reportFailure(err, "Impossible d'enregistrer les étapes");
    } finally { setSaving(false); }
  }, [saveSteps, reportFailure]);

  const filtered = plans.filter((p) =>
    !search ||
    p.label.toLowerCase().includes(search.toLowerCase()) ||
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  const masterList = filtered.map((p) => (
    <PlanItem
      key={p.id}
      plan={p}
      isSelected={selectedPlan?.id === p.id && !mode}
      onClick={() => selectPlan(p)}
    />
  ));

  let detailContent = null;
  if (mode === 'create') {
    detailContent = (
      <Box p="4">
        <PreventivePlanForm plan={null} onSubmit={handleCreate} onCancel={() => setMode(null)} saving={saving} />
      </Box>
    );
  } else if (mode === 'edit' && selectedPlan) {
    detailContent = (
      <Box p="4">
        <PreventivePlanForm plan={selectedPlan} onSubmit={handleEdit} onCancel={() => setMode(null)} saving={saving} />
      </Box>
    );
  } else if (selectedPlan) {
    detailContent = (
      <PreventivePlanDetail
        plan={selectedPlan}
        onEdit={(p) => { setSelectedPlan(p); setMode('edit'); setSearchParams((prev) => { const n = new URLSearchParams(prev); n.set('plan', p.id); return n; }, { replace: true }); }}
        onDeactivate={setToDeactivate}
        onReactivate={handleReactivate}
        onSaveSteps={handleSaveSteps}
        saving={saving}
      />
    );
  }

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  return (
    <Flex direction="column" style={{ height: '100%', minHeight: 0 }}>
      {actionError && <Box px="4"><StatusCallout type="error">{actionError}</StatusCallout></Box>}
      <Box px="4" style={{ flex: 1, minHeight: 500, overflow: 'hidden' }}>
        <MasterDetailLayout
          freeDetail
          ratio="35% 1fr"
          masterProps={{
            icon: ClipboardCheck,
            title: 'Plans préventifs',
            count: filtered.length,
            search,
            onSearchChange: setSearch,
            loading,
            children: masterList,
            headerExtra: (
              <Flex align="center" justify="between" mt="2">
                <Flex align="center" gap="1">
                  <Switch
                    checked={activeOnly}
                    onCheckedChange={(v) => { setActiveOnly(v); setSelectedPlan(null); }}
                    size="1"
                  />
                  <Text size="1" color="gray">Actifs seulement</Text>
                </Flex>
                {can(PERM.preventive.createPlan) && (
                  <Button size="1" color="blue" onClick={() => { selectPlan(null); setMode('create'); }}>
                    <Plus size={12} />Nouveau
                  </Button>
                )}
              </Flex>
            ),
          }}
          detailChildren={detailContent}
          emptyLabel="Sélectionnez un plan pour voir sa gamme et ses occurrences"
        />
      </Box>

      <PlanDeactivateDialog plan={toDeactivate} onConfirm={handleDeactivate} onClose={() => setToDeactivate(null)} />
    </Flex>
  );
}
