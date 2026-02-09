/**
 * @fileoverview Tableau par classe d'équipement
 * @module components/charge/EquipementClassTable
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text, Card, Heading, Table, Badge } from '@radix-ui/themes';
import { TrendingUp, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { formatHours, formatPercent } from './constants';

/**
 * Rendu d'une ligne du tableau
 */
function EquipementClassRow({ ec }) {
  const statusColor = ec.status?.color || 'gray';
  
  return (
    <Table.Row>
      <Table.Cell>
        <Flex direction="column">
          <Text weight="bold">{ec.equipementClassLabel || ec.equipementClassCode}</Text>
          {ec.equipementClassCode && ec.equipementClassLabel && (
            <Text size="1" color="gray">{ec.equipementClassCode}</Text>
          )}
        </Flex>
      </Table.Cell>
      <Table.Cell style={{ textAlign: 'right' }}>
        <Text weight="bold">{formatHours(ec.chargeTotale)}</Text>
      </Table.Cell>
      <Table.Cell style={{ textAlign: 'right' }}>
        <Text color="orange">{formatHours(ec.chargeDepannage)}</Text>
      </Table.Cell>
      <Table.Cell style={{ textAlign: 'right' }}>
        <Text color="red">{formatHours(ec.chargeDepannageEvitable)}</Text>
      </Table.Cell>
      <Table.Cell style={{ textAlign: 'right' }}>
        <Badge color={statusColor} size="2">
          {formatPercent(ec.tauxDepannageEvitable)}
        </Badge>
      </Table.Cell>
      <Table.Cell>
        <StatusIndicator statusColor={statusColor} text={ec.status?.text} />
      </Table.Cell>
    </Table.Row>
  );
}

EquipementClassRow.propTypes = {
  ec: PropTypes.shape({
    equipementClassId: PropTypes.string,
    equipementClassCode: PropTypes.string,
    equipementClassLabel: PropTypes.string,
    chargeTotale: PropTypes.number,
    chargeDepannage: PropTypes.number,
    chargeDepannageEvitable: PropTypes.number,
    tauxDepannageEvitable: PropTypes.number,
    status: PropTypes.shape({
      color: PropTypes.string,
      text: PropTypes.string,
    }),
  }).isRequired,
};

/**
 * Indicateur de statut avec icône
 */
function StatusIndicator({ statusColor, text }) {
  const iconProps = { size: 16 };
  
  return (
    <Flex align="center" gap="1">
      {statusColor === 'green' && <CheckCircle2 {...iconProps} color="var(--green-9)" />}
      {statusColor === 'orange' && <AlertTriangle {...iconProps} color="var(--orange-9)" />}
      {statusColor === 'red' && <AlertTriangle {...iconProps} color="var(--red-9)" />}
      <Text size="2" color={statusColor}>{text || '—'}</Text>
    </Flex>
  );
}

StatusIndicator.propTypes = {
  statusColor: PropTypes.string.isRequired,
  text: PropTypes.string,
};

/**
 * Tableau par classe d'équipement
 */
export function EquipementClassTable({ data }) {
  if (!data || data.length === 0) {
    return (
      <Box mb="5">
        <Heading size="4" mb="3">
          <Flex align="center" gap="2">
            <TrendingUp size={20} />
            Analyse par classe d&apos;équipement
          </Flex>
        </Heading>
        <Card>
          <Flex direction="column" align="center" p="5">
            <Info size={32} color="var(--gray-8)" />
            <Text color="gray" mt="2">Aucune donnée par classe d&apos;équipement</Text>
          </Flex>
        </Card>
      </Box>
    );
  }

  // Trier par charge totale décroissante
  const sortedData = [...data].sort((a, b) => b.chargeTotale - a.chargeTotale);

  return (
    <Box mb="5">
      <Heading size="4" mb="3">
        <Flex align="center" gap="2">
          <TrendingUp size={20} />
          Analyse par classe d&apos;équipement
        </Flex>
      </Heading>
      
      <Card>
        <Table.Root>
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Classe</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: 'right' }}>Total</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: 'right' }}>Dépannage</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: 'right' }}>Évitable</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell style={{ textAlign: 'right' }}>Taux évitable</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {sortedData.map((ec) => (
              <EquipementClassRow key={ec.equipementClassId || ec.equipementClassCode} ec={ec} />
            ))}
          </Table.Body>
        </Table.Root>
      </Card>
    </Box>
  );
}

EquipementClassTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    equipementClassId: PropTypes.string,
    equipementClassCode: PropTypes.string,
    equipementClassLabel: PropTypes.string,
    chargeTotale: PropTypes.number,
    chargeDepannage: PropTypes.number,
    chargeConstructive: PropTypes.number,
    chargeDepannageEvitable: PropTypes.number,
    tauxDepannageEvitable: PropTypes.number,
    status: PropTypes.shape({
      color: PropTypes.string,
      text: PropTypes.string,
    }),
  })),
};
