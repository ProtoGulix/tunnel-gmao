import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Card, Flex, Text, Badge, IconButton } from '@radix-ui/themes';
import { ShoppingCart, Package, CheckCircle, AlertCircle, X } from 'lucide-react';
import { stock } from '@/lib/api/facade';
import { DEFAULT_UNIT, resolveUnitForItem } from '@/config/units';
import SearchableSelect from '@/components/common/SearchableSelect';
import SelectionSummary from '@/components/common/SelectionSummary';
import DetailsRow from './DetailsRow';
import FormActions from './FormActions';

// eslint-disable-next-line complexity
function PurchaseRequestForm({ onSubmit, loading = false, onCancel, submitLabel = 'Créer', compact = false }) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [urgency, setUrgency] = useState('normal');
  const [requestedBy, setRequestedBy] = useState('');
  const [allStockItems, setAllStockItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [unit, setUnit] = useState(DEFAULT_UNIT);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    stock.fetchStockItems()
      .then((items) => setAllStockItems(items))
      .catch(console.error);
  }, []);

  useEffect(() => {
    setUnit(resolveUnitForItem(selectedItem));
  }, [selectedItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const finalName = requestedBy.trim() || 'Système';
    const finalLabel = selectedItem ? selectedItem.name : searchTerm;

    if (!finalLabel.trim()) {
      setFormError("Entrez un nom d'article");
      return;
    }

    const data = {
      item_label: finalLabel,
      quantity: parseInt(quantity, 10),
      unit,
      urgency,
      requested_by: finalName,
      stock_item_id: selectedItem?.isSpecialRequest ? null : (selectedItem?.id || null)
    };

    await onSubmit(data);

    setSelectedItem(null);
    setQuantity('1');
    setUrgency('normal');
    setRequestedBy('');
    setSearchTerm('');
    setUnit(DEFAULT_UNIT);
  };

  const submitDisabled = loading || !searchTerm.trim() || parseInt(quantity, 10) < 1 || !requestedBy.trim();

  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)', overflow: 'visible' }}>
      <Flex direction='column' gap={compact ? '2' : '3'}>
        <Flex align='center' gap='2'>
          <ShoppingCart size={20} color='var(--blue-9)' />
          <Text size='3' weight='bold' color='blue'>
            Nouvelle demande d&apos;achat
          </Text>
        </Flex>

        {!compact && (
          <Text size='2' color='gray'>Remplissez les informations ci-dessous</Text>
        )}

        {formError && (
          <Box
            aria-live='polite'
            id='purchase-form-error'
            style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: 6, padding: 12 }}
          >
            <Text color='red' weight='medium'>{formError}</Text>
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction='column' gap={compact ? '2' : '3'}>
            <Box style={{ position: 'relative', zIndex: 5 }}>
              <SearchableSelect
                items={allStockItems}
                label="Article"
                onChange={(item) => setSelectedItem(item)}
                value={selectedItem?.id}
                getDisplayText={(item) => item?.name || item?.ref || ''}
                getSearchableFields={(item) => [item?.name, item?.ref]}
                maxSuggestions={8}
                onSearchChange={(value) => setSearchTerm(value)}
                renderItem={(item) => (
                  <Flex align='center' justify='between' gap='2'>
                    <Flex align='center' gap='2'>
                      <Badge color='blue' variant='soft' size='1'>{item.ref}</Badge>
                      <Text size='2' weight='bold'>{item.name}</Text>
                    </Flex>
                    <Flex align='center' gap='1'>
                      <Package size={12} color='var(--gray-11)' />
                      <Text size='1' color='gray'>{item.quantity || 0} {item.unit || 'pcs'}</Text>
                    </Flex>
                  </Flex>
                )}
              />
              
              {selectedItem && (
                <SelectionSummary
                  variant={selectedItem.isSpecialRequest ? 'special' : 'stock'}
                  badgeText={selectedItem.isSpecialRequest ? 'Demande spéciale' : (selectedItem.ref || '')}
                  mainText={selectedItem.name}
                  rightText={selectedItem.isSpecialRequest ? undefined : `${selectedItem.quantity || 0} ${selectedItem.unit || 'pcs'}`}
                  onClear={() => {
                    setSearchTerm(selectedItem.name);
                    setSelectedItem(null);
                  }}
                />
              )}
            </Box>

            <DetailsRow
              compact={compact}
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
              compact={compact}
              onCancel={onCancel}
              submitDisabled={submitDisabled}
              loading={loading}
              submitLabel={submitLabel}
            />
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

PurchaseRequestForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  onCancel: PropTypes.func,
  submitLabel: PropTypes.string,
  compact: PropTypes.bool
};

PurchaseRequestForm.defaultProps = {
  loading: false,
  onCancel: undefined,
  submitLabel: 'Créer',
  compact: false
};

export default PurchaseRequestForm;
