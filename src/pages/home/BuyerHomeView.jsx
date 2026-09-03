/**
 * @fileoverview Vue d'accueil "acheteur" — demandes d'achat groupées par
 * statut dérivé, filtrables par site, avec accès à la DI d'origine.
 * @module pages/home/BuyerHomeView
 */

import { useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Container, Flex, Select, Badge, Text, Box, Heading } from '@radix-ui/themes';
import PageHeader from '@/components/layout/PageHeader';
import DataTable from '@/components/ui/DataTable';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import { useBuyerPurchaseRequests } from '@/hooks/home/useBuyerPurchaseRequests';

const SITE_OPTIONS = [
  { value: '', label: 'Tous les sites' },
  { value: 'VLT', label: 'Les Villettes' },
  { value: 'SML', label: 'Saint Maurice de Lignon' },
];

// Regroupement d'affichage : les statuts dérivés fins (TO_QUALIFY,
// NO_SUPPLIER_REF, PENDING_DISPATCH, OPEN, CONSULTATION, QUOTED) sont tous
// "en attente" côté acheteur — seul ORDERED/PARTIAL/RECEIVED/REJECTED
// méritent leur propre groupe, cohérent avec la demande "en attente /
// commandé / réceptionné".
const GROUP_LABELS = {
  en_attente: 'En attente',
  commande: 'Commandé',
  receptionne: 'Réceptionné',
  refuse: 'Refusé',
};
const GROUP_ORDER = ['en_attente', 'commande', 'receptionne', 'refuse'];

function groupKeyForStatus(code) {
  if (code === 'ORDERED' || code === 'PARTIAL') return 'commande';
  if (code === 'RECEIVED') return 'receptionne';
  if (code === 'REJECTED') return 'refuse';
  return 'en_attente';
}

function RequestOriginCell({ item }) {
  if (!item.intervention_request_id) {
    return <Text size="1" color="gray">—</Text>;
  }
  return (
    <a href={`/interventions?tab=demandes&id=${item.intervention_request_id}`} style={{ textDecoration: 'none' }}>
      <Text size="1" style={{ fontFamily: 'monospace' }}>{item.intervention_request_code}</Text>
    </a>
  );
}

RequestOriginCell.propTypes = {
  item: PropTypes.shape({
    intervention_request_id: PropTypes.string,
    intervention_request_code: PropTypes.string,
  }).isRequired,
};

export default function BuyerHomeView() {
  const [site, setSite] = useState('');
  const { items, loading, error } = useBuyerPurchaseRequests({ site });

  const grouped = useMemo(() => {
    const groups = new Map();
    for (const item of items) {
      const key = groupKeyForStatus(item.derived_status?.code);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(item);
    }
    return groups;
  }, [items]);

  if (loading && items.length === 0) return <LoadingState fullscreen message="Chargement des demandes d'achat…" />;
  if (error) return <ErrorState error={error} />;

  const columns = [
    { key: 'code', header: 'DA', accessor: (r) => r.code, width: 110 },
    {
      key: 'item_label',
      header: 'Article',
      render: (r) => (
        <Text size="2" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260, display: 'block' }}>
          {r.item_label}
        </Text>
      ),
    },
    { key: 'quantity', header: 'Qté', render: (r) => <Text size="1">{r.quantity} {r.unit || ''}</Text>, width: 80 },
    {
      key: 'derived_status',
      header: 'Statut',
      render: (r) => (
        <Badge size="1" variant="soft" style={{ backgroundColor: (r.derived_status?.color || '#888') + '22', color: r.derived_status?.color || '#888' }}>
          {r.derived_status?.label}
        </Badge>
      ),
      width: 140,
    },
    { key: 'urgency', header: 'Urgence', accessor: (r) => r.urgency || '—', width: 90 },
    { key: 'intervention_code', header: 'Intervention', accessor: (r) => r.intervention_code || '—', width: 140 },
    {
      key: 'intervention_request_code',
      header: 'DI d’origine',
      render: (r) => <RequestOriginCell item={r} />,
      width: 110,
    },
  ];

  return (
    <>
      <PageHeader
        title="Achats"
        subtitle="Demandes d'achat par statut"
      />
      <Container size="4">
        <Flex justify="end" mb="3">
          <Select.Root value={site || '__all__'} onValueChange={(v) => setSite(v === '__all__' ? '' : v)}>
            <Select.Trigger />
            <Select.Content>
              {SITE_OPTIONS.map((o) => (
                <Select.Item key={o.value || '__all__'} value={o.value || '__all__'}>{o.label}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>

        {GROUP_ORDER.filter((key) => grouped.has(key)).map((key) => {
          const groupItems = grouped.get(key);
          return (
            <Box key={key} mb="5">
              <Heading size="3" mb="2">
                {GROUP_LABELS[key]} <Text color="gray" size="2">({groupItems.length})</Text>
              </Heading>
              <DataTable columns={columns} data={groupItems} getRowKey={(r) => r.id} />
            </Box>
          );
        })}

        {items.length === 0 && (
          <Text color="gray">Aucune demande d&rsquo;achat pour ce site.</Text>
        )}
      </Container>
    </>
  );
}
