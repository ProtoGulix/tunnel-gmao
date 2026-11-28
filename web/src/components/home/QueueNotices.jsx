/**
 * @fileoverview Erreurs de l'accueil direction : sources non chargées, décision refusée.
 * @module components/home/QueueNotices
 */
import PropTypes from 'prop-types';
import { Box } from '@radix-ui/themes';
import StatusCallout from '@/components/ui/StatusCallout';

export default function QueueNotices({ actionError, failed }) {
  return (
    <>
      {actionError && <Box><StatusCallout type="error">{actionError}</StatusCallout></Box>}
      {failed.length > 0 && (
        <Box><StatusCallout type="error">Chargement impossible : {failed.join(', ')}.</StatusCallout></Box>
      )}
    </>
  );
}

QueueNotices.propTypes = {
  actionError: PropTypes.string,
  failed: PropTypes.arrayOf(PropTypes.string).isRequired,
};
