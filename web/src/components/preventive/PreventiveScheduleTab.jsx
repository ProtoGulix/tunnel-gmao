/**
 * @fileoverview Onglet Échéancier du préventif : trois groupes (en retard, cette semaine, à venir)
 * plus les plans par heures « non calculé ». Les états viennent de la route, rien n'est recalculé ici.
 * @module components/preventive/PreventiveScheduleTab
 */

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Badge, Box, Button, Flex, Text } from '@radix-ui/themes';
import { CalendarClock, ExternalLink } from 'lucide-react';
import { usePreventiveSchedule } from '@/hooks/preventive/usePreventiveSchedule';
import { PERM } from '@/auth/permissionCodes';
import { usePermissions } from '@/auth/usePermissions';
import { SCHEDULE_STATE_COLORS, SCHEDULE_STATE_LABELS, groupSchedule } from '@/config/preventiveConfig';
import { entityCodeUrl } from '@/components/shared/entityCodeUrl';
import MachineCodeLink from '@/components/preventive/MachineCodeLink';
import DataTable from '@/components/ui/DataTable';
import OverdueBadge from '@/components/preventive/OverdueBadge';
import ErrorState from '@/components/ui/ErrorState';

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

function DueCell({ row }) {
  if (row.state === 'not_computed') {
    return <Text size="1" color="gray" title="Le compteur d'heures n'est pas fiable : pas d'échéance calculée">non calculé</Text>;
  }
  return (
    <Flex direction="column" gap="0">
      <Text size="2" style={{ fontVariantNumeric: 'tabular-nums' }}>{fmtDate(row.due_date)}</Text>
      {row.state === 'overdue' && <OverdueBadge days={row.days_overdue} />}
    </Flex>
  );
}
DueCell.propTypes = { row: PropTypes.object.isRequired };

function LinkCell({ row }) {
  if (!row.di_id && !row.intervention_id) return <Text size="1" color="gray">—</Text>;
  return (
    <Flex gap="2" wrap="wrap">
      {row.di_id && (
        <Button size="1" variant="ghost" asChild>
          <Link to={`/interventions?tab=demandes&id=${encodeURIComponent(row.di_id)}`}><ExternalLink size={11} />Demande</Link>
        </Button>
      )}
      {row.intervention_id && (
        <Button size="1" variant="ghost" asChild>
          <Link to={entityCodeUrl('intervention', row.intervention_id)}><ExternalLink size={11} />Intervention</Link>
        </Button>
      )}
    </Flex>
  );
}
LinkCell.propTypes = { row: PropTypes.object.isRequired };

const columns = [
  {
    key: 'plan', header: 'Plan',
    render: (r) => (
      <Flex direction="column" gap="0">
        <Text size="2" weight="medium">{r.plan_label}</Text>
        <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>{r.plan_code}</Text>
      </Flex>
    ),
  },
  {
    key: 'machine', header: 'Équipement',
    render: (r) => (
      <Flex direction="column" gap="1" align="start">
        <MachineCodeLink id={r.machine_id} code={r.machine_code} />
        <Text size="1" color="gray">{r.machine_name}</Text>
      </Flex>
    ),
  },
  { key: 'due', header: 'Échéance', width: 150, render: (r) => <DueCell row={r} /> },
  { key: 'link', header: 'Suivi', width: 170, render: (r) => <LinkCell row={r} /> },
];

function Group({ state, rows }) {
  return (
    <Box mb="4">
      <Flex align="center" gap="2" mb="2">
        <Badge color={SCHEDULE_STATE_COLORS[state]} variant="soft">{SCHEDULE_STATE_LABELS[state]}</Badge>
        <Text size="1" color="gray">{rows.length}</Text>
      </Flex>
      <DataTable
        columns={columns}
        data={rows}
        getRowKey={(r) => `${r.plan_id}-${r.machine_id}`}
        emptyState={{ icon: CalendarClock, title: 'Rien dans ce groupe', description: '' }}
      />
    </Box>
  );
}
Group.propTypes = { state: PropTypes.string.isRequired, rows: PropTypes.array.isRequired };

export default function PreventiveScheduleTab() {
  const { can } = usePermissions();
  const allowed = can(PERM.preventive.schedule);
  // Sans le droit, aucun appel : un 403 afficherait une erreur globale.
  const { items, loading, error, refresh } = usePreventiveSchedule({}, allowed);
  if (!allowed) {
    return (
      <Box px="4" py="3">
        <Text size="2" color="gray">Votre rôle ne donne pas accès à l&apos;échéancier.</Text>
      </Box>
    );
  }
  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const groups = groupSchedule(items).filter((g) => g.rows.length > 0 || ['overdue', 'due_soon', 'ok'].includes(g.state));
  return (
    <Box px="4" py="3">
      {loading && <Text size="2" color="gray">Chargement…</Text>}
      {!loading && groups.map((g) => <Group key={g.state} state={g.state} rows={g.rows} />)}
    </Box>
  );
}
