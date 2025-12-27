// ===== IMPORTS =====
// 1. React core
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

// 2. UI Libraries (Radix)
import { 
  Box, 
  Flex, 
  Text, 
  Button, 
  Select,
  Badge
} from '@radix-ui/themes';

// 3. Icons (Lucide React)
import { CheckCircle, AlertCircle, Search, Package, HelpCircle } from 'lucide-react';

// 4. Utils
import { stock } from '@/lib/api/facade';
import { normalizeText } from '@/lib/utils/textUtils';

// 5. Config
import { UNIT_OPTIONS, DEFAULT_UNIT, resolveUnitForItem } from '@/config/units';

// ===== COMPONENT =====
/**
 * Formulaire réutilisable pour créer une demande d&apos;achat
 * Utilisé dans PurchaseRequestForm et InterventionTabs
 * @param {Object} props - Props du composant
 * @param {Function} props.onSubmit - Callback de soumission avec les données de la demande
 * @param {boolean} [props.loading=false] - État de chargement
 * @param {Function} [props.onCancel] - Callback d&apos;annulation (optionnel)
 * @param {string} [props.submitLabel='Créer'] - Label du bouton de soumission
 * @param {boolean} [props.compact=false] - Mode compact pour intégration dans d&apos;autres formulaires
 * @returns {JSX.Element} Formulaire de demande d&apos;achat
 */
export default function PurchaseRequestFormBody({
  onSubmit,
  loading = false,
  onCancel,
  submitLabel = 'Créer',
  compact = false
}) {
  // ----- State -----
  const [itemSearch, setItemSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState('1');
  const [urgency, setUrgency] = useState('normal');
  const [requestedBy, setRequestedBy] = useState('');
  const [allStockItems, setAllStockItems] = useState([]);
  const [unit, setUnit] = useState(DEFAULT_UNIT);
  const [formError, setFormError] = useState('');

  // Load stock items once for suggestions
  useEffect(() => {
    stock.fetchStockItems().then(setAllStockItems).catch(console.error);
  }, []);

  // Filter suggestions locally (name/ref contains search term)
  const suggestions = itemSearch.length >= 2
    ? allStockItems.filter(item => {
        const term = normalizeText(itemSearch.toLowerCase());
        const name = normalizeText(String(item.name || '').toLowerCase());
        const ref = normalizeText(String(item.ref || '').toLowerCase());
        return name.includes(term) || ref.includes(term);
      }).slice(0, 8)
    : [];

  // Sync unit with selected item (default to item's unit or 'pcs')
  useEffect(() => {
    setUnit(resolveUnitForItem(selectedItem));
  }, [selectedItem]);

  // ----- Submit Handler -----
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    
    const finalName = requestedBy.trim() || 'Système';
    const finalLabel = selectedItem ? selectedItem.name : itemSearch;
    
    if (!finalLabel.trim()) {
      setFormError("Entrez un nom d'article");
      return;
    }

    const data = {
      item_label: finalLabel,
      quantity: parseInt(quantity),
      unit,
      urgency,
      requested_by: finalName,
      stock_item_id: selectedItem?.id || null
    };

    await onSubmit(data);

    // Reset form
    setItemSearch('');
    setSelectedItem(null);
    setQuantity('1');
    setUrgency('normal');
    setRequestedBy('');
    setUnit(DEFAULT_UNIT);
    setFormError('');
  };

  // ----- Main Render -----
  return (
    <form onSubmit={handleSubmit}>
      <Flex direction='column' gap={compact ? '2' : '3'}>
        
        {!compact && (
          <Box mb='2'>
            <Text size='4' weight='bold'>Nouvelle demande d&apos;achat</Text>
            <Text size='2' color='gray' mt='1'>Remplissez les informations ci-dessous</Text>
          </Box>
        )}

        {formError && (
          <Box mb='2' aria-live='polite' id='purchase-form-error' style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: 6, padding: 12 }}>
            <Text color='red' weight='medium'>{formError}</Text>
          </Box>
        )}

        {/* Form Fields */}
        <Flex direction='column' gap={compact ? '2' : '3'}>
          {/* When compact: all on one line with equal heights */}
          {compact ? (
            <>
              <Box>
                <Text size='2' weight='bold' mb='1' style={{ display: 'block' }}>
                  Article
                </Text>
                <div style={{ position: 'relative' }}>
                  <input
                    type='text'
                    placeholder='Référence ou nom'
                    value={itemSearch}
                    onChange={(e) => { setItemSearch(e.target.value); if (selectedItem && e.target.value !== selectedItem.name) setSelectedItem(null); }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-7)',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      paddingLeft: '36px',
                      boxSizing: 'border-box',
                      height: '44px'
                    }}
                    aria-label='Article à rechercher'
                    aria-invalid={Boolean(formError)}
                    aria-describedby={formError ? 'purchase-form-error' : undefined}
                  />
                  <Search size={16} style={{
                    position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                    color: 'var(--gray-9)', pointerEvents: 'none'
                  }} />
                </div>
                {/* Color-coded status box */}
                <Box mt='2' style={{
                  border: selectedItem ? '2px solid var(--green-7)' : (itemSearch.trim() ? '2px solid var(--orange-7)' : '1px dashed var(--gray-6)'),
                  background: selectedItem ? 'var(--green-2)' : (itemSearch.trim() ? 'var(--orange-2)' : 'var(--gray-2)'),
                  borderRadius: '8px',
                  height: '140px',
                  overflowY: 'auto'
                }}>
                  {itemSearch.trim().length === 0 ? (
                    <Flex direction='column' align='center' justify='center' gap='2' style={{ minHeight: '140px' }}>
                      <HelpCircle size={20} color='var(--gray-9)' style={{ flexShrink: 0 }} />
                      <Text size='2' color='gray' weight='medium' style={{ textAlign: 'center' }}>Tapez une référence pour rechercher</Text>
                    </Flex>
                  ) : selectedItem ? (
                    <Flex direction='column' align='center' justify='center' gap='2' style={{ minHeight: '140px', padding: '16px' }}>
                      <CheckCircle size={24} color='var(--green-9)' style={{ flexShrink: 0 }} />
                      <Text size='2' weight='bold' color='green' style={{ textAlign: 'center', wordBreak: 'break-word' }}>{selectedItem.name}</Text>
                      <Flex gap='2' align='center' wrap='wrap' justify='center'>
                        <Badge color='blue' variant='soft' size='1'>{selectedItem.ref}</Badge>
                        <Flex align='center' gap='1'>
                          <Package size={12} color='var(--gray-11)' style={{ flexShrink: 0 }} />
                          <Text size='1' color='gray'>Stock: {selectedItem.quantity || 0} {selectedItem.unit || 'pcs'}</Text>
                        </Flex>
                      </Flex>
                    </Flex>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((item, idx) => (
                              <Box key={item.id} p='2' style={{
                        cursor: 'pointer',
                                borderBottom: idx < suggestions.length - 1 ? '1px solid var(--gray-3)' : 'none',
                                transition: 'background-color 0.15s ease'
                      }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-3)'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      onMouseDown={(e) => { e.preventDefault(); setSelectedItem(item); setItemSearch(item.name || item.ref || ''); }}>
                                <Text size='1' weight='bold' mb='1' style={{ display: 'block', wordBreak: 'break-word' }}>{item.name}</Text>
                                <Flex gap='1' align='center' wrap='wrap'>
                                  <Badge color='blue' variant='soft' size='1' style={{ fontSize: '11px' }}>{item.ref}</Badge>
                          <Flex align='center' gap='1'>
                                    <Package size={10} color='var(--gray-11)' style={{ flexShrink: 0 }} />
                                    <Text size='1' color='gray' style={{ fontSize: '11px' }}>{item.quantity || 0} {item.unit || 'pcs'}</Text>
                          </Flex>
                        </Flex>
                      </Box>
                    ))
                  ) : (
                    <Flex direction='column' align='center' justify='center' gap='2' style={{ minHeight: '140px', padding: '16px' }}>
                              <AlertCircle size={24} color='var(--orange-9)' style={{ flexShrink: 0 }} />
                              <Text size='2' weight='bold' color='orange' style={{ textAlign: 'center' }}>Demande spéciale</Text>
                              <Text size='1' color='gray' style={{ textAlign: 'center', wordBreak: 'break-word', padding: '0 8px' }}>Article non référencé: {itemSearch}</Text>
                    </Flex>
                  )}
                </Box>
              </Box>

              <Flex gap='3' wrap='wrap' mt='2'>
                {/* Quantity */}
                <Box style={{ flex: '0 0 25%', minWidth: '120px' }}>
                  <Text size='2' weight='bold' mb='1' style={{ display: 'block' }}>
                    Quantité
                  </Text>
                  <input
                    type='number'
                    min='1'
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-7)',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      height: '44px'
                    }}
                    inputMode='numeric'
                    pattern='[0-9]*'
                    aria-label='Quantité'
                  />
                </Box>

                {/* Unit */}
                <Box style={{ flex: '0 0 25%', minWidth: '120px' }}>
                  <Text size='2' weight='bold' mb='1' style={{ display: 'block' }}>
                    Unité
                  </Text>
                  <Select.Root value={unit} onValueChange={setUnit}>
                    <Select.Trigger style={{ height: '44px' }} aria-label='Unité' />
                    <Select.Content>
                      {UNIT_OPTIONS.map(({ value, label }) => (
                        <Select.Item key={value} value={value}>{label}</Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>

                {/* Urgence */}
                <Box style={{ flex: '0 0 25%', minWidth: '120px' }}>
                  <Text size='2' weight='bold' mb='1' style={{ display: 'block' }}>
                    Urgence
                  </Text>
                  <Select.Root value={urgency} onValueChange={setUrgency}>
                    <Select.Trigger style={{ height: '44px' }} aria-label='Urgence' />
                    <Select.Content>
                      <Select.Item value='low'>Faible</Select.Item>
                      <Select.Item value='normal'>Normal</Select.Item>
                      <Select.Item value='urgent'>Urgent</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>

                {/* Demandeur */}
                <Box style={{ flex: '1', minWidth: '200px' }}>
                  <Text size='2' weight='bold' mb='1' style={{ display: 'block' }}>
                    Demandeur (optionnel)
                  </Text>
                  <input
                    type='text'
                    placeholder='Votre nom'
                    value={requestedBy}
                    onChange={(e) => setRequestedBy(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-7)',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      height: '44px'
                    }}
                    aria-label='Nom du demandeur'
                  />
                  <Text size='1' color='gray' mt='1' style={{ display: 'block' }}>
                    Laissez vide pour utiliser &quot;Système&quot;
                  </Text>
                </Box>
              </Flex>
            </>
          ) : (
            <>
              {/* Full width layout */}
              {/* Article Search */}
              <Box>
                <Text size='2' weight='bold' mb='2' style={{ display: 'block' }}>
                  Article
                </Text>
                <div style={{ position: 'relative' }}>
                  <input
                    type='text'
                    placeholder='Référence ou nom'
                    value={itemSearch}
                    onChange={(e) => { setItemSearch(e.target.value); if (selectedItem && e.target.value !== selectedItem.name) setSelectedItem(null); }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-7)',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      paddingLeft: '36px',
                      boxSizing: 'border-box'
                    }}
                    aria-label='Article à rechercher'
                    aria-invalid={Boolean(formError)}
                    aria-describedby={formError ? 'purchase-form-error' : undefined}
                  />
                  <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-9)', pointerEvents: 'none' }} />
                </div>
                {/* Color-coded status box */}
                <Box mt='2' style={{
                  border: selectedItem ? '2px solid var(--green-7)' : (itemSearch.trim() ? '2px solid var(--orange-7)' : '1px dashed var(--gray-6)'),
                  background: selectedItem ? 'var(--green-2)' : (itemSearch.trim() ? 'var(--orange-2)' : 'var(--gray-2)'),
                  borderRadius: '8px',
                  height: '180px',
                  overflowY: 'auto'
                }}>
                  {itemSearch.trim().length === 0 ? (
                    <Flex direction='column' align='center' justify='center' gap='2' style={{ minHeight: '180px', padding: '16px' }}>
                      <HelpCircle size={28} color='var(--gray-9)' style={{ flexShrink: 0 }} />
                      <Text size='3' color='gray' weight='medium' style={{ textAlign: 'center' }}>Tapez pour rechercher un article</Text>
                      <Text size='2' color='gray' style={{ textAlign: 'center', maxWidth: '90%' }}>Vous pouvez aussi créer une demande spéciale pour un article non référencé</Text>
                    </Flex>
                  ) : selectedItem ? (
                    <Flex direction='column' align='center' justify='center' gap='2' style={{ minHeight: '180px', padding: '16px' }}>
                      <CheckCircle size={36} color='var(--green-9)' style={{ flexShrink: 0 }} />
                      <Text size='4' weight='bold' color='green' style={{ textAlign: 'center', wordBreak: 'break-word', maxWidth: '95%' }}>{selectedItem.name}</Text>
                      <Flex gap='2' align='center' wrap='wrap' justify='center'>
                        <Badge color='blue' variant='soft' size='2'>{selectedItem.ref}</Badge>
                        <Flex align='center' gap='1'>
                          <Package size={14} color='var(--gray-11)' style={{ flexShrink: 0 }} />
                          <Text size='2' color='gray'>Stock: {selectedItem.quantity || 0} {selectedItem.unit || 'pcs'}</Text>
                        </Flex>
                      </Flex>
                    </Flex>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((item, idx) => (
                      <Box key={item.id} p='3' style={{
                        cursor: 'pointer',
                        borderBottom: idx < suggestions.length - 1 ? '1px solid var(--gray-3)' : 'none',
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--gray-3)'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      onMouseDown={(e) => { e.preventDefault(); setSelectedItem(item); setItemSearch(item.name || item.ref || ''); }}>
                        <Text size='2' weight='bold' mb='1' style={{ display: 'block', wordBreak: 'break-word' }}>{item.name}</Text>
                        <Flex gap='2' align='center' wrap='wrap'>
                          <Badge color='blue' variant='soft' size='1'>{item.ref}</Badge>
                          <Flex align='center' gap='1'>
                            <Package size={12} color='var(--gray-11)' style={{ flexShrink: 0 }} />
                            <Text size='1' color='gray'>{item.quantity || 0} {item.unit || 'pcs'}</Text>
                          </Flex>
                        </Flex>
                      </Box>
                    ))
                  ) : (
                    <Flex direction='column' align='center' justify='center' gap='2' style={{ minHeight: '180px', padding: '16px' }}>
                      <AlertCircle size={36} color='var(--orange-9)' style={{ flexShrink: 0 }} />
                      <Text size='4' weight='bold' color='orange' style={{ textAlign: 'center' }}>Demande spéciale</Text>
                      <Text size='2' color='gray' style={{ textAlign: 'center', wordBreak: 'break-word', maxWidth: '90%' }}>Article non référencé: <strong>{itemSearch}</strong></Text>
                      <Text size='1' color='gray' style={{ textAlign: 'center' }}>Continuez pour créer cette demande</Text>
                    </Flex>
                  )}
                </Box>
              </Box>

              {/* Quantity and Urgency Row */}
              <Flex gap='3' wrap='wrap'>
                <Box style={{ flex: '0 0 140px', minWidth: '100px' }}>
                  <Text size='2' weight='bold' mb='2' style={{ display: 'block' }}>
                    Quantité
                  </Text>
                  <input
                    type='number'
                    min='1'
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-7)',
                      fontSize: '14px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      height: '44px'
                    }}
                    inputMode='numeric'
                    pattern='[0-9]*'
                    aria-label='Quantité'
                  />
                </Box>

                <Box style={{ flex: '0 0 120px', minWidth: '100px' }}>
                  <Text size='2' weight='bold' mb='2' style={{ display: 'block' }}>
                    Unité
                  </Text>
                  <Select.Root value={unit} onValueChange={setUnit}>
                    <Select.Trigger aria-label='Unité' style={{ height: '44px' }} />
                    <Select.Content>
                      {UNIT_OPTIONS.map(({ value, label }) => (
                        <Select.Item key={value} value={value}>{label}</Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>

                <Box style={{ flex: '1', minWidth: '120px' }}>
                  <Text size='2' weight='bold' mb='2' style={{ display: 'block' }}>
                    Urgence
                  </Text>
                  <Select.Root value={urgency} onValueChange={setUrgency}>
                    <Select.Trigger aria-label='Urgence' style={{ height: '44px' }} />
                    <Select.Content>
                      <Select.Item value='low'>Faible</Select.Item>
                      <Select.Item value='normal'>Normal</Select.Item>
                      <Select.Item value='urgent'>Urgent</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </Box>
              </Flex>

              {/* Requester Name */}
              <Box>
                <Text size='2' weight='bold' mb='2' style={{ display: 'block' }}>
                  Demandeur (optionnel)
                </Text>
                <input
                  type='text'
                  placeholder='Votre nom'
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid var(--gray-7)',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box'
                  }}
                  aria-label='Nom du demandeur'
                />
                <Text size='1' color='gray' mt='1' style={{ display: 'block' }}>
                  Laissez vide pour utiliser &quot;Système&quot;
                </Text>
              </Box>
            </>
          )}
        </Flex>

        {/* Action Buttons */}
        <Flex gap='2' justify='end' wrap='wrap' mt={compact ? '1' : '2'}>
          {onCancel && (
            <Button 
              type='button' 
              variant='soft' 
              color='gray'
              size={compact ? '1' : '2'}
              onClick={onCancel}
            >
              Annuler
            </Button>
          )}
          <Button 
            type='submit' 
            size={compact ? '1' : '2'}
            disabled={loading || !itemSearch.trim() || parseInt(quantity) < 1}
          >
            {loading ? '⏳ Création...' : submitLabel}
          </Button>
        </Flex>
      </Flex>
    </form>
  );
}

// ===== PROP TYPES =====
PurchaseRequestFormBody.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  onCancel: PropTypes.func,
  submitLabel: PropTypes.string,
  compact: PropTypes.bool,
};
