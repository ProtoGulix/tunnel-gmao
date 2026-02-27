/**
 * Page Qualité des Données
 * Détection et suivi des problèmes de complétude et cohérence
 */

import { useState, useMemo } from 'react';
import { Container, Card, Flex, Text, Select } from '@radix-ui/themes';
import { Database } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import QualityDataTab from '@/components/quality-data/tabs/QualityDataTab';
import { ENTITY_LABELS } from '@/components/quality-data/config';

export default function QualityDataPage() {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  const filters = useMemo(() => ({
    severite: severityFilter !== 'all' ? severityFilter : undefined,
    entite: entityFilter !== 'all' ? entityFilter : undefined,
  }), [severityFilter, entityFilter]);

  return (
    <Container size="4">
      <PageHeader
        title="Qualité des données"
        description="Contrôle de complétude et cohérence"
        icon={Database}
      />

      {/* Filtres */}
      <Card mb="4">
        <Flex gap="3" align="center">
          <Text size="2" weight="bold">
            Filtres :
          </Text>
          
          <Select.Root value={severityFilter} onValueChange={setSeverityFilter}>
            <Select.Trigger placeholder="Toutes sévérités" />
            <Select.Content>
              <Select.Item value="all">Toutes sévérités</Select.Item>
              <Select.Item value="high">Critique</Select.Item>
              <Select.Item value="medium">Moyenne</Select.Item>
            </Select.Content>
          </Select.Root>

          <Select.Root value={entityFilter} onValueChange={setEntityFilter}>
            <Select.Trigger placeholder="Toutes entités" />
            <Select.Content>
              <Select.Item value="all">Toutes entités</Select.Item>
              {Object.entries(ENTITY_LABELS).map(([key, label]) => (
                <Select.Item key={key} value={key}>
                  {label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Root>
        </Flex>
      </Card>

      {/* Contenu */}
      <QualityDataTab filters={filters} />
    </Container>
  );
}
