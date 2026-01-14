/**
 * Panneau de détails centralisé pour les Demandes d'Achat
 * 
 * Compose l'affichage et la gestion de:
 * - Article lié
 * - Références fournisseurs (via SupplierRefsInlinePanel)
 * - Spécifications standard (via SpecificationsSection)
 * 
 * Cette convention garantit une cohérence visuelle et fonctionnelle
 * dans tous les contextes de gestion des DA.
 * 
 * Usage:
 * <PurchaseRequestDetailsPanel
 *   request={request}
 *   stockItem={item}
 *   supplierRefs={refs}
 *   standardSpecs={specs}
 *   suppliers={suppliers}
 *   onAddSupplierRef={...}
 *   onDeleteSupplierRef={...}
 *   onUpdateSupplierRef={...}
 *   onAddStandardSpec={...}
 *   onCreateSupplier={...}
 *   loading={false}
 * />
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Flex, Box, Text, Card, Badge } from '@radix-ui/themes';
import { Package } from 'lucide-react';

import SupplierRefsInlinePanel from '@/components/purchase/suppliers/SupplierRefsInlinePanel';
import StandardSpecsPanel from '@/components/stock/StandardSpecsPanel';
import StockRefLink from '@/components/common/StockRefLink';

/**
 * Panneau de détails pour affichage centralisé de toutes les infos DA
 */
export default function PurchaseRequestDetailsPanel({
  request,
  stockItem,
  supplierRefs = [],
  standardSpecs = [],
  suppliers = [],
  onAddSupplierRef,
  onDeleteSupplierRef,
  onUpdateSupplierRef,
  onAddStandardSpec,
  onDeleteStandardSpec,
  onUpdateStandardSpec,
  loading = false,
  onCreateSupplier,
  allManufacturers = [],
}) {
  // État du formulaire pour les références fournisseurs (adapter à SupplierRefsInlinePanel)
  const [supplierRefFormData, setSupplierRefFormData] = useState({
    supplier_id: '',
    supplier_ref: '',
    unit_price: '',
    delivery_time_days: '',
    is_preferred: false,
  });

  // Wrapper callback pour adapter l'interface des références
  const handleAddSupplierRef = useCallback(() => {
    const stockItemId = stockItem?.id;
    if (!stockItemId) return;
    
    const trimmedSupplierId = (supplierRefFormData.supplier_id || '').trim();
    const trimmedSupplierRef = (supplierRefFormData.supplier_ref || '').trim();

    if (!trimmedSupplierId || !trimmedSupplierRef) {
      console.warn('Fournisseur ou référence manquants');
      return;
    }

    onAddSupplierRef(stockItemId, {
      supplier_id: trimmedSupplierId,
      supplier_ref: trimmedSupplierRef,
      unit_price: supplierRefFormData.unit_price ? parseFloat(supplierRefFormData.unit_price) : null,
      delivery_time_days: supplierRefFormData.delivery_time_days ? parseInt(supplierRefFormData.delivery_time_days) : null,
    });

    setSupplierRefFormData({
      supplier_id: '',
      supplier_ref: '',
      unit_price: '',
      delivery_time_days: '',
      is_preferred: false,
    });
  }, [stockItem?.id, supplierRefFormData, onAddSupplierRef]);

  // Wrappers pour spécifications (adapter aux callbacks fournis par parent)
  const handleAddSpec = useCallback(async (specData) => {
    try {
      await onAddStandardSpec(request.id, specData);
      // Recharger les specs depuis le parent
    } catch (error) {
      console.error('Erreur ajout spec:', error);
      throw error;
    }
  }, [request.id, onAddStandardSpec]);

  const handleUpdateSpec = useCallback(async (specId, specData) => {
    try {
      await onUpdateStandardSpec(specId, specData);
    } catch (error) {
      console.error('Erreur mise à jour spec:', error);
      throw error;
    }
  }, [onUpdateStandardSpec]);

  // Vérification des props obligatoires
  if (!request || !stockItem) {
    return (
      <Card>
        <Flex p="3" align="center" justify="center">
          <Text color="gray">Chargement des détails...</Text>
        </Flex>
      </Card>
    );
  }

  return (
    <Flex direction="column" gap="3">
      {/* Section Article */}
      <Flex align="center" justify="between" wrap="wrap" gap="3" p="2">
        <Flex align="center" gap="2">
          <Package size={16} color="var(--gray-9)" />
          <Text size="2" weight="medium" color="gray">Article lié :</Text>
          <Text size="2" weight="bold">{stockItem.name}</Text>
        </Flex>
        <Flex gap="2" align="center">
          <StockRefLink
            reference={stockItem.ref}
            tab="stock"
            variant="ghost"
            size="1"
          />
          <Badge variant="soft" size="1">{stockItem.family_code}</Badge>
        </Flex>
      </Flex>

      {/* Section Références Fournisseurs - Utiliser le composant réutilisable */}
      <SupplierRefsInlinePanel
        stockItem={stockItem}
        suppliers={suppliers}
        refs={supplierRefs}
        formData={supplierRefFormData}
        setFormData={setSupplierRefFormData}
        onAdd={handleAddSupplierRef}
        onUpdatePreferred={onUpdateSupplierRef}
        onDelete={onDeleteSupplierRef}
        loading={loading}
        allManufacturers={allManufacturers}
      />

      {/* Section Spécifications */}
      <StandardSpecsPanel
        stockItemId={stockItem?.id}
        stockItemName={stockItem?.name}
      />
    </Flex>
  );
}

PurchaseRequestDetailsPanel.propTypes = {
  request: PropTypes.object.isRequired,
  stockItem: PropTypes.object.isRequired,
  supplierRefs: PropTypes.array,
  standardSpecs: PropTypes.array,
  suppliers: PropTypes.array,
  onAddSupplierRef: PropTypes.func,
  onDeleteSupplierRef: PropTypes.func,
  onUpdateSupplierRef: PropTypes.func,
  onAddStandardSpec: PropTypes.func,
  onDeleteStandardSpec: PropTypes.func,
  onUpdateStandardSpec: PropTypes.func,
  loading: PropTypes.bool,
  onCreateSupplier: PropTypes.func,
  allManufacturers: PropTypes.array,
};

PurchaseRequestDetailsPanel.defaultProps = {
  supplierRefs: [],
  standardSpecs: [],
  suppliers: [],
  loading: false,
  allManufacturers: [],
};
