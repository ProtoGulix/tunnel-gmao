/**
 * @fileoverview Formulaire d'ajout de référence fabricant
 *
 * Composant d'ajout avec validation et soumission
 *
 * @module components/purchase/manufacturers/ManufacturerForm
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import PropTypes from "prop-types";
import { Card, Flex, Text, Box, TextField, Button } from "@radix-ui/themes";
import { Plus } from "lucide-react";

// ===== CONSTANTES =====
const FORM_DATA_KEYS = {
  MANUFACTURER_NAME: 'manufacturerName',
  MANUFACTURER_REF: 'manufacturerRef',
  DESIGNATION: 'designation',
};

const INITIAL_FORM_STATE = {
  [FORM_DATA_KEYS.MANUFACTURER_NAME]: "",
  [FORM_DATA_KEYS.MANUFACTURER_REF]: "",
  [FORM_DATA_KEYS.DESIGNATION]: ""
};

// ===== COMPOSANT =====
/**
 * Formulaire d'ajout de fabricant
 *
 * @component
 * @param {Object} props
 * @param {Object} props.formData - Données du formulaire
 * @param {Function} props.setFormData - Setter pour les données
 * @param {Function} props.onAdd - Callback de création
 * @param {boolean} [props.loading=false] - État de chargement
 * @returns {JSX.Element}
 *
 * @example
 * <ManufacturerForm 
 *   formData={formData}
 *   setFormData={setFormData}
 *   onAdd={handleAdd}
 *   loading={false}
 * />
 */
export default function ManufacturerForm({
  formData,
  setFormData,
  onAdd,
  loading = false
}) {
  return (
    <Card>
      <Flex direction="column" gap="3">
        <Text weight="bold" size="2">
          Ajouter une référence fabricant
        </Text>
        <Flex gap="2" wrap="wrap" align="end">
          <Box style={{ flex: "1", minWidth: "200px" }}>
            <Text size="2" as="label" weight="bold">
              Fabricant *
            </Text>
            <TextField.Root
              value={formData[FORM_DATA_KEYS.MANUFACTURER_NAME]}
              onChange={(e) => setFormData({ 
                ...formData, 
                [FORM_DATA_KEYS.MANUFACTURER_NAME]: e.target.value 
              })}
              placeholder="Ex: Schneider Electric"
            />
          </Box>

          <Box style={{ flex: "1", minWidth: "180px" }}>
            <Text size="2" as="label" weight="bold">
              Référence *
            </Text>
            <TextField.Root
              value={formData[FORM_DATA_KEYS.MANUFACTURER_REF]}
              onChange={(e) => setFormData({ 
                ...formData, 
                [FORM_DATA_KEYS.MANUFACTURER_REF]: e.target.value 
              })}
              placeholder="Ex: RXM2AB2BD"
            />
          </Box>

          <Box style={{ flex: "1.5", minWidth: "250px" }}>
            <Text size="2" as="label" weight="bold">
              Désignation (optionnel)
            </Text>
            <TextField.Root
              value={formData[FORM_DATA_KEYS.DESIGNATION]}
              onChange={(e) => setFormData({ 
                ...formData, 
                [FORM_DATA_KEYS.DESIGNATION]: e.target.value 
              })}
              placeholder="Description du produit"
            />
          </Box>

          <Button
            size="2"
            color="blue"
            onClick={onAdd}
            disabled={loading}
          >
            <Plus size={16} />
            Ajouter
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}

// ===== PROP TYPES =====
ManufacturerForm.propTypes = {
  formData: PropTypes.shape({
    manufacturerName: PropTypes.string,
    manufacturerRef: PropTypes.string,
    designation: PropTypes.string,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

// ===== EXPORTS =====
export { FORM_DATA_KEYS, INITIAL_FORM_STATE };
