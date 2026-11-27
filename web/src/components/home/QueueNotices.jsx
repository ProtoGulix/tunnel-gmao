/**
 * @fileoverview Erreurs de la file : lancement en avance refusé, sources non chargées.
 * @module components/home/QueueNotices
 */
import PropTypes from 'prop-types';
import { Box } from '@radix-ui/themes';
import StatusCallout from '@/components/ui/StatusCallout';

export default function QueueNotices({ anticipateError, failed }) {
  return (
    <>
      {anticipateError && <Box px="4"><StatusCallout type="error">{anticipateError}</StatusCallout></Box>}
      {failed.length > 0 && (
        <Box px="4"><StatusCallout type="error">Chargement impossible : {failed.join(', ')}.</StatusCallout></Box>
      )}
    </>
  );
}

QueueNotices.propTypes = {
  anticipateError: PropTypes.string,
  failed: PropTypes.arrayOf(PropTypes.string).isRequired,
};
