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

import { useState, useEffect, useMemo, useCallback } from "react";
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
  TextField,
  Select,
  Callout,
} from "@radix-ui/themes";
import { CheckCircle, AlertCircle, Plus, Edit2, Trash2 } from "lucide-react";
import ManufacturerBadge from "@/components/common/ManufacturerBadge";
import ManufacturerFormFields from "@/components/purchase/manufacturers/ManufacturerFormFields";
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
  
  // États de contrôle de formulaire
  const [isAdding, setIsAdding] = useState(false);
  const [editingRefId, setEditingRefId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [error, setError] = useState(null);
  
  // État pour éditer le fabricant
  const [editingManufacturerId, setEditingManufacturerId] = useState(null);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState(null);
  const [isSavingManufacturer, setIsSavingManufacturer] = useState(false);

  // Réinitialise le formulaire
  const resetForm = useCallback(() => {
    setFormData({
      supplier_id: '',
      supplier_ref: '',
      unit_price: '',
      delivery_time_days: '',
      is_preferred: false,
    });
    setError(null);
  }, [setFormData]);

  // Démarre l'ajout
  const startAdd = useCallback(() => {
    resetForm();
    setIsAdding(true);
  }, [resetForm]);

  // Démarre l'édition du fabricant
  const startEditingManufacturer = useCallback((ref) => {
    setEditingManufacturerId(ref.id);
    const mObj = ref.manufacturer_item_id || ref.manufacturer_item || null;
    setSelectedManufacturerId(mObj?.id || null);
    setError(null);
  }, []);

  // Annule l'édition
  const cancelEdit = useCallback(() => {
    setIsAdding(false);
    setEditingRefId(null);
    setEditingManufacturerId(null);
    resetForm();
  }, [resetForm]);

  // Valide et ajoute une référence
  const handleAdd = useCallback(async () => {
    if (!formData.supplier_id || !formData.supplier_ref.trim()) {
      setError('Le fournisseur et la référence sont requis');
      return;
    }
    try {
      await onAdd(stockItem.id);
      setIsAdding(false);
      resetForm();
    } catch (err) {
      setError('Erreur lors de l\'ajout de la référence');
      console.error('Add error:', err);
    }
  }, [formData, onAdd, stockItem.id, resetForm]);

  // Met à jour le fabricant
  const handleCreateManufacturer = useCallback(async (manufacturerData) => {
    if (!editingManufacturerId) return;
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
      
      await onUpdatePreferred(editingManufacturerId, {
        manufacturer_item_id: manu_id,
      });
      
      // Forcer le rechargement des données pour obtenir le manufacturerItem complet
      if (window.location) {
        window.location.reload();
      }
      
      setEditingManufacturerId(null);
      setSelectedManufacturerId(null);
      setError(null);
    } catch (err) {
      setError('Erreur lors de la mise à jour du fabricant');
      console.error('Erreur mise à jour fabricant:', err);
    } finally {
      setIsSavingManufacturer(false);
    }
  }, [editingManufacturerId, onUpdatePreferred]);

  // Supprime une référence
  const handleDeleteConfirm = useCallback(async (refId) => {
    try {
      await onDelete(refId);
      setDeleteConfirmId(null);
    } catch (err) {
      setError('Erreur lors de la suppression de la référence');
      console.error('Delete error:', err);
    }
  }, [onDelete]);

  const preferredCount = useMemo(
    () => refs.filter((r) => r.isPreferred).length,
    [refs]
  );

  return (
    <Card>
      <Flex direction="column" gap="4">
        {/* En-tête avec compteurs et bouton */}
        <Flex justify="between" align="center">
          <Flex gap="2" align="center">
            <CheckCircle size={20} />
            <Text size="3" weight="bold">
              Références fournisseur pour {stockItem?.name || ""}
            </Text>
            <Badge color="blue" variant="soft">
              {refs.length}
            </Badge>
            <Badge color="green" variant="soft">
              {preferredCount} préféré{preferredCount > 1 ? "s" : ""}
            </Badge>
          </Flex>
          {!isAdding && editingManufacturerId === null && (
            <Button
              size="2"
              color="blue"
              onClick={startAdd}
              disabled={loading}
            >
              <Plus size={16} />
              Ajouter
            </Button>
          )}
        </Flex>

        {/* Affichage des erreurs */}
        {error && (
          <Callout color="red" role="alert">
            <AlertCircle size={16} />
            <Text size="2">{error}</Text>
          </Callout>
        )}

        {/* Liste des références existantes */}
        {refs.length === 0 && !isAdding ? (
          <Box p="4" style={{ textAlign: 'center', background: 'var(--gray-2)', borderRadius: '8px' }}>
            <Flex direction="column" gap="2" align="center">
              <AlertCircle size={20} color="var(--amber-9)" />
              <Text size="2" weight="bold" color="gray">
                Aucune référence fournisseur définie
              </Text>
              <Text size="1" color="gray">
                Vous devez ajouter au moins une référence pour utiliser cet article dans les demandes d'achat.
              </Text>
            </Flex>
          </Box>
        ) : (
          <Box style={{ overflowX: 'auto' }}>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Référence</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Délai</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Prix unit.</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Préféré</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ width: '150px' }}>Actions</Table.ColumnHeaderCell>
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

                  const mObj = ref.manufacturerItem || ref.manufacturer_item_id || ref.manufacturer_item || null;
                  const manufacturerName = mObj?.manufacturerName || mObj?.manufacturer_name || null;
                  const manufacturerRef = mObj?.manufacturerRef || mObj?.manufacturer_ref || null;
                  const manufacturerDesignation = mObj?.designation || null;

                  // Debug: Log complet de l'objet ref
                  if (process.env.NODE_ENV === 'development') {
                    console.log('[SupplierRefsInlinePanel] Ref complet:', JSON.stringify(ref, null, 2));
                  }

                  return (
                    <Table.Row
                      key={ref.id}
                      style={{
                        background: ref.isPreferred ? "var(--green-2)" : undefined,
                      }}
                    >
                      <Table.Cell>
                        <Text size="2" weight={ref.isPreferred ? "bold" : "regular"}>
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
                        <Text size="2">{ref.unitPrice ? `${ref.unitPrice}€` : "-"}</Text>
                      </Table.Cell>
                      <Table.Cell>
                        <Checkbox
                          checked={ref.isPreferred}
                          onCheckedChange={(checked) =>
                            onUpdatePreferred(ref.id, { is_preferred: checked })
                          }
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <Flex gap="2">
                          <Button
                            size="1"
                            variant="soft"
                            color="blue"
                            onClick={() => startEditingManufacturer(ref)}
                            disabled={loading || isAdding || editingManufacturerId !== null}
                            title="Ajouter/modifier fabricant"
                          >
                            <Edit2 size={14} />
                          </Button>
                          <Button
                            size="1"
                            variant="soft"
                            color="red"
                            onClick={() => setDeleteConfirmId(ref.id)}
                            disabled={loading || isAdding || editingManufacturerId !== null}
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}

                {/* Formulaire d'ajout inline */}
                {isAdding && (
                  <Table.Row>
                    <Table.Cell colSpan={6}>
                      <Box p="3" style={{ background: 'var(--blue-2)', border: '1px solid var(--blue-6)', borderRadius: '8px' }}>
                        <Flex direction="column" gap="3">
                          <Flex align="center" gap="2">
                            <Plus size={20} color="var(--blue-9)" />
                            <Text size="3" weight="bold">Ajouter une référence fournisseur</Text>
                          </Flex>

                          {/* Ligne 1: Fournisseur et Référence */}
                          <Flex gap="3" wrap="wrap">
                            <Box style={{ flex: '1', minWidth: '200px' }}>
                              <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                Fournisseur *
                              </Text>
                              <Select.Root 
                                value={formData.supplier_id ? String(formData.supplier_id) : undefined} 
                                onValueChange={(v) => setFormData({ ...formData, supplier_id: v })}
                              >
                                <Select.Trigger placeholder="-- Sélectionner --" disabled={loading} style={{ width: '100%' }} />
                                <Select.Content>
                                  {suppliers.map(s => (
                                    <Select.Item key={s.id} value={String(s.id)}>
                                      {s.name}
                                    </Select.Item>
                                  ))}
                                </Select.Content>
                              </Select.Root>
                            </Box>

                            <Box style={{ flex: '1', minWidth: '200px' }}>
                              <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                Référence *
                              </Text>
                              <TextField.Root
                                placeholder="Référence fournisseur"
                                value={formData.supplier_ref}
                                onChange={(e) => setFormData({ ...formData, supplier_ref: e.target.value })}
                                disabled={loading}
                              />
                            </Box>
                          </Flex>

                          {/* Ligne 2: Délai et Prix */}
                          <Flex gap="3" wrap="wrap" align="end">
                            <Box style={{ flex: '1', minWidth: '150px' }}>
                              <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                Délai (jours)
                              </Text>
                              <TextField.Root
                                type="number"
                                placeholder="ex: 7"
                                value={formData.delivery_time_days}
                                onChange={(e) => setFormData({ ...formData, delivery_time_days: e.target.value })}
                                disabled={loading}
                              />
                            </Box>

                            <Box style={{ flex: '1', minWidth: '150px' }}>
                              <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                Prix unitaire (€)
                              </Text>
                              <TextField.Root
                                type="number"
                                step="0.01"
                                placeholder="ex: 12.50"
                                value={formData.unit_price}
                                onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                                disabled={loading}
                              />
                            </Box>

                            {/* Boutons alignés à droite avec les champs */}
                            <Flex gap="2">
                              <Button
                                variant="soft"
                                color="gray"
                                onClick={cancelEdit}
                                disabled={loading}
                                size="2"
                              >
                                Annuler
                              </Button>
                              <Button
                                color="blue"
                                onClick={handleAdd}
                                disabled={loading || !formData.supplier_id || !formData.supplier_ref.trim()}
                                size="2"
                              >
                                {loading ? 'Ajout...' : 'Enregistrer'}
                              </Button>
                            </Flex>
                          </Flex>
                        </Flex>
                      </Box>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          </Box>
        )}

        {/* Formulaire d'édition du fabricant */}
        {editingManufacturerId && (
          <Card style={{ background: "var(--blue-2)", border: "1px solid var(--blue-6)" }}>
            <Flex direction="column" gap="3">
              <Flex align="center" gap="2">
                <Edit2 size={20} color="var(--blue-9)" />
                <Text weight="bold" size="3">
                  Modifier les informations fabricant
                </Text>
              </Flex>
              <ManufacturerFormFields
                selectedRefId={selectedManufacturerId}
                onSelectRef={(ref) => setSelectedManufacturerId(ref.id)}
                onCreateRef={handleCreateManufacturer}
                availableRefs={allManufacturers}
                loading={isSavingManufacturer}
              />
              <Flex gap="2" justify="end" mt="2">
                <Button
                  variant="soft"
                  color="gray"
                  onClick={() => {
                    setEditingManufacturerId(null);
                    setSelectedManufacturerId(null);
                  }}
                  disabled={isSavingManufacturer}
                  size="2"
                >
                  Annuler
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}

        {/* Dialog de confirmation de suppression */}
        {deleteConfirmId !== null && (
          <Card style={{ background: 'var(--red-2)', borderLeft: '4px solid var(--red-9)' }}>
            <Flex gap="3" align="center">
              <AlertCircle size={20} color="var(--red-9)" />
              <Flex direction="column" gap="2" style={{ flex: 1 }}>
                <Text weight="bold" color="red">
                  Êtes-vous sûr de vouloir supprimer cette référence ?
                </Text>
                <Text size="2" color="gray">
                  Cette action ne peut pas être annulée.
                </Text>
              </Flex>
              <Flex gap="2">
                <Button
                  variant="soft"
                  color="gray"
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  color="red"
                  onClick={() => handleDeleteConfirm(deleteConfirmId)}
                  disabled={loading}
                >
                  {loading ? 'Suppression...' : 'Supprimer'}
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}
      </Flex>
    </Card>
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
