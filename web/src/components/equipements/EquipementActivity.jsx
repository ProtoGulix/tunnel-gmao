/**
 * @fileoverview Section Activité d'un équipement : demandes ouvertes, interventions, préventif
 * @module components/equipements/EquipementActivity
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Badge, Box, Button, Checkbox, Dialog, Flex, Text } from '@radix-ui/themes';
import { CalendarClock } from 'lucide-react';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import Pagination from '@/components/ui/Pagination';
import { useEquipementActivity, ACTIVITY_PAGE_SIZE_OPTIONS } from '@/hooks/equipements/useEquipementActivity';
import EquipementPreventifTab from '@/components/equipements/tabs/EquipementPreventifTab';
import { entityCodeUrl } from '@/components/shared/entityCodeUrl';
import { Section, formatDate, linkStyle } from '@/components/equipements/EquipementDetailSections';
import { STATUS_CONFIG, PRIORITY_BADGE_COLORS } from '@/config/interventionTypes';

function RowLink({ to, children }) {
  return (
    <Link to={to} style={linkStyle}>
      <Flex
        align="center"
        gap="2"
        style={{ padding: '6px 8px', border: '1px solid var(--gray-4)', borderRadius: 'var(--radius-2)', background: 'var(--gray-2)' }}
      >
        {children}
      </Flex>
    </Link>
  );
}
RowLink.propTypes = { to: PropTypes.string.isRequired, children: PropTypes.node };

const ellipsis = { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };

function ListBlock({ title, list, emptyLabel, children }) {
  const { items, total, loading, error, page, pageSize, setPage, setPageSize } = list;
  return (
    <Box mb="4">
      <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginBottom: 4 }}>
        {title} ({total})
      </Text>
      {error && <ErrorState error={error} />}
      {loading && items.length === 0 && !error && <LoadingState fullscreen={false} message="Chargement…" />}
      {!loading && !error && items.length === 0 && <Text size="2" color="gray">{emptyLabel}</Text>}
      {items.length > 0 && (
        <Flex direction="column" gap="1" style={{ opacity: loading ? 0.6 : 1 }}>
          {items.map(children)}
        </Flex>
      )}
      {total > ACTIVITY_PAGE_SIZE_OPTIONS[0] && (
        <Box mt="2">
          <Pagination
            currentPage={page}
            totalItems={total}
            itemsPerPage={pageSize}
            onPageChange={setPage}
            onItemsPerPageChange={setPageSize}
            pageSizeOptions={ACTIVITY_PAGE_SIZE_OPTIONS}
          />
        </Box>
      )}
    </Box>
  );
}
ListBlock.propTypes = {
  title: PropTypes.string.isRequired,
  list: PropTypes.object.isRequired,
  emptyLabel: PropTypes.string.isRequired,
  children: PropTypes.func.isRequired,
};

function OpenRequests({ list }) {
  return (
    <ListBlock title="Demandes ouvertes" list={list} emptyLabel="Aucune demande ouverte.">
      {(req) => (
        <RowLink key={req.id} to={`/interventions?tab=demandes&id=${req.id}`}>
          {req.code && <Text size="2" weight="bold" style={{ fontFamily: 'monospace', color: 'var(--accent-11)', flexShrink: 0 }}>{req.code}</Text>}
          {req.statut_label && (
            <Badge
              size="1"
              variant="soft"
              style={{
                flexShrink: 0,
                backgroundColor: req.statut_color ? `${req.statut_color}22` : 'var(--gray-3)',
                color: req.statut_color || 'var(--gray-11)',
              }}
            >
              {req.statut_label}
            </Badge>
          )}
          <Text size="2" color="gray" style={ellipsis}>{req.description}</Text>
          {req.created_at && <Text size="1" color="gray" style={{ flexShrink: 0 }}>{formatDate(req.created_at)}</Text>}
        </RowLink>
      )}
    </ListBlock>
  );
}
OpenRequests.propTypes = { list: PropTypes.object.isRequired };

function InterventionsBlock({ list }) {
  return (
    <ListBlock title="Interventions" list={list} emptyLabel="Aucune intervention.">
      {(inter) => {
        const status = STATUS_CONFIG[inter.status_actual?.toLowerCase()];
        return (
          <RowLink key={inter.id} to={entityCodeUrl('intervention', inter.id)}>
            <Badge variant="solid" color="blue" size="1" style={{ fontFamily: 'monospace', flexShrink: 0 }}>{inter.code}</Badge>
            <Text size="2" style={ellipsis}>{inter.title || 'Sans titre'}</Text>
            {inter.priority && (
              <Badge variant="soft" size="1" color={PRIORITY_BADGE_COLORS[inter.priority] ?? 'gray'} style={{ flexShrink: 0 }}>
                {inter.priority}
              </Badge>
            )}
            <Badge variant="soft" size="1" color={status?.color ?? 'gray'} style={{ flexShrink: 0 }}>
              {status?.label ?? inter.status_actual ?? '—'}
            </Badge>
            <Text size="1" color="gray" style={{ flexShrink: 0 }}>{formatDate(inter.reported_date)}</Text>
          </RowLink>
        );
      }}
    </ListBlock>
  );
}
InterventionsBlock.propTypes = { list: PropTypes.object.isRequired };

function PreventifBlock({ eq }) {
  const [open, setOpen] = useState(false);
  const summary = eq.preventive_occurrences_summary;
  if (!summary && eq.preventive_plans == null) return null;
  const pending = summary?.pending_count ?? 0;
  return (
    <Box>
      <Text size="1" weight="bold" color="gray" style={{ display: 'block', marginBottom: 4 }}>Préventif</Text>
      <Flex align="center" gap="3" wrap="wrap">
        <Badge color={pending > 0 ? 'orange' : 'gray'} variant="soft">{pending} en attente</Badge>
        {summary?.next_scheduled && <Text size="2" color="gray">Prochaine : {formatDate(summary.next_scheduled)}</Text>}
        <Button size="1" variant="soft" color="gray" onClick={() => setOpen(true)}>
          <CalendarClock size={13} /> Détail
        </Button>
      </Flex>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Content maxWidth="600px">
          <Dialog.Title>Maintenance préventive — {eq.code}</Dialog.Title>
          <EquipementPreventifTab equipement={eq} />
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
}
PreventifBlock.propTypes = { eq: PropTypes.object.isRequired };

export default function ActivitySection({ eq, includeDescendants, onIncludeChange }) {
  const { requests, interventions } = useEquipementActivity(String(eq.id), includeDescendants);
  const hasChildren = (eq.children_count ?? 0) > 0;
  return (
    <Section title="Activité">
      {hasChildren && (
        <Text as="label" size="2" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
          <Checkbox
            checked={includeDescendants}
            onCheckedChange={(v) => onIncludeChange(v === true)}
          />
          Inclure les sous-équipements
          {eq.descendants_count > 0 && <Text size="1" color="gray">({eq.descendants_count})</Text>}
        </Text>
      )}
      <OpenRequests list={requests} />
      <InterventionsBlock list={interventions} />
      <PreventifBlock eq={eq} />
    </Section>
  );
}
ActivitySection.propTypes = {
  eq: PropTypes.object.isRequired,
  includeDescendants: PropTypes.bool.isRequired,
  onIncludeChange: PropTypes.func.isRequired,
};
