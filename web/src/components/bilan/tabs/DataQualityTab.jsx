/**
 * @fileoverview Onglet « Qualité » du Bilan : contrôle de complétude et de cohérence des
 * données (ancienne page Qualité des données, ADR 0033). Pas de période : état actuel.
 * @module components/bilan/tabs/DataQualityTab
 */

import { useState, useMemo } from 'react';
import { Card, Flex, Text, Select } from '@radix-ui/themes';
import QualityDataTab from '@/components/quality-data/tabs/QualityDataTab';
import { ENTITY_LABELS } from '@/components/quality-data/config';

export default function DataQualityTab() {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');

  const filters = useMemo(() => ({
    severite: severityFilter !== 'all' ? severityFilter : undefined,
    entite: entityFilter !== 'all' ? entityFilter : undefined,
  }), [severityFilter, entityFilter]);

  return (
    <>
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
    </>
  );
}
