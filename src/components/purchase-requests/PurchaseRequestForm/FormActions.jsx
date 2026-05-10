import PropTypes from 'prop-types';
import { Button, Flex } from '@radix-ui/themes';
import { Check, Loader2 } from 'lucide-react';

function FormActions({ onCancel, submitDisabled, loading = false, submitLabel }) {
  return (
    <Flex justify={onCancel ? 'between' : 'end'} gap="2" wrap="wrap" mt="2">
      {onCancel && (
        <Button type="button" variant="soft" color="gray" size="2" onClick={onCancel}>
          Annuler
        </Button>
      )}
      <Button type="submit" color="blue" size="2" disabled={submitDisabled || loading}>
        {loading
          ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Création...</>
          : <><Check size={14} /> {submitLabel}</>
        }
      </Button>
    </Flex>
  );
}

FormActions.propTypes = {
  onCancel: PropTypes.func,
  submitDisabled: PropTypes.bool.isRequired,
  loading: PropTypes.bool,
  submitLabel: PropTypes.string.isRequired,
};

export default FormActions;
