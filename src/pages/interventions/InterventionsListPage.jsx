/**
 * Page Interventions — deux onglets : Planning (défaut) + Liste
 * Query param ?tab=planning|liste
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge, Box, Container, Flex, Tabs, Text, TextField } from '@radix-ui/themes';
import { CalendarDays, ClipboardList, List, Search, Wrench } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import InterventionsListTab from '@/components/interventions/tabs/InterventionsListTab';
import InterventionPlanningTab from '@/components/interventions/tabs/InterventionPlanningTab';
import InterventionRequestsTab from '@/components/intervention-requests/tabs/InterventionRequestsTab';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';

const TABS = [
  { id: 'planning', label: 'Planning', icon: CalendarDays },
  { id: 'liste', label: 'Liste', icon: List },
  { id: 'demandes', label: 'Demandes', icon: ClipboardList },
];

export default function InterventionsListPage() {
  const navigate = useNavigate();
  const { activeTab, setActiveTab } = useTabNavigation('planning', 'tab');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <Box>
      <PageHeader
        title="Interventions"
        subtitle="Gestion des interventions de maintenance"
        icon={Wrench}
        onAdd={() => navigate('/intervention/new')}
        addLabel="Nouvelle intervention"
      />

      <Container size="4" p="4">
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)', marginBottom: '1.5rem' }}>
            {TABS.map(({ id, label, icon: Icon }) => (
              <Tabs.Trigger key={id} value={id}>
                <Flex align="center" gap="2">
                  <Icon size={16} />
                  <Text>{label}</Text>
                </Flex>
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          <Tabs.Content value="planning">
            <InterventionPlanningTab />
          </Tabs.Content>

          <Tabs.Content value="liste">
            <Box mb="4">
              <TextField.Root
                placeholder="Rechercher par code machine, code intervention ou mot-clé..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="3"
              >
                <TextField.Slot side="left">
                  <Search size={16} />
                </TextField.Slot>
              </TextField.Root>
            </Box>
            <InterventionsListTab searchTerm={searchTerm} />
          </Tabs.Content>

          <Tabs.Content value="demandes">
            <InterventionRequestsTab />
          </Tabs.Content>
        </Tabs.Root>
      </Container>
    </Box>
  );
}
