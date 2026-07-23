/**
 * @fileoverview Contenu master-detail de l'onglet Interventions (page liste)
 * @module components/interventions/InterventionsTabContent
 */

import { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Flex, Text } from '@radix-ui/themes';
import { Wrench } from 'lucide-react';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import ErrorState from '@/components/ui/ErrorState';
import InterventionDetailPage from '@/pages/interventions/InterventionDetailPage';
import { useInterventionsList } from '@/hooks/interventions/useInterventionsList';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/config/interventionTypes';
import { getInterventionUrgency, formatDueDate } from '@/hooks/useInterventionUrgency';

/* ── Couleur de bord gauche selon bloc ─────────────────────────────────── */
function getBlockColor(interv) {
  const status = interv.status?.toLowerCase();
  if (status === 'ferme' || status === 'cancelled') return 'var(--gray-6)';
  if (status === 'attente_pieces' || status === 'attente_prod') return 'var(--amber-9)';
  const priority = interv.priority?.toLowerCase();
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.normal;
  return `var(--${cfg.color}-9)`;
}

function InterventionBadgesRow({ interv, statusCfg }) {
  const urgency = getInterventionUrgency(interv.next_due_date, interv.reportedDate);
  const dueLevelColor = urgency.level === 'overdue' ? 'red' : urgency.level === 'urgent' ? 'orange' : 'blue';

  return (
    <Flex align="center" justify="between" gap="2" mb="1">
      <Badge variant="solid" color="blue" size="1" style={{ fontFamily: 'monospace', flexShrink: 0 }}>
        {interv.code}
      </Badge>
      {interv.machine?.code && (
        <Badge variant="solid" color="gray" size="1" style={{ fontFamily: 'monospace', flexShrink: 0 }}>
          {interv.machine.code}
        </Badge>
      )}
      <Badge size="1" color={statusCfg.color} variant="soft" style={{ flexShrink: 0 }}>
        {statusCfg.label}
      </Badge>
      {interv.next_due_date && (
        <Badge size="1" color={dueLevelColor} variant={urgency.level === 'overdue' ? 'solid' : 'soft'} style={{ flexShrink: 0 }}>
          {formatDueDate(interv.next_due_date)}
        </Badge>
      )}
    </Flex>
  );
}
InterventionBadgesRow.propTypes = { interv: PropTypes.object.isRequired, statusCfg: PropTypes.object.isRequired };

/* ── Item de la liste maître ────────────────────────────────────────────── */
function InterventionItem({ interv, isSelected, onClick }) {
  const statusCfg = STATUS_CONFIG[interv.status?.toLowerCase()] ?? STATUS_CONFIG.ouvert;

  return (
    <Box
      px="3" py="2"
      onClick={onClick}
      style={{
        cursor: 'pointer',
        borderBottom: '1px solid var(--gray-4)',
        background: isSelected ? 'var(--blue-2)' : 'transparent',
        borderLeft: isSelected ? '3px solid var(--blue-9)' : `3px solid ${getBlockColor(interv)}`,
      }}
    >
      <InterventionBadgesRow interv={interv} statusCfg={statusCfg} />
      <Text size="2" weight="medium" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
        {interv.title || 'Sans titre'}
      </Text>
      {interv.machine?.name && (
        <Text size="1" color="gray" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
          {interv.machine.name}
        </Text>
      )}
    </Box>
  );
}
InterventionItem.propTypes = {
  interv: PropTypes.object.isRequired,
  isSelected: PropTypes.bool,
  onClick: PropTypes.func,
};

/* ── Séparateur de groupe ───────────────────────────────────────────────── */
function GroupHeader({ label, count, color }) {
  return (
    <Flex align="center" gap="2" px="3" py="1" style={{ background: 'var(--gray-3)', borderBottom: '1px solid var(--gray-4)', flexShrink: 0 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <Text size="1" weight="bold" color="gray">{label}</Text>
      <Text size="1" color="gray">({count})</Text>
    </Flex>
  );
}
GroupHeader.propTypes = { label: PropTypes.string.isRequired, count: PropTypes.number.isRequired, color: PropTypes.string.isRequired };

/* ── Contenu de l'onglet Interventions ──────────────────────────────────── */
export default function InterventionsTabContent({ selectedId, onSelect, onCreate }) {
  const [search, setSearch] = useState('');
  const { blocks, loading, error, refetch, totalOpen } = useInterventionsList(search);

  /* Construction de la liste maître avec séparateurs de groupes */
  const masterList = useMemo(() => {
    const items = [];

    const pushGroup = (list, label, color) => {
      if (list.length === 0) return;
      items.push(
        <GroupHeader key={`hdr-${label}`} label={label} count={list.length} color={color} />
      );
      list.forEach((interv) => items.push(
        <InterventionItem
          key={interv.id}
          interv={interv}
          isSelected={String(interv.id) === String(selectedId)}
          onClick={() => onSelect(interv)}
        />
      ));
    };

    pushGroup(blocks.actionnable, 'À faire maintenant', 'var(--red-9)');
    pushGroup(blocks.bloque, 'Bloqué', 'var(--amber-9)');
    pushGroup(blocks.projet, 'Projets / Support', 'var(--blue-9)');
    pushGroup(blocks.archive, 'À archiver', 'var(--gray-6)');

    return items;
  }, [blocks, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCount = blocks.actionnable.length + blocks.bloque.length + blocks.projet.length + blocks.archive.length;

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <Box px="4" pt="3" style={{ flex: 1, minHeight: 500, overflow: 'hidden' }}>
      <MasterDetailLayout
        freeDetail
        ratio="35% 1fr"
        masterProps={{
          icon: Wrench,
          title: 'Interventions',
          count: totalCount,
          search,
          onSearchChange: setSearch,
          loading,
          children: masterList,
          headerExtra: totalOpen > 0 ? (
            <Flex align="center" gap="2">
              <Badge color="red" variant="soft" size="1">{totalOpen} ouvertes</Badge>
              <Badge color="gray" variant="soft" size="1">{blocks.archive.length} archivées</Badge>
            </Flex>
          ) : null,
        }}
        detailChildren={selectedId ? (
          <InterventionDetailPage
            id={selectedId}
            embedded
            onDeleted={onCreate}
            onRefreshList={refetch}
          />
        ) : null}
        emptyLabel="Sélectionnez une intervention pour voir son détail"
      />
    </Box>
  );
}

InterventionsTabContent.propTypes = {
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
};
