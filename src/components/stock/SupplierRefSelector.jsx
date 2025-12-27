import { useMemo } from "react";
import PropTypes from 'prop-types';
import {
  Flex,
  Text,
  Select,
  Card,
  Badge,
} from "@radix-ui/themes";
import { AlertCircle } from "lucide-react";
import ManufacturerBadge from "@/components/common/ManufacturerBadge";

/**
 * Dropdown MVP pour sélectionner une référence fournisseur
 * 
 * RÈGLE STRICTE :
 * - Dropdown = sélection rapide uniquement (1 ligne = 1 choix)
 * - Détail = bloc séparé sous le dropdown
 * - Pas de header, pas de contexte rappelé
 * 
 * @param {Array} refs - Liste des références fournisseur disponibles
 * @param {string} value - ID de la référence sélectionnée
 * @param {Function} onValueChange - Callback lors de la sélection
 * @param {string} placeholder - Placeholder du select
 * @param {boolean} disabled - Désactiver le select
 */
export default function SupplierRefSelector({
  refs = [],
  value,
  onValueChange,
  placeholder = "Choisir une référence...",
  disabled = false,
}) {
  // Tri des références : Préférée → Autres (par fournisseur)
  const sortedRefs = useMemo(() => {
    return [...refs].sort((a, b) => {
      // Préférée en premier
      if (a.is_preferred && !b.is_preferred) return -1;
      if (!a.is_preferred && b.is_preferred) return 1;
      
      // Puis tri par fournisseur
      const supplierA = typeof a.supplier_id === 'object' ? a.supplier_id.name : '';
      const supplierB = typeof b.supplier_id === 'object' ? b.supplier_id.name : '';
      return supplierA.localeCompare(supplierB);
    });
  }, [refs]);

  // Référence sélectionnée pour afficher les détails
  const detailRef = useMemo(() => {
    return refs.find(r => r.id === value);
  }, [refs, value]);

  // Formater le label du dropdown : "FOURNISSEUR — Réf ⭐"
  const formatItemLabel = (ref) => {
    const supplierName = typeof ref.supplier_id === 'object' ? ref.supplier_id.name : 'Fournisseur';
    const supplierRef = ref.supplier_ref || '—';
    const star = ref.is_preferred ? ' ⭐' : '';
    return `${supplierName} — ${supplierRef}${star}`;
  };

  // Vérifier si infos incomplètes
  const hasIncompleteInfo = (ref) => {
    const hasManufacturerRef = ref.manufacturer_item_id?.manufacturer_ref;
    const hasManufacturerName = ref.manufacturer_item_id?.manufacturer_name;
    return !hasManufacturerRef || !hasManufacturerName;
  };

  return (
    <Flex direction="column" gap="3">
      {/* Dropdown : liste courte, 1 ligne = 1 choix */}
      <Select.Root
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <Select.Trigger placeholder={placeholder} />
        <Select.Content>
          {sortedRefs.map((ref) => (
            <Select.Item
              key={ref.id}
              value={ref.id}
            >
              {formatItemLabel(ref)}
              {hasIncompleteInfo(ref) && " ⚠️"}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      {/* Infos complémentaires (non visibles dans le dropdown) */}
      {detailRef && (
        <Card size="1" style={{ background: 'var(--gray-2)' }}>
          <Flex direction="column" gap="1" style={{ fontSize: '13px' }}>
            {/* Réf fabricant */}
            <Flex justify="between">
              <Text color="gray" size="1">Réf. fabricant :</Text>
              {detailRef.manufacturer_item_id?.manufacturer_ref ? (
                <Text weight="medium" size="1" family="mono">
                  {detailRef.manufacturer_item_id.manufacturer_ref}
                </Text>
              ) : (
                <Badge color="amber" variant="soft" size="1">
                  <AlertCircle size={10} style={{ marginRight: '4px' }} />
                  Non renseignée
                </Badge>
              )}
            </Flex>

            {/* Fabricant */}
            <Flex justify="between">
              <Text color="gray" size="1">Fabricant :</Text>
              {detailRef.manufacturer_item_id?.manufacturer_name ? (
                <ManufacturerBadge 
                  name={detailRef.manufacturer_item_id.manufacturer_name} 
                  size="1"
                />
              ) : (
                <Text color="gray" size="1">—</Text>
              )}
            </Flex>

            {/* Désignation fabricant */}
            {detailRef.manufacturer_item_id?.designation && (
              <Flex direction="column" gap="1" style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid var(--gray-4)' }}>
                <Text color="gray" size="1">Désignation :</Text>
                <Text size="1" style={{ fontStyle: 'italic' }}>
                  {detailRef.manufacturer_item_id.designation}
                </Text>
              </Flex>
            )}

            {/* Délai */}
            <Flex justify="between" style={{ marginTop: '4px', paddingTop: '4px', borderTop: '1px solid var(--gray-4)' }}>
              <Text color="gray" size="1">Délai :</Text>
              <Text weight="medium" size="1">
                {detailRef.delivery_time_days ? `${detailRef.delivery_time_days}j` : '—'}
              </Text>
            </Flex>

            {/* Prix indicatif */}
            {detailRef.unit_price && (
              <Flex justify="between">
                <Text color="gray" size="1">Prix indicatif :</Text>
                <Badge color="blue" variant="soft" size="1">
                  {Number(detailRef.unit_price).toFixed(2)} €
                </Badge>
              </Flex>
            )}

            {/* Avertissement info incomplète */}
            {hasIncompleteInfo(detailRef) && (
              <Flex align="center" gap="2" p="2" style={{ background: 'var(--amber-2)', borderRadius: '4px', marginTop: '4px' }}>
                <AlertCircle size={14} color="var(--amber-9)" />
                <Text size="1" color="amber">
                  ⚠️ Infos incomplètes
                </Text>
              </Flex>
            )}
          </Flex>
        </Card>
      )}

      {/* Message si aucune référence */}
      {refs.length === 0 && (
        <Card size="1" style={{ background: 'var(--gray-2)' }}>
          <Flex align="center" gap="2">
            <AlertCircle size={16} color="var(--gray-9)" />
            <Text size="2" color="gray">
              Aucune référence fournisseur disponible
            </Text>
          </Flex>
        </Card>
      )}
    </Flex>
  );
}

// ===== PROP TYPES =====
SupplierRefSelector.propTypes = {
  refs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      supplier_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.object]),
      supplier_ref: PropTypes.string,
      unit_price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      delivery_time_days: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      is_preferred: PropTypes.bool,
      manufacturer_item_id: PropTypes.shape({
        manufacturer_ref: PropTypes.string,
        manufacturer_name: PropTypes.string,
        designation: PropTypes.string,
      }),
    })
  ),
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onValueChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
};
