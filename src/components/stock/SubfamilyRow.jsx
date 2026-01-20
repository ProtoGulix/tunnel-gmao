/**
 * @fileoverview Composant d'affichage d'une sous-famille
 *
 * @module components/stock/SubfamilyRow
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import PropTypes from 'prop-types';
import { Table, Text, Button, Badge } from "@radix-ui/themes";
import { Trash2 } from "lucide-react";

/**
 * Affiche et gère une sous-famille
 *
 * @component
 */
export default function SubfamilyRow({ subfamily, onDelete }) {
  return (
    <Table.Row>
      <Table.Cell>
        <Badge color="gray" variant="solid" size="1">{subfamily.code}</Badge>
      </Table.Cell>
      <Table.Cell>
        <Text size="2">{subfamily.label}</Text>
      </Table.Cell>
      <Table.Cell align="right">
        <Button
          size="1"
          variant="soft"
          color="red"
          onClick={() => onDelete(subfamily.id)}
        >
          <Trash2 size={14} />
        </Button>
      </Table.Cell>
    </Table.Row>
  );
}

SubfamilyRow.propTypes = {
  subfamily: PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string,
    label: PropTypes.string,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};
