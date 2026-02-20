/**
 * @fileoverview Formulaire de gestion des valeurs enum d'un champ
 * @module components/stock/EnumValuesForm
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import { useState } from "react";
import PropTypes from "prop-types";
import {
  Card,
  Flex,
  Button,
  TextField,
  Text,
  IconButton,
} from "@radix-ui/themes";
import { Plus, Trash2 } from "lucide-react";

/**
 * Formulaire de gestion des valeurs enum
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {Array<Object>} props.enumValues - Liste des valeurs enum
 * @param {Function} props.onEnumValuesChange - Callback de modification
 * @returns {JSX.Element} Card avec liste et formulaire d'ajout
 * 
 * @example
 * <EnumValuesForm
 *   enumValues={enumValues}
 *   onEnumValuesChange={setEnumValues}
 * />
 */
export default function EnumValuesForm({ enumValues, onEnumValuesChange }) {
  const [enumValue, setEnumValue] = useState('');
  const [enumLabel, setEnumLabel] = useState('');

  const handleAddEnumValue = () => {
    if (!enumValue.trim() || !enumLabel.trim()) return;
    
    onEnumValuesChange(prev => [
      ...prev,
      { value: enumValue.trim(), label: enumLabel.trim() }
    ]);
    setEnumValue('');
    setEnumLabel('');
  };

  const handleRemoveEnumValue = (index) => {
    onEnumValuesChange(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Card variant="surface">
      <Text size="2" weight="bold" mb="2">Valeurs enum</Text>
      
      {enumValues.length > 0 && (
        <Flex direction="column" gap="1" mb="2">
          {enumValues.map((ev, i) => (
            <Flex key={i} align="center" gap="2">
              <Text size="1" weight="bold">{ev.value}</Text>
              <Text size="1" color="gray">→</Text>
              <Text size="1">{ev.label}</Text>
              <IconButton 
                size="1" 
                variant="ghost" 
                color="red"
                onClick={() => handleRemoveEnumValue(i)}
              >
                <Trash2 size={10} />
              </IconButton>
            </Flex>
          ))}
        </Flex>
      )}
      
      <Flex gap="2">
        <TextField.Root
          placeholder="Value (ex: A2)"
          value={enumValue}
          onChange={(e) => setEnumValue(e.target.value)}
          style={{ flex: 1 }}
        />
        <TextField.Root
          placeholder="Label (ex: Acier inox A2)"
          value={enumLabel}
          onChange={(e) => setEnumLabel(e.target.value)}
          style={{ flex: 2 }}
        />
        <Button size="1" onClick={handleAddEnumValue}>
          <Plus size={12} />
        </Button>
      </Flex>
    </Card>
  );
}

EnumValuesForm.propTypes = {
  enumValues: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  onEnumValuesChange: PropTypes.func.isRequired,
};
