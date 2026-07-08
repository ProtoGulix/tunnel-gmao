/**
 * Page Interventions — master-detail
 * Gauche : liste filtrée + recherche | Droite : détail de l'intervention sélectionnée
 */

import { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, Box, Button, Flex, Text } from '@radix-ui/themes';
import { Wrench } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
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

/* ── Item de la liste maître ────────────────────────────────────────────── */
function InterventionItem({ interv, isSelected, onClick }) {
  const statusCfg = STATUS_CONFIG[interv.status?.toLowerCase()] ?? STATUS_CONFIG.ouvert;
  const urgency = getInterventionUrgency(interv.next_due_date, interv.reportedDate);
  const dueLevelColor = urgency.level === 'overdue' ? 'red' : urgency.level === 'urgent' ? 'orange' : 'blue';

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

/* ── Page principale ────────────────────────────────────────────────────── */
export default function InterventionsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(() => searchParams.get('id') ?? null);

  const { blocks, loading, error, refetch, totalOpen } = useInterventionsList(search);

  const handleSelect = (interv) => {
    setSelectedId(String(interv.id));
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('id', interv.id);
      return next;
    }, { replace: true });
  };

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
          onClick={() => handleSelect(interv)}
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
    <>
      <PageHeader
        title="Interventions"
        subtitle="Gestion des interventions de maintenance"
        icon={Wrench}
        onAdd={() => navigate('/intervention/new')}
        addLabel="Nouvelle intervention"
      />

      <Box px="4" style={{ height: 'calc(100vh - 180px)', minHeight: 500 }}>
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
              onDeleted={() => setSelectedId(null)}
              onRefreshList={refetch}
            />
          ) : null}
          emptyLabel="Sélectionnez une intervention pour voir son détail"
        />
      </Box>
    </>
  );
}
