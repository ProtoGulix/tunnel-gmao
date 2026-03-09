/**
 * @fileoverview Formulaire de modification d'une référence fournisseur existante
 * @module components/stock/EditSupplierForm
 */

import PropTypes from 'prop-types';
import { useState } from 'react';
import { Box, Button, Callout, Flex, Text, TextField, Checkbox } from '@radix-ui/themes';
import { AlertCircle, X } from 'lucide-react';
import { updateSupplierItemLink } from '@/api/suppliers';
import { useApiStatus } from '@/hooks/shared/useApiStatus';
import { StatusButton } from '@/components/ui/StatusButton';

function getInlineError(status, error) {
  if (status !== 'error') return null;
  if (!error?.response || error.response.status >= 500) return null;
  return error.response.data?.detail || error.message;
}

export function EditSupplierForm({ link, onSuccess, onCancel }) {
  const [form, setForm] = useState({
    supplier_ref: link.supplier_ref || '',
    unit_price: link.unit_price != null ? String(link.unit_price) : '',
    min_order_quantity: link.min_order_quantity != null ? String(link.min_order_quantity) : '',
    delivery_time_days: link.delivery_time_days != null ? String(link.delivery_time_days) : '',
    is_preferred: link.is_preferred || false,
  });
  const { status, error, wrap, reset } = useApiStatus();

  const setField = (updates) => {
    setForm((f) => ({ ...f, ...updates }));
    if (status === 'error') reset();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.supplier_ref.length < 2) return;
    wrap(async () => {
      await updateSupplierItemLink(link.id, {
        supplier_ref: form.supplier_ref,
        unit_price: form.unit_price !== '' ? Number(form.unit_price) : null,
        min_order_quantity: form.min_order_quantity !== '' ? Number(form.min_order_quantity) : null,
        delivery_time_days: form.delivery_time_days !== '' ? Number(form.delivery_time_days) : null,
        is_preferred: form.is_preferred,
      });
      onSuccess();
    });
  };

  const inlineError = getInlineError(status, error);

  return (
    <Box mt="3" p="3" style={{ border: '1px solid var(--blue-6)', borderRadius: 'var(--radius-3)', background: 'var(--blue-1)' }}>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="2">
          <Text size="1" weight="bold" color="blue">Modifier — {link.supplier_name}</Text>
          <Flex gap="2" wrap="wrap">
            <Box style={{ minWidth: 140, flex: '1 1 140px' }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 4 }}>Réf. fournisseur *</Text>
              <TextField.Root
                size="2"
                value={form.supplier_ref}
                onChange={(e) => setField({ supplier_ref: e.target.value })}
                placeholder="ex: REF-001"
              />
            </Box>
            <Box style={{ minWidth: 110, flex: '1 1 110px' }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 4 }}>Prix unitaire (€)</Text>
              <TextField.Root
                size="2" type="number" min="0" step="0.01"
                value={form.unit_price}
                onChange={(e) => setField({ unit_price: e.target.value })}
                placeholder="0.00"
              />
            </Box>
            <Box style={{ minWidth: 100, flex: '1 1 100px' }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 4 }}>Qté min.</Text>
              <TextField.Root
                size="2" type="number" min="1" step="1"
                value={form.min_order_quantity}
                onChange={(e) => setField({ min_order_quantity: e.target.value })}
                placeholder="1"
              />
            </Box>
            <Box style={{ minWidth: 100, flex: '1 1 100px' }}>
              <Text size="1" color="gray" style={{ display: 'block', marginBottom: 4 }}>Délai (j)</Text>
              <TextField.Root
                size="2" type="number" min="0" step="1"
                value={form.delivery_time_days}
                onChange={(e) => setField({ delivery_time_days: e.target.value })}
                placeholder="7"
              />
            </Box>
          </Flex>
          <Flex align="center" gap="2">
            <Checkbox
              checked={form.is_preferred}
              onCheckedChange={(v) => setField({ is_preferred: !!v })}
            />
            <Text size="1">Définir comme fournisseur préféré</Text>
          </Flex>
          {inlineError && (
            <Callout.Root color="red" size="1">
              <Callout.Icon><AlertCircle size={14} /></Callout.Icon>
              <Callout.Text>{inlineError}</Callout.Text>
            </Callout.Root>
          )}
          <Flex gap="2" justify="end">
            <Button size="1" variant="soft" color="gray" type="button" onClick={onCancel}>
              <X size={12} /> Annuler
            </Button>
            <StatusButton
              size="1"
              type="submit"
              status={status}
              disabled={form.supplier_ref.length < 2}
            >
              Modifier
            </StatusButton>
          </Flex>
        </Flex>
      </form>
    </Box>
  );
}

EditSupplierForm.propTypes = {
  link: PropTypes.shape({
    id: PropTypes.string.isRequired,
    supplier_name: PropTypes.string,
    supplier_ref: PropTypes.string,
    unit_price: PropTypes.number,
    min_order_quantity: PropTypes.number,
    delivery_time_days: PropTypes.number,
    is_preferred: PropTypes.bool,
  }).isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
