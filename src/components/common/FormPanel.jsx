/**
 * @fileoverview Panneau de formulaire unifié pour édition/création
 * @module components/common/FormPanel
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * 
 * Composant wrapper pour afficher des formulaires standardisés dans des panneaux
 * Utilisé pour: édition specs, qualification, fournisseurs, etc.
 * 
 * @example
 * <FormPanel
 *   title="Modifier spécification"
 *   onCancel={() => setEditing(false)}
 *   onSubmit={(data) => handleSave(data)}
 *   loading={isSaving}
 * >
 *   <TextField.Root
 *     value={title}
 *     onChange={(e) => setTitle(e.target.value)}
 *     placeholder="Titre"
 *   />
 * </FormPanel>
 */

import PropTypes from 'prop-types';
import { Card, Flex, Text, Button, Box, Callout } from '@radix-ui/themes';
import { AlertCircle } from 'lucide-react';

/**
 * Panneau de formulaire unifié
 * @component
 * @param {Object} props
 * @param {string} props.title - Titre du formulaire
 * @param {React.ReactNode} props.children - Champs du formulaire
 * @param {Function} props.onSubmit - Callback soumission (reçoit FormData ou event)
 * @param {Function} props.onCancel - Callback annulation
 * @param {boolean} [props.loading=false] - État de chargement (désactive boutons)
 * @param {string} [props.error] - Message d'erreur
 * @param {string} [props.submitLabel='Sauvegarder'] - Texte bouton submit
 * @param {boolean} [props.submitDisabled=false] - Désactiver bouton submit
 * @param {string} [props.bgColor] - Couleur de fond
 * @param {string} [props.borderColor] - Couleur bordure gauche
 * @param {boolean} [props.compact=false] - Layout compact
 * @returns {JSX.Element}
 */
export default function FormPanel({
  title,
  children,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  submitLabel = 'Sauvegarder',
  submitDisabled = false,
  bgColor = 'var(--blue-1)',
  borderColor = 'var(--blue-9)',
  compact = false,
}) {
  const padding = compact ? '2' : '3';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading && !submitDisabled) {
      onSubmit?.(e);
    }
  };

  return (
    <Card
      style={{
        backgroundColor: bgColor,
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap={padding}>
          {/* Titre */}
          {title && (
            <Text weight="bold" size="2">
              {title}
            </Text>
          )}

          {/* Erreur */}
          {error && (
            <Callout.Root color="red" role="alert">
              <Callout.Icon>
                <AlertCircle size={16} />
              </Callout.Icon>
              <Callout.Text size="1">{error}</Callout.Text>
            </Callout.Root>
          )}

          {/* Champs */}
          <Box>{children}</Box>

          {/* Actions */}
          <Flex gap="2" justify="end" wrap="wrap" pt={compact ? '0' : '2'}>
            <Button
              onClick={onCancel}
              disabled={loading}
              color="gray"
              variant="soft"
              type="button"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={submitDisabled || loading}
              color="blue"
              loading={loading}
            >
              {submitLabel}
            </Button>
          </Flex>
        </Flex>
      </form>
    </Card>
  );
}

FormPanel.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  submitLabel: PropTypes.string,
  submitDisabled: PropTypes.bool,
  bgColor: PropTypes.string,
  borderColor: PropTypes.string,
  compact: PropTypes.bool,
};

FormPanel.defaultProps = {
  loading: false,
  error: null,
  submitLabel: 'Sauvegarder',
  submitDisabled: false,
  bgColor: 'var(--blue-1)',
  borderColor: 'var(--blue-9)',
  compact: false,
};
