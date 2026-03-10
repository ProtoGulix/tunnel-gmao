/**
 * @fileoverview Composant générique de sélection d'item avec onglets Rechercher / Créer.
 *
 * Gère :
 *  - Sélection via AsyncSearchSelect (debounce, spinner, états vides centrés)
 *  - Étape de confirmation optionnelle avant sélection définitive (renderPending)
 *  - Onglet de création optionnel (renderCreateForm)
 *  - Affichage du badge sélectionné + bouton de désélection (renderSelected)
 *  - Sync avec un item initial (mode édition) via ref interne
 *
 * Tout affichage spécifique au domaine est délégué via des render props.
 * Ce composant ne contient aucune logique métier.
 *
 * @module components/ui/ItemForm
 *
 * @example
 * <ItemForm
 *   label="Fabricant"
 *   fetchFn={(q) => api.searchManufacturers(q)}
 *   renderSearchItem={(item) => <span>{item.name}</span>}
 *   renderSelected={(item, onClear) => <Badge>{item.name} <X onClick={onClear} /></Badge>}
 *   renderCreateForm={({ onCreated, onCancel }) => <MyCreateForm onCreated={onCreated} onCancel={onCancel} />}
 *   onChange={(item) => setManufacturer(item)}
 * />
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Callout, Flex, Tabs, Text } from '@radix-ui/themes';
import { AlertCircle, Check, Plus, X } from 'lucide-react';

import AsyncSearchSelect from './AsyncSearchSelect';

export default function ItemForm({
  // State
  initialItem = null,
  onChange,

  // Search tab
  fetchFn,
  renderSearchItem,
  placeholder = 'Rechercher…',
  debounceMs = 350,
  minChars = 2,

  // Display
  renderSelected,

  // Create tab
  renderCreateForm,

  // Labels
  label,
  confirmLabel = 'Utiliser',
  createSubmitLabel = 'Créer',
  searchTabLabel = 'Rechercher',
  createTabLabel = 'Créer',
  createLabel = 'Créer',

  // Options
  disableSearch = false,
  disableCreate = false,
  onSearchChange,
}) {
  const [selected, setSelected] = useState(initialItem);
  const [pending, setPending] = useState(null);
  const [activeTab, setActiveTab] = useState('search');
  const [createError, setCreateError] = useState(null);
  const [creating, setCreating] = useState(false);

  const submitRef = useRef(null);
  // registerSubmit est stable (useCallback vide) — le form enfant peut l'appeler à chaque render
  const registerSubmit = useCallback((fn) => { submitRef.current = fn; }, []);

  // Sync if initialItem changes externally (edit mode reopen)
  const prevInitialId = useRef(initialItem?.id);
  useEffect(() => {
    if (initialItem?.id !== prevInitialId.current) {
      prevInitialId.current = initialItem?.id;
      setSelected(initialItem);
    }
  }, [initialItem]);

  const handleConfirm = (item) => {
    setSelected(item);
    setPending(null);
    setActiveTab('search');
    onChange(item);
  };

  const handleClear = () => {
    setSelected(null);
    onChange(null);
  };

  const handleSearchSelect = (item) => {
    setPending(item);
  };

  const handleTabChange = (tab) => {
    if (tab !== 'search') setPending(null);
    if (tab !== 'create') setCreateError(null);
    setActiveTab(tab);
  };

  // Après création : passe par l'étape de confirmation (même flow que la recherche)
  const handleCreated = (item) => {
    setCreateError(null);
    setPending(item);
    setActiveTab('search');
  };

  const hasCreateTab = !!renderCreateForm && !disableCreate;
  const hasSearchTab = !!fetchFn && !disableSearch;

  // Après clic sur le bouton Créer de l'onglet : même étape de confirmation que la recherche
  const handleCreate = async () => {
    if (!submitRef.current) return;
    setCreating(true);
    setCreateError(null);
    try {
      const created = await submitRef.current();
      if (created) handleCreated(created);
    } catch (err) {
      setCreateError(err?.response?.data?.detail || err?.message || 'Erreur lors de la création.');
    } finally {
      setCreating(false);
    }
  };

  // ── Selected ────────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <Box>
        {label && (
          <Text size="2" weight="bold" as="label" mb="1" style={{ display: 'block' }}>{label}</Text>
        )}
        {renderSelected(selected, handleClear)}
      </Box>
    );
  }

  // ── Search tab content (with built-in pending confirmation step) ────────────
  const searchContent = pending
    ? (
      <Box>
        {renderSelected(pending, () => setPending(null))}
        <Flex gap="2" mt="2">
          <Button size="2" color="blue" type="button" onClick={() => handleConfirm(pending)}>
            <Check size={14} /> {confirmLabel}
          </Button>
          <Button size="2" variant="ghost" color="gray" type="button" onClick={() => setPending(null)}>
            <X size={14} /> Annuler
          </Button>
        </Flex>
      </Box>
    )
    : hasSearchTab
      ? (
        <AsyncSearchSelect
          fetchFn={fetchFn}
          onSelect={handleSearchSelect}
          renderItem={renderSearchItem}
          placeholder={placeholder}
          debounceMs={debounceMs}
          minChars={minChars}
          onCreateClick={hasCreateTab ? () => handleTabChange('create') : undefined}
          createLabel={createLabel}
          onSearchChange={onSearchChange}
        />
      )
      : null;

  // ── No selection yet ────────────────────────────────────────────────────────
  return (
    <Box>
      {label && (
        <Text size="2" weight="bold" as="label" mb="1" style={{ display: 'block' }}>{label}</Text>
      )}

      {hasCreateTab && hasSearchTab ? (
        <Tabs.Root value={activeTab} onValueChange={handleTabChange}>
          <Tabs.List mb="2">
            <Tabs.Trigger value="search">{searchTabLabel}</Tabs.Trigger>
            <Tabs.Trigger value="create">
              <Plus size={12} style={{ marginRight: 4 }} />{createTabLabel}
            </Tabs.Trigger>
          </Tabs.List>
          <Tabs.Content value="search">{searchContent}</Tabs.Content>
          <Tabs.Content value="create">
            {createError && (
              <Callout.Root color="red" size="1" mb="2">
                <Callout.Icon><AlertCircle size={14} /></Callout.Icon>
                <Callout.Text>{createError}</Callout.Text>
              </Callout.Root>
            )}
            {renderCreateForm({ registerSubmit, onCancel: () => handleTabChange('search') })}
            <Flex gap="2" mt="2">
              <Button size="2" color="blue" type="button" loading={creating} onClick={handleCreate}>
                <Plus size={14} /> {createSubmitLabel}
              </Button>
              <Button size="2" variant="ghost" color="gray" type="button" onClick={() => handleTabChange('search')}>
                <X size={14} /> Annuler
              </Button>
            </Flex>
          </Tabs.Content>
        </Tabs.Root>
      ) : hasCreateTab ? (
        <>
          {createError && (
            <Callout.Root color="red" size="1" mb="2">
              <Callout.Icon><AlertCircle size={14} /></Callout.Icon>
              <Callout.Text>{createError}</Callout.Text>
            </Callout.Root>
          )}
          {renderCreateForm({ registerSubmit })}
          <Flex gap="2" mt="2">
            <Button size="2" color="blue" type="button" loading={creating} onClick={handleCreate}>
              <Plus size={14} /> {createSubmitLabel}
            </Button>
          </Flex>
        </>
      ) : (
        searchContent
      )}
    </Box>
  );
}

ItemForm.propTypes = {
  initialItem: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  fetchFn: PropTypes.func,
  renderSearchItem: PropTypes.func,
  placeholder: PropTypes.string,
  debounceMs: PropTypes.number,
  minChars: PropTypes.number,
  renderSelected: PropTypes.func.isRequired,
  renderCreateForm: PropTypes.func,
  label: PropTypes.string,
  confirmLabel: PropTypes.string,
  createSubmitLabel: PropTypes.string,
  searchTabLabel: PropTypes.string,
  createTabLabel: PropTypes.string,
  createLabel: PropTypes.string,
  disableSearch: PropTypes.bool,
  disableCreate: PropTypes.bool,
  onSearchChange: PropTypes.func,
};
