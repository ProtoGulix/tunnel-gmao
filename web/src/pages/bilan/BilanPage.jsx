/**
 * @fileoverview Page Bilan du service : onglets État, Audit et Qualité, période commune
 * aux deux premiers (ADR 0033)
 * @module pages/bilan/BilanPage
 */

import { Container, Flex, Select, Tabs } from '@radix-ui/themes';
import { Activity } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import ServiceTab from '@/components/bilan/tabs/ServiceTab';
import AuditTab from '@/components/bilan/tabs/AuditTab';
import DataQualityTab from '@/components/bilan/tabs/DataQualityTab';
import { PERM } from '@/auth/permissionCodes';
import { usePermissions } from '@/auth/usePermissions';
import { BILAN_PERIODS, periodStart, toDateString } from '@/hooks/bilan/bilanParams';
import { useBilanParams } from '@/hooks/bilan/useBilanParams';

export default function BilanPage() {
  const { can } = usePermissions();
  const canAudit = can(PERM.stats.auditSynthese);
  const { tab, months, setTab, setMonths } = useBilanParams(canAudit);

  return (
    <>
      <PageHeader title="Bilan du service" description="État du service, audit des décisions et qualité des données" icon={Activity} />
      <Container size="4">
        <Tabs.Root value={tab} onValueChange={setTab}>
          <Flex align="center" justify="between" gap="3" wrap="wrap" mb="3" style={{ borderBottom: '1px solid var(--gray-6)' }}>
            <Tabs.List style={{ boxShadow: 'none' }}>
              <Tabs.Trigger value="service">État</Tabs.Trigger>
              {canAudit && <Tabs.Trigger value="audit">Audit</Tabs.Trigger>}
              <Tabs.Trigger value="qualite">Qualité</Tabs.Trigger>
            </Tabs.List>
            {/* La qualité des données est un état actuel : pas de période */}
            {tab !== 'qualite' && <Select.Root value={String(months)} onValueChange={setMonths} size="1">
              <Select.Trigger aria-label="Période" />
              <Select.Content>
                {BILAN_PERIODS.map((m) => <Select.Item key={m} value={String(m)}>{m} mois</Select.Item>)}
              </Select.Content>
            </Select.Root>}
          </Flex>
          <Tabs.Content value="service">
            <ServiceTab startDate={periodStart(months)} endDate={toDateString(new Date())} />
          </Tabs.Content>
          {canAudit && <Tabs.Content value="audit"><AuditTab months={months} /></Tabs.Content>}
          <Tabs.Content value="qualite"><DataQualityTab /></Tabs.Content>
        </Tabs.Root>
      </Container>
    </>
  );
}
