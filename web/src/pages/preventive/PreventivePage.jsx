/**
 * @fileoverview Page Préventif : onglets Plans (gammes, occurrences) et Échéancier
 * @module pages/preventive/PreventivePage
 */

import { Flex, Tabs, Text } from '@radix-ui/themes';
import { CalendarClock, ClipboardCheck } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import PreventivePlansView from '@/components/preventive/PreventivePlansView';
import PreventiveScheduleTab from '@/components/preventive/PreventiveScheduleTab';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';

export default function PreventivePage() {
  const { activeTab, setActiveTab } = useTabNavigation('plans', 'view');
  return (
    <Flex direction="column" style={{ height: '100%', minHeight: 0 }}>
      <PageHeader
        title="Préventif"
        subtitle="Plans de maintenance préventive, échéancier et suivi des occurrences"
      />
      <Tabs.Root value={activeTab} onValueChange={setActiveTab} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <Tabs.List style={{ flexShrink: 0, paddingInline: 'var(--space-4)' }}>
          <Tabs.Trigger value="plans"><Flex align="center" gap="2"><ClipboardCheck size={13} /><Text>Plans</Text></Flex></Tabs.Trigger>
          <Tabs.Trigger value="echeancier"><Flex align="center" gap="2"><CalendarClock size={13} /><Text>Échéancier</Text></Flex></Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="plans" style={{ flex: 1, minHeight: 0 }}><PreventivePlansView /></Tabs.Content>
        <Tabs.Content value="echeancier" style={{ flex: 1, minHeight: 0, overflow: 'auto' }}><PreventiveScheduleTab /></Tabs.Content>
      </Tabs.Root>
    </Flex>
  );
}
