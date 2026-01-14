/**
 * @fileoverview Formulaire de saisie des devis
 *
 * Composant réutilisable pour la saisie des devis fournisseurs.
 *
 * @module components/purchase/orders/QuoteLineForm
 */

import PropTypes from 'prop-types';
import {
  Flex,
  Text,
  Button,
  TextField,
  Checkbox,
  Box,
  Card,
} from '@radix-ui/themes';
import { Save, X } from 'lucide-react';

/**
 * Formulaire de saisie d'un devis
 *
 * @param {Object} props
 * @param {Object} props.formData - Données du formulaire
 * @param {Function} props.setFormData - Callback mise à jour données
 * @param {boolean} props.isLocked - Vrai si formulaire verrouillé
 * @param {Function} props.onSave - Callback sauvegarde
 * @param {Function} props.onCancel - Callback annulation
 * @returns {JSX.Element}
 */
export default function QuoteLineForm({
  formData,
  setFormData,
  isLocked,
  onSave,
  onCancel,
}) {
  return (
    <Card variant="surface" style={{ backgroundColor: 'var(--blue-1)' }}>
      <Flex direction="column" gap="3">
        <Text weight="bold" size="2">
          Saisir le devis
        </Text>

        {/* Checkbox: Devis reçu */}
        <Flex align="center" gap="2">
          <Checkbox
            checked={formData.quoteReceived}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, quoteReceived: checked })
            }
            disabled={isLocked}
          />
          <Text size="2">Devis reçu</Text>
        </Flex>

        {/* Prix */}
        <Box>
          <Text size="2" as="label" weight="bold" mb="1" style={{ display: 'block' }}>
            Prix unitaire (€)
          </Text>
          <TextField.Root
            type="number"
            placeholder="0.00"
            value={formData.quotePrice}
            onChange={(e) =>
              setFormData({ ...formData, quotePrice: e.target.value })
            }
            disabled={isLocked}
            step="0.01"
            min="0"
          />
        </Box>

        {/* Délai de livraison */}
        <Box>
          <Text size="2" as="label" weight="bold" mb="1" style={{ display: 'block' }}>
            Délai livraison (jours)
          </Text>
          <TextField.Root
            type="number"
            placeholder="0"
            value={formData.leadTimeDays}
            onChange={(e) =>
              setFormData({ ...formData, leadTimeDays: e.target.value })
            }
            disabled={isLocked}
            min="0"
          />
        </Box>

        {/* Fabricant */}
        <Box>
          <Text size="2" as="label" weight="bold" mb="1" style={{ display: 'block' }}>
            Fabricant
          </Text>
          <TextField.Root
            type="text"
            placeholder="ex: SKF, NSK, etc."
            value={formData.manufacturer}
            onChange={(e) =>
              setFormData({ ...formData, manufacturer: e.target.value })
            }
            disabled={isLocked}
          />
        </Box>

        {/* Référence fabricant */}
        <Box>
          <Text size="2" as="label" weight="bold" mb="1" style={{ display: 'block' }}>
            Référence fabricant
          </Text>
          <TextField.Root
            type="text"
            placeholder="ex: 6205-2Z/C3"
            value={formData.manufacturerRef}
            onChange={(e) =>
              setFormData({ ...formData, manufacturerRef: e.target.value })
            }
            disabled={isLocked}
          />
        </Box>

        {/* Boutons d'action */}
        <Flex gap="2" justify="end">
          <Button size="2" variant="soft" color="gray" onClick={onCancel}>
            <X size={16} />
            Annuler
          </Button>
          <Button size="2" color="blue" onClick={onSave}>
            <Save size={16} />
            Enregistrer
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}

QuoteLineForm.propTypes = {
  formData: PropTypes.shape({
    quoteReceived: PropTypes.bool,
    quotePrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    leadTimeDays: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    manufacturer: PropTypes.string,
    manufacturerRef: PropTypes.string,
  }).isRequired,
  setFormData: PropTypes.func.isRequired,
  isLocked: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
