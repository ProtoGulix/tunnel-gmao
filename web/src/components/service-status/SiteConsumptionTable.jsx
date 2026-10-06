/**
 * @fileoverview Composant affichant la consommation de capacité par équipement mère (site)
 * @module components/service-status/SiteConsumptionTable
 */

import PropTypes from 'prop-types';
import { Box, Text, Badge, Callout } from '@radix-ui/themes';
import { Info } from 'lucide-react';
import DataTable from '@/components/ui/DataTable';

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
        {row.totalHours.toFixed(1)}h
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
        {row.percentTotal.toFixed(1)}%
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
        {row.fragHours.toFixed(1)}h
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
        {row.percentFrag.toFixed(1)}%
      </Badge>
    ),
  },
];

const EXPLANATION_TEXT = 'Cette analyse montre quels sites consomment la capacité du service maintenance. Elle reflète des contraintes organisationnelles (distance, support, coordination), et non la performance des équipes ou des équipements.';

export default function SiteConsumptionTable({ siteConsumption }) {
  if (!siteConsumption || !siteConsumption.items || siteConsumption.items.length === 0) {
    return (
      <Box mb="6">
        <Box p="4">
          <Text color="gray" align="center">
            Aucune donnée de consommation par site disponible
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box mb="6">
      <Box mb="4">
        <Text as="div" size="3" weight="bold" mb="3">
          Consommation de capacité par site
        </Text>

        <DataTable
          columns={COLUMNS}
          data={siteConsumption.items}
          getRowKey={(row) => row.equipmentId}
          rowHover
          variant="surface"
        />
      </Box>

      <Callout.Root>
        <Callout.Icon>
          <Info size={18} />
        </Callout.Icon>
        <Callout.Text>
          <Text as="span" size="2">
            {EXPLANATION_TEXT}
          </Text>
        </Callout.Text>
      </Callout.Root>
    </Box>
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
