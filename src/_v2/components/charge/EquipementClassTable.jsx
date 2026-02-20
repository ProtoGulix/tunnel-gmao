/**
 * @fileoverview Tableau par classe d'équipement avec détail enrichi
 * @module components/charge/EquipementClassTable
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, Text, Card, Heading, Table, Badge, Callout } from '@radix-ui/themes';
import { TrendingUp, AlertTriangle, CheckCircle2, Info, ChevronDown, ChevronRight, Lightbulb } from 'lucide-react';
import { formatHours, formatPercent } from './constants';

/**
 * Détail de la ventilation évitable - version simplifiée
 */
function EvitableBreakdownDetail({ breakdown }) {
  if (!breakdown) return null;
  const { hoursWithFactor, hoursSystemic, hoursBoth } = breakdown;

  return (
    <Flex gap="4" wrap="wrap" mt="2">
      <Text size="1">
        <Badge color="blue" variant="soft" mr="1">Facteur</Badge>
        {formatHours(hoursWithFactor)}
      </Text>
      <Text size="1">
        <Badge color="orange" variant="soft" mr="1">Récurrent</Badge>
        {formatHours(hoursSystemic)}
      </Text>
      {hoursBoth > 0 && (
        <Text size="1">
          <Badge color="purple" variant="soft" mr="1">Les deux</Badge>
          {formatHours(hoursBoth)}
        </Text>
      )}
    </Flex>
  );
}

EvitableBreakdownDetail.propTypes = {
  breakdown: PropTypes.shape({
    hoursWithFactor: PropTypes.number,
    hoursSystemic: PropTypes.number,
    hoursBoth: PropTypes.number,
    totalEvitable: PropTypes.number,
  }),
};

/**
 * Top causes d'une classe d'équipement - version simplifiée
 */
function TopCausesList({ causes, categorieColors }) {
  if (!causes || causes.length === 0) return null;

  const findColor = (category) => {
    if (!category || !categorieColors) return 'gray';
    const found = categorieColors.find((c) => c.category.toLowerCase() === category.toLowerCase());
    // Mapper les couleurs hex vers les couleurs Radix
    if (!found?.color) return 'gray';
    const colorMap = {
      '#ef4444': 'red', '#f97316': 'orange', '#eab308': 'yellow',
      '#22c55e': 'green', '#3b82f6': 'blue', '#6366f1': 'indigo',
    };
    return colorMap[found.color] || 'gray';
  };

  return (
    <Flex gap="2" wrap="wrap" mt="2">
      <Text size="1" color="gray" mr="1">Causes :</Text>
      {causes.slice(0, 3).map((cause, i) => (
        <Badge key={i} color={findColor(cause.category)} variant="soft">
          {cause.code} ({formatPercent(cause.percent)})
        </Badge>
      ))}
    </Flex>
  );
}

TopCausesList.propTypes = {
  causes: PropTypes.arrayOf(PropTypes.shape({
    code: PropTypes.string,
    label: PropTypes.string,
    category: PropTypes.string,
    hours: PropTypes.number,
    percent: PropTypes.number,
  })),
  categorieColors: PropTypes.array,
};

/**
 * Recommandation d'action - utilise Callout Radix
 */
function RecommendedAction({ action }) {
  if (!action) return null;

  return (
    <Callout.Root color="amber" size="1" mt="3">
      <Callout.Icon><Lightbulb size={16} /></Callout.Icon>
      <Callout.Text>{action}</Callout.Text>
    </Callout.Root>
  );
}

RecommendedAction.propTypes = {
  action: PropTypes.string,
};

/**
 * Rendu d'une ligne du tableau avec détail expandable
 */
function EquipementClassRow({ ec, isExpanded, onToggle, categorieColors }) {
  const statusColor = ec.status?.color || 'gray';
  const hasDetail = ec.explanation || ec.recommendedAction || (ec.topCauses && ec.topCauses.length > 0);

  return (
    <>
      <Table.Row
        style={{ cursor: hasDetail ? 'pointer' : 'default' }}
        onClick={() => hasDetail && onToggle()}
      >
        <Table.Cell>
          <Flex align="center" gap="2">
            {hasDetail && (
              isExpanded
                ? <ChevronDown size={14} color="var(--gray-9)" />
                : <ChevronRight size={14} color="var(--gray-9)" />
            )}
            <Flex direction="column">
              <Text weight="bold">{ec.equipementClassLabel || ec.equipementClassCode}</Text>
              {ec.equipementClassCode && ec.equipementClassLabel && (
                <Text size="1" color="gray">{ec.equipementClassCode}</Text>
              )}
            </Flex>
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
      {isExpanded && hasDetail && (
        <Table.Row>
          <Table.Cell colSpan={6} style={{ background: 'var(--gray-2)', padding: '12px 16px' }}>
            {/* Explication */}
            {ec.explanation && (
              <Text size="2" color="gray" style={{ fontStyle: 'italic' }}>
                {ec.explanation}
              </Text>
            )}

            {/* Ventilation évitable */}
            {ec.evitableBreakdown && (
              <EvitableBreakdownDetail breakdown={ec.evitableBreakdown} />
            )}

            {/* Top causes */}
            {ec.topCauses && ec.topCauses.length > 0 && (
              <TopCausesList causes={ec.topCauses} categorieColors={categorieColors} />
            )}

            {/* Recommandation */}
            {ec.recommendedAction && (
              <RecommendedAction action={ec.recommendedAction} />
            )}
          </Table.Cell>
        </Table.Row>
      )}
    </>
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
    evitableBreakdown: PropTypes.object,
    explanation: PropTypes.string,
    topCauses: PropTypes.array,
    recommendedAction: PropTypes.string,
  }).isRequired,
  isExpanded: PropTypes.bool,
  onToggle: PropTypes.func,
  categorieColors: PropTypes.array,
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
export function EquipementClassTable({ data, categorieColors }) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

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
        <Text size="1" color="gray" mb="2" style={{ padding: '8px 12px 0' }}>
          Cliquez sur une ligne pour voir le détail et les recommandations
        </Text>
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
            {sortedData.map((ec) => {
              const rowId = ec.equipementClassId || ec.equipementClassCode;
              return (
                <EquipementClassRow
                  key={rowId}
                  ec={ec}
                  isExpanded={expandedRows.has(rowId)}
                  onToggle={() => toggleRow(rowId)}
                  categorieColors={categorieColors}
                />
              );
            })}
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
    evitableBreakdown: PropTypes.shape({
      hoursWithFactor: PropTypes.number,
      hoursSystemic: PropTypes.number,
      hoursBoth: PropTypes.number,
      totalEvitable: PropTypes.number,
    }),
    explanation: PropTypes.string,
    topCauses: PropTypes.arrayOf(PropTypes.shape({
      code: PropTypes.string,
      label: PropTypes.string,
      category: PropTypes.string,
      hours: PropTypes.number,
      percent: PropTypes.number,
    })),
    recommendedAction: PropTypes.string,
  })),
  categorieColors: PropTypes.arrayOf(PropTypes.shape({
    category: PropTypes.string,
    color: PropTypes.string,
  })),
};
