import { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useError } from '@/contexts/ErrorContext';
import { 
  Dialog, 
  Flex, 
  Box, 
  Text, 
  Button, 
  TextField,
  Card,
  Tabs,
  Select,
  Separator
} from '@radix-ui/themes';
import { Search, Plus, Link, CheckCircle, AlertCircle } from 'lucide-react';
import { fetchStockItems, createStockItem, updatePurchaseRequest } from '@/lib/api';
import { normalizeText } from '@/lib/utils/textUtils';

/**
 * Dialog de liaison entre une demande d'achat et un article du stock
 * Permet de rechercher un article existant ou d'en créer un nouveau
 * 
 * ✅ Implémenté :
 * - Recherche temps réel avec normalisation de texte
 * - Création rapide d'article avec validation
 * - Tabs pour switcher entre recherche et création
 * - Pré-remplissage depuis request.item_label
 * 
 * TODO: Améliorations futures :
 * - Debounce sur la recherche (300ms) pour réduire les re-rendus
 * - Afficher catégorie/famille dans les résultats de recherche
 * - Suggestion "Créer" directement depuis résultats vides
 * - Validation côté client (regex pour ref, longueur min pour nom)
 * - Historique des articles récemment liés (localStorage)
 * - Import en masse CSV pour création multiple
 * - Prévisualisation des specs standard de l'article sélectionné
 */
export default function StockItemLinkDialog({ 
  request, 
  isOpen, 
  onClose, 
  onSuccess 
}) {
  const { showError } = useError();
  // ----- State -----
  const [activeTab, setActiveTab] = useState('search');
  const [loading, setLoading] = useState(false);
  
  // Search existing
  const [searchTerm, setSearchTerm] = useState(request?.item_label || '');
  const [allStockItems, setAllStockItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Create new
  const [newItemName, setNewItemName] = useState(request?.item_label || '');
  const [newItemRef, setNewItemRef] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('pcs');
  const [newItemMinStock, setNewItemMinStock] = useState('0');

  // ----- Load stock items -----
  const loadStockItems = useCallback(async () => {
    try {
      const items = await fetchStockItems();
      setAllStockItems(items);
    } catch (error) {
      showError(error instanceof Error ? error : new Error("Erreur lors du chargement du stock"));
    }
  }, [showError]);

  useEffect(() => {
    if (isOpen) {
      loadStockItems();
    }
  }, [isOpen, loadStockItems]);

  // ----- Search filter with memoization -----
  // TODO: Ajouter debounce (300ms) pour éviter filtrage à chaque frappe
  const filteredItems = useMemo(() => {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const normalizedTerm = normalizeText(searchTerm.toLowerCase());
    const filtered = allStockItems.filter(item => {
      const normalizedName = normalizeText((item.name || '').toLowerCase());
      const normalizedRef = normalizeText((item.ref || '').toLowerCase());
      return normalizedName.includes(normalizedTerm) || normalizedRef.includes(normalizedTerm);
    });

    return filtered.slice(0, 20);
  }, [searchTerm, allStockItems]);

  // ----- Link existing item -----
  const handleLinkExisting = useCallback(async () => {
    if (!selectedItem) return;

    try {
      setLoading(true);
      await updatePurchaseRequest(request.id, {
        stock_item_id: selectedItem.id,
        item_label: selectedItem.name
      });
      onSuccess();
      onClose();
    } catch (error) {
      showError(error instanceof Error ? error : new Error("Erreur lors de la liaison avec l'article"));
    } finally {
      setLoading(false);
    }
  }, [selectedItem, request.id, onSuccess, onClose, showError]);

  // ----- Create new item -----
  const handleCreateNew = useCallback(async () => {
    if (!newItemName.trim() || !newItemRef.trim()) {
      showError(new Error("Le nom et la référence sont obligatoires"));
      return;
    }

    try {
      setLoading(true);

      // Create stock item
      const newStockItem = await createStockItem({
        name: newItemName.trim(),
        ref: newItemRef.trim(),
        category: newItemCategory.trim() || null,
        unit: newItemUnit,
        min_stock: parseInt(newItemMinStock) || 0,
        current_stock: 0
      });

      // Link to purchase request
      await updatePurchaseRequest(request.id, {
        stock_item_id: newStockItem.id,
        item_label: newStockItem.name
      });

      onSuccess();
      onClose();
    } catch (error) {
      showError(error instanceof Error ? error : new Error("Erreur lors de la création de l'article"));
    } finally {
      setLoading(false);
    }
  }, [newItemName, newItemRef, newItemCategory, newItemUnit, newItemMinStock, request.id, onSuccess, onClose, showError]);

  // ----- Reset on close -----
  const handleClose = useCallback(() => {
    setActiveTab('search');
    setSearchTerm(request?.item_label || '');
    setSelectedItem(null);
    setNewItemName(request?.item_label || '');
    setNewItemRef('');
    setNewItemCategory('');
    setNewItemUnit('pcs');
    setNewItemMinStock('0');
    onClose();
  }, [request?.item_label, onClose]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Dialog.Content style={{ maxWidth: 600 }}>
        <Dialog.Title>
          Lier à un article du stock
        </Dialog.Title>

        <Dialog.Description size="2" mb="4">
          Demande: <Text weight="bold">{request?.item_label}</Text> ({request?.quantity} unités)
        </Dialog.Description>

        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Trigger value="search">
              <Search size={14} /> Rechercher
            </Tabs.Trigger>
            <Tabs.Trigger value="create">
              <Plus size={14} /> Créer
            </Tabs.Trigger>
          </Tabs.List>

          <Box pt="4">
            {/* TAB: Search existing */}
            <Tabs.Content value="search">
              <Flex direction="column" gap="3">
                
                <TextField.Root
                  placeholder="Nom ou référence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="3"
                >
                  <TextField.Slot>
                    <Search size={16} />
                  </TextField.Slot>
                </TextField.Root>

                {selectedItem && (
                  <Card style={{ background: 'var(--green-2)' }}>
                    <Flex gap="2" align="center">
                      <CheckCircle size={16} color="var(--green-9)" />
                      <Box flex="1">
                        <Text weight="bold">{selectedItem.name}</Text>
                        <Text color="gray" size="2"> • Réf: {selectedItem.ref}</Text>
                      </Box>
                      <Button 
                        size="1" 
                        variant="ghost" 
                        color="gray"
                        onClick={() => setSelectedItem(null)}
                      >
                        ✕
                      </Button>
                    </Flex>
                  </Card>
                )}

                {!selectedItem && filteredItems.length > 0 && (
                  <Box 
                    style={{ 
                      maxHeight: '300px', 
                      overflow: 'auto',
                      border: '1px solid var(--gray-6)',
                      borderRadius: 'var(--radius-3)'
                    }}
                  >
                    <Flex direction="column" gap="1" p="2">
                      {filteredItems.map((item) => (
                        <Card
                          key={item.id}
                          style={{ 
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onClick={() => setSelectedItem(item)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--accent-3)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '';
                          }}
                        >
                          <Flex justify="between" align="center">
                            <Box>
                              <Text weight="medium">{item.name}</Text>
                              <Text color="gray" size="2">Réf: {item.ref}</Text>
                            </Box>
                            <Button size="1" variant="soft">
                              Sélectionner
                            </Button>
                          </Flex>
                        </Card>
                      ))}
                    </Flex>
                  </Box>
                )}

                {!selectedItem && searchTerm.length >= 2 && filteredItems.length === 0 && (
                  <Card>
                    <Flex direction="column" align="center" gap="2" p="3">
                      <AlertCircle size={24} color="var(--gray-9)" />
                      <Text color="gray">Aucun article trouvé</Text>
                      <Button 
                        variant="soft" 
                        color="blue"
                        onClick={() => setActiveTab('create')}
                      >
                        Créer un nouvel article
                      </Button>
                    </Flex>
                  </Card>
                )}
              </Flex>
            </Tabs.Content>

            {/* TAB: Create new */}
            <Tabs.Content value="create">
              <Flex direction="column" gap="3">
                
                <Box>
                  <Text size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                    Nom de l&apos;article <Text color="red">*</Text>
                  </Text>
                  <TextField.Root
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    placeholder="Ex: Câble Ethernet RJ45"
                    size="2"
                  />
                </Box>

                <Box>
                  <Text size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                    Référence <Text color="red">*</Text>
                  </Text>
                  <TextField.Root
                    value={newItemRef}
                    onChange={(e) => setNewItemRef(e.target.value)}
                    placeholder="Ex: CBL-ETH-001"
                    size="2"
                  />
                </Box>

                <Box>
                  <Text size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                    Catégorie
                  </Text>
                  <TextField.Root
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    placeholder="Ex: Électrique, Mécanique..."
                    size="2"
                  />
                </Box>

                <Flex gap="3">
                  <Box flex="1">
                    <Text size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                      Unité
                    </Text>
                    <Select.Root value={newItemUnit} onValueChange={setNewItemUnit} size="2">
                      <Select.Trigger />
                      <Select.Content>
                        <Select.Item value="pcs">Pièces (pcs)</Select.Item>
                        <Select.Item value="m">Mètres (m)</Select.Item>
                        <Select.Item value="kg">Kilogrammes (kg)</Select.Item>
                        <Select.Item value="l">Litres (l)</Select.Item>
                        <Select.Item value="box">Boîte</Select.Item>
                        <Select.Item value="roll">Rouleau</Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </Box>

                  <Box flex="1">
                    <Text size="2" weight="medium" mb="1" style={{ display: 'block' }}>
                      Stock min.
                    </Text>
                    <TextField.Root
                      type="number"
                      value={newItemMinStock}
                      onChange={(e) => setNewItemMinStock(e.target.value)}
                      placeholder="0"
                      size="2"
                    />
                  </Box>
                </Flex>

              </Flex>
            </Tabs.Content>
          </Box>
        </Tabs.Root>

        <Separator size="4" my="4" />

        <Flex gap="3" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Annuler
            </Button>
          </Dialog.Close>

          {activeTab === 'search' && (
            <Button 
              onClick={handleLinkExisting}
              disabled={!selectedItem || loading}
            >
              <Link size={16} />
              {loading ? 'Liaison...' : 'Lier cet article'}
            </Button>
          )}

          {activeTab === 'create' && (
            <Button 
              onClick={handleCreateNew}
              disabled={!newItemName.trim() || !newItemRef.trim() || loading}
            >
              <Plus size={16} />
              {loading ? 'Création...' : 'Créer et lier'}
            </Button>
          )}
        </Flex>

      </Dialog.Content>
    </Dialog.Root>
  );
}

StockItemLinkDialog.propTypes = {
  request: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    item_label: PropTypes.string,
    quantity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
};
