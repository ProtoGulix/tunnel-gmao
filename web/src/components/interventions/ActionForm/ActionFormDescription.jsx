import PropTypes from 'prop-types';
import { Box, TextArea } from '@radix-ui/themes';

function ActionFormDescription({ formState, handlers }) {
  return (
    <Box>
      <TextArea
        placeholder="Remarque ou information complémentaire (optionnel)…"
        value={formState.description}
        onChange={(e) => handlers.handleDescriptionChange(e.target.value)}
        rows={2}
        style={{
          resize: 'vertical',
          backgroundColor: 'var(--gray-2)',
          fontSize: 'var(--font-size-1)',
          color: 'var(--gray-11)',
        }}
      />
    </Box>
  );
}

ActionFormDescription.displayName = 'ActionFormDescription';

ActionFormDescription.propTypes = {
  formState: PropTypes.shape({ description: PropTypes.string.isRequired }).isRequired,
  handlers: PropTypes.shape({ handleDescriptionChange: PropTypes.func.isRequired }).isRequired,
};

export default ActionFormDescription;
