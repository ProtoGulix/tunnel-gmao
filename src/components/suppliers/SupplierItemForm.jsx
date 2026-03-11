/**
 * @fileoverview Formulaire unifié de création/édition d'une référence fournisseur-pièce.
 *
 * Conçu pour être appelé depuis plusieurs contextes :
 *  - `SupplierDetail`          → supplierId fixé, pièce à choisir/créer
 *  - `StockItemSuppliers`      → stockItemId fixé, fournisseur à choisir
 *  - `PurchaseRequestEditForm` → stockItemId issu de la DA, fournisseur à choisir
 *
 * Quand `supplierId` est fourni, le sélecteur fournisseur est masqué (contexte fixé).
 * Quand `stockItemId` est fourni, le sélecteur pièce est masqué (contexte fixé).
 * En mode édition (`link` fourni), les deux sont masqués — seule la ref et le fabricant sont modifiables.
 *
 * Gestion inline du fabricant : création d'un manufacturer-item directement dans le formulaire.
 * Gestion inline de la pièce  : recherche dans le catalogue OU création via StockItemForm embedded.
 *
 * @module components/suppliers/SupplierItemForm
 */

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Badge, Box, Button, Card, Checkbox, Flex,
  Separator, Text, TextField,
} from '@radix-ui/themes';
import { Building2, Edit2, Link, Package, Plus, X } from 'lucide-react';
import * as stockApi from '@/api/stock';
import { fetchSuppliers } from '@/api/suppliers';
import ManufacturerForm from '@/components/manufacturers/ManufacturerCreateForm';
import StockItemForm from '@/components/stock/StockItemForm';
import ItemForm from '@/components/ui/ItemForm';
import StatusCallout from '@/components/ui/StatusCallout';

// ─── Hooks de chargement ──────────────────────────────────────────────────────

function useSuppliersList(skip = false) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    if (skip) return;
    fetchSuppliers({})
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, [skip]);
  return items;
}

// ─── Initialisation du formulaire ─────────────────────────────────────────────

function initForm(link) {
  if (!link) {
    return {
      supplierRef: '',
      unitPrice: '',
      minOrderQty: '',
      deliveryDays: '',
      isPreferred: false,
      manufacturerId: null,
      productUrl: '',
    };
  }
  return {
    supplierRef: link.supplier_ref || '',
    unitPrice: link.unit_price != null ? String(link.unit_price) : '',
    minOrderQty: link.min_order_quantity != null ? String(link.min_order_quantity) : '',
    deliveryDays: link.delivery_time_days != null ? String(link.delivery_time_days) : '',
    isPreferred: link.is_preferred || false,
    manufacturerId: link.manufacturer_item?.id || null,
    productUrl: link.product_url || '',
  };
}

// ─── Affichage d'un contexte verrouillé ───────────────────────────────────────

function LockedBadge({ icon: Icon, label, sublabel, color = 'gray' }) {
  return (
    <Flex align="center" gap="2" p="2" style={{
      background: 'var(--gray-2)', borderRadius: 'var(--radius-2)',
      border: '1px solid var(--gray-5)',
    }}>
      <Icon size={14} color={`var(--${color}-9)`} />
      <Box>
        <Text size="2" weight="medium">{label}</Text>
        {sublabel && <Text size="1" color="gray" style={{ display: 'block' }}>{sublabel}</Text>}
      </Box>
      <Badge size="1" color={color} variant="soft" style={{ marginLeft: 'auto' }}>fixé</Badge>
    </Flex>
  );
}
LockedBadge.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  sublabel: PropTypes.string,
  color: PropTypes.string,
};

// ─── Section fournisseur ──────────────────────────────────────────────────────

function SupplierSection({ supplierId, supplierName, selectedId, onSelect }) {
  const suppliers = useSuppliersList(!!supplierId);

  if (supplierId) {
    return (
      <Box>
        <Text size="2" weight="bold" as="label" mb="1" style={{ display: 'block' }}>Fournisseur</Text>
        <LockedBadge icon={Building2} label={supplierName || supplierId} color="blue" />
      </Box>
    );
  }

  return (
    <Box>
      <Text size="2" weight="bold" as="label" mb="1" style={{ display: 'block' }}>Fournisseur *</Text>
      <select
        value={selectedId || ''}
        onChange={(e) => onSelect(e.target.value || null)}
        style={{
          width: '100%', height: 34, padding: '0 8px', borderRadius: 'var(--radius-2)',
          border: '1px solid var(--gray-7)', fontSize: 'var(--font-size-2)',
          background: 'var(--color-background)', color: 'var(--gray-12)',
        }}
      >
        <option value="">Sélectionner un fournisseur...</option>
        {suppliers.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
    </Box>
  );
}
SupplierSection.propTypes = {
  supplierId: PropTypes.string,
  supplierName: PropTypes.string,
  selectedId: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};

// ─── Section pièce catalogue ──────────────────────────────────────────────────

// Composant séparé car StockItemForm gère son propre state interne (familles, template…)
function StockCreateTabContent({ registerSubmit }) {
  const handleSubmit = async (payload) => {
    return await stockApi.createStockItem(payload);
  };
  return <StockItemForm item={null} onSubmit={handleSubmit} onCancel={() => {}} noActions registerSubmit={registerSubmit} embedded />;
}
StockCreateTabContent.propTypes = {
  registerSubmit: PropTypes.func.isRequired,
};

// ─── Champs numériques de la référence ───────────────────────────────────────

function RefFields({ form, setForm }) {
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  return (
    <Flex direction="column" gap="2">
      <Box>
        <Text size="2" weight="bold" as="label" mb="1" style={{ display: 'block' }}>Référence fournisseur *</Text>
        <TextField.Root
          value={form.supplierRef}
          onChange={set('supplierRef')}
          placeholder="ex: P1115070"
        />
      </Box>
      <Flex gap="2" wrap="wrap">
        <Box style={{ flex: '1', minWidth: 100 }}>
          <Text size="1" color="gray" style={{ display: 'block', marginBottom: 4 }}>Prix unitaire (€)</Text>
          <TextField.Root value={form.unitPrice} onChange={set('unitPrice')} type="number" min="0" step="0.01" placeholder="0.00" />
        </Box>
        <Box style={{ flex: '1', minWidth: 100 }}>
          <Text size="1" color="gray" style={{ display: 'block', marginBottom: 4 }}>Qté min.</Text>
          <TextField.Root value={form.minOrderQty} onChange={set('minOrderQty')} type="number" min="1" placeholder="1" />
        </Box>
        <Box style={{ flex: '1', minWidth: 100 }}>
          <Text size="1" color="gray" style={{ display: 'block', marginBottom: 4 }}>Délai (j)</Text>
          <TextField.Root value={form.deliveryDays} onChange={set('deliveryDays')} type="number" min="0" placeholder="7" />
        </Box>
      </Flex>
      <Flex align="center" gap="2">
        <Checkbox
          checked={form.isPreferred}
          onCheckedChange={(checked) => setForm((f) => ({ ...f, isPreferred: !!checked }))}
        />
        <Text size="2">Fournisseur préféré pour cette pièce</Text>
      </Flex>
      <Box>
        <Text size="1" color="gray" style={{ display: 'block', marginBottom: 4 }}>URL fiche produit</Text>
        <TextField.Root
          value={form.productUrl}
          onChange={set('productUrl')}
          placeholder="https://…"
          type="url"
        />
      </Box>
    </Flex>
  );
}
RefFields.propTypes = {
  form: PropTypes.object.isRequired,
  setForm: PropTypes.func.isRequired,
};

// ─── Composant principal ──────────────────────────────────────────────────────

/**
 * Formulaire unifié de création/édition d'une référence fournisseur-pièce.
 *
 * @param {Object}  props
 * @param {Object}  [props.link]            - Liaison existante (mode édition). null = création.
 * @param {string}  [props.supplierId]      - ID fournisseur pré-fixé (masque le sélecteur).
 * @param {string}  [props.supplierName]    - Nom affiché quand supplierId est fixé.
 * @param {string}  [props.stockItemId]     - ID pièce pré-fixée (masque le sélecteur).
 * @param {string}  [props.stockItemLabel]  - Texte affiché quand stockItemId est fixé (ex: "REF — Nom").
 * @param {Function} props.onSubmit         - async (payload) => void
 * @param {Function} props.onCancel
 * @param {boolean} [props.saving]          - État de sauvegarde externe.
 */
export default function SupplierItemForm({
  link,
  supplierId,
  supplierName,
  stockItemId,
  stockItemLabel,
  onSubmit,
  onCancel,
  saving = false,
}) {
  const isEdit = !!link;

  const [form, setForm] = useState(() => initForm(link));
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const [selectedStockItem, setSelectedStockItem] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Résolution des IDs finaux
  const resolvedSupplierId = supplierId || selectedSupplierId;
  const resolvedStockItemId = stockItemId || selectedStockItem?.id;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      supplier_ref: form.supplierRef.trim(),
      unit_price: form.unitPrice !== '' ? parseFloat(form.unitPrice) : null,
      min_order_quantity: form.minOrderQty !== '' ? parseInt(form.minOrderQty, 10) : null,
      delivery_time_days: form.deliveryDays !== '' ? parseInt(form.deliveryDays, 10) : null,
      is_preferred: form.isPreferred,
      manufacturer_item_id: form.manufacturerId || null,
      product_url: form.productUrl.trim() || null,
    };

    if (!isEdit) {
      payload.supplier_id = resolvedSupplierId;
      payload.stock_item_id = resolvedStockItemId;
    }

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err?.response?.data?.detail || 'Erreur lors de la sauvegarde.');
    } finally {
      setSubmitting(false);
    }
  };

  const isBusy = saving || submitting;

  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
      <form onSubmit={handleSubmit}>
        <Flex direction="column" gap="3">

          {/* En-tête */}
          <Flex align="center" gap="2">
            {isEdit ? <Edit2 size={18} color="var(--blue-9)" /> : <Link size={18} color="var(--blue-9)" />}
            <Text size="3" weight="bold">
              {isEdit ? 'Modifier la référence' : 'Ajouter une référence fournisseur'}
            </Text>
          </Flex>

          {error && <StatusCallout type="error">{error}</StatusCallout>}

          {/* Fournisseur */}
          {!isEdit && (
            <SupplierSection
              supplierId={supplierId}
              supplierName={supplierName}
              selectedId={selectedSupplierId}
              onSelect={setSelectedSupplierId}
            />
          )}

          {/* Pièce catalogue */}
          {!isEdit && (
            <>
              <Separator size="4" />
              {stockItemId ? (
                <Box>
                  <Text size="2" weight="bold" as="label" mb="1" style={{ display: 'block' }}>Pièce catalogue</Text>
                  <LockedBadge icon={Package} label={stockItemLabel || stockItemId} color="amber" />
                </Box>
              ) : (
                <ItemForm
                  label="Pièce catalogue *"
                  onChange={setSelectedStockItem}

                  fetchFn={(q) => stockApi.fetchStockItems({ search: q }).then((r) => Array.isArray(r) ? r : (r.items || []))}
                  renderSearchItem={(i) => (
                    <Flex align="center" justify="between" gap="2" style={{ width: '100%' }}>
                      <Flex align="center" gap="2">
                        <Badge color="blue" variant="soft" size="1">{i.ref}</Badge>
                        <Text size="2">{i.name}</Text>
                      </Flex>
                      <Text size="1" color="gray">{i.quantity ?? 0} {i.unit || 'pcs'}</Text>
                    </Flex>
                  )}
                  placeholder="Rechercher dans le catalogue…"

                  renderSelected={(item, onClear) => (
                    <Flex align="center" gap="2" p="2" style={{
                      background: 'var(--blue-2)', borderRadius: 'var(--radius-2)',
                      border: '1px solid var(--blue-6)',
                    }}>
                      <Package size={14} color="var(--amber-9)" />
                      <Badge color="blue" variant="soft" size="1">{item.ref}</Badge>
                      <Text size="2" weight="medium" style={{ flex: 1 }}>{item.name}</Text>
                      <Button size="1" variant="ghost" color="gray" type="button" onClick={onClear}>
                        <X size={12} />
                      </Button>
                    </Flex>
                  )}

                  renderCreateForm={({ registerSubmit }) => (
                    <StockCreateTabContent registerSubmit={registerSubmit} />
                  )}

                  confirmLabel="Utiliser cette pièce"
                  createSubmitLabel="Créer une pièce"

                  searchTabLabel="Rechercher"
                  createTabLabel="Créer"
                  createLabel="Créer une pièce"
                />
              )}
            </>
          )}

          {/* Référence et champs numériques */}
          <Separator size="4" />
          {isEdit && (
            <Text size="1" color="gray">
              Pièce : <strong>{link.stock_item_ref} — {link.stock_item_name}</strong>
              {' · Fournisseur : '}<strong>{link.supplier_name}</strong>
            </Text>
          )}
          <RefFields form={form} setForm={setForm} />

          {/* Fabricant */}
          <Separator size="4" />
          <ManufacturerForm
            initialItem={link?.manufacturer_item ?? null}
            onChange={(item) => setForm((f) => ({ ...f, manufacturerId: item?.id ?? null }))}
          />

          {/* Actions */}
          <Flex justify="end" gap="2" pt="1">
            <Button type="button" variant="soft" color="gray" size="2" onClick={onCancel} disabled={isBusy}>
              Annuler
            </Button>
            <Button type="submit" color="blue" size="2" loading={isBusy}>
              {isEdit ? 'Enregistrer' : 'Créer la référence'}
            </Button>
          </Flex>

        </Flex>
      </form>
    </Card>
  );
}

SupplierItemForm.propTypes = {
  link: PropTypes.object,
  supplierId: PropTypes.string,
  supplierName: PropTypes.string,
  stockItemId: PropTypes.string,
  stockItemLabel: PropTypes.string,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};
