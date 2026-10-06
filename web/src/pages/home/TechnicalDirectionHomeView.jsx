/**
 * @fileoverview Vue d'accueil "direction technique" :
 * - Idées d'amélioration : kanban (colonnes = sous_statut) — volume et usage
 *   (arbitrage carte par carte) adaptés à ce format.
 * - Demandes d'intervention classiques : résumé compact (compteurs par
 *   statut générique + DI non traitées depuis longtemps), pas de kanban —
 *   à ce volume (105+ DI, 31 "Nouvelle") les colonnes deviennent illisibles
 *   et dupliquent la liste déjà disponible sur /interventions?tab=demandes.
 * @module pages/home/TechnicalDirectionHomeView
 */

import { useMemo, useState } from 'react';
import { Container, Flex, Select, Text, Box, Heading } from '@radix-ui/themes';
import { ClipboardList, Lightbulb } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import KanbanBoard from '@/components/ui/KanbanBoard';
import SpontaneousInterventionRequestModal from '@/components/home/SpontaneousInterventionRequestModal';
import AmeliorationCard from '@/pages/home/AmeliorationCard';
import StandardRequestsSummary from '@/pages/home/StandardRequestsSummary';
import { useTechnicalDirectionRequests } from '@/hooks/home/useTechnicalDirectionRequests';

const SITE_OPTIONS = [
  { value: '', label: 'Tous les sites' },
  { value: 'VLT', label: 'Les Villettes' },
  { value: 'SML', label: 'Saint Maurice de Lignon' },
];

export default function TechnicalDirectionHomeView() {
  const [site, setSite] = useState('');
  const { items, statuses, categories, sousStatuts, loading, error, updateAmelioration, reload } =
    useTechnicalDirectionRequests({ site });
  const [createModal, setCreateModal] = useState({ open: false, type: 'standard' });

  const ameliorationItems = useMemo(() => items.filter((r) => r.type === 'amelioration'), [items]);
  const standardItems = useMemo(() => items.filter((r) => r.type !== 'amelioration'), [items]);

  if (loading && items.length === 0) return <LoadingState fullscreen message="Chargement des demandes…" />;
  if (error) return <ErrorState error={error} />;

  return (
    <>
      <PageHeader
        title="Direction technique"
        subtitle="Idées d'amélioration et demandes d'intervention par statut"
        actions={[
          {
            label: "Demande d'inter",
            icon: ClipboardList,
            onClick: () => setCreateModal({ open: true, type: 'standard' }),
          },
          {
            label: 'Ajouter une idée',
            icon: Lightbulb,
            onClick: () => setCreateModal({ open: true, type: 'amelioration' }),
          },
        ]}
      />

      <SpontaneousInterventionRequestModal
        open={createModal.open}
        initialType={createModal.type}
        onOpenChange={(open) => setCreateModal((prev) => ({ ...prev, open }))}
        onSuccess={reload}
      />

      <Container size="4">
        <Flex justify="end" mb="4">
          <Select.Root value={site || '__all__'} onValueChange={(v) => setSite(v === '__all__' ? '' : v)}>
            <Select.Trigger />
            <Select.Content>
              {SITE_OPTIONS.map((o) => (
                <Select.Item key={o.value || '__all__'} value={o.value || '__all__'}>{o.label}</Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>

        <Box mb="6">
          <Heading size="4" mb="3">Idées d&rsquo;amélioration</Heading>
          <KanbanBoard
            columns={sousStatuts}
            items={ameliorationItems}
            getColumnKey={(r) => r.sous_statut}
            getRowKey={(r) => r.id}
            emptyLabel="Aucune idée d'amélioration pour ce site."
            renderCard={(r) => (
              <AmeliorationCard
                request={r}
                categories={categories}
                sousStatuts={sousStatuts}
                onUpdate={updateAmelioration}
              />
            )}
          />
        </Box>

        <Box mb="6">
          <Heading size="4" mb="3">Demandes d&rsquo;intervention</Heading>
          <StandardRequestsSummary items={standardItems} statuses={statuses} />
        </Box>

        {items.length === 0 && (
          <Text color="gray">Aucune demande pour ce site.</Text>
        )}
      </Container>
    </>
  );
}
