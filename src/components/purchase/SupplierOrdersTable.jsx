import { useState, useCallback, Fragment, useMemo } from "react";
import PropTypes from 'prop-types';
import { useError } from '@/contexts/ErrorContext';
import {
  Box,
  Flex,
  Card,
  Table,
  Text,
  Button,
  Badge,
  Select,
  DropdownMenu,
} from "@radix-ui/themes";
import { Package, Send, Eye, MoreHorizontal, TruckIcon } from "lucide-react";
import { suppliers, stock } from "@/lib/api/facade";
import { CSV_CONFIG, EMAIL_CONFIG } from "@/config/exportConfig";
import {
  generateCSVContent,
  generateEmailBody,
  generateFullEmailHTML,
} from "@/lib/utils/exportGenerator";
import { getSupplierOrderStatus } from "@/config/purchasingConfig";
import TableHeader from "@/components/common/TableHeader";
import FilterSelect from "@/components/common/FilterSelect";
import ExpandableDetailsRow from "@/components/common/ExpandableDetailsRow";

const DAY_IN_MS = 1000 * 60 * 60 * 24;
const STALE_OPEN_DAYS = 5;
const STALE_SENT_DAYS = 3;

const getAgeInDays = (date) => {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(diff / DAY_IN_MS));
};

// DTO-friendly accessors supporting legacy snake_case
const getOrderNumber = (order) => order?.orderNumber ?? order?.order_number;
const getCreatedAt = (order) => order?.createdAt ?? order?.created_at;
const getSupplierObj = (order) => order?.supplier ?? order?.supplier_id;
const getTotalAmount = (order) => order?.totalAmount ?? order?.total_amount;
const getLineCount = (order) => Number(order?.lineCount ?? order?.line_count ?? 0);

const getAgeColor = (order) => {
  const ageDays = getAgeInDays(getCreatedAt(order));
  if (ageDays == null) return "gray";
  
  // Hiérarchie visuelle basée sur statut + âge
  if (order.status === "OPEN") {
    if (ageDays >= STALE_OPEN_DAYS) return "red"; // 5j+ : urgent
    if (ageDays >= 3) return "amber"; // 3-4j : attention
    if (ageDays >= 1) return "yellow"; // 1-2j : surveiller
    return "gray"; // <1j : normal
  }
  
  if (order.status === "SENT") {
    if (ageDays >= STALE_SENT_DAYS) return "amber"; // 3j+ : relancer
    return "gray";
  }
  
  return "gray";
};

/**
 * Table complète de gestion des paniers fournisseurs (supplier orders)
 * Affiche, trie, filtre les commandes avec actions complètes (export, email, changement statut)
 * 
 * ✅ Implémenté :
 * - Tri intelligent : non-commandés en premier, puis par âge décroissant
 * - Système d'âge coloré avec alertes (OPEN >5j = rouge, SENT >3j = amber)
 * - Badge "Urgent" si lignes avec DA >5j
 * - Actions contextuelles selon statut (Relancer/Voir devis/Suivi/Détails)
 * - Export CSV avec BOM UTF-8, formatage personnalisé
 * - Email texte (mailto) et HTML (copie presse-papiers)
 * - Expansion inline pour voir lignes de commande détaillées
 * - Cache des lignes chargées (Map) pour éviter refetch
 * - Validation : montant obligatoire pour passer en RECEIVED
 * - Mise à jour cascade : statut commande → statuts DAs liées
 * - Sticky headers sur tables principale et détails
 * - DropdownMenu pour actions secondaires (détails, exports, emails)
 * - Verrouillage visuel pour paniers RECEIVED/CLOSED
 * 
 * TODO: Améliorations futures :
 * - Édition inline du montant total (input au clic)
 * - Historique des changements de statut avec timeline
 * - Notifications push si commande bloquée >7j
 * - Filtres avancés : plage de dates, montant min/max
 * - Tri cliquable sur colonnes (n°, fournisseur, âge, montant)
 * - Export Excel avec mise en forme (couleurs, graphiques)
 * - Template d'email personnalisable par fournisseur
 * - Génération PDF de bon de commande
 * - Intégration API fournisseur (envoi auto, suivi colis)
 * - Détection automatique du prix depuis devis reçu (OCR)
 * - Dashboard analytics : délais moyens, fournisseurs performants
 * - Actions en batch : exporter plusieurs commandes simultanément
 */
export default function SupplierOrdersTable({
  orders,
  onRefresh,
  // Optional header controls (when you want the table to manage its own header)
  showHeader = false,
  searchTerm = "",
  onSearchChange = () => {},
  statusFilter = undefined,
  onStatusFilterChange = () => {},
  supplierFilter = undefined,
  onSupplierFilterChange = () => {},
  supplierOptions = [],
}) {
  const { showError } = useError();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderLines, setOrderLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  // Tri par défaut : paniers non commandés d'abord, puis âge décroissant
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      // Priorité 1 : Non commandés avant commandés
      const aCompleted = ['RECEIVED', 'CLOSED', 'CANCELLED'].includes(a.status);
      const bCompleted = ['RECEIVED', 'CLOSED', 'CANCELLED'].includes(b.status);
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
      
      // Priorité 2 : Âge décroissant (plus vieux en premier)
      const ageA = getAgeInDays(getCreatedAt(a)) || 0;
      const ageB = getAgeInDays(getCreatedAt(b)) || 0;
      return ageB - ageA;
    });
  }, [orders]);

  // Fonction utilitaire pour récupérer les lignes (mise en cache)
  const [cachedLines, setCachedLines] = useState(new Map());
  
  const getOrderLines = useCallback(
    async (orderId, { forceRefresh = false } = {}) => {
      // Force a refetch when exports need up-to-date manufacturer info
      if (!forceRefresh && cachedLines.has(orderId)) {
        return cachedLines.get(orderId);
      }

      const lines = await suppliers.fetchSupplierOrderLines(orderId);
      setCachedLines((prev) => new Map(prev).set(orderId, lines));
      return lines;
    },
    [cachedLines]
  );

  const handleViewDetails = useCallback(async (order) => {
    try {
      setLoading(true);
      setSelectedOrder(order);
      const lines = await getOrderLines(order.id);
      setOrderLines(lines);
      setExpandedOrderId(expandedOrderId === order.id ? null : order.id);
    } catch (error) {
      showError(error instanceof Error ? error : new Error("Erreur lors du chargement des détails"));
    } finally {
      setLoading(false);
    }
  }, [getOrderLines, expandedOrderId, showError]);

  const handleExportCSV = useCallback(async (order) => {
    try {
      const lines = await getOrderLines(order.id, { forceRefresh: true });
      const csvContent = generateCSVContent(lines);
      
      // Télécharger le fichier
      const blob = new Blob(["\ufeff" + csvContent], { 
        type: `text/csv;charset=${CSV_CONFIG.encoding};` 
      });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = CSV_CONFIG.fileNamePattern(
        getOrderNumber(order), 
        getSupplierObj(order)?.name || "fournisseur"
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      showError(error instanceof Error ? error : new Error("Erreur lors de l'export CSV"));
    }
  }, [getOrderLines, showError]);

  const handleSendEmail = useCallback(async (order) => {
    try {
      const lines = await getOrderLines(order.id, { forceRefresh: true });
      const subject = EMAIL_CONFIG.subject(getOrderNumber(order));
      const bodyText = generateEmailBody(order, lines);
      
      // mailto avec texte formaté (pas de HTML)
      const mailtoLink = `mailto:${getSupplierObj(order)?.email || ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;
      
      // Ouvrir dans le client email
      window.location.href = mailtoLink;
    } catch (error) {
      showError(error instanceof Error ? error : new Error("Erreur lors de la préparation de l'email"));
    }
  }, [getOrderLines, showError]);

  const handleCopyHTMLEmail = useCallback(async (order) => {
    try {
      const lines = await getOrderLines(order.id, { forceRefresh: true });
      const htmlContent = generateFullEmailHTML(order, lines);
      
      // Copier le HTML dans le presse-papiers
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([generateEmailBody(order, lines)], { type: 'text/plain' })
        })
      ]);
      
      showError(new Error("Email HTML copié ! Collez-le (Ctrl+V) dans votre client email."));
    } catch (error) {
      showError(error instanceof Error ? error : new Error("Erreur lors de la copie dans le presse-papiers"));
    }
  }, [getOrderLines, showError]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setLoading(true);
      
      // Validation : Montant obligatoire pour passer en RECEIVED
      const currentOrder = orders.find(o => o.id === orderId);
      if (newStatus === 'RECEIVED' && (!getTotalAmount(currentOrder) || Number(getTotalAmount(currentOrder)) <= 0)) {
        showError(new Error('Montant obligatoire pour passer en "Commandé". Veuillez saisir un montant (même estimatif).'));
        setLoading(false);
        return;
      }
      
      // 1. Récupérer toutes les lignes du panier
      const lines = await suppliers.fetchSupplierOrderLines(orderId);
      
      // 2. Mapper le statut commande → statut DA
      const statusMapping = {
        "OPEN": "in_progress",
        "SENT": "ordered", 
        "ACK": "ordered",
        "RECEIVED": "ordered", // "Commandé" = commande passée, DA reste en ordered
        "CLOSED": "received",
        "CANCELLED": "cancelled"
      };
      
      const daStatus = statusMapping[newStatus];
      
      if (!daStatus) {
        console.error("Statut invalide:", newStatus);
        return;
      }
      
      // 3. Mettre à jour tous les DAs liés
      const allRequests = Array.from(
        new Set(
          lines.flatMap((line) => {
            const prs = line.purchaseRequests ?? line.purchase_requests ?? [];
            return prs.map((pr) => {
              const prField = pr.purchaseRequest ?? pr.purchase_request_id;
              if (prField && typeof prField === 'object') return prField.id;
              return prField || null;
            });
          })
        )
      ).filter(Boolean);
      
      await Promise.all(
        allRequests.map((prId) =>
          stock.updatePurchaseRequest(prId, { status: daStatus })
        )
      );
      
      // 4. Mettre à jour le statut de la commande
      const updateData = { status: newStatus };
      if (newStatus === "SENT") {
        updateData.ordered_at = new Date().toISOString();
      } else if (newStatus === "CLOSED") {
        updateData.received_at = new Date().toISOString();
      }
      
      await suppliers.updateSupplierOrder(orderId, updateData);
      
      // 5. Rafraîchir les données
      await onRefresh();
      
      // 6. Recharger les lignes si expandée
      if (expandedOrderId === orderId) {
        const updatedLines = await suppliers.fetchSupplierOrderLines(orderId);
        setOrderLines(updatedLines);
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      
    } catch (error) {
      console.error("Erreur changement statut:", error);
      showError(error instanceof Error ? error : new Error("Erreur lors du changement de statut"));
    } finally {
      setLoading(false);
    }
  };

  const renderHeader = () => (
    showHeader ? (
      <TableHeader
        icon={TruckIcon}
        title="Paniers fournisseurs"
        count={orders.length}
        searchValue={searchTerm}
        onSearchChange={onSearchChange}
        onRefresh={onRefresh}
        showRefreshButton={true}
        searchPlaceholder="Recherche (n°, fournisseur...)"
        actions={
          <Flex align="center" gap="2">
            {typeof statusFilter !== "undefined" && (
              <FilterSelect
                label="Statut"
                value={statusFilter}
                onValueChange={onStatusFilterChange}
                minWidth="200px"
                inline
                options={[
                  { value: "all", label: "Tous" },
                  { value: "OPEN", label: "Ouverts" },
                  { value: "SENT", label: "Envoyés (attente réponse)" },
                  { value: "ACK", label: "Réponse reçue" },
                  { value: "RECEIVED", label: "Commandés" },
                  { value: "CLOSED", label: "Clôturés" },
                ]}
              />
            )}
            {typeof supplierFilter !== "undefined" && (
              <FilterSelect
                label="Fournisseur"
                value={supplierFilter}
                onValueChange={onSupplierFilterChange}
                minWidth="220px"
                inline
                options={supplierOptions}
              />
            )}
          </Flex>
        }
      />
    ) : null
  );

  const canShowAmount = (status) => ["ACK", "RECEIVED", "CLOSED"].includes(status);

  const hasUrgentLines = (order) => {
    // Si pas de lignes chargées, on ne peut pas déterminer
    if (!cachedLines.has(order.id)) return false;
    const lines = cachedLines.get(order.id);
    // Ligne urgente = demande avec âge > 5j
    return lines.some(line => 
      (line.purchaseRequests ?? line.purchase_requests)?.some(pr => {
        const prObj = pr.purchaseRequest ?? pr.purchase_request_id;
        const reqDate = (typeof prObj === 'object' ? prObj?.createdAt ?? prObj?.created_at : null);
        if (!reqDate) return false;
        const age = getAgeInDays(reqDate);
        return age != null && age > 5;
      })
    );
  };

  const getPrimaryAction = (order) => {
    if (order.status === "SENT") {
      return {
        label: "Relancer",
        color: "amber",
        icon: Send,
        onClick: () => handleSendEmail(order),
      };
    }

    if (order.status === "ACK") {
      return {
        label: "Voir devis",
        color: "blue",
        icon: Eye,
        onClick: () => handleViewDetails(order),
      };
    }

    if (order.status === "RECEIVED") {
      return {
        label: "Suivi",
        color: "blue",
        icon: Eye,
        onClick: () => handleViewDetails(order),
      };
    }

    return {
      label: "Détails",
      color: "gray",
      icon: Eye,
      onClick: () => handleViewDetails(order),
    };
  };

  return (
    <>
      {renderHeader()}
      {orders.length === 0 ? (
        <Card>
          <Flex align="center" justify="center" p="6" direction="column" gap="3">
            <Package size={48} color="var(--gray-9)" />
            <Text color="gray" size="4">Aucun panier fournisseur</Text>
          </Flex>
        </Card>
      ) : (
        <Flex direction="column" gap="3">
          <Table.Root variant="surface">
        <Table.Header style={{ position: 'sticky', top: 0, background: 'var(--gray-1)', zIndex: 1 }}>
          <Table.Row>
            <Table.ColumnHeaderCell>N° Commande</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Nb lignes</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Montant</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Âge (j)</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {sortedOrders.map((order) => {
            const lineCount = getLineCount(order);
            const ageDays = getAgeInDays(getCreatedAt(order));
            const isBlocking = (
              (order.status === "OPEN" && ageDays != null && ageDays > STALE_OPEN_DAYS) ||
              (order.status === "SENT" && ageDays != null && ageDays > STALE_SENT_DAYS)
            );
            const blockingReason = order.status === "OPEN"
              ? "Panier ouvert depuis plusieurs jours"
              : "Envoyé sans réponse";
            const ageColor = getAgeColor(order);
            const primaryAction = getPrimaryAction(order);
            const PrimaryIcon = primaryAction?.icon;
            const isUrgent = hasUrgentLines(order);

            return (
              <Fragment key={order.id}>
                <Table.Row>
                  <Table.Cell>
                    <Flex align="center" gap="2">
                      {isUrgent && (
                        <Badge color="red" variant="solid" size="1">Urgent</Badge>
                      )}
                      {isBlocking && (
                        <Text title={blockingReason}>⚠️</Text>
                      )}
                      <Text weight="bold" family="mono">
                        {getOrderNumber(order) || "—"}
                      </Text>
                    </Flex>
                  </Table.Cell>

                  <Table.Cell>
                    <Text weight="medium">
                      {getSupplierObj(order)?.name || "—"}
                    </Text>
                  </Table.Cell>

                  <Table.Cell>
                    {(() => {
                      const statusConfig = getSupplierOrderStatus(order.status);
                      return (
                        <Badge color={statusConfig.color} variant="solid" size="2">
                          {statusConfig.icon && <span style={{ marginRight: '4px' }}>{statusConfig.icon}</span>}
                          {statusConfig.label}
                        </Badge>
                      );
                    })()}
                  </Table.Cell>

                  <Table.Cell>
                    <Badge color="gray" variant="soft">
                      {lineCount} ligne{lineCount > 1 ? "s" : ""}
                    </Badge>
                  </Table.Cell>

                  <Table.Cell>
                    {canShowAmount(order.status) && Number(getTotalAmount(order)) > 0 ? (
                      <Text weight="medium">
                        {Number(getTotalAmount(order)).toFixed(2)} {order.currency || "EUR"}
                      </Text>
                    ) : order.status !== "OPEN" ? (
                      <Text color="amber" size="1" style={{ fontStyle: "italic" }}>
                        À saisir
                      </Text>
                    ) : (
                      <Text color="gray">—</Text>
                    )}
                  </Table.Cell>

                  <Table.Cell>
                    <Badge color={ageColor} variant="soft">
                      {ageDays != null ? `${ageDays} j` : "—"}
                    </Badge>
                  </Table.Cell>

                  <Table.Cell>
                    <Flex gap="2" wrap="wrap" align="center">
                      {primaryAction && (
                        <Button
                          size="1"
                          variant="solid"
                          color={primaryAction.color}
                          onClick={primaryAction.onClick}
                          disabled={loading}
                        >
                          {PrimaryIcon && <PrimaryIcon size={14} />}
                          {primaryAction.label}
                        </Button>
                      )}

                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger>
                          <Button size="1" variant="ghost" color="gray" aria-label="Autres actions">
                            <MoreHorizontal size={16} />
                          </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content>
                          {primaryAction?.label !== "Détails" && (
                            <DropdownMenu.Item onSelect={() => handleViewDetails(order)}>
                              Voir les détails
                            </DropdownMenu.Item>
                          )}
                          <DropdownMenu.Item onSelect={() => handleExportCSV(order)}>
                            Export CSV
                          </DropdownMenu.Item>
                          <DropdownMenu.Item onSelect={() => handleSendEmail(order)}>
                            📧 Email texte (mailto)
                          </DropdownMenu.Item>
                          <DropdownMenu.Item onSelect={() => handleCopyHTMLEmail(order)}>
                            📋 Copier email HTML
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>

                      <Select.Root
                        value={order.status}
                        onValueChange={(value) => handleStatusChange(order.id, value)}
                        disabled={loading}
                      >
                        <Select.Trigger 
                          variant="soft" 
                          size="1"
                          style={{ minWidth: '140px' }}
                        />
                        <Select.Content>
                          <Select.Item value="OPEN">Ouvert</Select.Item>
                          <Select.Item value="SENT">Envoyé (attente)</Select.Item>
                          <Select.Item value="ACK">Réponse reçue</Select.Item>
                          <Select.Item value="RECEIVED">Commandé</Select.Item>
                          <Select.Item value="CLOSED">Clôturé</Select.Item>
                          <Select.Item value="CANCELLED">Annulé</Select.Item>
                        </Select.Content>
                      </Select.Root>
                    </Flex>
                  </Table.Cell>
                </Table.Row>

                {/* Ligne expansible avec détails */}
                {expandedOrderId === order.id && (
                  <ExpandableDetailsRow colSpan={7} withCard={true}>
                    <Box>
                        <Flex justify="between" align="center" mb="2">
                          <Text size="2" weight="bold">
                            Lignes de commande ({orderLines.length})
                          </Text>
                          {(order.status === "RECEIVED" || order.status === "CLOSED") && (
                            <Badge color="red" variant="soft" size="1">
                              🔒 Panier verrouillé
                            </Badge>
                          )}
                        </Flex>

                        <Table.Root variant="surface" size="1">
                          <Table.Header style={{ position: 'sticky', top: 0, background: 'var(--gray-1)', zIndex: 1 }}>
                            <Table.Row>
                              <Table.ColumnHeaderCell>Article</Table.ColumnHeaderCell>
                              <Table.ColumnHeaderCell>Réf.</Table.ColumnHeaderCell>
                              <Table.ColumnHeaderCell>Réf. fournisseur</Table.ColumnHeaderCell>
                              <Table.ColumnHeaderCell>Qté</Table.ColumnHeaderCell>
                              <Table.ColumnHeaderCell>Intervention</Table.ColumnHeaderCell>
                              <Table.ColumnHeaderCell>Demandeur</Table.ColumnHeaderCell>
                            </Table.Row>
                          </Table.Header>

                          <Table.Body>
                            {orderLines.map((line) => (
                              <Table.Row key={line.id}>
                                <Table.Cell>
                                  <Text weight="medium">
                                    {(line.stockItem ?? line.stock_item_id)?.name || "—"}
                                  </Text>
                                </Table.Cell>

                                <Table.Cell>
                                  <Text family="mono" size="1">
                                    {(line.stockItem ?? line.stock_item_id)?.ref || "—"}
                                  </Text>
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
                                    {(line.purchaseRequests ?? line.purchase_requests)?.length > 1 && (
                                      <Badge color="gray" size="1">
                                        {(line.purchaseRequests ?? line.purchase_requests).length} DAs
                                      </Badge>
                                    )}
                                  </Flex>
                                </Table.Cell>

                                <Table.Cell>
                                  {(line.purchaseRequests ?? line.purchase_requests)?.length > 0 && ((line.purchaseRequests ?? line.purchase_requests)[0].purchaseRequest?.intervention?.id || (line.purchaseRequests ?? line.purchase_requests)[0].purchase_request_id?.intervention_id) ? (
                                    <Badge color="blue" variant="soft" size="1">
                                      {(() => {
                                        const first = (line.purchaseRequests ?? line.purchase_requests)[0];
                                        const interv = first.purchaseRequest?.intervention ?? first.purchase_request_id?.intervention_id;
                                        if (interv && typeof interv === 'object') return interv.code || interv.id;
                                        return interv || '—';
                                      })()}
                                    </Badge>
                                  ) : (
                                    <Text color="gray" size="1">—</Text>
                                  )}
                                </Table.Cell>

                                <Table.Cell>
                                  <Flex direction="column" gap="1">
                                    {(line.purchaseRequests ?? line.purchase_requests)?.slice(0, 2).map((pr, idx) => (
                                      <Text key={idx} size="1" color="gray">
                                        {(pr.purchaseRequest ?? pr.purchase_request_id)?.requested_by || (pr.purchaseRequest ?? pr.purchase_request_id)?.requestedBy || "—"}
                                      </Text>
                                    ))}
                                    {(line.purchaseRequests ?? line.purchase_requests)?.length > 2 && (
                                      <Text size="1" color="gray" style={{ fontStyle: "italic" }}>
                                        +{(line.purchaseRequests ?? line.purchase_requests).length - 2} autre{(line.purchaseRequests ?? line.purchase_requests).length - 2 > 1 ? "s" : ""}
                                      </Text>
                                    )}
                                  </Flex>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      </Box>
                  </ExpandableDetailsRow>
                )}
              </Fragment>
            );
          })}
        </Table.Body>
      </Table.Root>
        </Flex>
      )}
    </>
  );
}
SupplierOrdersTable.propTypes = {
  orders: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      order_number: PropTypes.string,
      orderNumber: PropTypes.string,
      status: PropTypes.string.isRequired,
      created_at: PropTypes.string,
      createdAt: PropTypes.string,
      ordered_at: PropTypes.string,
      orderedAt: PropTypes.string,
      received_at: PropTypes.string,
      receivedAt: PropTypes.string,
      total_amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      totalAmount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      currency: PropTypes.string,
      line_count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      lineCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      supplier_id: PropTypes.shape({
        name: PropTypes.string,
        email: PropTypes.string,
      }),
      supplier: PropTypes.shape({
        name: PropTypes.string,
        email: PropTypes.string,
      }),
    })
  ).isRequired,
  onRefresh: PropTypes.func.isRequired,
  showHeader: PropTypes.bool,
  searchTerm: PropTypes.string,
  onSearchChange: PropTypes.func,
  statusFilter: PropTypes.string,
  onStatusFilterChange: PropTypes.func,
  supplierFilter: PropTypes.string,
  onSupplierFilterChange: PropTypes.func,
  supplierOptions: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string,
      label: PropTypes.string,
    })
  ),
};