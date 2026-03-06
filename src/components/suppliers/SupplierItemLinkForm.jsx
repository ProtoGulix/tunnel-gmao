/**
 * @fileoverview Formulaire creation/edition d'une liaison fournisseur-piece
 * @module components/suppliers/SupplierItemLinkForm
 */

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Card, Checkbox, Flex, Text, TextField } from '@radix-ui/themes';
import { Link, Edit2 } from 'lucide-react';
import { fetchStockItems } from '@/api/stock';
import { fetchManufacturers } from '@/api/manufacturers';
import SearchableSelect from '@/components/ui/SearchableSelect';

function useStockItemSearch() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetchStockItems({ limit: 200 })
      .then((res) => setItems(Array.isArray(res.items) ? res.items : []))
      .catch(() => setItems([]));
  }, []);
  return items;
}

function useManufacturerSearch() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    fetchManufacturers({ limit: 1000 })
      .then(({ items: list }) => setItems(Array.isArray(list) ? list : []))
      .catch(() => setItems([]));
  }, []);
  return items;
}

function initFromLink(link) {
  if (!link) return { stockItemId: null, supplierRef: '', unitPrice: '', minOrderQty: '', deliveryDays: '', isPreferred: false, manufacturerId: null };
  return {
    stockItemId: link.stock_item_id,
    supplierRef: link.supplier_ref || '',
    unitPrice: link.unit_price != null ? String(link.unit_price) : '',
    minOrderQty: link.min_order_quantity != null ? String(link.min_order_quantity) : '',
    deliveryDays: link.delivery_time_days != null ? String(link.delivery_time_days) : '',
    isPreferred: link.is_preferred || false,
    manufacturerId: link.manufacturer_item?.id || null,
  };
}

function buildPayload(isEdit, form, supplierId) {
  const payload = {
    supplier_ref: form.supplierRef.trim(),
    unit_price: form.unitPrice !== '' ? parseFloat(form.unitPrice) : null,
    min_order_quantity: form.minOrderQty !== '' ? parseInt(form.minOrderQty, 10) : null,
    delivery_time_days: form.deliveryDays !== '' ? parseInt(form.deliveryDays, 10) : null,
    is_preferred: form.isPreferred,
    manufacturer_item_id: form.manufacturerId || null,
  };
  if (!isEdit) { payload.stock_item_id = form.stockItemId; payload.supplier_id = supplierId; }
  return payload;
}

function validateLink(isEdit, form) {
  const errs = [];
  if (!isEdit && !form.stockItemId) errs.push('Selectionnez une piece.');
  if (!form.supplierRef.trim() || form.supplierRef.trim().length < 2)
    errs.push('La reference fournisseur doit contenir au moins 2 caracteres.');
  return errs;
}

function ErrorBlock({ errors }) {
  if (!errors.length) return null;
  return (
    <Box style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: '6px', padding: '12px' }}>
      <Text color="red" weight="bold" size="2">Erreurs</Text>
      {errors.map((err, idx) => (
        <Text key={idx} color="red" size="1" style={{ display: 'block' }}>• {err}</Text>
      ))}
    </Box>
  );
}

ErrorBlock.propTypes = { errors: PropTypes.arrayOf(PropTypes.string).isRequired };

function StockItemPicker({ items, value, onChange }) {
  return (
    <SearchableSelect
      label="Piece *"
      items={items}
      value={value}
      onChange={(item) => onChange(item ? item.id : null)}
      getDisplayText={(item) => `${item.ref} — ${item.name}`}
      getSearchableFields={(item) => [item.ref, item.name]}
      placeholder="Rechercher une piece..."
      allowSpecialRequest={false}
      required
    />
  );
}

StockItemPicker.propTypes = {
  items: PropTypes.array.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

function getManufacturerLabel(item) {
  return item.manufacturer_ref
    ? `${item.manufacturer_name} — ${item.manufacturer_ref}`
    : item.manufacturer_name;
}

function ManufacturerPicker({ items, value, onChange }) {
  return (
    <SearchableSelect
      label="Fabricant (optionnel)"
      items={items}
      value={value}
      onChange={(item) => onChange(item ? item.id : null)}
      getDisplayText={getManufacturerLabel}
      getSearchableFields={(item) => [item.manufacturer_name, item.manufacturer_ref].filter(Boolean)}
      placeholder="Rechercher un fabricant..."
      allowSpecialRequest={false}
    />
  );
}

ManufacturerPicker.propTypes = {
  items: PropTypes.array.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

function ReadonlyStockItem({ link }) {
  return (
    <Box>
      <Text size="2" weight="bold" as="label">Piece</Text>
      <Text size="2" color="gray" style={{ display: 'block' }}>
        {link.stock_item_ref} — {link.stock_item_name}
      </Text>
    </Box>
  );
}

ReadonlyStockItem.propTypes = {
  link: PropTypes.shape({
    stock_item_ref: PropTypes.string,
    stock_item_name: PropTypes.string,
  }).isRequired,
};

function NumericFields({ form, setForm }) {
  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  return (
    <>
      <Flex gap="3" wrap="wrap">
        <Box style={{ flex: '1', minWidth: '160px' }}>
          <Text size="2" weight="bold" as="label">Reference fournisseur *</Text>
          <TextField.Root value={form.supplierRef} onChange={set('supplierRef')} placeholder="P1115070" />
        </Box>
        <Box style={{ flex: '1', minWidth: '100px' }}>
          <Text size="2" weight="bold" as="label">Prix unitaire (€)</Text>
          <TextField.Root value={form.unitPrice} onChange={set('unitPrice')} type="number" min="0" step="0.01" placeholder="12.50" />
        </Box>
      </Flex>
      <Flex gap="3" wrap="wrap">
        <Box style={{ flex: '1', minWidth: '120px' }}>
          <Text size="2" weight="bold" as="label">Qte min. commande</Text>
          <TextField.Root value={form.minOrderQty} onChange={set('minOrderQty')} type="number" min="1" placeholder="5" />
        </Box>
        <Box style={{ flex: '1', minWidth: '120px' }}>
          <Text size="2" weight="bold" as="label">Delai livraison (j)</Text>
          <TextField.Root value={form.deliveryDays} onChange={set('deliveryDays')} type="number" min="0" placeholder="3" />
        </Box>
      </Flex>
    </>
  );
}

NumericFields.propTypes = {
  form: PropTypes.object.isRequired,
  setForm: PropTypes.func.isRequired,
};

export default function SupplierItemLinkForm({ link, supplierId, onSubmit, onCancel, saving }) {
  const isEdit = !!link;
  const stockItems = useStockItemSearch();
  const manufacturers = useManufacturerSearch();
  const [form, setForm] = useState(() => initFromLink(link));
  const [errors, setErrors] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateLink(isEdit, form);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    await onSubmit(buildPayload(isEdit, form, supplierId));
  };

  const setField = (field) => (value) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          {isEdit ? <Edit2 size={20} color="var(--blue-9)" /> : <Link size={20} color="var(--blue-9)" />}
          <Text size="3" weight="bold">{isEdit ? 'Modifier la liaison' : 'Lier une piece'}</Text>
        </Flex>

        <ErrorBlock errors={errors} />

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            {isEdit
              ? <ReadonlyStockItem link={link} />
              : <StockItemPicker items={stockItems} value={form.stockItemId} onChange={setField('stockItemId')} />
            }

            <NumericFields form={form} setForm={setForm} />

            <ManufacturerPicker
              items={manufacturers}
              value={form.manufacturerId}
              onChange={setField('manufacturerId')}
            />

            <Flex align="center" gap="2">
              <Checkbox
                checked={form.isPreferred}
                onCheckedChange={(checked) => setField('isPreferred')(!!checked)}
              />
              <Text size="2" weight="bold">Fournisseur prefere pour cette piece</Text>
            </Flex>

            <Flex justify="end" gap="2">
              <Button type="button" variant="soft" color="gray" size="2" onClick={onCancel} disabled={saving}>Annuler</Button>
              <Button type="submit" color="blue" size="2" disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

SupplierItemLinkForm.propTypes = {
  link: PropTypes.object,
  supplierId: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
