/**
 * @fileoverview Contenu du tableau des fabricants
 *
 * Affiche la liste des fabricants dans un tableau
 *
 * @module components/purchase/manufacturers/ManufacturerTableContent
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 */

import PropTypes from "prop-types";
import { Table, Flex, Text } from "@radix-ui/themes";

/**
 * Ligne du tableau pour un fabricant
 *
 * @component
 * @param {Object} props
 * @param {Object} props.manufacturer - Données du fabricant
 * @returns {JSX.Element}
 */
function ManufacturerRow({ manufacturer }) {
  return (
    <Table.Row key={manufacturer.id}>
      <Table.Cell>
        <Text weight="bold">{manufacturer.manufacturerName}</Text>
      </Table.Cell>
      <Table.Cell>
        <Text size="2">{manufacturer.manufacturerRef}</Text>
      </Table.Cell>
      <Table.Cell>
        <Text size="2" color="gray">{manufacturer.designation || "-"}</Text>
      </Table.Cell>
    </Table.Row>
  );
}

ManufacturerRow.propTypes = {
  manufacturer: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    manufacturerName: PropTypes.string,
    manufacturerRef: PropTypes.string,
    designation: PropTypes.string,
  }).isRequired,
};

/**
 * Tableau des fabricants
 *
 * @component
 * @param {Object} props
 * @param {Array<Object>} props.items - Liste des fabricants
 * @returns {JSX.Element}
 *
 * @example
 * <ManufacturerTableContent items={manufacturers} />
 */
export default function ManufacturerTableContent({ items = [] }) {
  return (
    <Table.Root variant="surface" size="2">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Fabricant</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Référence</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Désignation</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {items.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={3}>
              <Flex align="center" justify="center" p="4">
                <Text color="gray">Aucune référence fabricant</Text>
              </Flex>
            </Table.Cell>
          </Table.Row>
        ) : (
          items.map((m) => (
            <ManufacturerRow key={m.id} manufacturer={m} />
          ))
        )}
      </Table.Body>
    </Table.Root>
  );
}

// ===== PROP TYPES =====
ManufacturerTableContent.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      manufacturerName: PropTypes.string,
      manufacturerRef: PropTypes.string,
      designation: PropTypes.string,
    })
  ),
};
