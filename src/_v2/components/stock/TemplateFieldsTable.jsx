/**
 * @fileoverview Tableau d'affichage des champs d'un template
 * @module components/stock/TemplateFieldsTable
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import PropTypes from "prop-types";
import {
  Card,
  Table,
  Text,
  IconButton,
  Flex,
} from "@radix-ui/themes";
import { Trash2, ArrowUp, ArrowDown, Check } from "lucide-react";

/**
 * Tableau des champs définis d'un template
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {Array<Object>} props.fields - Liste des champs à afficher
 * @param {Function} props.onMoveField - Callback de déplacement (index, direction)
 * @param {Function} props.onRemoveField - Callback de suppression (index)
 * @returns {JSX.Element} Card contenant le tableau
 * 
 * @example
 * <TemplateFieldsTable
 *   fields={formData.fields}
 *   onMoveField={handleMoveField}
 *   onRemoveField={handleRemoveField}
 * />
 */
export default function TemplateFieldsTable({ fields, onMoveField, onRemoveField }) {
  if (fields.length === 0) return null;

  return (
    <Card>
      <Text size="3" weight="bold" mb="3">Champs définis</Text>
      
      <Table.Root variant="surface" size="1">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Clé</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Label</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Unité</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Requis</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        
        <Table.Body>
          {fields.map((field, index) => (
            <Table.Row key={index}>
              <Table.Cell><Text weight="bold" size="1">{field.field_key}</Text></Table.Cell>
              <Table.Cell><Text size="1">{field.label}</Text></Table.Cell>
              <Table.Cell><Text size="1">{field.type}</Text></Table.Cell>
              <Table.Cell><Text size="1">{field.unit || '-'}</Text></Table.Cell>
              <Table.Cell>
                {field.required && <Check size={14} color="var(--green-9)" />}
              </Table.Cell>
              <Table.Cell>
                <Flex gap="1">
                  <IconButton 
                    size="1" 
                    variant="ghost" 
                    onClick={() => onMoveField(index, 'up')}
                    disabled={index === 0}
                  >
                    <ArrowUp size={12} />
                  </IconButton>
                  <IconButton 
                    size="1" 
                    variant="ghost" 
                    onClick={() => onMoveField(index, 'down')}
                    disabled={index === fields.length - 1}
                  >
                    <ArrowDown size={12} />
                  </IconButton>
                  <IconButton 
                    size="1" 
                    variant="ghost" 
                    color="red"
                    onClick={() => onRemoveField(index)}
                  >
                    <Trash2 size={12} />
                  </IconButton>
                </Flex>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Card>
  );
}

TemplateFieldsTable.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      field_key: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      type: PropTypes.oneOf(['text', 'number', 'enum']).isRequired,
      unit: PropTypes.string,
      required: PropTypes.bool,
      order: PropTypes.number,
      enum_values: PropTypes.arrayOf(
        PropTypes.shape({
          value: PropTypes.string.isRequired,
          label: PropTypes.string.isRequired,
        })
      ),
    })
  ).isRequired,
  onMoveField: PropTypes.func.isRequired,
  onRemoveField: PropTypes.func.isRequired,
};
