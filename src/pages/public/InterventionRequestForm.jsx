// ===== IMPORTS =====
import { useState } from 'react';
import { Box, Flex, Card, Text } from '@radix-ui/themes';
import PageHeader from '@/components/layout/PageHeader';
import { usePageHeaderProps } from '@/hooks/usePageConfig';

// ===== COMPONENT =====
export default function InterventionRequestForm() {
  // ----- Config Header -----
  const headerProps = usePageHeaderProps();

  // ----- Main Render -----
  return (
    <Box>
      <PageHeader {...headerProps} />

      <Box p="6" maxWidth="800px" mx="auto">
        <Card>
          <Flex direction="column" gap="4">
            <Text>Formulaire de demande d'intervention - À compléter</Text>
          </Flex>
        </Card>
      </Box>
    </Box>
  );
}
