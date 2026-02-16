/**
 * @fileoverview Composant d'affichage d'une sous-famille
 *
 * @module components/stock/SubfamilyRow
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Table, Text, Button, Badge, Flex, Box, Select } from "@radix-ui/themes";
import { Trash2, Link as LinkIcon } from "lucide-react";

/**
 * Affiche et gère une sous-famille avec liaison template
 *
 * @component
 */
export default function SubfamilyRow({ subfamily, templates = [], onDelete, onUpdateTemplate }) {
  const [editMode, setEditMode] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    subfamily.part_template_id ? String(subfamily.part_template_id) : null
  );

  const handleSaveTemplate = async () => {
    // Mise à jour de la liaison template
    await onUpdateTemplate?.(subfamily, selectedTemplateId);
    setEditMode(false);
  };

  const currentTemplate = subfamily.part_template || templates.find(t => t.id === subfamily.part_template_id);

  return (
    <Table.Row>
      <Table.Cell>
        <Badge color="gray" variant="solid" size="1">{subfamily.code}</Badge>
      </Table.Cell>
      <Table.Cell>
        <Text size="2">{subfamily.label}</Text>
      </Table.Cell>
      <Table.Cell>
        {editMode ? (
          <Flex gap="2" align="center">
            <Select.Root
              value={selectedTemplateId || 'none'}
              onValueChange={(value) => setSelectedTemplateId(value === 'none' ? null : value)}
              size="1"
            >
              <Select.Trigger placeholder="Sélectionner template" />
              <Select.Content>
                <Select.Item value="none">Aucun (legacy)</Select.Item>
                {templates.map(template => (
                  <Select.Item key={template.id} value={String(template.id)}>
                    {template.label} (v{template.version})
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
            <Button size="1" onClick={handleSaveTemplate}>
              OK
            </Button>
            <Button size="1" variant="soft" color="gray" onClick={() => setEditMode(false)}>
              ✕
            </Button>
          </Flex>
        ) : (
          <Flex gap="2" align="center">
            {currentTemplate ? (
              <Flex align="center" gap="1">
                <LinkIcon size={12} />
                <Text size="1" weight="bold">{currentTemplate.label}</Text>
                <Badge size="1" color="blue" variant="soft">v{currentTemplate.version}</Badge>
              </Flex>
            ) : (
              <Text size="1" color="gray">Aucun template (legacy)</Text>
            )}
            {onUpdateTemplate && (
              <Button size="1" variant="ghost" onClick={() => setEditMode(true)}>
                Modifier
              </Button>
            )}
          </Flex>
        )}
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
    part_template_id: PropTypes.number,
    part_template: PropTypes.object,
  }).isRequired,
  templates: PropTypes.array,
  onDelete: PropTypes.func.isRequired,
  onUpdateTemplate: PropTypes.func,
};
