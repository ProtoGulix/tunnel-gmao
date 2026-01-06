/**
 * @fileoverview États de chargement/erreur pour les préconisations
 */

import PropTypes from 'prop-types';
import { Box, Flex, Card, Text, Spinner } from '@radix-ui/themes';

/**
 * État de chargement
 */
function LoadingState({ message }) {
  return (
    <Box p="6">
      <Flex justify="center" align="center" gap="2" py="6">
        <Spinner />
        <Text color="gray">{message}</Text>
      </Flex>
    </Box>
  );
}

LoadingState.propTypes = {
  message: PropTypes.string.isRequired,
};

/**
 * État d'erreur
 */
function ErrorState({ message, errorDetail }) {
  return (
    <Box p="6">
      <Card color="red">
        <Text color="red">
          {message}: {errorDetail}
        </Text>
      </Card>
    </Box>
  );
}

ErrorState.propTypes = {
  message: PropTypes.string.isRequired,
  errorDetail: PropTypes.string.isRequired,
};

/**
 * État vide
 */
function EmptyState({ message }) {
  return (
    <Card color="gray">
      <Text color="gray">{message}</Text>
    </Card>
  );
}

EmptyState.propTypes = {
  message: PropTypes.string.isRequired,
};

export { LoadingState, ErrorState, EmptyState };
