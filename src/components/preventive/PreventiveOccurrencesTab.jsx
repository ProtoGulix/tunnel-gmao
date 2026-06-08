/**
 * @fileoverview Onglet suivi des occurrences préventives avec génération et filtres
 * @module components/preventive/PreventiveOccurrencesTab
 */

import { useEffect, useState } from 'react';
import { AlertDialog, Badge, Box, Button, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { CalendarClock, ChevronDown, ChevronRight, ExternalLink, Play, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePreventiveOccurrences } from '@/hooks/preventive/usePreventiveOccurrences';
import { fetchPreventivePlans } from '@/api/preventivePlans';
import TableHeader from '@/components/ui/TableHeader';
import DataTable from '@/components/ui/DataTable';
import ErrorState from '@/components/ui/ErrorState';
import { useInterventionRequestStatuses } from '@/hooks/shared/useInterventionRequestStatuses';

const STATUS_COLORS = { pending: 'gray', generated: 'blue', skipped: 'orange', done: 'green' };
const STATUS_LABELS = { pending: 'En attente', generated: 'Générée', skipped: 'Ignorée', done: 'Clôturée' };

const STEP_STATUS_COLORS = { done: 'green', skipped: 'orange', todo: 'gray', in_progress: 'blue' };
const STEP_STATUS_LABELS = { done: 'Validée', skipped: 'Ignorée', todo: 'En attente', in_progress: 'En cours' };

const stepColumns = [
  { key: 'order', header: '#', width: 36, render: (s) => <Text size="1" color="gray">{s.sort_order}</Text> },
  {
    key: 'label', header: 'Étape',
    render: (s) => (
      <Flex align="center" gap="2">
        <Text size="2">{s.label}</Text>
        {s.optional && <Badge color="gray" variant="outline" size="1">Optionnelle</Badge>}
      </Flex>
    ),
  },
  {
    key: 'status', header: 'Statut', width: 110,
    render: (s) => <Badge color={STEP_STATUS_COLORS[s.status] || 'gray'} variant="soft" size="1">{STEP_STATUS_LABELS[s.status] || s.status}</Badge>,
  },
];

export default function PreventiveOccurrencesTab() {
  const { labelMap: diLabelMap, colorMap: diColorMap } = useInterventionRequestStatuses();
  const [planId, setPlanId] = useState('');
  const [status, setStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [plans, setPlans] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);
  const [toSkip, setToSkip] = useState(null);
  const [skipReason, setSkipReason] = useState('');
  const [confirmGen, setConfirmGen] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [repairResult, setRepairResult] = useState(null);
  const [confirmRepair, setConfirmRepair] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);

  const filters = {
    ...(planId ? { plan_id: planId } : {}),
    ...(status ? { status } : {}),
    ...(dateFrom ? { scheduled_date_from: dateFrom } : {}),
    ...(dateTo ? { scheduled_date_to: dateTo } : {}),
  };

  const { items, loading, error, refresh, skipOccurrence, generate, repair } = usePreventiveOccurrences(filters);

  useEffect(() => {
    fetchPreventivePlans({ active_only: false })
      .then((p) => setPlans(Array.isArray(p) ? p : []))
      .catch(() => {});
  }, []);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const result = await generate();
      setGenResult(result);
    } finally {
      setGenerating(false);
      setConfirmGen(false);
    }
  };

  const handleRepair = async () => {
    try {
      setRepairing(true);
      const result = await repair();
      setRepairResult(result);
    } finally {
      setRepairing(false);
      setConfirmRepair(false);
    }
  };

  const handleRowClick = (r) => {
    if (!(r.tasks ?? []).length) return;
    setExpandedRowId(r.id === expandedRowId ? null : r.id);
  };

  const handleSkip = async () => {
    if (!toSkip) return;
    try {
      await skipOccurrence(toSkip.id, skipReason);
    } finally {
      setToSkip(null);
      setSkipReason('');
    }
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

  const columns = [
    { key: 'plan', header: 'Plan', width: 180, render: (r) => <Text size="2" weight="medium">{r.plan_label}</Text> },
    {
      key: 'machine', header: 'Machine', width: 160,
      render: (r) => (
        <Flex direction="column" gap="0">
          <Text size="2">{r.machine_code}</Text>
          <Text size="1" color="gray">{r.machine_name}</Text>
        </Flex>
      ),
    },
    { key: 'date', header: 'Date prévue', width: 110, render: (r) => <Text size="1">{fmtDate(r.scheduled_date)}</Text> },
    {
      key: 'gamme', header: 'Gamme', width: 80,
      render: (r) => {
        const steps = r.tasks ?? [];
        if (!steps.length) return <Text size="1" color="gray">—</Text>;
        const validated = steps.filter((s) => s.status === 'validated').length;
        const color = validated === steps.length ? 'green' : validated > 0 ? 'blue' : 'gray';
        return <Badge color={color} variant="soft" size="1">{validated}/{steps.length}</Badge>;
      },
    },
    {
      key: 'status', header: 'Statut', width: 110,
      render: (r) => <Badge color={STATUS_COLORS[r.status] || 'gray'} variant="soft" size="1">{STATUS_LABELS[r.status] || r.status}</Badge>,
    },
    {
      key: 'di', header: 'Demande (DI)', width: 160,
      render: (r) => {
        if (!r.di_id) return <Text size="1" color="gray">—</Text>;
        return (
          <Flex direction="column" gap="1">
            <Flex align="center" gap="1">
              <Button size="1" variant="ghost" asChild>
                <Link to={`/interventions?tab=demandes`}>
                  <ExternalLink size={11} />
                  <Text size="1" style={{ fontFamily: 'monospace' }}>{r.di_code ?? 'DI'}</Text>
                </Link>
              </Button>
            </Flex>
            {r.di_statut && (
              <Badge color={diColorMap[r.di_statut] ?? 'gray'} variant="soft" size="1">
                {diLabelMap[r.di_statut] ?? r.di_statut}
              </Badge>
            )}
          </Flex>
        );
      },
    },
    {
      key: 'intervention', header: 'Intervention', width: 100,
      render: (r) => r.intervention_id
        ? (
          <Button size="1" variant="ghost" asChild>
            <Link to={`/intervention/${r.intervention_id}`}><ExternalLink size={11} />Voir</Link>
          </Button>
        )
        : <Text size="1" color="gray">—</Text>,
    },
    {
      key: 'skip', header: '', width: 100,
      render: (r) => {
        const hasSteps = (r.tasks ?? []).length > 0;
        return (
          <Flex align="center" gap="2" justify="end">
            {r.status === 'pending' && (
              <Button size="1" variant="ghost" color="orange" onClick={(e) => { e.stopPropagation(); setToSkip(r); }}>
                Ignorer
              </Button>
            )}
            {hasSteps && (
              r.id === expandedRowId
                ? <ChevronDown size={14} color="var(--gray-9)" />
                : <ChevronRight size={14} color="var(--gray-9)" />
            )}
          </Flex>
        );
      },
    },
  ];

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  return (
    <Box>
      <TableHeader
        icon={CalendarClock}
        title="Occurrences préventives"
        count={items.length}
        loading={loading}
        showSearchInput={false}
        showRefreshButton={false}
        rightActions={
          <Flex gap="2">
            <Button size="2" color="amber" variant="soft" onClick={() => setConfirmRepair(true)} disabled={repairing}>
              <Wrench size={14} />{repairing ? 'Correction…' : 'Corriger'}
            </Button>
            <Button size="2" color="green" onClick={() => setConfirmGen(true)} disabled={generating}>
              <Play size={14} />{generating ? 'Génération…' : 'Générer'}
            </Button>
          </Flex>
        }
      />
      <Flex gap="2" mb="3" wrap="wrap">
        <Select.Root value={planId || '__all__'} onValueChange={(v) => setPlanId(v === '__all__' ? '' : v)}>
          <Select.Trigger style={{ minWidth: 160 }} placeholder="Tous les plans" />
          <Select.Content>
            <Select.Item value="__all__">Tous les plans</Select.Item>
            {plans.map((p) => <Select.Item key={p.id} value={p.id}>{p.label}</Select.Item>)}
          </Select.Content>
        </Select.Root>
        <Select.Root value={status || '__all__'} onValueChange={(v) => setStatus(v === '__all__' ? '' : v)}>
          <Select.Trigger style={{ minWidth: 130 }} placeholder="Tous statuts" />
          <Select.Content>
            <Select.Item value="__all__">Tous statuts</Select.Item>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <Select.Item key={k} value={k}>{v}</Select.Item>)}
          </Select.Content>
        </Select.Root>
        <TextField.Root type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        <TextField.Root type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        {(planId || status || dateFrom || dateTo) && (
          <Button size="2" variant="ghost" color="gray" onClick={() => { setPlanId(''); setStatus(''); setDateFrom(''); setDateTo(''); }}>
            Réinitialiser
          </Button>
        )}
      </Flex>
      <DataTable
        columns={columns}
        data={items}
        loading={loading}
        getRowKey={(r) => r.id}
        onRowClick={handleRowClick}
        rowStyles={(r) => (r.tasks ?? []).length > 0 ? { cursor: 'pointer' } : undefined}
        isRowExpanded={(r) => r.id === expandedRowId}
        emptyState={{ icon: CalendarClock, title: 'Aucune occurrence', description: 'Ajustez les filtres ou cliquez sur Générer.' }}
        renderExpandedRow={(r) => {
          const steps = [...(r.tasks ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          if (!steps.length) return null;
          return (
            <Box px="4" py="3" style={{ backgroundColor: 'var(--gray-1)', borderTop: '1px solid var(--gray-4)' }}>
              <Text size="1" weight="medium" color="gray" style={{ display: 'block', marginBottom: 8 }}>Étapes de gamme</Text>
              <DataTable
                columns={stepColumns}
                data={steps}
                getRowKey={(s) => s.id}
                size="1"
                variant="ghost"
                stickyHeader={false}
                emptyState={{ icon: CalendarClock, title: 'Aucune étape', description: '' }}
              />
            </Box>
          );
        }}
      />

      {/* Confirmation génération */}
      <AlertDialog.Root open={confirmGen} onOpenChange={setConfirmGen}>
        <AlertDialog.Content maxWidth="400px">
          <AlertDialog.Title>Générer les occurrences</AlertDialog.Title>
          <AlertDialog.Description>Déclencher la génération automatique des occurrences préventives ?</AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel><Button variant="soft" color="gray">Annuler</Button></AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="green" onClick={handleGenerate} disabled={generating}>Générer</Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {/* Résultat génération */}
      <AlertDialog.Root open={!!genResult} onOpenChange={(open) => !open && setGenResult(null)}>
        <AlertDialog.Content maxWidth="400px">
          <AlertDialog.Title>Résultat de la génération</AlertDialog.Title>
          <AlertDialog.Description>
            {genResult?.generated ?? 0} occurrence(s) créée(s), {genResult?.skipped_conflicts ?? 0} conflit(s) ignoré(s).
            {genResult?.errors?.length > 0 && (
              <Text color="red" style={{ display: 'block', marginTop: 8 }}>
                {genResult.errors.length} erreur(s) détectée(s).
              </Text>
            )}
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Action>
              <Button color="blue" onClick={() => { setGenResult(null); refresh(); }}>OK</Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {/* Confirmation correction */}
      <AlertDialog.Root open={confirmRepair} onOpenChange={setConfirmRepair}>
        <AlertDialog.Content maxWidth="420px">
          <AlertDialog.Title>Corriger les données</AlertDialog.Title>
          <AlertDialog.Description>
            Cette procédure corrige les données corrompues par deux bugs :
            <Text as="span" mt="2" size="2" style={{ display: 'block' }}>• Étapes de gamme non liées à leur intervention</Text>
            <Text as="span" size="2" style={{ display: 'block' }}>• Occurrences bloquées à «&nbsp;Générée&nbsp;» alors que l'intervention est fermée</Text>
            <Text as="span" mt="2" size="1" color="gray" style={{ display: 'block' }}>L'opération est idempotente et sans effet secondaire.</Text>
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel><Button variant="soft" color="gray">Annuler</Button></AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="amber" onClick={handleRepair} disabled={repairing}>Corriger</Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {/* Résultat correction */}
      <AlertDialog.Root open={!!repairResult} onOpenChange={(open) => !open && setRepairResult(null)}>
        <AlertDialog.Content maxWidth="480px">
          <AlertDialog.Title>Résultat de la correction</AlertDialog.Title>
          <AlertDialog.Description>
            <Text as="span" size="2" style={{ display: 'block' }}>• {repairResult?.steps_relinked ?? 0} étape(s) rattachée(s) (Bug 1)</Text>
            <Text as="span" size="2" style={{ display: 'block' }}>• {repairResult?.occurrences_relinked ?? 0} occurrence(s) réliée(s) à leur intervention (Bug 2 pré-étape)</Text>
            <Text as="span" size="2" style={{ display: 'block' }}>• {repairResult?.occurrences_completed ?? 0} occurrence(s) clôturée(s) (Bug 2)</Text>
            <Text as="span" size="2" style={{ display: 'block' }}>• {repairResult?.requests_closed ?? 0} demande(s) clôturée(s) (Bug 2)</Text>
            {repairResult?.details?.length > 0 && (
              <Text
                as="span"
                mt="3"
                size="1"
                color="gray"
                style={{ display: 'block', maxHeight: 200, overflowY: 'auto', background: 'var(--gray-2)', borderRadius: 'var(--radius-2)', padding: '8px 12px' }}
              >
                {repairResult.details.map((d, i) => (
                  <Text key={i} as="span" size="1" color="gray" style={{ display: 'block' }}>{d}</Text>
                ))}
              </Text>
            )}
          </AlertDialog.Description>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Action>
              <Button color="blue" onClick={() => { setRepairResult(null); refresh(); }}>OK</Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>

      {/* Skip occurrence */}
      <AlertDialog.Root open={!!toSkip} onOpenChange={(open) => { if (!open) { setToSkip(null); setSkipReason(''); } }}>
        <AlertDialog.Content maxWidth="420px">
          <AlertDialog.Title>Ignorer l'occurrence</AlertDialog.Title>
          <AlertDialog.Description>
            Plan : <strong>{toSkip?.plan_label}</strong> — Machine : <strong>{toSkip?.machine_code}</strong>
          </AlertDialog.Description>
          <Box mt="2">
            <TextField.Root
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder="Raison de l'exclusion (obligatoire)…"
            />
          </Box>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel><Button variant="soft" color="gray">Annuler</Button></AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="orange" onClick={handleSkip} disabled={!skipReason.trim()}>Ignorer</Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
}
