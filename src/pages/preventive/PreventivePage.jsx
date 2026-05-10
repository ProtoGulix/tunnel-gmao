/**
 * @fileoverview Page Préventif — plans + occurrences
 * @module pages/preventive/PreventivePage
 */

import { Container, Flex, Tabs, Text } from '@radix-ui/themes';
import { CalendarClock, ClipboardCheck } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';
import PreventivePlansTab from '@/components/preventive/PreventivePlansTab';
import PreventiveOccurrencesTab from '@/components/preventive/PreventiveOccurrencesTab';

export default function PreventivePage() {
  const { activeTab, setActiveTab } = useTabNavigation('plans', 'tab');

  return (
    <>
      <PageHeader
        title="Préventif"
        subtitle="Plans de maintenance préventive et suivi des occurrences"
      />
      <Container size="4">
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)' }}>
          <Tabs.Trigger value="plans">
            <Flex align="center" gap="2">
              <ClipboardCheck size={14} />
              <Text>Plans</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="occurrences">
            <Flex align="center" gap="2">
              <CalendarClock size={14} />
              <Text>Occurrences</Text>
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="plans">
          {activeTab === 'plans' && <PreventivePlansTab />}
        </Tabs.Content>
        <Tabs.Content value="occurrences">
          {activeTab === 'occurrences' && <PreventiveOccurrencesTab />}
        </Tabs.Content>
      </Tabs.Root>
      </Container>
    </>
  );
}
