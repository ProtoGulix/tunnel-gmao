/**
 * @fileoverview Formulaire d'ajout de champ de template
 * @module components/stock/AddTemplateFieldForm
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import PropTypes from "prop-types";
import {
  Card,
  Flex,
  Box,
  Button,
  TextField,
  Text,
  Select,
} from "@radix-ui/themes";
import { Plus } from "lucide-react";
import EnumValuesForm from "./EnumValuesForm";

/**
 * Formulaire d'ajout d'un champ à un template
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {Object} props.currentField - État actuel du champ en cours de création
 * @param {Function} props.onFieldChange - Callback de modification du champ (updates)
 * @param {Array<Object>} props.enumValues - Valeurs enum actuelles
 * @param {Function} props.onEnumValuesChange - Callback de modification des enums
 * @param {Function} props.onAddField - Callback d'ajout du champ
 * @returns {JSX.Element} Card contenant le formulaire
 * 
 * @example
 * <AddTemplateFieldForm
 *   currentField={currentField}
 *   onFieldChange={setCurrentField}
 *   enumValues={enumValues}
 *   onEnumValuesChange={setEnumValues}
 *   onAddField={handleAddField}
 * />
 */
export default function AddTemplateFieldForm({
  currentField,
  onFieldChange,
  enumValues,
  onEnumValuesChange,
  onAddField,
}) {
  /** Types de champs disponibles */
  const FIELD_TYPES = ['text', 'number', 'enum'];

  const updateField = (updates) => {
    onFieldChange(prev => ({ ...prev, ...updates }));
  };

  return (
    <Card>
      <Text size="3" weight="bold" mb="3">Ajouter un champ</Text>
      
      <Flex direction="column" gap="3">
        <Flex gap="2">
          <Box style={{ flex: 1 }}>
            <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
              Clé (unique) *
            </Text>
            <TextField.Root
              placeholder="Ex: DIAM, LONG, MAT"
              value={currentField.field_key}
              onChange={(e) => updateField({ field_key: e.target.value.toUpperCase() })}
            />
          </Box>

          <Box style={{ flex: 1 }}>
            <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
              Label *
            </Text>
            <TextField.Root
              placeholder="Ex: Diamètre"
              value={currentField.label}
              onChange={(e) => updateField({ label: e.target.value })}
            />
          </Box>
        </Flex>

        <Flex gap="2">
          <Box style={{ flex: 1 }}>
            <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
              Type
            </Text>
            <Select.Root
              value={currentField.type}
              onValueChange={(value) => updateField({ type: value })}
            >
              <Select.Trigger />
              <Select.Content>
                {FIELD_TYPES.map(type => (
                  <Select.Item key={type} value={type}>{type}</Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          <Box style={{ flex: 1 }}>
            <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
              Unité (optionnel)
            </Text>
            <TextField.Root
              placeholder="Ex: mm"
              value={currentField.unit}
              onChange={(e) => updateField({ unit: e.target.value })}
            />
          </Box>
        </Flex>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="checkbox"
            checked={currentField.required}
            onChange={(e) => updateField({ required: e.target.checked })}
          />
          <Text size="2">Champ requis</Text>
        </label>

        {currentField.type === 'enum' && (
          <EnumValuesForm
            enumValues={enumValues}
            onEnumValuesChange={onEnumValuesChange}
          />
        )}

        <Button onClick={onAddField} variant="soft">
          <Plus size={16} />
          Ajouter ce champ
        </Button>
      </Flex>
    </Card>
  );
}

AddTemplateFieldForm.propTypes = {
  currentField: PropTypes.shape({
    field_key: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['text', 'number', 'enum']).isRequired,
    unit: PropTypes.string,
    required: PropTypes.bool,
    order: PropTypes.number,
  }).isRequired,
  onFieldChange: PropTypes.func.isRequired,
  enumValues: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  onEnumValuesChange: PropTypes.func.isRequired,
  onAddField: PropTypes.func.isRequired,
};
