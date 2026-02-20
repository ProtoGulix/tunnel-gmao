/**
 * @fileoverview Formulaire des informations générales d'un template
 * @module components/stock/TemplateGeneralInfoForm
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 */

import PropTypes from "prop-types";
import {
  Card,
  Flex,
  Box,
  TextField,
  Text,
} from "@radix-ui/themes";

/**
 * Formulaire des informations générales d'un template
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {Object} props.formData - Données du formulaire
 * @param {Function} props.onFormDataChange - Callback de modification
 * @param {boolean} [props.codeDisabled=false] - Code désactivé (mode édition)
 * @param {string} [props.patternPreview=''] - Aperçu du pattern généré
 * @returns {JSX.Element} Card contenant le formulaire
 * 
 * @example
 * <TemplateGeneralInfoForm
 *   formData={formData}
 *   onFormDataChange={setFormData}
 *   codeDisabled={mode === 'edit'}
 *   patternPreview={patternPreview}
 * />
 */
export default function TemplateGeneralInfoForm({
  formData,
  onFormDataChange,
  codeDisabled = false,
  patternPreview = '',
}) {
  const updateFormData = (updates) => {
    onFormDataChange(prev => ({ ...prev, ...updates }));
  };

  return (
    <Card>
      <Text size="3" weight="bold" mb="3">Informations générales</Text>
      
      <Flex direction="column" gap="3">
        <Box>
          <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
            Code *
          </Text>
          <TextField.Root
            placeholder="Ex: BOLT, WASHER"
            value={formData.code}
            onChange={(e) => updateFormData({ code: e.target.value })}
            disabled={codeDisabled}
          />
        </Box>

        <Box>
          <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
            Label *
          </Text>
          <TextField.Root
            placeholder="Ex: Boulons, Rondelles"
            value={formData.label || ''}
            onChange={(e) => updateFormData({ label: e.target.value })}
          />
        </Box>

        <Box>
          <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
            Pattern * (ex: M{"{DIAM}"}x{"{LONG}"}-{"{MAT}"})
          </Text>
          <TextField.Root
            placeholder="Ex: M{DIAM}x{LONG}-{MAT}"
            value={formData.pattern}
            onChange={(e) => updateFormData({ pattern: e.target.value })}
          />
          {patternPreview && (
            <Text size="1" color="gray" mt="1">
              Preview: <Text weight="bold">{patternPreview}</Text>
            </Text>
          )}
        </Box>
      </Flex>
    </Card>
  );
}

TemplateGeneralInfoForm.propTypes = {
  formData: PropTypes.shape({
    code: PropTypes.string.isRequired,
    label: PropTypes.string,
    pattern: PropTypes.string.isRequired,
    fields: PropTypes.array,
  }).isRequired,
  onFormDataChange: PropTypes.func.isRequired,
  codeDisabled: PropTypes.bool,
  patternPreview: PropTypes.string,
};
