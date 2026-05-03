/**
 * @fileoverview Onglet référentiel admin (actions + interventions)
 * @module components/admin/tabs/AdminReferentielTab
 */

import { useCallback } from 'react';
import { Box, Callout, Flex, Tabs, Text } from '@radix-ui/themes';
import { CheckCircle, XCircle, Layers, Wrench } from 'lucide-react';
import {
  ActionCategoriesSection,
  ComplexityFactorsSection,
} from '@/components/admin/AdminRefActionsSection';
import {
  InterventionTypesSection,
  InterventionStatusesSection,
} from '@/components/admin/AdminRefInterventionsSection';
import {
  useActionCategories,
  useComplexityFactors,
  useInterventionTypes,
  useInterventionStatuses,
} from '@/hooks/admin/useAdminReferentiel';
import * as refApi from '@/api/adminReferentiel';
import { useNotification } from '@/hooks/shared/useNotification';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export default function AdminReferentielTab() {
  const { activeTab, setActiveTab } = useTabNavigation('actions', 'ref');
  const { notification, notify } = useNotification();

  const categories = useActionCategories();
  const factors = useComplexityFactors();
  const intTypes = useInterventionTypes();
  const intStatuses = useInterventionStatuses();

  const wrap = useCallback(async (fn, successMsg) => {
    try {
      await fn();
      notify(successMsg);
    } catch (err) {
      notify(extractApiErrorMessage(err, 'Erreur'), 'error');
    }
  }, [notify]);

  // Catégories
  const handleUpdateCategory = useCallback((id, payload) =>
    wrap(async () => {
      const updated = await refApi.updateActionCategory(id, payload);
      categories.setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
    }, 'Catégorie modifiée'), [categories, wrap]);

  const handleToggleCategoryActive = useCallback((id, is_active) =>
    wrap(async () => {
      const updated = await refApi.toggleActionCategoryActive(id, is_active);
      categories.setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
    }, is_active ? 'Catégorie activée' : 'Catégorie désactivée'), [categories, wrap]);

  // Facteurs
  const handleUpdateFactor = useCallback((id, payload) =>
    wrap(async () => {
      const updated = await refApi.updateComplexityFactor(id, payload);
      factors.setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
    }, 'Facteur modifié'), [factors, wrap]);

  const handleToggleFactorActive = useCallback((id, is_active) =>
    wrap(async () => {
      const updated = await refApi.toggleComplexityFactorActive(id, is_active);
      factors.setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
    }, is_active ? 'Activé' : 'Désactivé'), [factors, wrap]);

  // Types intervention
  const handleCreateIntType = useCallback((payload) =>
    wrap(async () => {
      await refApi.createInterventionType(payload);
      intTypes.refresh();
    }, 'Type créé'), [intTypes, wrap]);

  const handleUpdateIntType = useCallback((id, payload) =>
    wrap(async () => {
      const updated = await refApi.updateInterventionType(id, payload);
      intTypes.setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
    }, 'Type modifié'), [intTypes, wrap]);

  const handleToggleIntTypeActive = useCallback((id, is_active) =>
    wrap(async () => {
      const updated = await refApi.toggleInterventionTypeActive(id, is_active);
      intTypes.setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
    }, is_active ? 'Activé' : 'Désactivé'), [intTypes, wrap]);

  // Statuts intervention
  const handleUpdateIntStatus = useCallback((id, payload) =>
    wrap(async () => {
      const updated = await refApi.updateInterventionStatus(id, payload);
      intStatuses.setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
    }, 'Statut modifié'), [intStatuses, wrap]);

  return (
    <Box pt="4">
      {notification && (
        <Callout.Root color={notification.type === 'error' ? 'red' : 'green'} mb="3" size="1">
          <Callout.Icon>
            {notification.type === 'error' ? <XCircle size={14} /> : <CheckCircle size={14} />}
          </Callout.Icon>
          <Callout.Text>{notification.message}</Callout.Text>
        </Callout.Root>
      )}

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List style={{ borderBottom: '1px solid var(--gray-5)', marginBottom: '1.5rem' }}>
          <Tabs.Trigger value="actions">
            <Flex align="center" gap="2"><Layers size={13} /><Text>Actions</Text></Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="interventions">
            <Flex align="center" gap="2"><Wrench size={13} /><Text>Interventions</Text></Flex>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="actions">
          {activeTab === 'actions' && (
            <>
              <ActionCategoriesSection
                items={categories.items}
                loading={categories.loading}
                error={categories.error}
                onUpdate={handleUpdateCategory}
              />
              <ComplexityFactorsSection
                items={factors.items}
                categories={categories.items}
                loading={factors.loading}
                onUpdate={handleUpdateFactor}
                onToggleActive={handleToggleFactorActive}
              />
            </>
          )}
        </Tabs.Content>

        <Tabs.Content value="interventions">
          {activeTab === 'interventions' && (
            <>
              <InterventionTypesSection
                items={intTypes.items}
                loading={intTypes.loading}
                onCreate={handleCreateIntType}
                onUpdate={handleUpdateIntType}
                onToggleActive={handleToggleIntTypeActive}
              />
              <InterventionStatusesSection
                items={intStatuses.items}
                loading={intStatuses.loading}
                onUpdate={handleUpdateIntStatus}
              />
            </>
          )}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
