/**
 * @fileoverview Page admin — gestion des plans préventifs
 * @module pages/admin/AdminPreventivePlansPage
 */

import { Container } from '@radix-ui/themes';
import { ClipboardCheck } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import PreventivePlansTab from '@/components/preventive/PreventivePlansTab';

export default function AdminPreventivePlansPage() {
  return (
    <Container size="4">
      <PageHeader
        title="Plans Préventifs"
        subtitle="Définition et configuration des plans de maintenance préventive"
        icon={ClipboardCheck}
      />
      <PreventivePlansTab />
    </Container>
  );
}
