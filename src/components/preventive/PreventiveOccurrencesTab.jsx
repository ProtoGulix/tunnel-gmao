/**
 * @fileoverview Onglet suivi des occurrences préventives avec génération et filtres
 * @module components/preventive/PreventiveOccurrencesTab
 */

import { useEffect, useState } from 'react';
import { AlertDialog, Badge, Box, Button, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { CalendarClock, ExternalLink, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePreventiveOccurrences } from '@/hooks/preventive/usePreventiveOccurrences';
import { fetchPreventivePlans } from '@/api/preventivePlans';
import TableHeader from '@/components/ui/TableHeader';
import DataTable from '@/components/ui/DataTable';
import ErrorState from '@/components/ui/ErrorState';
import GammeProgressBlock from '@/components/preventive/GammeProgressBlock';

const STATUS_COLORS = { pending: 'gray', generated: 'blue', skipped: 'orange', done: 'green' };
const STATUS_LABELS = { pending: 'En attente', generated: 'Générée', skipped: 'Ignorée', done: 'Clôturée' };

const DI_STATUT_COLORS = { nouvelle: 'blue', en_attente: 'amber', acceptee: 'green', rejetee: 'red', cloturee: 'gray' };
const DI_STATUT_LABELS = { nouvelle: 'Nouvelle', en_attente: 'En attente', acceptee: 'Acceptée', rejetee: 'Rejetée', cloturee: 'Clôturée' };

export default function PreventiveOccurrencesTab() {
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

  const filters = {
    ...(planId ? { plan_id: planId } : {}),
    ...(status ? { status } : {}),
    ...(dateFrom ? { scheduled_date_from: dateFrom } : {}),
    ...(dateTo ? { scheduled_date_to: dateTo } : {}),
  };

  const { items, loading, error, refresh, skipOccurrence, generate } = usePreventiveOccurrences(filters);

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
              <Badge color={DI_STATUT_COLORS[r.di_statut] ?? 'gray'} variant="soft" size="1">
                {DI_STATUT_LABELS[r.di_statut] ?? r.di_statut}
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
      key: 'skip', header: '', width: 80,
      render: (r) => r.status === 'pending'
        ? (
          <Button size="1" variant="ghost" color="orange" onClick={(e) => { e.stopPropagation(); setToSkip(r); }}>
            Ignorer
          </Button>
        )
        : null,
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
          <Button size="2" color="green" onClick={() => setConfirmGen(true)} disabled={generating}>
            <Play size={14} />{generating ? 'Génération…' : 'Générer'}
          </Button>
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
        emptyState={{ icon: CalendarClock, title: 'Aucune occurrence', description: 'Ajustez les filtres ou cliquez sur Générer.' }}
        renderExpandedRow={(r) => {
          if (r.status !== 'generated' && r.status !== 'done') return null;
          return (
            <Box px="4" py="3" style={{ backgroundColor: 'var(--gray-1)', borderTop: '1px solid var(--gray-4)' }}>
              <GammeProgressBlock
                mode="occurrence"
                occurrenceId={r.id}
                diId={r.di_id ?? null}
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
