/**
 * Section des références fournisseurs pour le panneau de détails DA
 * Composant réutilisable pour l'affichage et la gestion des références
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
  Flex,
  Box,
  Text,
  Table,
  Card,
  Button,
  Badge,
  AlertDialog,
} from '@radix-ui/themes';
import { Plus, AlertCircle, Trash2, Star } from 'lucide-react';
import SupplierSearchableSelect from '@/components/purchase/requests/SupplierSearchableSelect';

export default function SupplierRefsSection({
  requestId,
  supplierRefs = [],
  suppliers = [],
  onAddSupplierRef,
  onDeleteSupplierRef,
  onUpdateSupplierRef,
  loading = false,
  onCreateSupplier,
}) {
  const [isAddingRef, setIsAddingRef] = useState(false);
  const [refFormData, setRefFormData] = useState({
    supplier_id: '',
    supplier_ref: '',
    unit_price: '',
    delivery_time_days: '',
    manufacturer_name: '',
    manufacturer_ref: '',
    manufacturer_designation: '',
  });

  const handleAddSupplierRef = useCallback(async () => {
    const trimmedSupplierId = (refFormData.supplier_id || '').trim();
    const trimmedSupplierRef = (refFormData.supplier_ref || '').trim();

    if (!trimmedSupplierId || !trimmedSupplierRef) {
      console.warn('Fournisseur ou référence manquants');
      return;
    }

    try {
      await onAddSupplierRef(requestId, {
        supplier_id: trimmedSupplierId,
        supplier_ref: trimmedSupplierRef,
        unit_price: refFormData.unit_price ? parseFloat(refFormData.unit_price) : null,
        delivery_time_days: refFormData.delivery_time_days ? parseInt(refFormData.delivery_time_days) : null,
        manufacturer_name: refFormData.manufacturer_name?.trim() || '',
        manufacturer_ref: refFormData.manufacturer_ref?.trim() || '',
        manufacturer_designation: refFormData.manufacturer_designation?.trim() || '',
      });

      setRefFormData({
        supplier_id: '',
        supplier_ref: '',
        unit_price: '',
        delivery_time_days: '',
        manufacturer_name: '',
        manufacturer_ref: '',
        manufacturer_designation: '',
      });
      setIsAddingRef(false);
    } catch (error) {
      console.error('Erreur ajout référence:', error);
    }
  }, [requestId, refFormData, onAddSupplierRef]);

  const handleDeleteRef = useCallback(async (refId) => {
    try {
      await onDeleteSupplierRef(refId, requestId);
    } catch (error) {
      console.error('Erreur suppression référence:', error);
    }
  }, [requestId, onDeleteSupplierRef]);

  const handleSetPreferred = useCallback(async (refId) => {
    try {
      await onUpdateSupplierRef(refId, { is_preferred: true }, requestId);
    } catch (error) {
      console.error('Erreur mise à jour référence:', error);
    }
  }, [requestId, onUpdateSupplierRef]);

  return (
    <Card>
      <Flex direction="column" gap="2" p="3">
        {/* Header */}
        <Flex align="center" justify="between">
          <Flex align="center" gap="2">
            <Box>
              <Text weight="bold" size="3">Références fournisseurs</Text>
              <Badge variant="outline" size="3">{supplierRefs.length}</Badge>
            </Box>
          </Flex>
          {onAddSupplierRef && !isAddingRef && (
            <Button size="2" variant="soft" color="blue" onClick={() => setIsAddingRef(true)}>
              <Plus size={14} />
              Ajouter
            </Button>
          )}
        </Flex>

        {/* Liste */}
        {supplierRefs.length > 0 && (
          <Table.Root size="1">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Référence</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Prix</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Délai</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {supplierRefs.map((ref) => (
                <Table.Row key={ref.id} style={{ background: ref.isPreferred ? 'var(--green-2)' : undefined }}>
                  <Table.Cell>
                    <Text size="2" weight={ref.isPreferred ? 'bold' : 'regular'}>
                      {ref.supplier?.name || 'Fournisseur inconnu'}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2" weight={ref.isPreferred ? 'bold' : 'regular'}>
                      {ref.supplierRef}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="2">{ref.unitPrice ? `${ref.unitPrice}€` : '-'}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge variant="soft" size="1" color="blue">
                      {ref.deliveryTimeDays ? `${ref.deliveryTimeDays}j` : '-'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {ref.isPreferred ? (
                      <Badge color="green" size="1" variant="solid">
                        <Flex align="center" gap="1">
                          <Star size={12} />
                          Préféré
                        </Flex>
                      </Badge>
                    ) : (
                      <Button
                        size="1"
                        variant="soft"
                        color="gray"
                        onClick={() => handleSetPreferred(ref.id)}
                        disabled={loading}
                      >
                        <Star size={12} />
                      </Button>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <AlertDialog.Root>
                      <AlertDialog.Trigger>
                        <Button size="1" variant="soft" color="red" disabled={loading}>
                          <Trash2 size={12} />
                        </Button>
                      </AlertDialog.Trigger>
                      <AlertDialog.Content>
                        <AlertDialog.Title>Supprimer la référence</AlertDialog.Title>
                        <AlertDialog.Description>
                          Êtes-vous sûr de vouloir supprimer cette référence fournisseur ?
                        </AlertDialog.Description>
                        <Flex gap="3" mt="4" justify="end">
                          <AlertDialog.Cancel>
                            <Button variant="soft" color="gray">Annuler</Button>
                          </AlertDialog.Cancel>
                          <AlertDialog.Action>
                            <Button
                              color="red"
                              onClick={() => handleDeleteRef(ref.id)}
                              disabled={loading}
                            >
                              Supprimer
                            </Button>
                          </AlertDialog.Action>
                        </Flex>
                      </AlertDialog.Content>
                    </AlertDialog.Root>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}

        {/* État vide */}
        {supplierRefs.length === 0 && !isAddingRef && (
          <Flex direction="column" gap="1" align="center" p="3">
            <AlertCircle size={20} color="var(--gray-8)" />
            <Text size="2" color="gray">Aucune référence fournisseur</Text>
          </Flex>
        )}

        {/* Formulaire d'ajout */}
        {isAddingRef && (
          <Flex direction="column" gap="3" p="3" style={{ borderTop: '1px solid var(--gray-4)' }}>
            <Text weight="bold" size="2">Ajouter une référence fournisseur</Text>

            <Box>
              <SupplierSearchableSelect
                suppliers={suppliers}
                value={refFormData.supplier_id}
                onChange={(supplier) => setRefFormData({ ...refFormData, supplier_id: supplier.id })}
                onCreateSupplier={onCreateSupplier}
                required={true}
                loading={loading}
              />
            </Box>

            <Box>
              <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>Référence fournisseur</Text>
              <input
                type="text"
                placeholder="Ex: 51775.040.020"
                value={refFormData.supplier_ref}
                onChange={(e) => setRefFormData({ ...refFormData, supplier_ref: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--gray-6)',
                  borderRadius: '6px',
                }}
              />
            </Box>

            <Box>
              <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>Prix unitaire (optionnel)</Text>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={refFormData.unit_price}
                onChange={(e) => setRefFormData({ ...refFormData, unit_price: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--gray-6)',
                  borderRadius: '6px',
                }}
              />
            </Box>

            <Box>
              <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>Délai livraison (j)</Text>
              <input
                type="number"
                placeholder="7"
                value={refFormData.delivery_time_days}
                onChange={(e) => setRefFormData({ ...refFormData, delivery_time_days: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid var(--gray-6)',
                  borderRadius: '6px',
                }}
              />
            </Box>

            <Box style={{ padding: '12px', background: 'var(--gray-2)', borderRadius: '6px' }}>
              <Text size="2" weight="bold" mb="2" style={{ display: 'block' }}>Fabricant (optionnel)</Text>
              <Flex direction="column" gap="2">
                <input
                  type="text"
                  placeholder="Nom"
                  value={refFormData.manufacturer_name}
                  onChange={(e) => setRefFormData({ ...refFormData, manufacturer_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid var(--gray-6)',
                    borderRadius: '6px',
                  }}
                />
                <input
                  type="text"
                  placeholder="Référence"
                  value={refFormData.manufacturer_ref}
                  onChange={(e) => setRefFormData({ ...refFormData, manufacturer_ref: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid var(--gray-6)',
                    borderRadius: '6px',
                  }}
                />
                <input
                  type="text"
                  placeholder="Désignation"
                  value={refFormData.manufacturer_designation}
                  onChange={(e) => setRefFormData({ ...refFormData, manufacturer_designation: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid var(--gray-6)',
                    borderRadius: '6px',
                  }}
                />
              </Flex>
            </Box>

            <Flex gap="2" justify="end">
              <Button
                variant="soft"
                color="gray"
                onClick={() => {
                  setIsAddingRef(false);
                  setRefFormData({
                    supplier_id: '',
                    supplier_ref: '',
                    unit_price: '',
                    delivery_time_days: '',
                    manufacturer_name: '',
                    manufacturer_ref: '',
                    manufacturer_designation: '',
                  });
                }}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                color="blue"
                onClick={handleAddSupplierRef}
                disabled={loading || !refFormData.supplier_id || !refFormData.supplier_ref}
              >
                {loading ? 'Enregistrement...' : 'Ajouter'}
              </Button>
            </Flex>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

SupplierRefsSection.propTypes = {
  requestId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  supplierRefs: PropTypes.arrayOf(PropTypes.object),
  suppliers: PropTypes.arrayOf(PropTypes.object),
  onAddSupplierRef: PropTypes.func,
  onDeleteSupplierRef: PropTypes.func,
  onUpdateSupplierRef: PropTypes.func,
  loading: PropTypes.bool,
  onCreateSupplier: PropTypes.func,
};
