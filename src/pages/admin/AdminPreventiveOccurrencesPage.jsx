/**
 * @fileoverview Page admin — suivi des occurrences préventives
 * @module pages/admin/AdminPreventiveOccurrencesPage
 */

import { Container } from '@radix-ui/themes';
import { CalendarClock } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import PreventiveOccurrencesTab from '@/components/preventive/PreventiveOccurrencesTab';

export default function AdminPreventiveOccurrencesPage() {
  return (
    <Container size="4">
      <PageHeader
        title="Occurrences Préventives"
        subtitle="Suivi et génération des occurrences de maintenance préventive"
        icon={CalendarClock}
      />
      <PreventiveOccurrencesTab />
    </Container>
  );
}
