/**
 * @fileoverview Panneau inline de gestion des références fournisseur
 * Permet d'ajouter, modifier et supprimer des références fournisseur pour un article de stock.
 * Gère également les informations fabricant associées à chaque référence.
 *
 * @module components/purchase/suppliers/SupplierRefsInlinePanel
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires @/contexts/ErrorContext
 * @requires @/components/common/ManufacturerBadge
 * @requires @/components/purchase/manufacturers/ManufacturerFormFields
 * @requires @/components/purchase/suppliers/SupplierReferenceForm
 * @requires @/lib/api/facade
 */

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

/**
 * Panneau de gestion des références fournisseur pour un article
 * @component
 * 
 * @param {Object} props
 * @param {Object} props.stockItem - Article de stock
 * @param {string|number} props.stockItem.id - ID de l'article
 * @param {string} [props.stockItem.name] - Nom de l'article
 * @param {Array<Object>} props.suppliers - Liste des fournisseurs disponibles
 * @param {Array<Object>} props.refs - Liste des références fournisseur existantes
 * @param {Object} props.formData - Données du formulaire d'ajout
 * @param {Function} props.setFormData - Callback pour mettre à jour le formulaire
 * @param {Function} props.onAdd - Callback pour ajouter une référence
 * @param {Function} props.onUpdatePreferred - Callback pour mettre à jour une référence
 * @param {Function} props.onDelete - Callback pour supprimer une référence
 * @param {boolean} [props.loading=false] - État de chargement
 * @param {Array<Object>} [props.allManufacturers=[]] - Liste des fabricants disponibles
 * @returns {JSX.Element} Panneau de gestion des références
 * 
 * @example
 * <SupplierRefsInlinePanel
 *   stockItem={{ id: 123, name: "Vis M8" }}
 *   suppliers={suppliersList}
 *   refs={referencesList}
 *   formData={formData}
 *   setFormData={setFormData}
 *   onAdd={handleAdd}
 *   onUpdatePreferred={handleUpdate}
 *   onDelete={handleDelete}
 *   loading={isLoading}
 *   allManufacturers={manufacturersList}
 * />
 */
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
    if (formData.supplier_ref && refs.length > 0) {
      const lastRef = refs[refs.length - 1];
      if (lastRef?.supplierRef === (formData.supplier_ref || '').trim()) {
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
      
      if (manufacturerData.id) {
        manu_id = manufacturerData.id;
      } else if (manufacturerData.manufacturer_name || manufacturerData.manufacturer_ref) {
        const manu = await manufacturerItems.getOrCreateManufacturerItem({
          name: manufacturerData.manufacturer_name.trim(),
          ref: manufacturerData.manufacturer_ref.trim(),
          designation: manufacturerData.designation?.trim() || "",
        });
        manu_id = manu?.id || null;
      }
      
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
        {/* En-tête avec compteurs */}
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

        {/* Liste des références existantes */}
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
                <Text size="1" color="gray">
                  Vous devez ajouter au moins une référence pour pouvoir utiliser cet article dans les demandes d&apos;achat.
                </Text>
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
                    const supplierId = typeof ref.supplier === 'object' 
                      ? ref.supplier?.id 
                      : ref.supplier;
                    
                    const supplierName =
                      ref.supplier?.name ||
                      suppliers.find((s) => String(s.id) === String(supplierId))?.name ||
                      (typeof supplierId === 'string' || typeof supplierId === 'number' ? String(supplierId) : null) ||
                      "N/A";

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

        {/* Formulaire d'ajout de référence */}
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
      supplier: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.shape({
          id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
          name: PropTypes.string,
        }),
      ]),
      supplierRef: PropTypes.string,
      supplier_ref: PropTypes.string,
      unit_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      delivery_time_days: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      deliveryTimeDays: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      is_preferred: PropTypes.bool,
      isPreferred: PropTypes.bool,
      manufacturer_item_id: PropTypes.object,
      manufacturer_item: PropTypes.object,
      manufacturerItem: PropTypes.object,
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
  allManufacturers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      manufacturer_name: PropTypes.string,
      manufacturer_ref: PropTypes.string,
      designation: PropTypes.string,
    })
  ),
};
