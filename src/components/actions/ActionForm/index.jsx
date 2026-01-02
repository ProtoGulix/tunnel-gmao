/**
 * ActionForm - Composant principal
 * Formulaire de création d'action avec validation
 *
 * ARCHITECTURE STRICTE :
 * - 5 props max : { formState, handlers, metadata, validation, callbacks }
 * - Logique = hook useActionForm
 * - JSX = rendu uniquement
 * - Imbrication max : 3
 * - Aucun callback inline
 */

import PropTypes from 'prop-types';
import { Box, Flex, Text, Card, Button } from '@radix-ui/themes';
import { Activity, Plus } from 'lucide-react';
import { useActionForm } from './useActionForm';
import ActionFormFields from './ActionFormFields';
import ActionFormDescription from './ActionFormDescription';
import ActionFormComplexity from './ActionFormComplexity';

function ActionForm({ initialState = {}, metadata = {}, onCancel, onSubmit, style }) {
  // ===== HOOK =====
  const form = useActionForm(initialState);

  // ===== HANDLERS MÉTIER =====
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.handlers.handleValidate()) {
      return;
    }

    onSubmit(form.formState);
  };

  const handleCancel = () => {
    form.handlers.handleReset();
    onCancel();
  };

  // ===== EARLY RETURNS =====
  if (!metadata) {
    return (
      <Card style={{ backgroundColor: 'var(--red-2)', border: '1px solid var(--red-6)', ...style }}>
        <Text color="red">Erreur : métadonnées manquantes</Text>
      </Card>
    );
  }

  // ===== RENDER =====
  return (
    <Card
      style={{
        backgroundColor: 'var(--blue-2)',
        border: '1px solid var(--blue-6)',
        ...style
      }}
    >
      <Flex direction="column" gap="3">
        {/* Header */}
        <Flex align="center" gap="2">
          <Activity size={20} color="var(--blue-9)" />
          <Text size="3" weight="bold" color="blue">
            Nouvelle action
          </Text>
        </Flex>

        {/* Validation errors */}
        {form.validation.errors.length > 0 && (
          <Box
            style={{
              background: 'var(--red-3)',
              border: '1px solid var(--red-7)',
              borderRadius: '6px',
              padding: '12px'
            }}
          >
            <Text color="red" weight="bold" size="2" mb="2">
              Erreurs de validation
            </Text>
            <Flex direction="column" gap="1">
              {form.validation.errors.map((error, idx) => (
                <Text key={idx} color="red" size="1">
                  • {error}
                </Text>
              ))}
            </Flex>
          </Box>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            {/* Fields */}
            <ActionFormFields
              formState={form.formState}
              handlers={form.handlers}
              metadata={metadata}
            />

            {/* Description */}
            <ActionFormDescription
              formState={form.formState}
              handlers={form.handlers}
            />

            {/* Complexity */}
            <ActionFormComplexity
              formState={form.formState}
              handlers={form.handlers}
              metadata={metadata}
              validation={form.validation}
            />

            {/* Buttons */}
            <Flex justify="between" gap="2">
              <Button type="button" variant="soft" onClick={handleCancel}>
                Annuler
              </Button>
              <Button
                type="submit"
                size="3"
                style={{ backgroundColor: 'var(--blue-9)', color: 'white' }}
              >
                <Plus size={16} />
                Ajouter l&apos;action
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

ActionForm.displayName = 'ActionForm';

ActionForm.propTypes = {
  initialState: PropTypes.shape({
    time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    date: PropTypes.string,
    category: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.string,
    complexity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    complexityFactors: PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    )
  }),
  metadata: PropTypes.shape({
    subcategories: PropTypes.array,
    complexityFactors: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        label: PropTypes.string
      })
    )
  }),
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  style: PropTypes.object
};

export default ActionForm;
