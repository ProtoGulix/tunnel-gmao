/**
 * @fileoverview Section d'anomalies par type
 * @module components/anomalies/AnomalySection
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text, Card, Heading, Badge, Callout } from '@radix-ui/themes';
import { Info, RefreshCw, Clock, Tag, Users, Package } from 'lucide-react';
import DataTable from '@/components/common/DataTable';

/**
 * Configuration des types d'anomalies
 */
const ANOMALY_TYPES = {
  tooRepetitive: {
    title: 'Actions répétitives',
    icon: RefreshCw,
    description: 'Même sous-catégorie + même machine répétée plus de 3 fois dans un mois',
    color: 'orange',
    columns: [
      { key: 'category', header: 'Catégorie', render: (row) => (
        <Text weight="bold">{row.category}{row.categoryName && <Text size="1" color="gray"> — {row.categoryName}</Text>}</Text>
      )},
      { key: 'machine', header: 'Machine', accessor: 'machine' },
      { key: 'month', header: 'Mois', accessor: 'month' },
      { key: 'count', header: 'Occurrences', align: 'end', accessor: 'count' },
      { key: 'severity', header: 'Sévérité', render: (row) => <SeverityBadge severity={row.severity} /> },
    ],
  },
  tooFragmented: {
    title: 'Actions fragmentées',
    icon: Clock,
    description: 'Actions courtes (< 1h) sur une même sous-catégorie apparaissant 5+ fois',
    color: 'blue',
    columns: [
      { key: 'category', header: 'Catégorie', render: (row) => (
        <Text weight="bold">{row.category}{row.categoryName && <Text size="1" color="gray"> — {row.categoryName}</Text>}</Text>
      )},
      { key: 'count', header: 'Occurrences', align: 'end', accessor: 'count' },
      { key: 'totalTime', header: 'Temps total', align: 'end', render: (row) => `${row.totalTime?.toFixed(1)}h` },
      { key: 'avgTime', header: 'Temps moyen', align: 'end', render: (row) => `${row.avgTime?.toFixed(2)}h` },
      { key: 'severity', header: 'Sévérité', render: (row) => <SeverityBadge severity={row.severity} /> },
    ],
  },
  tooLongForCategory: {
    title: 'Durée anormale',
    icon: Clock,
    description: 'Actions > 4h sur des catégories normalement rapides',
    color: 'red',
    columns: [
      { key: 'category', header: 'Catégorie', render: (row) => <Text weight="bold">{row.category}</Text> },
      { key: 'intervention', header: 'Intervention', render: (row) => (
        <><Text>{row.intervention}</Text>{row.machine && <Text size="1" color="gray"> — {row.machine}</Text>}</>
      )},
      { key: 'tech', header: 'Technicien', accessor: 'tech' },
      { key: 'time', header: 'Durée', align: 'end', render: (row) => <Text color="red" weight="bold">{row.time?.toFixed(1)}h</Text> },
      { key: 'severity', header: 'Sévérité', render: (row) => <SeverityBadge severity={row.severity} /> },
    ],
  },
  badClassification: {
    title: 'Classification douteuse',
    icon: Tag,
    description: 'Actions dont la description contient des mots-clés incohérents avec la catégorie',
    color: 'purple',
    columns: [
      { key: 'category', header: 'Catégorie', render: (row) => <Text weight="bold">{row.category}</Text> },
      { key: 'keywords', header: 'Mots-clés suspects', render: (row) => (
        <Flex gap="1" wrap="wrap">
          {row.foundKeywords?.map((kw, j) => <Badge key={j} color="purple" variant="soft">{kw}</Badge>)}
        </Flex>
      )},
      { key: 'intervention', header: 'Intervention', accessor: 'intervention' },
      { key: 'severity', header: 'Sévérité', render: (row) => <SeverityBadge severity={row.severity} /> },
    ],
  },
  backToBack: {
    title: 'Actions consécutives',
    icon: Users,
    description: 'Même technicien + même intervention avec actions espacées de moins de 24h',
    color: 'amber',
    columns: [
      { key: 'tech', header: 'Technicien', accessor: 'tech' },
      { key: 'intervention', header: 'Intervention', accessor: 'intervention' },
      { key: 'categories', header: 'Catégories', render: (row) => <Text size="1">{row.category1} → {row.category2}</Text> },
      { key: 'daysDiff', header: 'Écart', align: 'end', render: (row) => <Text color="amber">{row.daysDiff?.toFixed(1)}j</Text> },
      { key: 'severity', header: 'Sévérité', render: (row) => <SeverityBadge severity={row.severity} /> },
    ],
  },
  lowValueHighLoad: {
    title: 'Charge faible valeur',
    icon: Package,
    description: 'Catégories à faible valeur ajoutée dont le temps cumulé dépasse 30h',
    color: 'gray',
    columns: [
      { key: 'category', header: 'Catégorie', render: (row) => (
        <Text weight="bold">{row.category}{row.categoryName && <Text size="1" color="gray"> — {row.categoryName}</Text>}</Text>
      )},
      { key: 'totalTime', header: 'Temps total', align: 'end', render: (row) => <Text weight="bold">{row.totalTime?.toFixed(1)}h</Text> },
      { key: 'count', header: 'Actions', align: 'end', accessor: 'count' },
      { key: 'interventionCount', header: 'Interventions', align: 'end', accessor: 'interventionCount' },
      { key: 'severity', header: 'Sévérité', render: (row) => <SeverityBadge severity={row.severity} /> },
    ],
  },
};

/**
 * Badge de sévérité
 */
function SeverityBadge({ severity }) {
  return (
    <Badge color={severity === 'high' ? 'red' : 'orange'} variant="soft">
      {severity === 'high' ? 'Haute' : 'Moyenne'}
    </Badge>
  );
}

SeverityBadge.propTypes = {
  severity: PropTypes.string.isRequired,
};

/**
 * Section pour un type d'anomalie
 */
export function AnomalySection({ type, items }) {
  const config = ANOMALY_TYPES[type];
  if (!config) return null;

  const Icon = config.icon;
  const count = items?.length || 0;

  return (
    <Box mb="4">
      <Card>
        <Flex align="center" justify="between" mb="3">
          <Flex align="center" gap="2">
            <Icon size={18} color={`var(--${config.color}-9)`} />
            <Heading size="3">{config.title}</Heading>
            <Badge color={config.color} variant="soft">{count}</Badge>
          </Flex>
        </Flex>

        <Text size="1" color="gray" mb="3" style={{ display: 'block' }}>
          {config.description}
        </Text>

        {count === 0 ? (
          <Callout.Root color="green" size="1">
            <Callout.Icon><Info size={14} /></Callout.Icon>
            <Callout.Text>Aucune anomalie de ce type détectée</Callout.Text>
          </Callout.Root>
        ) : (
          <DataTable
            columns={config.columns}
            data={items}
            size="1"
            variant="surface"
            stickyHeader={false}
            getRowKey={(row, i) => row.actionId || row.category + i}
          />
        )}
      </Card>
    </Box>
  );
}

AnomalySection.propTypes = {
  type: PropTypes.oneOf([
    'tooRepetitive',
    'tooFragmented',
    'tooLongForCategory',
    'badClassification',
    'backToBack',
    'lowValueHighLoad',
  ]).isRequired,
  items: PropTypes.array,
};
