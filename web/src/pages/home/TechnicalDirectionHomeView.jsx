/**
 * @fileoverview Vue d'accueil "direction technique" : résumé compact des demandes
 * d'intervention (compteurs par statut générique, DI non traitées depuis longtemps), sans
 * kanban : à ce volume (105+ DI, 31 "Nouvelle") les colonnes deviennent illisibles et
 * dupliquent la liste de /interventions?tab=demandes.
 * @module pages/home/TechnicalDirectionHomeView
 */

import { useState } from 'react';
import { Container, Flex, Select, Text, Box, Heading } from '@radix-ui/themes';
import { ClipboardList } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import SpontaneousInterventionRequestModal from '@/components/home/SpontaneousInterventionRequestModal';
import StandardRequestsSummary from '@/pages/home/StandardRequestsSummary';
import { useSiteOptions } from '@/hooks/home/useSiteOptions';
import { useTechnicalDirectionRequests } from '@/hooks/home/useTechnicalDirectionRequests';

export default function TechnicalDirectionHomeView() {
  const [site, setSite] = useState('');
  const siteOptions = useSiteOptions();
  const { items, statuses, loading, error, reload } =
    useTechnicalDirectionRequests({ siteId: site });
  const [createModal, setCreateModal] = useState(false);

  if (loading && items.length === 0) return <LoadingState fullscreen message="Chargement des demandes…" />;
  if (error) return <ErrorState error={error} />;

  return (
    <>
      <PageHeader
        title="Direction technique"
        subtitle="Demandes d'intervention par statut"
        actions={[
          {
            label: "Demande d'inter",
            icon: ClipboardList,
            onClick: () => setCreateModal(true),
          },
        ]}
      />

      <SpontaneousInterventionRequestModal
        open={createModal}
        onOpenChange={setCreateModal}
        onSuccess={reload}
      />

      <Container size="4">
        {siteOptions.length > 0 && (
        <Flex justify="end" mb="4">
          <Select.Root value={site || '__all__'} onValueChange={(v) => setSite(v === '__all__' ? '' : v)}>
            <Select.Trigger />
            <Select.Content>
              <Select.Item value="__all__">Tous les sites</Select.Item>
              {siteOptions.map((o) => (
                <Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>
        )}

        <Box mb="6">
          <Heading size="4" mb="3">Demandes d&rsquo;intervention</Heading>
          <StandardRequestsSummary items={items} statuses={statuses} />
        </Box>

        {items.length === 0 && (
          <Text color="gray">Aucune demande.</Text>
        )}
      </Container>
    </>
  );
}
