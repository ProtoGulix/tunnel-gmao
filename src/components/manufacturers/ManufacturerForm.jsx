/**
 * @fileoverview Formulaire de recherche et création de fabricant (manufacturer-item).
 *
 * Wrapper domaine autour de `ItemForm` :
 *  - Recherche debouncée via l'API manufacturers (search sur name ET ref)
 *  - Création inline (nom + ref)
 *  - Badge sélectionné violet
 *
 * @module components/manufacturers/ManufacturerForm
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Button, Flex, Text, TextField } from '@radix-ui/themes';
import { Factory, X } from 'lucide-react';
import { createManufacturer, fetchManufacturers } from '@/api/manufacturers';
import ItemForm from '@/components/ui/ItemForm';

// ─── Composant principal ───────────────────────────────────────────────────────

/**
 * @param {Object}   props
 * @param {Object}   [props.initialItem]    - Fabricant pré-sélectionné (mode édition).
 * @param {Function} props.onChange         - (item | null) => void.
 * @param {boolean}  [props.disableSearch]  - Masque l'onglet de recherche.
 * @param {boolean}  [props.disableCreate]  - Masque l'onglet de création.
 * @param {string}   [props.label]          - Label du champ.
 */
export default function ManufacturerForm({
  initialItem = null,
  onChange,
  disableSearch = false,
  disableCreate = false,
  label = 'Référence fabricant',
}) {
  // État local du formulaire de création (manufacturer-specific)
  const [createForm, setCreateForm] = useState({ name: '', ref: '' });

  return (
    <ItemForm
      label={`${label} (optionnel)`}
      initialItem={initialItem}
      onChange={onChange}
      disableSearch={disableSearch}
      disableCreate={disableCreate}

      // ── Recherche ──────────────────────────────────────────────────────────
      fetchFn={(q) => fetchManufacturers({ search: q, limit: 20 }).then((r) => r.items || [])}
      renderSearchItem={(item) => (
        <>
          <Badge color="violet" variant="soft" size="1" style={{ flexShrink: 0 }}>
            {item.manufacturer_ref || '—'}
          </Badge>
          <span style={{ flex: 1 }}>{item.manufacturer_name}</span>
        </>
      )}
      placeholder="Rechercher par nom ou référence…"
      createLabel="Créer ce fabricant"

      // ── Badge sélectionné ──────────────────────────────────────────────────
      renderSelected={(item, onClear) => (
        <Flex align="center" gap="2" p="2" style={{
          background: 'var(--violet-2)', borderRadius: 'var(--radius-2)',
          border: '1px solid var(--violet-6)',
        }}>
          <Factory size={14} color="var(--violet-9)" />
          <Badge color="violet" variant="soft" size="1">
            {item.manufacturer_ref || item.manufacturer_name}
          </Badge>
          <Text size="2" weight="medium" style={{ flex: 1 }}>{item.manufacturer_name}</Text>
          <Button size="1" variant="ghost" color="gray" type="button" onClick={onClear}>
            <X size={12} />
          </Button>
        </Flex>
      )}

      // ── Formulaire de création ─────────────────────────────────────────────
      renderCreateForm={({ registerSubmit }) => {
        // Enregistrement du handler — appelé à chaque render pour avoir la closure à jour
        registerSubmit(async () => {
          const name = createForm.name.trim();
          if (!name) throw new Error('Le nom du fabricant est obligatoire.');
          const created = await createManufacturer({
            manufacturer_name: name,
            manufacturer_ref: createForm.ref.trim() || null,
          });
          setCreateForm({ name: '', ref: '' });
          return created;
        });

        return (
          <Flex gap="2" wrap="wrap">
            <Box style={{ flex: '1 1 140px' }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 4 }}>Nom fabricant *</Text>
              <TextField.Root
                value={createForm.name}
                onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="ex: WAGO"
                autoFocus
              />
            </Box>
            <Box style={{ flex: '1 1 120px' }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 4 }}>Référence fabricant</Text>
              <TextField.Root
                value={createForm.ref}
                onChange={(e) => setCreateForm((f) => ({ ...f, ref: e.target.value }))}
                placeholder="ex: 750-491"
              />
            </Box>
          </Flex>
        );
      }}

      createSubmitLabel="Créer ce fabricant"
      searchTabLabel="Rechercher"
      createTabLabel="Nouveau"
    />
  );
}

ManufacturerForm.propTypes = {
  initialItem: PropTypes.shape({
    id: PropTypes.string.isRequired,
    manufacturer_name: PropTypes.string.isRequired,
    manufacturer_ref: PropTypes.string,
  }),
  onChange: PropTypes.func.isRequired,
  disableSearch: PropTypes.bool,
  disableCreate: PropTypes.bool,
  label: PropTypes.string,
};
