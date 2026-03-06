import PropTypes from 'prop-types';
import { Box, Text } from '@radix-ui/themes';

export default function FormErrors({ errors }) {
  if (!errors.length) return null;
  return (
    <Box style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: '6px', padding: '12px' }}>
      <Text color="red" weight="bold" size="2">Erreurs</Text>
      {errors.map((err, idx) => <Text key={idx} color="red" size="1" style={{ display: 'block' }}>• {err}</Text>)}
    </Box>
  );
}

FormErrors.propTypes = { errors: PropTypes.arrayOf(PropTypes.string).isRequired };
