/**
 * @fileoverview Panneau de détails unifié pour toute l'application
 * @module components/common/DetailPanel
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * 
 * Composant wrapper pour afficher des panneaux de détails standardisés
 * Utilisé pour: Stock, Purchase, Preventive, Actions, etc.
 * 
 * @example
 * <DetailPanel
 *   title="Détails demande d'achat"
 *   loading={isLoading}
 *   error={error}
 *   actions={[
 *     { label: 'Fermer', onClick: () => handleClose() },
 *     { label: 'Sauvegarder', onClick: () => handleSave(), color: 'blue' }
 *   ]}
 * >
 *   <Text>Contenu du panneau...</Text>
 * </DetailPanel>
 */

import PropTypes from 'prop-types';
import { Card, Flex, Text, Button, Box, Spinner, Callout } from '@radix-ui/themes';
import { AlertCircle, X } from 'lucide-react';
import { Fragment } from 'react';

/**
 * Panneau de détails unifié
 * @component
 * @param {Object} props
 * @param {string} props.title - Titre du panneau
 * @param {React.ReactNode} props.children - Contenu du panneau
 * @param {Array<Object>} [props.actions] - Actions buttons
 * @param {string} props.actions[].label - Texte du bouton
 * @param {Function} props.actions[].onClick - Callback au clic
 * @param {string} [props.actions[].color] - Couleur Radix (blue, red, gray, etc.)
 * @param {boolean} [props.actions[].disabled] - Désactiver le bouton
 * @param {boolean} [props.loading=false] - État de chargement
 * @param {string} [props.error] - Message d'erreur
 * @param {string} [props.bgColor] - Couleur de fond (var(--color-N))
 * @param {string} [props.borderColor] - Couleur bordure gauche
 * @param {boolean} [props.compact=false] - Layout compact (moins de padding)
 * @returns {JSX.Element}
 */
export default function DetailPanel({
  title,
  children,
  actions = [],
  loading = false,
  error = null,
  bgColor = 'var(--blue-2)',
  borderColor = 'var(--blue-9)',
  compact = false,
}) {
  const padding = compact ? '2' : '3';

  return (
    <Card
      style={{
        backgroundColor: bgColor,
        borderLeft: `4px solid ${borderColor}`,
        overflow: 'hidden',
      }}
    >
      <Flex direction="column" gap={padding}>
        {/* Titre */}
        {title && (
          <Flex align="center" justify="between">
            <Text weight="bold" size="2">
              {title}
            </Text>
            {loading && <Spinner size="1" />}
          </Flex>
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

        {/* Contenu */}
        {loading && !error ? (
          <Flex align="center" justify="center" p="4">
            <Spinner />
          </Flex>
        ) : (
          <Box>{children}</Box>
        )}

        {/* Actions */}
        {actions.length > 0 && !loading && (
          <Flex gap="2" justify="end" wrap="wrap">
            {actions.map((action, idx) => (
              <Button
                key={idx}
                onClick={action.onClick}
                disabled={action.disabled || false}
                color={action.color || 'gray'}
                variant={action.color === 'blue' ? 'solid' : 'soft'}
                size="2"
              >
                {action.label}
              </Button>
            ))}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

DetailPanel.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      onClick: PropTypes.func.isRequired,
      color: PropTypes.string,
      disabled: PropTypes.bool,
    })
  ),
  loading: PropTypes.bool,
  error: PropTypes.string,
  bgColor: PropTypes.string,
  borderColor: PropTypes.string,
  compact: PropTypes.bool,
};

DetailPanel.defaultProps = {
  actions: [],
  loading: false,
  error: null,
  bgColor: 'var(--blue-2)',
  borderColor: 'var(--blue-9)',
  compact: false,
};
