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
import { Table, Text, Button, Badge, Flex, Select, Box, Code } from "@radix-ui/themes";
import { Trash2, Link as LinkIcon, ChevronDown, ChevronUp } from "lucide-react";

/**
 * Affiche et gère une sous-famille avec liaison template
 *
 * @component
 */
export default function SubfamilyRow({ subfamily, templates = [], onDelete, onUpdateTemplate }) {
  const [editMode, setEditMode] = useState(false);
  const [showSchema, setShowSchema] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    subfamily.part_template_id ? String(subfamily.part_template_id) : null
  );

  const handleSaveTemplate = async () => {
    // Mise à jour de la liaison template
    await onUpdateTemplate?.(subfamily, selectedTemplateId);
    setEditMode(false);
  };

  const currentTemplate = subfamily.part_template || templates.find(t => t.id === subfamily.part_template_id);
  const hasFields = currentTemplate?.fields && currentTemplate.fields.length > 0;

  return (
    <>
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
                {currentTemplate.pattern && (
                  <Code size="1" color="gray">{currentTemplate.pattern}</Code>
                )}
                {hasFields && (
                  <Button 
                    size="1" 
                    variant="ghost" 
                    onClick={() => setShowSchema(!showSchema)}
                    title="Voir le schéma"
                  >
                    {showSchema ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {showSchema ? 'Masquer' : 'Schéma'} ({currentTemplate.fields.length})
                  </Button>
                )}
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
    
    {/* Schema details row */}
    {showSchema && hasFields && (
      <Table.Row>
        <Table.Cell colSpan={4}>
          <Box p="3" style={{ background: 'var(--gray-2)', borderRadius: 'var(--radius-2)' }}>
            <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>
              Schéma du template : {currentTemplate.label}
            </Text>
            <Flex direction="column" gap="2">
              {currentTemplate.fields.map((field, idx) => (
                <Flex key={idx} gap="3" align="center" style={{ padding: '8px', background: 'var(--gray-1)', borderRadius: 'var(--radius-1)' }}>
                  <Code size="2" weight="bold">{field.key}</Code>
                  <Text size="2">{field.label}</Text>
                  <Badge size="1" color={field.required ? 'red' : 'gray'}>
                    {field.field_type}
                    {field.unit && ` (${field.unit})`}
                  </Badge>
                  {field.required && <Badge size="1" color="red">requis</Badge>}
                  {field.enum_values && (
                    <Text size="1" color="gray">
                      Valeurs: {field.enum_values.map(ev => ev.label).join(', ')}
                    </Text>
                  )}
                </Flex>
              ))}
            </Flex>
          </Box>
        </Table.Cell>
      </Table.Row>
    )}
    </>
  );
}

SubfamilyRow.propTypes = {
  subfamily: PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string,
    label: PropTypes.string,
    part_template_id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    part_template: PropTypes.object,
  }).isRequired,
  templates: PropTypes.array,
  onDelete: PropTypes.func.isRequired,
  onUpdateTemplate: PropTypes.func,
};
