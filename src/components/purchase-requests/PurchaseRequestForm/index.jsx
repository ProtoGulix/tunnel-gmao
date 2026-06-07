import { useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Card, Flex, IconButton, Select, Text, TextField } from '@radix-ui/themes';
import { CheckCircle2, Factory, Hash, Package, ShoppingCart, User, X } from 'lucide-react';
import * as stockApi from '@/api/stock';
import { DEFAULT_UNIT, resolveUnitForItem, UNIT_OPTIONS } from '@/config/units';
import ItemForm from '@/components/ui/ItemForm';
import FormActions from './FormActions';
import { useAuth } from '@/auth/useAuth';

function TimelineIcon({ icon: Icon, done = false, last = false }) {
  const color  = done ? 'var(--green-9)' : 'var(--gray-7)';
  const dotted = done ? '2.5px dashed var(--green-7)' : '2.5px dashed var(--gray-6)';
  return (
    <div style={{ flexShrink: 0, width: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', alignSelf: 'stretch' }}>
      <div style={{ flex: 1, borderLeft: dotted, transition: 'border-color 0.3s' }} />
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <Icon size={18} strokeWidth={2} style={{ color, transition: 'color 0.3s', display: 'block' }} />
        {done && (
          <CheckCircle2
            size={10} strokeWidth={3}
            style={{
              color: 'var(--green-9)', position: 'absolute', bottom: -2, right: -4,
              background: 'var(--color-background)', borderRadius: '50%',
            }}
          />
        )}
      </div>
      {!last && <div style={{ flex: 1, borderLeft: dotted, marginTop: 5, transition: 'border-color 0.3s' }} />}
      {last  && <div style={{ flex: 1, marginTop: 5 }} />}
    </div>
  );
}
TimelineIcon.propTypes = { icon: PropTypes.elementType.isRequired, done: PropTypes.bool, last: PropTypes.bool };

function PurchaseRequestForm({ onSubmit, loading = false, onCancel, submitLabel = 'Créer', initialData = null, bare = false, contextBanner = null }) {
  const { user } = useAuth();
  const userFullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ');

  const [selectedItem, setSelectedItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState(initialData ? String(initialData.quantity ?? '1') : '1');
  const [urgency, setUrgency] = useState(initialData?.urgency || 'normal');
  const [requestedBy, setRequestedBy] = useState(initialData?.requester_name || initialData?.requested_by || userFullName);
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
      setRequestedBy(userFullName);
      setUnit(DEFAULT_UNIT);
      setFormKey((k) => k + 1);
    }
  };

  const submitDisabled = loading
    || (!selectedItem && !searchTerm.trim())
    || parseInt(quantity, 10) < 1;

  const doneArticle   = !!(selectedItem || isSpecialRequest);
  const doneDetails   = !!(quantity && parseInt(quantity, 10) >= 1);
  const doneRequester = !!requestedBy.trim();

  const content = (
    <Flex direction="column" gap="2">
      <Flex align="center" gap="2" mb="1">
        <ShoppingCart size={20} color="var(--blue-9)" />
        <Text size="3" weight="bold" color="blue">Nouvelle demande d&apos;achat</Text>
      </Flex>

      {formError && (
        <Box style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: 6, padding: 12 }}>
          <Text color="red" weight="medium">{formError}</Text>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <Flex direction="column">

          {contextBanner}

          {/* Ligne 1 — Article */}
          <Flex align="stretch" gap="4">
            <TimelineIcon icon={Package} done={doneArticle} />
            <Flex direction="column" gap="2" style={{ flex: 1, padding: '10px 0', position: 'relative', zIndex: 5 }}>
              <Box>
                <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
                  Article <Text color="red">*</Text>
                </Text>
                <ItemForm
                  key={formKey}
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
            </Flex>
          </Flex>

          {/* Ligne 2 — Quantité / Unité / Urgence */}
          <Flex align="stretch" gap="4">
            <TimelineIcon icon={Hash} done={doneDetails} />
            <Flex gap="3" align="end" wrap="wrap" style={{ flex: 1, padding: '10px 0' }}>
              <Box style={{ flex: '0 0 140px', minWidth: '120px' }}>
                <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Quantité</Text>
                <TextField.Root
                  type="number" min="1" value={quantity} inputMode="numeric"
                  onChange={(e) => setQuantity(e.target.value)}
                  style={{ borderColor: doneDetails ? 'var(--green-7)' : undefined, transition: 'border-color 0.3s' }}
                />
              </Box>
              <Box style={{ flex: '0 0 120px', minWidth: '120px' }}>
                <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Unité</Text>
                <Select.Root value={unit} onValueChange={setUnit}>
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    {UNIT_OPTIONS.map(({ value, label }) => (
                      <Select.Item key={value} value={value}>{label}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>
              <Box style={{ flex: '1', minWidth: '120px' }}>
                <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Urgence</Text>
                <Select.Root value={urgency} onValueChange={setUrgency}>
                  <Select.Trigger style={{ width: '100%' }} />
                  <Select.Content>
                    <Select.Item value="normal">Normal</Select.Item>
                    <Select.Item value="high">Élevée</Select.Item>
                    <Select.Item value="critical">Critique</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Box>
            </Flex>
          </Flex>

          {/* Ligne 3 — Demandeur + actions */}
          <Flex align="stretch" gap="4">
            <TimelineIcon icon={User} done={doneRequester} last />
            <Flex direction="column" gap="3" style={{ flex: 1, padding: '10px 0' }}>
              <Box>
                <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Demandeur</Text>
                <TextField.Root
                  placeholder="Nom du demandeur"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  style={{ borderColor: doneRequester ? 'var(--green-7)' : undefined, transition: 'border-color 0.3s' }}
                />
              </Box>
              <FormActions
                onCancel={onCancel}
                submitDisabled={submitDisabled}
                loading={loading}
                submitLabel={submitLabel}
              />
            </Flex>
          </Flex>

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
  contextBanner: PropTypes.node,
};

export default PurchaseRequestForm;
