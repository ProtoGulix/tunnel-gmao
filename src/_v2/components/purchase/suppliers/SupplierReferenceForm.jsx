import { useRef } from "react";
import PropTypes from 'prop-types';
import { useError } from '@/contexts/ErrorContext';
import {
  Box,
  Flex,
  Text,
  Select,
  TextField,
  Button,
  Checkbox,
  Card,
} from "@radix-ui/themes";

// ===== CONSTANTS =====
const VALIDATION_ERRORS = {
  SUPPLIER_REQUIRED: 'Veuillez sélectionner un fournisseur',
  REFERENCE_REQUIRED: 'Veuillez entrer la référence fournisseur',
};

const FIELD_SIZES = {
  SUPPLIER: { flex: "1", minWidth: "200px" },
  REFERENCE: { flex: "1", minWidth: "150px" },
  PRICE: { flex: "0.7", minWidth: "100px" },
  DELAY: { flex: "0.6", minWidth: "80px" },
};

/**
 * @fileoverview Formulaire pour ajouter une nouvelle référence fournisseur
 * @module components/purchase/suppliers/SupplierReferenceForm
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires @/contexts/ErrorContext
 * @requires @/components/purchase/manufacturers/ManufacturerFormFields
 */

/**
 * Formulaire complet pour ajouter une nouvelle référence fournisseur
 * Champs essentiels: fournisseur, référence
 * Champs optionnels: prix, délai, préférence
 * Respecte le pattern: validation stricte, normalisation données, feedback utilisateur
 *
 * @component
 * @param {Object} props
 * @param {Array} props.suppliers - Liste des fournisseurs disponibles
 * @param {Object} props.formData - État du formulaire
 * @param {Function} props.setFormData - Setter pour formData
 * @param {Function} props.onAdd - Callback soumission (reçoit stockItemId)
 * @param {string} props.stockItemId - ID de l'article en stock
 * @param {boolean} [props.loading=false] - État de chargement
 * @returns {JSX.Element}
 * @example
 * <SupplierReferenceForm
 *   suppliers={suppliers}
 *   formData={formData}
 *   setFormData={setFormData}
 *   onAdd={handleAdd}
 *   stockItemId={stockItem.id}
 *   loading={loading}
 * />
 */

// ===== HELPERS =====
/**
 * Valide les champs obligatoires du formulaire
 * @param {string} supplierId - ID fournisseur
 * @param {string} supplierRef - Référence fournisseur
 * @returns {string|null} Message erreur ou null si valide
 */
function validateFormData(supplierId, supplierRef) {
  const trimmedId = (supplierId || '').trim();
  const trimmedRef = (supplierRef || '').trim();

  if (!trimmedId) return VALIDATION_ERRORS.SUPPLIER_REQUIRED;
  if (!trimmedRef) return VALIDATION_ERRORS.REFERENCE_REQUIRED;
  return null;
}

// ===== COMPONENT =====
export default function SupplierReferenceForm({
  suppliers,
  formData,
  setFormData,
  onAdd,
  stockItemId,
  loading = false,
}) {
  const { showError } = useError();
  const refFieldRef = useRef(null);

  const handleSubmit = () => {
    if (loading) return;

    // ----- Validation -----
    const stateSupplierRef = (formData.supplier_ref || '').trim();
    const domSupplierRef = (refFieldRef.current?.value || '').trim();
    const finalSupplierRef = domSupplierRef || stateSupplierRef;
    const trimmedSupplierId = (formData.supplier_id || '').trim();

    const validationError = validateFormData(trimmedSupplierId, finalSupplierRef);
    if (validationError) {
      showError(new Error(validationError));
      return;
    }

    // ----- Mettre à jour et soumettre -----
    const updatedFormData = {
      ...formData,
      supplier_ref: finalSupplierRef,
      supplier_id: trimmedSupplierId,
    };
    
    setFormData(updatedFormData);
    onAdd(stockItemId);
  };

  return (
    <Card
      style={{
        background: 'var(--blue-1)',
        borderLeft: '4px solid var(--blue-9)',
      }}
    >
      <Flex direction="column" gap="3">
        {/* En-tête avec contexte */}
        <Flex align="center" justify="between">
          <Text weight="bold" size="2">
            Ajouter une référence fournisseur
          </Text>
        </Flex>

        {/* Champs du formulaire */}
        <Flex gap="2" wrap="wrap" align="end">
          
          {/* Fournisseur - REQUIS */}
          <Box style={FIELD_SIZES.SUPPLIER}>
            <Text size="2" as="label" weight="bold">
              Fournisseur *
            </Text>
            <Select.Root
              value={String(formData.supplier_id || '')}
              onValueChange={(value) => {
                setFormData({ ...formData, supplier_id: value });
              }}
            >
              <Select.Trigger placeholder="Choisir..." />
              <Select.Content>
                {suppliers.map((supplier) => (
                  <Select.Item key={supplier.id} value={String(supplier.id)}>
                    {supplier.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          {/* Référence fournisseur - REQUIS */}
          <Box style={FIELD_SIZES.REFERENCE}>
            <Text size="2" as="label" weight="bold">
              Référence fournisseur *
            </Text>
            <TextField.Root
              ref={refFieldRef}
              value={formData.supplier_ref || ''}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  supplier_ref: e.target.value,
                });
              }}
              placeholder="Ex: 51775.040.020"
              required
            />
          </Box>

          {/* Prix unitaire - OPTIONNEL */}
          <Box style={FIELD_SIZES.PRICE}>
            <Text size="2" as="label" weight="bold">
              Prix unitaire
            </Text>
            <TextField.Root
              type="number"
              step="0.01"
              value={formData.unit_price || ''}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  unit_price: e.target.value,
                });
              }}
              placeholder="0.00"
            />
          </Box>

          {/* Délai livraison - OPTIONNEL */}
          <Box style={FIELD_SIZES.DELAY}>
            <Text size="2" as="label" weight="bold">
              Délai (j)
            </Text>
            <TextField.Root
              type="number"
              value={formData.delivery_time_days || ''}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  delivery_time_days: e.target.value,
                });
              }}
            />
          </Box>

          {/* Préféré - OPTIONNEL */}
          <Flex align="center" gap="2">
            <Checkbox
              checked={formData.is_preferred}
              onCheckedChange={(checked) => {
                setFormData({
                  ...formData,
                  is_preferred: checked,
                });
              }}
            />
            <Text size="2">Préféré</Text>
          </Flex>
        </Flex>

        {/* Boutons d'action */}
        <Flex gap="1">
          <Button
            size="2"
            color="blue"
            onClick={handleSubmit}
            disabled={loading}
          >
            Ajouter
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}

// ===== PROP TYPES =====
SupplierReferenceForm.propTypes = {
  suppliers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  formData: PropTypes.shape({
    supplier_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    supplier_ref: PropTypes.string,
    unit_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    delivery_time_days: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    is_preferred: PropTypes.bool,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  stockItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  loading: PropTypes.bool,
};
