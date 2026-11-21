/**
 * @fileoverview Tableau de la consommation de capacité par équipement mère (site) (titre et définition dans l'onglet État)
 * @module components/service-status/SiteConsumptionTable
 */

import PropTypes from 'prop-types';
import { Box, Text, Badge } from '@radix-ui/themes';
import DataTable from '@/components/ui/DataTable';
import { formatHours, formatPct } from '@/hooks/organisation/organisationFormat';

const COLUMNS = [
  {
    key: 'equipmentName',
    header: 'Équipement mère (site)',
    render: (row) => (
      <Text size="2" weight="medium">
        {row.equipmentCode ? `${row.equipmentCode} - ${row.equipmentName}` : row.equipmentName}
      </Text>
    ),
  },
  {
    key: 'totalHours',
    header: 'Temps total (h)',
    width: '120px',
    align: 'end',
    render: (row) => (
      <Text size="2" weight="bold">
        {formatHours(row.totalHours)}
      </Text>
    ),
  },
  {
    key: 'percentTotal',
    header: '% temps service',
    width: '130px',
    align: 'end',
    render: (row) => (
      <Badge color="blue" variant="soft">
        {formatPct(row.percentTotal)}
      </Badge>
    ),
  },
  {
    key: 'fragHours',
    header: 'Temps FRAG (h)',
    width: '130px',
    align: 'end',
    render: (row) => (
      <Text size="2" weight="bold" color="orange">
        {formatHours(row.fragHours)}
      </Text>
    ),
  },
  {
    key: 'percentFrag',
    header: '% FRAG service',
    width: '130px',
    align: 'end',
    render: (row) => (
      <Badge color="orange" variant="soft">
        {formatPct(row.percentFrag)}
      </Badge>
    ),
  },
];

export default function SiteConsumptionTable({ siteConsumption }) {
  if (!siteConsumption || !siteConsumption.items || siteConsumption.items.length === 0) {
    return (
      <Box p="3">
        <Text color="gray">Aucune donnée de consommation par site disponible</Text>
      </Box>
    );
  }

  return (
    <DataTable
      columns={COLUMNS}
      data={siteConsumption.items}
      getRowKey={(row) => row.equipmentId}
      rowHover
      variant="surface"
    />
  );
}

SiteConsumptionTable.propTypes = {
  siteConsumption: PropTypes.shape({
    totalServiceHours: PropTypes.number,
    totalFragHours: PropTypes.number,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        equipmentId: PropTypes.number.isRequired,
        equipmentName: PropTypes.string.isRequired,
        totalHours: PropTypes.number.isRequired,
        fragHours: PropTypes.number.isRequired,
        percentTotal: PropTypes.number.isRequired,
        percentFrag: PropTypes.number.isRequired,
      })
    ),
  }),
};
