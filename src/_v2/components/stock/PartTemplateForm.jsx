/**
 * @fileoverview Formulaire de création/édition de templates de pièces
 * @module components/stock/PartTemplateForm
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 * @requires @/lib/utils/templatePatternGenerator
 */

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Card,
  Flex,
  Button,
  Text,
} from "@radix-ui/themes";
import { FileCode, Edit2 } from "lucide-react";
import { generatePattern } from "@/lib/utils/templatePatternGenerator";
import TemplateGeneralInfoForm from "./TemplateGeneralInfoForm";
import TemplateFieldsTable from "./TemplateFieldsTable";
import AddTemplateFieldForm from "./AddTemplateFieldForm";

// ===== CONSTANTS =====

/** Valeurs par défaut du formulaire principal */
const DEFAULT_FORM_DATA = { code: '', label: '', pattern: '', fields: [] };

/** Valeurs par défaut d'un champ de template */
const DEFAULT_FIELD_DATA = { field_key: '', label: '', type: 'text', unit: '', required: false, order: 0 };

// ===== HELPERS =====

/**
 * Génère les valeurs de prévisualisation du pattern
 * @param {Array<Object>} fields - Liste des champs du template
 * @returns {Object} Objet clé-valeur pour la prévisualisation
 */
const generatePreviewValues = (fields) => {
  const previewValues = {};
  fields.forEach(field => {
    previewValues[field.field_key] = field.type === 'number' ? '00' : 'XX';
  });
  return previewValues;
};

/**
 * Réordonne deux éléments dans un tableau
 * @param {Array} array - Tableau source
 * @param {number} fromIndex - Index source
 * @param {number} toIndex - Index destination
 * @returns {Array} Nouveau tableau avec éléments échangés
 */
const swapArrayElements = (array, fromIndex, toIndex) => {
  const newArray = [...array];
  [newArray[fromIndex], newArray[toIndex]] = [newArray[toIndex], newArray[fromIndex]];
  return newArray;
};

// ===== COMPONENT =====

/**
 * Formulaire de création/édition de template de pièce 
 * @component
 */
export default function PartTemplateForm({ 
  onSubmit,
  onCancel,
  initialData = null,
  mode = 'create',
}) {
  // ----- State -----
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [currentField, setCurrentField] = useState(DEFAULT_FIELD_DATA);
  const [enumValues, setEnumValues] = useState([]);

  // ----- Effects -----
  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData({
        code: initialData.code || '',
        label: initialData.label || initialData.code || '',
        pattern: initialData.pattern || '',
        fields: initialData.fields || [],
      });
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
  }, [initialData, mode]);

  // ----- Handlers -----
  const handleAddField = () => {
    if (!currentField.field_key.trim() || !currentField.label.trim()) return;

    const newField = {
      ...currentField,
      order: formData.fields.length,
      enum_values: currentField.type === 'enum' ? enumValues : [],
    };

    setFormData(prev => ({ ...prev, fields: [...prev.fields, newField] }));
    setCurrentField(DEFAULT_FIELD_DATA);
    setEnumValues([]);
  };

  const handleRemoveField = (index) => {
    setFormData(prev => ({ ...prev, fields: prev.fields.filter((_, i) => i !== index) }));
  };

  const handleMoveField = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= formData.fields.length) return;
    
    const reorderedFields = swapArrayElements(formData.fields, index, targetIndex);
    reorderedFields.forEach((field, i) => { field.order = i; });
    
    setFormData(prev => ({ ...prev, fields: reorderedFields }));
  };

  const handleSubmit = async () => {
    const { code, label, pattern } = formData;
    if (!code.trim() || !label.trim() || !pattern.trim()) return;

    await onSubmit(formData);
  };

  // ----- Computed -----
  const previewValues = generatePreviewValues(formData.fields);
  const patternPreview = generatePattern(formData.pattern, previewValues);

  // ----- Render -----
  return (
    <Card style={{ background: "var(--blue-2)", border: "1px solid var(--blue-6)" }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          {mode === 'create' ? <FileCode size={20} color="var(--blue-9)" /> : <Edit2 size={20} color="var(--blue-9)" />}
          <Text size="3" weight="bold">
            {mode === 'create' ? 'Créer un template' : `Nouvelle version : ${formData.code}`}
          </Text>
        </Flex>

        <Text size="2" color="gray">
          {mode === 'create' 
            ? 'Définir la structure d\'un type de pièce avec des champs dynamiques.' 
            : `Créer la version ${(initialData?.version || 0) + 1}. Les pièces existantes conserveront la version ${initialData?.version || 1}.`
          }
        </Text>

        {/* Bloc 1 - Infos générales */}
        <TemplateGeneralInfoForm
          formData={formData}
          onFormDataChange={setFormData}
          codeDisabled={mode === 'edit'}
          patternPreview={patternPreview}
        />

        {/* Bloc 2 - Champs existants */}
        <TemplateFieldsTable
          fields={formData.fields}
          onMoveField={handleMoveField}
          onRemoveField={handleRemoveField}
        />

        {/* Bloc 3 - Ajouter un champ */}
        <AddTemplateFieldForm
          currentField={currentField}
          onFieldChange={setCurrentField}
          enumValues={enumValues}
          onEnumValuesChange={setEnumValues}
          onAddField={handleAddField}
        />

        {/* Actions */}
        <Flex gap="2" justify="end">
          <Button variant="soft" color="gray" size="2" onClick={onCancel}>
            Annuler
          </Button>
          <Button size="2" onClick={handleSubmit}>
            {mode === 'create' ? <FileCode size={16} /> : <Edit2 size={16} />}
            Enregistrer
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}

PartTemplateForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  initialData: PropTypes.object,
  mode: PropTypes.oneOf(['create', 'edit']),
};
