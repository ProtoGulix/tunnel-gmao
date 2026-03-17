/**
 * @fileoverview Boutons d'action génériques pour les formulaires de demande d'achat
 * @module components/purchase-requests/PurchaseRequestForm/FormActions
 */
import PropTypes from 'prop-types';
import { Button, Flex } from '@radix-ui/themes';
import { Check, Loader2 } from 'lucide-react';

/**
 * Barre d'actions d'un formulaire : bouton Annuler (optionnel) + bouton de soumission.
 *
 * @component
 * @param {Object} props
 * @param {boolean} props.compact - Mode compact (taille 1 vs 2)
 * @param {Function} [props.onCancel] - Callback annulation ; absent = bouton masqué
 * @param {boolean} props.submitDisabled - Désactive le bouton de soumission
 * @param {boolean} props.loading - Affiche l'état de chargement
 * @param {string} props.submitLabel - Libellé du bouton de soumission
 */
function FormActions({ compact, onCancel, submitDisabled, loading, submitLabel }) {
  return (
    <Flex justify={onCancel ? 'between' : 'end'} gap='2' wrap='wrap' mt={compact ? '1' : '2'}>
      {onCancel && (
        <Button
          type='button'
          variant='soft'
          color='gray'
          size={compact ? '1' : '2'}
          onClick={onCancel}
        >
          Annuler
        </Button>
      )}

      <Button
        type='submit'
        color='blue'
        size={compact ? '1' : '2'}
        disabled={submitDisabled || loading}
      >
        {loading
          ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Création...</>
          : <><Check size={14} /> {submitLabel}</>
        }
      </Button>
    </Flex>
  );
}

FormActions.propTypes = {
  compact: PropTypes.bool,
  onCancel: PropTypes.func,
  submitDisabled: PropTypes.bool.isRequired,
  loading: PropTypes.bool,
  submitLabel: PropTypes.string.isRequired
};

FormActions.defaultProps = {
  compact: false,
  onCancel: undefined,
  loading: false
};

export default FormActions;
