/**
 * Panneau de détails centralisé pour les Demandes d'Achat
 * Affiche: intervention liée, article, références fournisseurs, spécifications
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Flex, Text, Card, Badge } from '@radix-ui/themes';
import { Package, ExternalLink, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';

import SupplierRefsInlinePanel from '@/components/purchase/suppliers/SupplierRefsInlinePanel';
import StandardSpecsPanel from '@/components/stock/StandardSpecsPanel';
import StockRefLink from '@/components/common/StockRefLink';

/** État initial du formulaire référence fournisseur */
const INITIAL_SUPPLIER_REF_FORM = {
  supplier_id: '', supplier_ref: '', unit_price: '', delivery_time_days: '', is_preferred: false,
};

/** Construit le payload pour ajout de référence fournisseur */
const buildSupplierRefPayload = (formData) => ({
  supplier_id: (formData.supplier_id || '').trim(),
  supplier_ref: (formData.supplier_ref || '').trim(),
  unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
  delivery_time_days: formData.delivery_time_days ? parseInt(formData.delivery_time_days) : null,
});

/** Extrait les infos d'intervention depuis la request */
const getInterventionInfo = (request) =>
  request.intervention || (request.interventionId ? { id: request.interventionId, code: request.interventionId } : null);

/** Badge lien vers l'intervention liée */
function InterventionBadge({ request }) {
  const info = getInterventionInfo(request);
  if (!info) return null;
  return (
    <Flex align="center" gap="2" p="2" style={{ background: 'var(--blue-2)', borderRadius: 'var(--radius-2)' }}>
      <Wrench size={16} color="var(--blue-9)" />
      <Text size="2" weight="medium" color="gray">Intervention :</Text>
      <Link to={`/intervention/${info.id}`} style={{ textDecoration: 'none' }}>
        <Badge color="blue" variant="soft" size="2" style={{ cursor: 'pointer' }}>
          <Flex align="center" gap="1">{info.code || info.id}<ExternalLink size={12} /></Flex>
        </Badge>
      </Link>
    </Flex>
  );
}

InterventionBadge.propTypes = { request: PropTypes.object.isRequired };

/**
 * Panneau de détails pour affichage centralisé de toutes les infos DA
 */
export default function PurchaseRequestDetailsPanel({
  request,
  stockItem,
  supplierRefs = [],
  suppliers = [],
  onAddSupplierRef,
  onDeleteSupplierRef,
  onUpdateSupplierRef,
  loading = false,
  allManufacturers = [],
}) {
  const [supplierRefFormData, setSupplierRefFormData] = useState(INITIAL_SUPPLIER_REF_FORM);

  const handleAddSupplierRef = useCallback(() => {
    if (!stockItem?.id) return;
    const payload = buildSupplierRefPayload(supplierRefFormData);
    if (!payload.supplier_id || !payload.supplier_ref) {
      console.warn('Fournisseur ou référence manquants');
      return;
    }
    onAddSupplierRef(stockItem.id, payload);
    setSupplierRefFormData(INITIAL_SUPPLIER_REF_FORM);
  }, [stockItem?.id, supplierRefFormData, onAddSupplierRef]);

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
      {/* Section Intervention liée */}
      <InterventionBadge request={request} />

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
  suppliers: PropTypes.array,
  onAddSupplierRef: PropTypes.func,
  onDeleteSupplierRef: PropTypes.func,
  onUpdateSupplierRef: PropTypes.func,
  loading: PropTypes.bool,
  allManufacturers: PropTypes.array,
};

PurchaseRequestDetailsPanel.defaultProps = {
  supplierRefs: [],
  suppliers: [],
  loading: false,
  allManufacturers: [],
};
