import { useState, useEffect, useMemo } from "react";
import PropTypes from 'prop-types';
import { useError } from '@/contexts/ErrorContext';
import {
  Box,
  Flex,
  Text,
  Table,
  Badge,
  Checkbox,
  Card,
  Button,
} from "@radix-ui/themes";
import { CheckCircle, AlertCircle } from "lucide-react";
import ManufacturerBadge from "@/components/common/ManufacturerBadge";
import ManufacturerFormFields from "@/components/purchase/manufacturers/ManufacturerFormFields";
import SupplierReferenceForm from "@/components/purchase/suppliers/SupplierReferenceForm";
import { manufacturerItems } from "@/lib/api/facade";

export default function SupplierRefsInlinePanel({
  stockItem,
  suppliers,
  refs,
  formData,
  setFormData,
  onAdd,
  onUpdatePreferred,
  onDelete,
  loading,
  allManufacturers = [],
}) {
  const { showError } = useError();
  const [isLoadingInitial, setIsLoadingInitial] = useState(false);
  // État pour éditer le fabricant d'une référence existante
  const [editingRefId, setEditingRefId] = useState(null);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState(null);
  const [isSavingManufacturer, setIsSavingManufacturer] = useState(false);

  // Ne plus relancer d'appel si aucune ref : afficher l'empty state directement
  useEffect(() => {
    setIsLoadingInitial(false);
  }, [refs.length]);
  
  // Reset form when refs are added successfully
  useEffect(() => {
    // This effect detects when a new ref has been added (external refs update)
    // and resets the form fields
    if (formData.supplier_ref && refs.length > 0) {
      // Check if the last ref added matches our form data
      const lastRef = refs[refs.length - 1];
      if (lastRef?.supplierRef === (formData.supplier_ref || '').trim()) {
        // Form was successfully submitted, reset it
        setFormData({
          supplier_id: '',
          supplier_ref: '',
          unit_price: '',
          delivery_time_days: '',
          is_preferred: false,
        });
      }
    }
  }, [refs, formData, setFormData]);
  
  const preferredCount = useMemo(
    () => refs.filter((r) => r.isPreferred).length,
    [refs]
  );

  const handleAdd = () => {
    onAdd(stockItem.id);
  };

  // Fonctions pour éditer le fabricant d'une référence existante
  const startEditingManufacturer = (ref) => {
    setEditingRefId(ref.id);
    const mObj = ref.manufacturer_item_id || ref.manufacturer_item || null;
    setSelectedManufacturerId(mObj?.id || null);
  };

  const cancelEditingManufacturer = () => {
    setEditingRefId(null);
    setSelectedManufacturerId(null);
  };

  const handleSelectManufacturer = (ref) => {
    setSelectedManufacturerId(ref.id);
  };

  const handleCreateManufacturer = async (manufacturerData) => {
    if (!editingRefId) return;
    setIsSavingManufacturer(true);
    try {
      let manu_id = null;
      
      // Si c'est une référence existante (a un id), on l'utilise directement
      if (manufacturerData.id) {
        manu_id = manufacturerData.id;
      } else if (manufacturerData.manufacturer_name || manufacturerData.manufacturer_ref) {
        // Sinon on crée une nouvelle référence
        const manu = await manufacturerItems.getOrCreateManufacturerItem({
          name: manufacturerData.manufacturer_name.trim(),
          ref: manufacturerData.manufacturer_ref.trim(),
          designation: manufacturerData.designation?.trim() || "",
        });
        manu_id = manu?.id || null;
      }
      
      // On envoie seulement l'ID de la relation
      await onUpdatePreferred(editingRefId, {
        manufacturer_item_id: manu_id,
      });
      
      cancelEditingManufacturer();
    } catch (err) {
      console.error('Erreur mise à jour fabricant:', err);
      showError(err instanceof Error ? err : new Error('Erreur lors de la mise à jour'));
    } finally {
      setIsSavingManufacturer(false);
    }
  };



  return (
    <Box p="4">
      <Flex direction="column" gap="4">
        <Flex align="center" justify="between" wrap="wrap" gap="3">
          <Flex align="center" gap="2">
            <CheckCircle size={16} color="var(--blue-9)" />
            <Text weight="bold" size="3">
              Références pour {stockItem?.name || ""}
            </Text>
          </Flex>
          <Flex align="center" gap="2">
            <Badge color="blue" variant="solid">
              {refs.length} référence{refs.length > 1 ? "s" : ""}
            </Badge>
            <Badge color="green" variant="soft">
              {preferredCount} préféré{preferredCount > 1 ? "s" : ""}
            </Badge>
          </Flex>
        </Flex>

        <Card>
          <Flex direction="column" gap="3">
            <Text weight="bold" size="2">
              Références existantes
            </Text>
            {isLoadingInitial ? (
              <Flex align="center" gap="2" direction="column" style={{ padding: '12px' }}>
                <Text size="2" color="gray">Chargement des références...</Text>
              </Flex>
            ) : refs.length === 0 ? (
              <Flex align="center" gap="2" color="gray" direction="column" style={{ padding: '12px' }}>
                <Flex align="center" gap="2">
                  <AlertCircle size={16} color="var(--amber-9)" />
                  <Text size="2" weight="bold" color="gray">Aucune référence fournisseur définie</Text>
                </Flex>
                <Text size="1" color="gray">Vous devez ajouter au moins une référence pour pouvoir utiliser cet article dans les demandes d'achat.</Text>
              </Flex>
            ) : (
              <Table.Root>
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Référence</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Délai</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Préféré</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {refs.map((ref) => {
                    // Normalize supplier_id to primitive
                    const supplierId = typeof ref.supplier === 'object' 
                      ? ref.supplier?.id 
                      : ref.supplier;
                    
                    const supplierName =
                      ref.supplier?.name ||
                      suppliers.find((s) => String(s.id) === String(supplierId))?.name ||
                      (typeof supplierId === 'string' || typeof supplierId === 'number' ? String(supplierId) : null) ||
                      "N/A";

                    // Optional manufacturer info (from relation only):
                    const mObj = ref.manufacturer_item_id || ref.manufacturer_item || ref.manufacturerItem || null;
                    const manufacturerName = mObj?.manufacturer_name || mObj?.manufacturerName || null;
                    const manufacturerRef = mObj?.manufacturer_ref || mObj?.manufacturerRef || null;
                    const manufacturerDesignation = mObj?.designation || null;

                    return (
                      <Table.Row
                        key={ref.id}
                        style={{
                          background: ref.isPreferred ? "var(--green-2)" : undefined,
                        }}
                      >
                        <Table.Cell>
                          <Text size="2" weight={ref.is_preferred ? "bold" : "regular"}>
                            {supplierName}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex direction="column" gap="1">
                            <Text size="2" weight={ref.isPreferred ? "bold" : "regular"}>
                              {ref.supplierRef}
                            </Text>
                            {manufacturerName || manufacturerRef ? (
                              <ManufacturerBadge
                                name={manufacturerName}
                                reference={manufacturerRef}
                                designation={manufacturerDesignation}
                              />
                            ) : (
                              <Text size="1" color="gray">
                                Pas de fabricant
                              </Text>
                            )}
                          </Flex>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">{ref.deliveryTimeDays ? `${ref.deliveryTimeDays}j` : "-"}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex align="center">
                            <Checkbox
                              checked={ref.isPreferred}
                              onCheckedChange={(checked) =>
                                onUpdatePreferred(ref.id, { is_preferred: checked })
                              }
                            />
                          </Flex>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap="1">
                            <Button
                              size="1"
                              color="green"
                              variant="soft"
                              title="Utiliser cette référence pour les futures demandes d'achat"
                              onClick={() => {
                                if (!ref.isPreferred) {
                                  onUpdatePreferred(ref.id, { is_preferred: true });
                                }
                              }}
                              disabled={ref.isPreferred}
                            >
                              {ref.isPreferred ? "✓ Utilisée" : "Utiliser"}
                            </Button>
                            <Button
                              size="1"
                              color="blue"
                              variant="soft"
                              title="Ajouter/modifier les informations fabricant"
                              onClick={() => startEditingManufacturer(ref)}
                            >
                              Fabricant
                            </Button>
                            <Button
                              size="1"
                              color="red"
                              variant="soft"
                              onClick={() => onDelete(ref.id)}
                            >
                              Supprimer
                            </Button>
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table.Root>
            )}
          </Flex>
        </Card>

        {/* Formulaire d'édition du fabricant pour une référence existante */}
        {editingRefId && (
          <Card style={{ background: "var(--blue-1)", borderLeft: "4px solid var(--blue-9)" }}>
            <Flex direction="column" gap="3">
              <Flex align="center" justify="between">
                <Text weight="bold" size="2">
                  Ajouter/Modifier les informations fabricant
                </Text>
              </Flex>
              <ManufacturerFormFields
                selectedRefId={selectedManufacturerId}
                onSelectRef={handleSelectManufacturer}
                onCreateRef={handleCreateManufacturer}
                availableRefs={allManufacturers}
                loading={isSavingManufacturer}
              />
              <Flex gap="1" mt="3">
                <Button
                  size="2"
                  variant="soft"
                  color="gray"
                  onClick={cancelEditingManufacturer}
                >
                  Annuler
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}
        <SupplierReferenceForm
          suppliers={suppliers}
          formData={formData}
          setFormData={setFormData}
          onAdd={handleAdd}
          stockItemId={stockItem.id}
          loading={loading}
        />
      </Flex>
    </Box>
  );
}

// ===== PROP TYPES =====
SupplierRefsInlinePanel.propTypes = {
  stockItem: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string,
  }).isRequired,
  suppliers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ),
  refs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      supplier_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
      supplier_ref: PropTypes.string,
      unit_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      delivery_time_days: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      is_preferred: PropTypes.bool,
      manufacturer_item_id: PropTypes.object,
      manufacturer_name: PropTypes.string,
      manufacturer_ref: PropTypes.string,
      manufacturer_designation: PropTypes.string,
    })
  ),
  formData: PropTypes.shape({
    supplier_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    supplier_ref: PropTypes.string,
    unit_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    delivery_time_days: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    is_preferred: PropTypes.bool,
  }),
  setFormData: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onUpdatePreferred: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  allManufacturers: PropTypes.array,
};
