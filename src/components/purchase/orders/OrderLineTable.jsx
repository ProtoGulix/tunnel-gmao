/**
 * @fileoverview Tableau des lignes d'une commande fournisseur
 *
 * Affiche le détail des articles d'une commande avec informations
 * complètes (article, références, demandeurs, etc.).
 *
 * @module components/purchase/orders/OrderLineTable
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Table, Flex, Text, Box, Badge, Checkbox } from "@radix-ui/themes";
import { Package, Ban, ExternalLink, Lock } from "lucide-react";
import { suppliers } from '@/lib/api/facade';
import { URGENCY_LEVELS } from '@/config/stockManagementConfig';
import { normalizeBasketStatus } from "@/lib/purchasing/basketItemRules";
import useTwinLinesValidation from '@/hooks/useTwinLinesValidation';
import TwinLinesValidationAlert from './TwinLinesValidationAlert';

// ===== DTO ACCESSORS =====
const getStock = (line) => line.stockItem ?? line.stock_item_id;
const getPurchaseRequests = (line) => line?.purchaseRequests ?? line?.purchase_requests ?? [];
const getPurchaseRequest = (pr) => {
  if (!pr) return null;
  // Handle M2M structure: { id, purchase_request_id: {...} }
  if (pr.purchase_request_id) return pr.purchase_request_id;
  if (pr.purchaseRequest) return pr.purchaseRequest;
  // Direct PR object
  return pr;
};

const getMaxUrgency = (line) => {
  // Priorité : urgence sur la ligne, sinon max des DA liées
  const rank = { high: 3, normal: 2, low: 1 };
  const lineUrgency = line.urgency || line.urgency_level;
  let best = lineUrgency || null;
  getPurchaseRequests(line).forEach((pr) => {
    const prObj = getPurchaseRequest(pr);
    const u = prObj?.urgency;
    if (!u) return;
    if (!best || (rank[u] || 0) > (rank[best] || 0)) {
      best = u;
    }
  });
  return best;
};

/**
 * Extrait le code intervention d'un objet intervention
 * @param {Object} interv - Objet intervention
 * @returns {string|null} Code ou id intervention
 */
const getIntervCode = (interv) => {
  if (!interv) return null;
  return typeof interv === 'object' ? (interv.code || interv.id) : interv;
};

/**
 * Récupère les infos intervention d'une ligne
 * @param {Object} line - Ligne de commande
 * @returns {{id: string|null, code: string|null}}
 */
const getInterventionInfo = (line) => {
  const prs = getPurchaseRequests(line);
  const first = getPurchaseRequest(prs[0]);
  if (!first) return null;
  const interv = first.intervention ?? first.intervention_id;
  if (!interv) return null;
  const code = getIntervCode(interv);
  const id = typeof interv === 'object' ? interv.id : interv;
  return { id: id || null, code: code || id || null };
};

/**
 * Récupère le nom du demandeur d'une PR
 * @param {Object} pr - Purchase request
 * @returns {string} Nom du demandeur
 */
const getRequesterName = (pr) => {
  const prObj = getPurchaseRequest(pr);
  return prObj?.requested_by || prObj?.requestedBy || "—";
};

/**
 * Compte le nombre de DA (purchase requests) liées à une ligne
 * @param {Object} line - Ligne de commande
 * @returns {number} Nombre de DA
 */
const countPurchaseRequests = (line) => {
  const prs = getPurchaseRequests(line);
  return prs.length;
};

/**
 * Détecte si une ligne a des lignes jumelles (même DA chez d'autres fournisseurs)
 * @param {Object} line - Ligne de commande
 * @returns {{hasTwin: boolean, twinCount: number, totalLines: number}} Info sur les jumelles
 */
const detectTwinLines = (line) => {
  const prs = getPurchaseRequests(line);
  if (prs.length === 0) {
    return { hasTwin: false, twinCount: 0, totalLines: 0 };
  }

  // Pour chaque DA, vérifier combien de supplier_order_line_ids elle a
  let maxTotalLines = 0;
  let hasTwin = false;

  prs.forEach((pr) => {
    const prObj = getPurchaseRequest(pr);
    if (!prObj) return;
    
    // Récupérer tous les supplier_order_line_ids de cette DA
    let supplierOrderLineIds = prObj.supplier_order_line_ids || [];
    
    // Si c'est un array d'objets avec purchase_request_id nested, extraire la vraie liste
    if (supplierOrderLineIds.length > 0 && typeof supplierOrderLineIds[0] === 'object') {
      // Prendre le premier élément et extraire son supplier_order_line_ids nested
      const firstItem = supplierOrderLineIds[0];
      if (firstItem.purchase_request_id && firstItem.purchase_request_id.supplier_order_line_ids) {
        supplierOrderLineIds = firstItem.purchase_request_id.supplier_order_line_ids;
      }
    }
    
    // Compter le nombre de lignes (gérer array de strings ou d'objets)
    const count = Array.isArray(supplierOrderLineIds) ? supplierOrderLineIds.length : 0;
    
    if (count > 1) {
      hasTwin = true;
      maxTotalLines = Math.max(maxTotalLines, count);
    }
  });

  return { 
    hasTwin, 
    twinCount: hasTwin ? maxTotalLines - 1 : 0,
    totalLines: maxTotalLines
  };
};

const renderUrgencyBadge = (urgency) => {
  const urgencyConfig = URGENCY_LEVELS.find(u => u.value === urgency);
  if (!urgencyConfig || urgencyConfig.value === 'all') {
    return <Badge color="gray" variant="soft" size="1">Inconnue</Badge>;
  }
  return (
    <Badge color={urgencyConfig.color} variant={urgencyConfig.variant} size="1">
      {urgencyConfig.label}
    </Badge>
  );
};

const renderRequesters = (prs) => {
  const visible = prs.slice(0, 2);
  const extra = prs.length - visible.length;

  return (
    <Flex direction="column" gap="1">
      {visible.map((pr, idx) => (
        <Text key={idx} size="1" color="gray">{getRequesterName(pr)}</Text>
      ))}
      {extra > 0 && (
        <Text size="1" color="gray" style={{ fontStyle: "italic" }}>
          +{extra} autre{extra > 1 ? "s" : ""}
        </Text>
      )}
    </Flex>
  );
};

/**
 * Ligne du tableau détail (une ligne de commande)
 *
 * @component
 * @param {Object} props
 * @param {Object} props.line - Ligne de commande
 * @param {Function} props.onToggleSelected - Callback changement sélection
 * @param {boolean} props.disabled - Désactiver la checkbox
 * @returns {JSX.Element}
 */
/**
 * Composant wrapper pour une ligne avec validation des jumelles
 */
function OrderLineRowWithValidation({ line, onToggleSelected, disabled, isPooling, onValidationUpdate }) {
  const stock = getStock(line);
  const prs = getPurchaseRequests(line);
  const interventionInfo = getInterventionInfo(line);
  const isSelected = line.is_selected ?? line.isSelected ?? false;
  const urgency = getMaxUrgency(line) || 'normal';
  const prCount = countPurchaseRequests(line);
  const twinInfo = detectTwinLines(line);
  
  // Utiliser le hook de validation des jumelles
  const {
    twinLines,
    loading: twinLoading,
    validationErrors,
    validationWarnings,
    hasTwins,
    isValid,
  } = useTwinLinesValidation(line);
  
  // Utiliser une ref pour éviter les mises à jour inutiles
  const lastValidationRef = useRef(null);
  
  // Propager les infos de validation au parent seulement si elles ont changé
  useEffect(() => {
    if (!onValidationUpdate) return;
    
    const currentValidation = {
      twinLines,
      validationErrors,
      validationWarnings,
      hasTwins: hasTwins(),
      isValid,
    };
    
    // Comparer avec la dernière validation pour éviter les mises à jour inutiles
    const lastValidation = lastValidationRef.current;
    const hasChanged = !lastValidation ||
      lastValidation.isValid !== currentValidation.isValid ||
      lastValidation.hasTwins !== currentValidation.hasTwins ||
      JSON.stringify(lastValidation.validationErrors) !== JSON.stringify(currentValidation.validationErrors) ||
      JSON.stringify(lastValidation.validationWarnings) !== JSON.stringify(currentValidation.validationWarnings);
    
    if (hasChanged) {
      lastValidationRef.current = currentValidation;
      onValidationUpdate(line.id, currentValidation);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [line.id, twinLines.length, validationErrors.length, validationWarnings.length, isValid]);
  
  const handleCheckboxChange = useCallback((checked) => {
    onToggleSelected(line.id, checked);
  }, [line.id, onToggleSelected]);
  
  return (
    <Table.Row key={line.id} style={{
      opacity: !isSelected && disabled ? 0.5 : 1,
      backgroundColor: !isSelected && disabled ? 'var(--gray-2)' : 'transparent',
    }}>
      <Table.Cell>
        <Flex align="center" gap="2">
          <Checkbox
            checked={isSelected || isPooling}
            onCheckedChange={handleCheckboxChange}
            disabled={disabled || isPooling}
            aria-label="Sélectionner cette ligne pour commande"
          />
          {disabled && !isPooling && (
            <Ban size={14} color="var(--red-9)" style={{ opacity: 0.6 }} title="Élément désélectionné" />
          )}
          {isPooling && (
            <Lock size={14} color="var(--blue-9)" style={{ opacity: 0.6 }} title="Mutualisation en cours" />
          )}
        </Flex>
      </Table.Cell>
      
      <Table.Cell>
        <Text weight="medium">{stock?.name || "—"}</Text>
      </Table.Cell>

      <Table.Cell>
        <Text family="mono" size="1">{stock?.ref || "—"}</Text>
      </Table.Cell>

      <Table.Cell>
        <Badge variant="soft" color="blue">
          {line.supplierRefSnapshot ?? line.supplier_ref_snapshot ?? "—"}
        </Badge>
      </Table.Cell>

      <Table.Cell>
        <Flex align="center" gap="1">
          <Package size={12} />
          <Text weight="medium">{line.quantity}</Text>
        </Flex>
      </Table.Cell>

      <Table.Cell>
        <Flex direction="column" gap="1">
          <Badge color="blue" variant="soft" size="1">
            {prCount} DA{prCount > 1 ? 's' : ''}
          </Badge>
          {twinInfo.hasTwin && (
            <Badge color="amber" variant="soft" size="1" title={`Cette ligne a ${twinInfo.twinCount} jumelle(s) - ${twinInfo.totalLines} fournisseurs au total`}>
              🔗 {twinInfo.twinCount} jumelle{twinInfo.twinCount > 1 ? 's' : ''}
            </Badge>
          )}
        </Flex>
      </Table.Cell>

      <Table.Cell>
        {renderUrgencyBadge(urgency)}
      </Table.Cell>

      <Table.Cell>
        {interventionInfo ? (
          <Link
            to={`/intervention/${interventionInfo.id}`}
            style={{ textDecoration: 'none' }}
            title={`Ouvrir l'intervention ${interventionInfo.code || interventionInfo.id}`}
          >
            <Badge color="blue" variant="soft" size="1" style={{ cursor: 'pointer' }}>
              <Flex align="center" gap="1">
                {interventionInfo.code || interventionInfo.id}
                <ExternalLink size={10} />
              </Flex>
            </Badge>
          </Link>
        ) : (
          <Text color="gray" size="1">—</Text>
        )}
      </Table.Cell>

      <Table.Cell>{renderRequesters(prs)}</Table.Cell>
    </Table.Row>
  );
}

OrderLineRowWithValidation.propTypes = {
  line: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    quantity: PropTypes.number,
    supplierRefSnapshot: PropTypes.string,
    supplier_ref_snapshot: PropTypes.string,
    is_selected: PropTypes.bool,
    isSelected: PropTypes.bool,
    stockItem: PropTypes.object,
    stock_item_id: PropTypes.object,
    purchaseRequests: PropTypes.array,
    purchase_requests: PropTypes.array,
  }).isRequired,
  onToggleSelected: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  isPooling: PropTypes.bool,
  onValidationUpdate: PropTypes.func,
};

/**
 * Tableau complet des lignes de commande
 *
 * @component
 * @param {Object} props
 * @param {Object} props.order - Commande parente
 * @param {Array} props.orderLines - Lignes de la commande
 * @param {Function} props.onLineUpdate - Callback pour mise à jour locale optimiste d'une ligne
 * @param {Function} props.onRefresh - Callback pour rafraîchir après modification (optionnel)
 * @returns {JSX.Element}
 */
export default function OrderLineTable({ 
  order, 
  orderLines = [], 
  onLineUpdate, 
  onRefresh,
  basketStatus = 'UNKNOWN',
  isLocked = false,
  selectionState = {},
  onToggleItemSelection = () => {},
  canModifyItem = () => true,
  twinValidationsByLine = {},
  onTwinValidationUpdate = () => {},
}) {
  // Dedup lines by id to avoid double display when backend returns duplicates
  const uniqueLines = Array.from(new Map(orderLines.map((l) => [l.id, l])).values());
  // Déterminer le statut normalisé
  const normalizedStatus = basketStatus || normalizeBasketStatus(order.status || '');
  const isPooling = normalizedStatus === 'POOLING';
  const isCommandeOrClosed = ['ORDERED', 'CLOSED'].includes(normalizedStatus);
  const [updating, setUpdating] = useState(false);

  // Callback pour recevoir les mises à jour de validation de chaque ligne
  const handleValidationUpdate = useCallback((lineId, validation) => {
    onTwinValidationUpdate(prev => ({
      ...prev,
      [lineId]: validation
    }));
  }, [onTwinValidationUpdate]);

  // Debug: log du statut pour vérifier
  useEffect(() => {
    console.log('[OrderLineTable] Order status:', order.status, 'normalizedStatus:', normalizedStatus, 'isLocked:', isLocked);
  }, [order.status, normalizedStatus, isLocked]);

  // Calculer les alertes globales pour toutes les lignes
  const globalValidationAlerts = useMemo(() => {
    const linesWithErrors = [];
    const linesWithWarnings = [];
    
    uniqueLines.forEach(line => {
      const validation = twinValidationsByLine[line.id];
      if (!validation || !validation.hasTwins) return;
      
      if (validation.validationErrors && validation.validationErrors.length > 0) {
        linesWithErrors.push({
          line,
          ...validation
        });
      } else if (validation.validationWarnings && validation.validationWarnings.length > 0) {
        linesWithWarnings.push({
          line,
          ...validation
        });
      }
    });
    
    return { linesWithErrors, linesWithWarnings };
  }, [uniqueLines, twinValidationsByLine]);

  const handleToggleSelected = useCallback(async (lineId, isSelected) => {
    // En mutualisation: tous les items sont auto-sélectionnés, pas de changement possible
    if (isPooling) {
      return;
    }

    // Si verrouillé ou commandé/clôturé, ne pas autoriser
    if (isLocked || isCommandeOrClosed) {
      return;
    }

    // Appeler la logique du parent pour vérifier les règles métier
    onToggleItemSelection(order.id, lineId);
    
    // Mise à jour optimiste locale immédiate (pas de rechargement)
    if (onLineUpdate) {
      onLineUpdate(lineId, { is_selected: isSelected });
    }
    
    try {
      setUpdating(true);
      // Mise à jour API en arrière-plan
      await suppliers.updateSupplierOrderLine(lineId, { is_selected: isSelected });
    } catch (error) {
      console.error('Erreur mise à jour sélection ligne:', error);
      // En cas d'erreur, recharger depuis l'API pour corriger
      if (onRefresh) {
        await onRefresh();
      }
    } finally {
      setUpdating(false);
    }
  }, [isPooling, isLocked, isCommandeOrClosed, order.id, onToggleItemSelection, onLineUpdate, onRefresh]);

  return (
    <Box>
      <Flex justify="between" align="center" mb="2">
        <Text size="2" weight="bold">
          Lignes de commande ({orderLines.length})
        </Text>
        {isCommandeOrClosed && (
          <Badge color="red" variant="soft" size="1">
            🔒 Panier verrouillé - Modification interdite
          </Badge>
        )}
        {isPooling && (
          <Badge color="blue" variant="soft" size="1">
            🤝 Mutualisation - Tous les items sélectionnés
          </Badge>
        )}
      </Flex>
      
      {/* Afficher les alertes de validation globales */}
      {globalValidationAlerts.linesWithErrors.length > 0 && (
        <TwinLinesValidationAlert
          currentLine={globalValidationAlerts.linesWithErrors[0]?.line}
          twinLines={globalValidationAlerts.linesWithErrors[0]?.twinLines || []}
          validationErrors={globalValidationAlerts.linesWithErrors[0]?.validationErrors || []}
          validationWarnings={[]}
          loading={false}
        />
      )}
      
      {globalValidationAlerts.linesWithWarnings.length > 0 && globalValidationAlerts.linesWithErrors.length === 0 && (
        <TwinLinesValidationAlert
          currentLine={globalValidationAlerts.linesWithWarnings[0]?.line}
          twinLines={globalValidationAlerts.linesWithWarnings[0]?.twinLines || []}
          validationErrors={[]}
          validationWarnings={globalValidationAlerts.linesWithWarnings[0]?.validationWarnings || []}
          loading={false}
        />
      )}

      <Table.Root variant="surface" size="1">
        <Table.Header style={{ position: 'sticky', top: 0, background: 'var(--gray-1)', zIndex: 1 }}>
          <Table.Row>
            <Table.ColumnHeaderCell>Sélection</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Article</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Réf.</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Réf. fournisseur</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Qté</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>DA / Jumelles</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Urgence</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Intervention</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Demandeur</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {uniqueLines.map((line) => (
            <OrderLineRowWithValidation
              key={line.id} 
              line={line} 
              onToggleSelected={handleToggleSelected}
              disabled={isCommandeOrClosed || updating}
              isPooling={isPooling}
              onValidationUpdate={handleValidationUpdate}
            />
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

// ===== PROP TYPES =====
OrderLineTable.propTypes = {
  order: PropTypes.shape({
    status: PropTypes.string.isRequired,
  }).isRequired,
  orderLines: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    })
  ),
  onLineUpdate: PropTypes.func,
  onRefresh: PropTypes.func,
  basketStatus: PropTypes.string,
  isLocked: PropTypes.bool,
  selectionState: PropTypes.object,
  onToggleItemSelection: PropTypes.func,
  canModifyItem: PropTypes.func,
  twinValidationsByLine: PropTypes.object,
  onTwinValidationUpdate: PropTypes.func,
};
