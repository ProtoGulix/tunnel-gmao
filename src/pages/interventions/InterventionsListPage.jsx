/**
 * Page Interventions — deux onglets : Planning (défaut) + Liste
 * Query param ?tab=planning|liste
 */

import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge, Box, Container, Flex, Tabs, Text, TextField } from '@radix-ui/themes';
import { CalendarDays, List, Search, Wrench } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import InterventionsListTab from '@/components/interventions/tabs/InterventionsListTab';
import InterventionPlanningTab from '@/components/interventions/tabs/InterventionPlanningTab';

const TABS = [
  { id: 'planning', label: 'Planning', icon: CalendarDays },
  { id: 'liste', label: 'Liste', icon: List },
];

export default function InterventionsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') ?? 'planning');
  const [searchTerm, setSearchTerm] = useState('');

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setSearchParams((prev) => { prev.set('tab', tab); return prev; }, { replace: true });
  }, [setSearchParams]);

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
        <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
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
        </Tabs.Root>
      </Container>
    </Box>
  );
}
