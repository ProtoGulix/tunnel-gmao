import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Card,
  Flex,
  Box,
  Button,
  TextField,
  Text,
  Select,
  Badge,
} from "@radix-ui/themes";
import { Search, Plus, CheckCircle, Link as LinkIcon, FileText } from "lucide-react";
import { stock } from "@/lib/api/facade";
import { useStockSubFamilies } from "@/hooks/useStockFamilies";
import StockItemSearchDropdown from "./StockItemSearchDropdown";
import { generateStockReference } from "@/lib/utils/stockReferenceGenerator";

export default function StockItemLinkForm({
  requestId,
  initialItemLabel,
  onLinkExisting,
  onCreateNew,
  loading,
  stockFamilies = [],
}) {
  const [formTab, setFormTab] = useState("search");
  const [formSearchTerm, setFormSearchTerm] = useState(initialItemLabel || "");
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemSpecs, setSelectedItemSpecs] = useState([]);

  // New item form
  const [newItemName, setNewItemName] = useState(initialItemLabel || "");
  const [newItemFamilyCode, setNewItemFamilyCode] = useState("");
  const [newItemSubFamilyCode, setNewItemSubFamilyCode] = useState("");
  const [newItemSpec, setNewItemSpec] = useState("");
  const [newItemDimension, setNewItemDimension] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("pcs");
  const [newItemLocation, setNewItemLocation] = useState("");

  // Load sub-families
  const { subFamilies } = useStockSubFamilies(newItemFamilyCode);

  // Mémoïser loadSpecs pour éviter re-renders inutiles
  const loadSpecs = useCallback(async (stockItemId) => {
    try {
      const specs = await stock.fetchStockItemStandardSpecs(stockItemId);
      setSelectedItemSpecs(specs);
    } catch (error) {
      console.error("Erreur chargement specs:", error);
      setSelectedItemSpecs([]);
    }
  }, []);

  // Load specs when item is selected
  useEffect(() => {
    if (selectedItem) {
      loadSpecs(selectedItem.id);
    } else {
      setSelectedItemSpecs([]);
    }
  }, [selectedItem, loadSpecs]);

  const handleLinkClick = () => {
    if (selectedItem) {
      onLinkExisting(requestId, selectedItem);
    }
  };

  const handleCreateClick = () => {
    if (newItemName.trim() && newItemFamilyCode && newItemSubFamilyCode && newItemDimension.trim()) {
      onCreateNew(requestId, {
        name: newItemName.trim(),
        family_code: newItemFamilyCode,
        sub_family_code: newItemSubFamilyCode,
        spec: newItemSpec.trim() || null,
        dimension: newItemDimension.trim(),
        unit: newItemUnit,
        location: newItemLocation.trim() || null,
      });
    }
  };

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Flex gap="2">
          <Button
            variant={formTab === "search" ? "solid" : "soft"}
            size="2"
            onClick={() => setFormTab("search")}
          >
            <Search size={14} /> Rechercher
          </Button>
          <Button
            variant={formTab === "create" ? "solid" : "soft"}
            size="2"
            onClick={() => {
              setFormTab("create");
              // Pré-remplir le nom si on a un terme de recherche
              if (formSearchTerm && !newItemName) {
                setNewItemName(formSearchTerm);
              }
            }}
          >
            <Plus size={14} /> Créer
          </Button>
        </Flex>

        {formTab === "search" && (
          <Flex direction="column" gap="2">
            <StockItemSearchDropdown
              value={formSearchTerm}
              onChange={setFormSearchTerm}
              onSelect={setSelectedItem}
              selectedItem={selectedItem}
              placeholder="Rechercher un article..."
              maxSuggestions={20}
            />

            {selectedItem && (
              <Card style={{ background: "var(--green-2)" }}>
                <Flex direction="column" gap="2">
                  <Flex gap="2" align="center">
                    <CheckCircle size={16} color="var(--green-9)" />
                    <Box flex="1">
                      <Text weight="bold">{selectedItem.name}</Text>
                      <Badge color="blue" variant="soft" size="1" ml="2">
                        {selectedItem.ref}
                      </Badge>
                    </Box>
                    <Button
                      size="1"
                      variant="ghost"
                      onClick={() => {
                        setSelectedItem(null);
                        setFormSearchTerm('');
                      }}
                    >
                      ✕
                    </Button>
                  </Flex>
                  {selectedItemSpecs.length > 0 && (() => {
                    const defaultSpec = selectedItemSpecs.find(s => s.isDefault) || selectedItemSpecs[0];
                    return (
                      <Box
                        p="2"
                        style={{
                          background: "var(--green-1)",
                          borderRadius: "var(--radius-2)",
                        }}
                      >
                        <Flex direction="column" gap="1">
                          <Flex align="center" gap="2">
                            <FileText size={14} color="var(--blue-9)" />
                            <Text size="2" weight="bold">
                              {defaultSpec.title}
                            </Text>
                            {defaultSpec.isDefault && (
                              <Badge color="green" size="1" variant="soft">Par défaut</Badge>
                            )}
                          </Flex>
                          <Text size="1" color="gray">
                            {defaultSpec.value} {defaultSpec.unit || ''}
                          </Text>
                          {selectedItemSpecs.length > 1 && (
                            <Text size="1" color="blue">
                              +{selectedItemSpecs.length - 1} autre{selectedItemSpecs.length > 2 ? 's' : ''}
                            </Text>
                          )}
                        </Flex>
                      </Box>
                    );
                  })()}
                </Flex>
              </Card>
            )}

            {selectedItem && (
              <Button onClick={handleLinkClick} disabled={loading} size="2">
                <LinkIcon size={16} />
                {loading ? "Liaison..." : "Lier cet article"}
              </Button>
            )}
          </Flex>
        )}

        {formTab === "create" && (
          <Flex direction="column" gap="3">
            <TextField.Root
              placeholder="Nom de l'article *"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              size="2"
            />
            
            <Flex gap="2">
              <Box style={{ flex: 1 }}>
                <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
                  Famille *
                </Text>
                <Select.Root 
                  value={newItemFamilyCode} 
                  onValueChange={(value) => {
                    setNewItemFamilyCode(value);
                    setNewItemSubFamilyCode("");
                  }} 
                  size="2"
                >
                  <Select.Trigger placeholder="Sélectionner..." />
                  <Select.Content>
                    {stockFamilies.map((family) => (
                      <Select.Item key={family.code} value={family.code}>
                        {family.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>

              <Box style={{ flex: 1 }}>
                <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
                  Sous-famille *
                </Text>
                <Select.Root 
                  value={newItemSubFamilyCode} 
                  onValueChange={setNewItemSubFamilyCode}
                  disabled={!newItemFamilyCode}
                  size="2"
                >
                  <Select.Trigger placeholder="Sélectionner..." />
                  <Select.Content>
                    {subFamilies.map((subFamily) => (
                      <Select.Item key={subFamily.code} value={subFamily.code}>
                        {subFamily.label}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>
            </Flex>

            <Flex gap="2">
              <TextField.Root
                placeholder="Spécification (optionnel)"
                value={newItemSpec}
                onChange={(e) => setNewItemSpec(e.target.value)}
                size="2"
                style={{ flex: 1 }}
              />
              <TextField.Root
                placeholder="Dimension *"
                value={newItemDimension}
                onChange={(e) => setNewItemDimension(e.target.value)}
                size="2"
                style={{ flex: 1 }}
              />
            </Flex>

            <Flex gap="2">
              <Box style={{ flex: 1 }}>
                <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
                  Unité
                </Text>
                <Select.Root value={newItemUnit} onValueChange={setNewItemUnit} size="2">
                  <Select.Trigger />
                  <Select.Content>
                    <Select.Item value="pcs">Pièces</Select.Item>
                    <Select.Item value="m">Mètres</Select.Item>
                    <Select.Item value="kg">Kg</Select.Item>
                    <Select.Item value="l">Litres</Select.Item>
                    <Select.Item value="boite">Boîte</Select.Item>
                    <Select.Item value="rouleau">Rouleau</Select.Item>
                  </Select.Content>
                </Select.Root>
              </Box>

              <TextField.Root
                placeholder="Localisation"
                value={newItemLocation}
                onChange={(e) => setNewItemLocation(e.target.value)}
                size="2"
                style={{ flex: 1 }}
              />
            </Flex>

            <Box>
              <Text size="1" color="gray" style={{ display: "block", marginBottom: "4px" }}>
                Référence auto-générée : {generateStockReference({
                  family_code: newItemFamilyCode,
                  sub_family_code: newItemSubFamilyCode,
                  spec: newItemSpec,
                  dimension: newItemDimension,
                })}
              </Text>
            </Box>

            <Button
              onClick={handleCreateClick}
              disabled={!newItemName.trim() || !newItemFamilyCode || !newItemSubFamilyCode || !newItemDimension.trim() || loading}
              size="2"
            >
              <Plus size={16} />
              {loading ? "Création..." : "Créer et lier"}
            </Button>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

StockItemLinkForm.propTypes = {
  requestId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  initialItemLabel: PropTypes.string,
  onLinkExisting: PropTypes.func.isRequired,
  onCreateNew: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  stockFamilies: PropTypes.array,
};
