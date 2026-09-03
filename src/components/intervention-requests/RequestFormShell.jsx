/**
 * @fileoverview Habillage visuel de InterventionRequestForm : en-tête,
 * bandeau d'erreur, et wrapper Card (sauf en mode bare, où le Dialog
 * parent fournit déjà son propre titre/carte).
 * @module components/intervention-requests/RequestFormShell
 */

import PropTypes from 'prop-types';
import { Box, Card, Flex, Heading, Text } from '@radix-ui/themes';
import { ClipboardList } from 'lucide-react';
import { preventEnterSubmit } from '@/components/ui/SearchableSelect/preventEnterSubmit';

export default function RequestFormShell({ bare, error, children }) {
  const content = (
    <Flex direction="column" gap="3">
      {!bare && (
        <Flex align="center" gap="3">
          <ClipboardList size={20} color="var(--blue-9)" />
          <Heading size="4" weight="bold">Nouvelle demande d&apos;intervention</Heading>
        </Flex>
      )}

      {error && (
        <Box style={{ backgroundColor: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: 4, padding: '0.75rem' }}>
          <Text size="2" color="red" weight="medium">{error}</Text>
        </Box>
      )}

      {children}
    </Flex>
  );

  if (bare) return content;

  return (
    <Card
      mt="4"
      mb="3"
      onKeyDownCapture={preventEnterSubmit}
      style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}
    >
      {content}
    </Card>
  );
}

RequestFormShell.propTypes = {
  bare: PropTypes.bool.isRequired,
  error: PropTypes.string,
  children: PropTypes.node.isRequired,
};
