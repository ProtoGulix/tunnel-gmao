/**
 * @fileoverview Picker fabricant : recherche + sélection + création via ManufacturerForm.
 * Wrapper domaine autour de `ItemForm`.
 * @module components/manufacturers/ManufacturerCreateForm
 */

import PropTypes from 'prop-types';
import { Badge, Button, Flex, Text } from '@radix-ui/themes';
import { Factory, X } from 'lucide-react';
import { createManufacturer, fetchManufacturers } from '@/api/manufacturers';
import ItemForm from '@/components/ui/ItemForm';
import ManufacturerForm from '@/components/manufacturers/ManufacturerForm';

export default function ManufacturerCreateForm({
  initialItem = null,
  onChange,
  disableSearch = false,
  disableCreate = false,
  label = 'Référence fabricant',
}) {
  return (
    <ItemForm
      label={`${label} (optionnel)`}
      initialItem={initialItem}
      onChange={onChange}
      disableSearch={disableSearch}
      disableCreate={disableCreate}

      fetchFn={(q) => fetchManufacturers({ search: q, limit: 20 }).then((r) => r.items || [])}
      renderSearchItem={(item) => (
        <>
          <Badge color="violet" variant="soft" size="1" style={{ flexShrink: 0 }}>
            {item.manufacturer_ref || '—'}
          </Badge>
          <span style={{ flex: 1 }}>
            {item.manufacturer_name}
            {item.designation && <span style={{ color: 'var(--gray-9)', marginLeft: 6, fontSize: '0.85em' }}>{item.designation}</span>}
          </span>
        </>
      )}
      placeholder="Rechercher par nom ou référence…"

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

      renderCreateForm={({ registerSubmit }) => (
        <ManufacturerForm
          noActions
          embedded
          registerSubmit={registerSubmit}
          onSubmit={createManufacturer}
          onCancel={() => {}}
        />
      )}

      createSubmitLabel="Créer ce fabricant"
      searchTabLabel="Rechercher"
      createTabLabel="Nouveau"
    />
  );
}

ManufacturerCreateForm.propTypes = {
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
