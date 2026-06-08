/**
 * @fileoverview Panneau détail d'un plan préventif — gamme + occurrences
 * @module components/preventive/PreventivePlanDetail
 */

import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Separator, Tabs, Text } from '@radix-ui/themes';
import { CalendarClock, CheckCircle2, ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import GammeStepsPanel from '@/components/preventive/GammeStepsPanel';
import DataTable from '@/components/ui/DataTable';
import { usePreventiveOccurrences } from '@/hooks/preventive/usePreventiveOccurrences';
import { triggerLabel, OCCURRENCE_STATUS_COLORS, OCCURRENCE_STATUS_LABELS } from '@/config/preventiveConfig';
import { useInterventionRequestStatuses } from '@/hooks/shared/useInterventionRequestStatuses';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

export default function PreventivePlanDetail({ plan, onEdit, onDeactivate, onSaveSteps, saving }) {
  const { items, loading } = usePreventiveOccurrences({ plan_id: plan.id });
  const { labelMap: diLabelMap, colorMap: diColorMap } = useInterventionRequestStatuses();

  const occurrenceColumns = [
    {
      key: 'machine', header: 'Machine', width: 160,
      render: (r) => (
        <Flex direction="column" gap="0">
          <Text size="2">{r.machine_code}</Text>
          <Text size="1" color="gray">{r.machine_name}</Text>
        </Flex>
      ),
    },
    {
      key: 'date', header: 'Date prévue', width: 110,
      render: (r) => <Text size="1">{fmtDate(r.scheduled_date)}</Text>,
    },
    {
      key: 'status', header: 'Statut', width: 110,
      render: (r) => <Badge color={OCCURRENCE_STATUS_COLORS[r.status] || 'gray'} variant="soft" size="1">{OCCURRENCE_STATUS_LABELS[r.status] || r.status}</Badge>,
    },
    {
      key: 'di', header: 'DI', width: 140,
      render: (r) => {
        if (!r.di_id) return <Text size="1" color="gray">—</Text>;
        return (
          <Flex direction="column" gap="1">
            <Button size="1" variant="ghost" asChild>
              <Link to="/interventions?tab=demandes">
                <ExternalLink size={11} />
                <Text size="1" style={{ fontFamily: 'monospace' }}>{r.di_code ?? 'DI'}</Text>
              </Link>
            </Button>
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
  ];

  return (
    <Box p="4" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header du plan */}
      <Flex align="start" justify="between" gap="3" wrap="wrap">
        <Flex direction="column" gap="1">
          <Flex align="center" gap="2">
            <Badge variant="soft" color="blue" style={{ fontFamily: 'monospace' }}>{plan.code}</Badge>
            <Text size="3" weight="bold">{plan.label}</Text>
          </Flex>
          <Flex gap="2" align="center">
            {plan.equipement_class_label && (
              <Text size="1" color="gray">{plan.equipement_class_label}</Text>
            )}
            {plan.equipement_class_label && <Text size="1" color="gray">·</Text>}
            <Text size="1" color="gray">{triggerLabel(plan)}</Text>
            <Badge color={plan.auto_accept ? 'green' : 'gray'} variant="soft" size="1">
              {plan.auto_accept ? 'Auto' : 'Manuel'}
            </Badge>
          </Flex>
        </Flex>
        <Flex gap="2" shrink="0">
          <Button size="2" variant="soft" color="blue" onClick={() => onEdit(plan)}>
            <Pencil size={13} />Modifier
          </Button>
          <Button size="2" variant="ghost" color="red" onClick={() => onDeactivate(plan)}>
            <Trash2 size={13} />Désactiver
          </Button>
        </Flex>
      </Flex>

      <Separator size="4" />

      {/* Onglets Gamme / Occurrences */}
      <Tabs.Root defaultValue="gamme" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Tabs.List style={{ flexShrink: 0 }}>
          <Tabs.Trigger value="gamme">
            <Flex align="center" gap="2">
              <CheckCircle2 size={13} />
              <Text>Gamme</Text>
              <Badge size="1" variant="soft" color="gray">{(plan.steps ?? []).length}</Badge>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="occurrences">
            <Flex align="center" gap="2">
              <CalendarClock size={13} />
              <Text>Occurrences</Text>
              {!loading && <Badge size="1" variant="soft" color="gray">{items.length}</Badge>}
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="gamme" style={{ flex: 1, overflow: 'auto' }}>
          <Box pt="3">
            <GammeStepsPanel plan={plan} onSave={onSaveSteps} onClose={() => {}} saving={saving} />
          </Box>
        </Tabs.Content>

        <Tabs.Content value="occurrences" style={{ flex: 1, overflow: 'auto' }}>
          <Box pt="3">
            <DataTable
              columns={occurrenceColumns}
              data={items}
              loading={loading}
              getRowKey={(r) => r.id}
              emptyState={{ icon: CalendarClock, title: 'Aucune occurrence', description: 'Cliquez sur Générer depuis la page principale.' }}
            />
          </Box>
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}

PreventivePlanDetail.propTypes = {
  plan: PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string,
    label: PropTypes.string.isRequired,
    equipement_class_label: PropTypes.string,
    trigger_type: PropTypes.string,
    periodicity_days: PropTypes.number,
    hours_threshold: PropTypes.number,
    auto_accept: PropTypes.bool,
    steps: PropTypes.array,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onDeactivate: PropTypes.func.isRequired,
  onSaveSteps: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
