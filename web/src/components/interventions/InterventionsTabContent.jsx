/**
 * @fileoverview Contenu master-detail de l'onglet Interventions (page liste)
 * @module components/interventions/InterventionsTabContent
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, SegmentedControl, Text } from '@radix-ui/themes';
import { Wrench } from 'lucide-react';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import ErrorState from '@/components/ui/ErrorState';
import InterventionDetailPanel from '@/components/interventions/InterventionDetailPanel';
import { useInterventionsList } from '@/hooks/interventions/useInterventionsList';
import InterventionListItem from '@/components/interventions/InterventionListItem';

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

/* Groupes de la liste, dans l'ordre d'affichage ; « Tout » les montre empilés */
const GROUPS = [
  { key: 'actionnable', short: 'À faire', label: 'À faire maintenant', color: 'var(--red-9)' },
  { key: 'bloque', short: 'Bloqué', label: 'Bloqué', color: 'var(--amber-9)' },
  { key: 'projet', short: 'Projets', label: 'Projets / Support', color: 'var(--blue-9)' },
  { key: 'archive', short: 'À archiver', label: 'À archiver', color: 'var(--gray-6)' },
];
const ALL = 'tout';

/* ── Sélecteur de groupe, sous la recherche ─────────────────────────────── */
function GroupSelector({ value, onChange, blocks }) {
  return (
    <SegmentedControl.Root size="1" value={value} onValueChange={onChange} style={{ width: '100%' }}>
      {GROUPS.map((g) => (
        <SegmentedControl.Item key={g.key} value={g.key}>
          {g.short} ({blocks[g.key].length})
        </SegmentedControl.Item>
      ))}
      <SegmentedControl.Item value={ALL}>Tout</SegmentedControl.Item>
    </SegmentedControl.Root>
  );
}
GroupSelector.propTypes = { value: PropTypes.string.isRequired, onChange: PropTypes.func.isRequired, blocks: PropTypes.object.isRequired };

/* ── Contenu de l'onglet Interventions ──────────────────────────────────── */
export default function InterventionsTabContent({ selectedId, onSelect, onCreate, refreshToken }) {
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('actionnable');
  const { blocks, loading, error, refetch } = useInterventionsList(search);

  // Relance la liste quand la page change refreshToken (marquage de masse), sauf au montage
  const lastToken = useRef(refreshToken);
  useEffect(() => {
    if (lastToken.current === refreshToken) return;
    lastToken.current = refreshToken;
    refetch();
  }, [refreshToken]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Liste maître : le groupe choisi seul, ou tous les groupes avec leurs séparateurs */
  const masterList = useMemo(() => {
    const visible = group === ALL ? GROUPS : GROUPS.filter((g) => g.key === group);
    return visible.flatMap((g) => {
      const list = blocks[g.key];
      if (list.length === 0) return [];
      const rows = list.map((interv) => (
        <InterventionListItem
          key={interv.id}
          interv={interv}
          isSelected={String(interv.id) === String(selectedId)}
          onClick={() => onSelect(interv)}
        />
      ));
      if (group !== ALL) return rows;
      return [<GroupHeader key={`hdr-${g.key}`} label={g.label} count={list.length} color={g.color} />, ...rows];
    });
  }, [blocks, group, selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const shownCount = group === ALL
    ? GROUPS.reduce((n, g) => n + blocks[g.key].length, 0)
    : blocks[group].length;

  if (error) return <ErrorState error={error} onRetry={refetch} />;

  return (
    <Box px="4" pt="3" style={{ flex: 1, minHeight: 500, overflow: 'hidden' }}>
      <MasterDetailLayout
        freeDetail
        ratio="35% 1fr"
        masterProps={{
          icon: Wrench,
          title: 'Interventions',
          count: shownCount,
          search,
          onSearchChange: setSearch,
          loading,
          children: masterList,
          headerExtra: <GroupSelector value={group} onChange={setGroup} blocks={blocks} />,
        }}
        detailChildren={selectedId ? (
          <InterventionDetailPanel
            id={selectedId}
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
  refreshToken: PropTypes.number,
};
