/**
 * @fileoverview Tableau du Top 10 des causes de fragmentation du service (titre et définition dans l'onglet État)
 * @module components/service-status/FragmentationCausesList
 */

import PropTypes from 'prop-types';
import { Box, Text, Badge } from '@radix-ui/themes';
import DataTable from '@/components/ui/DataTable';
import { formatHours, formatPct } from '@/hooks/organisation/organisationFormat';

const COLUMNS = [
  {
    key: 'rank',
    header: 'Rang',
    width: '60px',
    align: 'center',
    render: (row) => (
      <Text size="2" weight="bold" color="orange">
        {row.rank}
      </Text>
    ),
  },
  {
    key: 'subcategoryCode',
    header: 'Code',
    width: '80px',
    align: 'center',
    render: (row) => (
      <Badge color="blue" variant="soft" size="1">
        {row.subcategoryCode}
      </Badge>
    ),
  },
  {
    key: 'subcategoryName',
    header: 'Cause',
    render: (row) => <Text size="2">{row.subcategoryName}</Text>,
  },
  {
    key: 'totalHours',
    header: 'Temps (h)',
    width: '120px',
    align: 'end',
    render: (row) => (
      <Text size="2" weight="bold">
        {formatHours(row.totalHours)}
      </Text>
    ),
  },
  {
    key: 'actionCount',
    header: 'Actions',
    width: '100px',
    align: 'center',
    render: (row) => <Text size="2" color="gray">{row.actionCount}</Text>,
  },
  {
    key: 'percent',
    header: '% FRAG',
    width: '100px',
    align: 'end',
    render: (row) => (
      <Badge color="orange" variant="soft">
        {typeof row.percent === 'number' ? formatPct(row.percent) : row.percent}
      </Badge>
    ),
  },
];

const prepareTableData = (items) => {
  const rankedItems = items.map((cause, index) => ({
    ...cause,
    rank: index + 1,
  }));

  rankedItems.push({
    rank: '•',
    subcategoryCode: 'SHORT',
    subcategoryName: 'Actions courtes (< 0,5h) - Sauf : Dépannage, Préventif',
    totalHours: 0,
    actionCount: '-',
    percent: '-',
    isSpecialRow: true,
  });

  return rankedItems;
};

export default function FragmentationCausesList({ fragmentation }) {
  if (!fragmentation || !fragmentation.items || fragmentation.items.length === 0) {
    return (
      <Box p="3">
        <Text color="gray">Aucune fragmentation détectée sur la période</Text>
      </Box>
    );
  }

  return (
    <DataTable
      columns={COLUMNS}
      data={prepareTableData(fragmentation.items)}
      getRowKey={(row, index) => row.subcategoryId || `special-${index}`}
      rowHover
      variant="surface"
    />
  );
}

FragmentationCausesList.propTypes = {
  fragmentation: PropTypes.shape({
    total: PropTypes.number,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        subcategoryId: PropTypes.number.isRequired,
        subcategoryName: PropTypes.string.isRequired,
        totalHours: PropTypes.number.isRequired,
        actionCount: PropTypes.number.isRequired,
        percent: PropTypes.number.isRequired,
      })
    ),
  }),
};
