/**
 * @fileoverview Page Préventif — master-detail (liste plans + détail gamme/occurrences)
 * @module pages/preventive/PreventivePage
 */

import { useCallback, useState } from 'react';
import { AlertDialog, Badge, Box, Button, Container, Flex, Switch, Text } from '@radix-ui/themes';
import { ClipboardCheck, Plus } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import ErrorState from '@/components/ui/ErrorState';
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
          </Flex>
          <Text size="1" color="gray">{triggerLabel(plan)}</Text>
        </Flex>
        <Text size="1" color="gray" style={{ flexShrink: 0 }}>{(plan.steps ?? []).length} ét.</Text>
      </Flex>
    </Box>
  );
}

export default function PreventivePage() {
  const [activeOnly, setActiveOnly] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [mode, setMode] = useState(null); // null | 'create' | 'edit'
  const [saving, setSaving] = useState(false);
  const [toDeactivate, setToDeactivate] = useState(null);

  const { plans, loading, error, refresh, createPlan, updatePlan, deactivatePlan, saveSteps } =
    usePreventivePlans({ active_only: activeOnly });

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
    await deactivatePlan(toDeactivate.id);
    if (selectedPlan?.id === toDeactivate.id) setSelectedPlan(null);
    setToDeactivate(null);
  }, [toDeactivate, deactivatePlan, selectedPlan]);

  const handleSaveSteps = useCallback(async (id, steps) => {
    try {
      setSaving(true);
      const updated = await saveSteps(id, steps);
      setSelectedPlan((prev) => (prev?.id === id ? { ...prev, steps: updated } : prev));
    } finally { setSaving(false); }
  }, [saveSteps]);

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
      onClick={() => { setSelectedPlan(p); setMode(null); }}
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
        onEdit={(p) => { setSelectedPlan(p); setMode('edit'); }}
        onDeactivate={setToDeactivate}
        onSaveSteps={handleSaveSteps}
        saving={saving}
      />
    );
  }

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  return (
    <>
      <PageHeader
        title="Préventif"
        subtitle="Plans de maintenance préventive et suivi des occurrences"
      />
      <Container size="4">
        <div style={{ height: 'calc(100vh - 180px)', minHeight: 500 }}>
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
                  <Button size="1" color="blue" onClick={() => { setSelectedPlan(null); setMode('create'); }}>
                    <Plus size={12} />Nouveau
                  </Button>
                </Flex>
              ),
            }}
            detailChildren={detailContent}
            emptyLabel="Sélectionnez un plan pour voir sa gamme et ses occurrences"
          />
        </div>
      </Container>

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
    </>
  );
}
