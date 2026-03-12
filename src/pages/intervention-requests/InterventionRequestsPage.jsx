/**
 * Page Demandes d'intervention
 *
 * Shell de 50 lignes max — assemblage uniquement.
 */

import { Box, Container } from '@radix-ui/themes';
import PageHeader from '@/components/layout/PageHeader';
import { usePageHeaderProps } from '@/hooks/usePageConfig';
import InterventionRequestsTab from '@/components/intervention-requests/tabs/InterventionRequestsTab';

export default function InterventionRequestsPage() {
  const headerProps = usePageHeaderProps();

  return (
    <Box>
      <PageHeader {...headerProps} />
      <Container size="4" p="4">
        <InterventionRequestsTab />
      </Container>
    </Box>
  );
}
