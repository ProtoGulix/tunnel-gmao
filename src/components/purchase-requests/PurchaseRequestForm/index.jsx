import { useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Card, Flex, IconButton, Text } from '@radix-ui/themes';
import { Factory, ShoppingCart, X } from 'lucide-react';
import * as stockApi from '@/api/stock';
import { DEFAULT_UNIT, resolveUnitForItem } from '@/config/units';
import ItemForm from '@/components/ui/ItemForm';
import DetailsRow from './DetailsRow';
import FormActions from './FormActions';

function PurchaseRequestForm({ onSubmit, loading = false, onCancel, submitLabel = 'Créer', initialData = null, bare = false }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState(initialData ? String(initialData.quantity ?? '1') : '1');
  const [urgency, setUrgency] = useState(initialData?.urgency || 'normal');
  const [requestedBy, setRequestedBy] = useState(initialData?.requester_name || initialData?.requested_by || '');
  const [unit, setUnit] = useState(initialData?.unit || DEFAULT_UNIT);
  const [formError, setFormError] = useState('');
  const [formKey, setFormKey] = useState(0);

  const isSpecialRequest = !selectedItem && searchTerm.trim().length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const finalLabel = selectedItem ? selectedItem.name : searchTerm.trim();
    if (!finalLabel) {
      setFormError("Entrez un nom d'article");
      return;
    }

    await onSubmit({
      item_label: finalLabel,
      quantity: parseInt(quantity, 10),
      unit,
      urgency,
      requested_by: requestedBy.trim() || 'Système',
      stock_item_id: selectedItem?.id ?? initialData?.stock_item_id ?? null,
    });

    if (!initialData) {
      setSelectedItem(null);
      setSearchTerm('');
      setQuantity('1');
      setUrgency('normal');
      setRequestedBy('');
      setUnit(DEFAULT_UNIT);
      setFormKey((k) => k + 1);
    }
  };

  const submitDisabled = loading
    || (!selectedItem && !searchTerm.trim())
    || parseInt(quantity, 10) < 1;

  const content = (
    <Flex direction="column" gap="3">
      <Flex align="center" gap="2">
        <ShoppingCart size={20} color="var(--blue-9)" />
        <Text size="3" weight="bold" color="blue">Nouvelle demande d&apos;achat</Text>
      </Flex>

        {formError && (
          <Box style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: 6, padding: 12 }}>
            <Text color="red" weight="medium">{formError}</Text>
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            <Box style={{ position: 'relative', zIndex: 5 }}>
              <ItemForm
                key={formKey}
                label="Article"
                fetchFn={(q) =>
                  stockApi.fetchStockItems({ search: q }).then((r) =>
                    Array.isArray(r) ? r : (r.items || [])
                  )
                }
                renderSearchItem={(item) => {
                  const primaryMfr = item.manufacturer_refs?.[0];
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0 12px', alignItems: 'start', width: '100%' }}>
                      <Flex direction="column" gap="1">
                        {primaryMfr ? (
                          <>
                            <Flex align="center" gap="1">
                              <Factory size={11} color="var(--violet-9)" />
                              <Text size="1" color="gray">{primaryMfr.name}</Text>
                            </Flex>
                            <Text size="2" weight="bold" style={{ fontFamily: 'monospace', color: 'var(--violet-11)' }}>
                              {primaryMfr.ref}
                            </Text>
                          </>
                        ) : (
                          <Flex align="center" gap="1" style={{ opacity: 0.5 }}>
                            <Factory size={11} color="var(--gray-8)" />
                            <Text size="1" color="gray">Sans fabricant</Text>
                          </Flex>
                        )}
                        <Text size="1" color="gray">{item.name}</Text>
                      </Flex>
                      <Flex direction="column" gap="1" align="end">
                        <Badge variant="outline" color="gray" size="1" style={{ fontFamily: 'monospace', fontSize: 10 }}>{item.ref}</Badge>
                        {item.quantity === 0
                          ? <Badge color="red" variant="soft" size="1">Rupture</Badge>
                          : item.quantity <= 3
                            ? <Badge color="orange" variant="soft" size="1">Stock bas · {item.quantity}</Badge>
                            : <Badge color="green" variant="soft" size="1">{item.quantity} {item.unit || ''}</Badge>
                        }
                      </Flex>
                    </div>
                  );
                }}
                renderSelected={(item, onClear) => {
                  const primaryMfr = item.manufacturer_refs?.[0];
                  return (
                    <Flex
                      align="center" gap="2"
                      style={{ padding: '6px 10px', background: 'var(--violet-3)', borderRadius: 'var(--radius-2)', border: '1px solid var(--violet-6)' }}
                    >
                      {primaryMfr ? (
                        <>
                          <Factory size={12} color="var(--violet-9)" />
                          <Text size="2" weight="bold" style={{ fontFamily: 'monospace', color: 'var(--violet-11)', flex: 1 }}>
                            {primaryMfr.ref}
                          </Text>
                          <Text size="1" color="gray">{item.name}</Text>
                        </>
                      ) : (
                        <>
                          <Badge variant="outline" color="gray" size="1" style={{ fontFamily: 'monospace' }}>{item.ref}</Badge>
                          <Text size="2" weight="bold" style={{ flex: 1 }}>{item.name}</Text>
                        </>
                      )}
                      <IconButton size="1" variant="ghost" color="gray" type="button" onClick={onClear}>
                        <X size={12} />
                      </IconButton>
                    </Flex>
                  );
                }}
                confirmLabel="Utiliser cet article"
                onChange={(item) => { setSelectedItem(item); setUnit(resolveUnitForItem(item)); }}
                onSearchChange={setSearchTerm}
                disableCreate
              />

              {isSpecialRequest && (
                <Flex
                  align="center" gap="2" mt="2"
                  style={{ padding: '6px 10px', background: 'var(--amber-3)', borderRadius: 'var(--radius-2)', border: '1px solid var(--amber-6)' }}
                >
                  <Badge color="amber" variant="soft" size="1">Demande spéciale</Badge>
                  <Text size="2" color="amber" weight="medium">{searchTerm}</Text>
                </Flex>
              )}
            </Box>

            <DetailsRow
              quantity={quantity}
              onQuantityChange={setQuantity}
              unit={unit}
              onUnitChange={setUnit}
              urgency={urgency}
              onUrgencyChange={setUrgency}
              requestedBy={requestedBy}
              onRequestedByChange={setRequestedBy}
            />

            <FormActions
              onCancel={onCancel}
              submitDisabled={submitDisabled}
              loading={loading}
              submitLabel={submitLabel}
            />
          </Flex>
        </form>
    </Flex>
  );

  if (bare) return content;
  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)', overflow: 'visible' }}>
      {content}
    </Card>
  );
}

PurchaseRequestForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  onCancel: PropTypes.func,
  submitLabel: PropTypes.string,
  initialData: PropTypes.object,
  bare: PropTypes.bool,
};

export default PurchaseRequestForm;
