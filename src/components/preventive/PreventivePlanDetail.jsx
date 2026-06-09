/**
 * @fileoverview Panneau détail d'un plan préventif — gamme + occurrences
 * @module components/preventive/PreventivePlanDetail
 */

import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Separator, Tabs, Text } from '@radix-ui/themes';
import { CalendarClock, CheckCircle2, ExternalLink, Pause, Pencil } from 'lucide-react';
import { Link } from 'react-router-dom';
import GammeStepsPanel from '@/components/preventive/GammeStepsPanel';
import DataTable from '@/components/ui/DataTable';
import { usePreventiveOccurrences } from '@/hooks/preventive/usePreventiveOccurrences';
import { triggerLabel, OCCURRENCE_STATUS_COLORS, OCCURRENCE_STATUS_LABELS } from '@/config/preventiveConfig';
import { useInterventionRequestStatuses } from '@/hooks/shared/useInterventionRequestStatuses';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

export default function PreventivePlanDetail({ plan, onEdit, onDeactivate, onSaveSteps, saving }) {
  const { items, loading } = usePreventiveOccurrences({ plan_id: plan.id });
  const { labelMap: diLabelMap, colorMap: diColorMap } = useInterventionRequestStatuses();
  const { activeTab, setActiveTab } = useTabNavigation('gamme', 'tab');

  const occurrenceColumns = [
    {
      key: 'machine', header: 'Machine',
      render: (r) => (
        <Flex direction="column" gap="0">
          <Text size="2" weight="medium">{r.machine_code}</Text>
          <Text size="1" color="gray">{r.machine_name}</Text>
        </Flex>
      ),
    },
    {
      key: 'date', header: 'Échéance', width: 100,
      render: (r) => (
        <Text size="1" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtDate(r.scheduled_date)}</Text>
      ),
    },
    {
      key: 'status', header: 'Statut', width: 90,
      render: (r) => (
        <Badge color={OCCURRENCE_STATUS_COLORS[r.status] || 'gray'} variant="soft" size="1">
          {OCCURRENCE_STATUS_LABELS[r.status] || r.status}
        </Badge>
      ),
    },
    {
      key: 'suivi', header: 'Suivi',
      render: (r) => (
        <Flex align="center" gap="2" wrap="wrap">
          {r.di_id ? (
            <Button size="1" variant="ghost" asChild>
              <Link to="/interventions?tab=demandes">
                <ExternalLink size={11} />
                <Text size="1" style={{ fontFamily: 'monospace' }}>{r.di_code ?? 'DI'}</Text>
              </Link>
            </Button>
          ) : null}
          {r.di_statut && (
            <Badge color={diColorMap[r.di_statut] ?? 'gray'} variant="soft" size="1">
              {diLabelMap[r.di_statut] ?? r.di_statut}
            </Badge>
          )}
          {r.intervention_id && (
            <Button size="1" variant="soft" color="gray" asChild>
              <Link to={`/intervention/${r.intervention_id}`}><ExternalLink size={11} />Intervention</Link>
            </Button>
          )}
          {!r.di_id && !r.intervention_id && (
            <Text size="1" color="gray">—</Text>
          )}
        </Flex>
      ),
    },
  ];

  return (
    <Box p="4" style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Header du plan */}
      <Flex align="center" justify="between" gap="3" wrap="wrap">
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
        <Flex gap="2" shrink="0" align="center">
          <Button size="2" variant="soft" color="blue" onClick={() => onEdit(plan)}>
            <Pencil size={13} />Modifier
          </Button>
          <Button size="2" variant="soft" color="orange" onClick={() => onDeactivate(plan)}>
            <Pause size={13} />Désactiver
          </Button>
        </Flex>
      </Flex>

      <Separator size="4" />

      {/* Onglets Gamme / Occurrences */}
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
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
            <GammeStepsPanel plan={plan} onSave={onSaveSteps} saving={saving} />
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
