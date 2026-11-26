/**
 * @fileoverview Page Bilan du service : onglets État, Audit et Qualité, période commune
 * aux deux premiers, choisie dans l'en-tête (ADR 0033)
 * @module pages/bilan/BilanPage
 */

import { Container, Tabs } from '@radix-ui/themes';
import { Activity } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import BilanPeriodControls from '@/components/bilan/BilanPeriodControls';
import ServiceTab from '@/components/bilan/tabs/ServiceTab';
import AuditTab from '@/components/bilan/tabs/AuditTab';
import ConstatInsights from '@/components/bilan/ConstatInsights';
import DataQualityTab from '@/components/bilan/tabs/DataQualityTab';
import { PERM } from '@/auth/permissionCodes';
import { usePermissions } from '@/auth/usePermissions';
import { periodStart, toDateString } from '@/hooks/bilan/bilanParams';
import { useBilanParams } from '@/hooks/bilan/useBilanParams';

export default function BilanPage() {
  const { can } = usePermissions();
  const canAudit = can(PERM.stats.auditSynthese);
  const { tab, months, setTab, setMonths } = useBilanParams(canAudit);
  // La qualité des données est un état actuel : pas de période sur cet onglet
  const actions = tab === 'qualite' ? [] : [{ label: <BilanPeriodControls months={months} onChange={setMonths} /> }];

  return (
    <>
      <PageHeader
        title="Bilan du service" subtitle="État du service, audit des décisions et qualité des données"
        icon={Activity} actions={actions}
      />
      <Container size="4">
        <Tabs.Root value={tab} onValueChange={setTab}>
          <Tabs.List mb="3">
            <Tabs.Trigger value="service">État</Tabs.Trigger>
            <Tabs.Trigger value="constats">Constats</Tabs.Trigger>
            {canAudit && <Tabs.Trigger value="audit">Audit</Tabs.Trigger>}
            <Tabs.Trigger value="qualite">Qualité</Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="service">
            <ServiceTab startDate={periodStart(months)} endDate={toDateString(new Date())} />
          </Tabs.Content>
          <Tabs.Content value="constats">
            <ConstatInsights startDate={periodStart(months)} endDate={toDateString(new Date())} />
          </Tabs.Content>
          {canAudit && <Tabs.Content value="audit"><AuditTab months={months} /></Tabs.Content>}
          <Tabs.Content value="qualite"><DataQualityTab /></Tabs.Content>
        </Tabs.Root>
      </Container>
    </>
  );
}
