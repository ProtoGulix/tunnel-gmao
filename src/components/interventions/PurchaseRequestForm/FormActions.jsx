import PropTypes from 'prop-types';
import { Button, Flex } from '@radix-ui/themes';

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
        size={compact ? '1' : '2'}
        disabled={submitDisabled}
        style={{ backgroundColor: 'var(--blue-9)', color: 'white' }}
      >
        {loading ? '⏳ Création...' : submitLabel}
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
