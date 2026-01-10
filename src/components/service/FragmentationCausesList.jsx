/**
 * @fileoverview Composant affichant le Top 10 des causes de fragmentation du service
 *
 * @module components/service/FragmentationCausesList
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 * @requires components/common/DataTable
 */

import PropTypes from 'prop-types';
import { Box, Text, Badge, Callout } from '@radix-ui/themes';
import { Info } from 'lucide-react';
import DataTable from '@/components/common/DataTable';

/**
 * Constantes de configuration
 */
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
        {row.totalHours.toFixed(1)}h
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
        {row.percent}%
      </Badge>
    ),
  },
];

const EXPLANATION_TEXT = 'Les causes ci-dessus représentent les principales sources de fragmentation du temps du service. Elles correspondent à du support diffus, des interruptions ou des micro-actions répétées. Réduire la fragmentation passe par une action sur ces causes, pas par l&apos;ajout de ressources.';

/**
 * Prépare les données pour l'affichage en tableau
 *
 * @param {Array<Object>} items - Causes de fragmentation
 * @returns {Array<Object>} Données avec rang et ligne spéciale pour actions courtes
 * @private
 */
const prepareTableData = (items) => {
  const rankedItems = items.map((cause, index) => ({
    ...cause,
    rank: index + 1,
  }));

  // Ajouter la ligne "Actions courtes"
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

/**
 * Affiche le Top 10 des causes de fragmentation
 *
 * @component
 * @param {Object} props
 * @param {Object} [props.fragmentation] - Données de fragmentation
 * @param {number} [props.fragmentation.total] - Total heures FRAG
 * @param {Array<Object>} [props.fragmentation.items] - Top 10 causes
 * @param {number} props.fragmentation.items[].subcategoryId - ID de la sous-catégorie
 * @param {string} props.fragmentation.items[].subcategoryCode - Code de la sous-catégorie
 * @param {string} props.fragmentation.items[].subcategoryName - Nom de la sous-catégorie
 * @param {number} props.fragmentation.items[].totalHours - Temps cumulé en heures
 * @param {number} props.fragmentation.items[].actionCount - Nombre d'actions
 * @param {number} props.fragmentation.items[].percent - Pourcentage du total FRAG
 * @returns {JSX.Element} Tableau des causes ou message neutre
 *
 * @example
 * <FragmentationCausesList
 *   fragmentation={{
 *     total: 30,
 *     items: [
 *       { subcategoryId: 5, subcategoryName: "Support", totalHours: 15.5, actionCount: 23, percent: 42 }
 *     ]
 *   }}
 * />
 */
export default function FragmentationCausesList({ fragmentation }) {
  if (!fragmentation || !fragmentation.items || fragmentation.items.length === 0) {
    return (
      <Box mb="6">
        <Box p="4">
          <Text color="gray" align="center">
            Aucune fragmentation détectée sur la période
          </Text>
        </Box>
      </Box>
    );
  }

  const tableData = prepareTableData(fragmentation.items);

  return (
    <Box mb="6">
      <Box mb="4">
        <Text as="div" size="3" weight="bold" mb="3">
          Causes de la fragmentation
        </Text>

        <DataTable
          columns={COLUMNS}
          data={tableData}
          getRowKey={(row) => row.subcategoryId}
          rowHover
          variant="surface"
        />
      </Box>

      <Callout.Root>
        <Callout.Icon>
          <Info size={18} />
        </Callout.Icon>
        <Callout.Text>
          <Box as="p" size="2">
            {EXPLANATION_TEXT}
          </Box>
        </Callout.Text>
      </Callout.Root>
    </Box>
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
