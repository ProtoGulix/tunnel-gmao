import { Fragment, useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Table, Text, Badge, Flex, Button, Card, Box, TextField, TextArea, Select, Checkbox } from "@radix-ui/themes";
import { Package, AlertTriangle, AlertCircle, Building2, FileText, Plus, Send, Hourglass, FileQuestion } from "lucide-react";

import ExpandableDetailsRow from "@/components/common/ExpandableDetailsRow";
import SearchSpecsDialog from "./SearchSpecsDialog";

export default function PurchaseRequestsTable({
  requests,
  expandedRequestId,
  onToggleExpand = () => {},
  renderExpandedContent = () => null,
  stockItems = [],
  supplierRefs = {},
  standardSpecs = {},
  onRefresh,
  onAddSupplierRef,
  onAddStandardSpec,
  suppliers = [],
  loading = false,
  setDispatchResult,
  compact = false,
}) {
  const [detailsExpandedId, setDetailsExpandedId] = useState(null);
  const [missingExpandedId, setMissingExpandedId] = useState(null);
  const [addingSupplierRefId, setAddingSupplierRefId] = useState(null);
  const [addingSpecsId, setAddingSpecsId] = useState(null);
  const [refFormData, setRefFormData] = useState({ supplier_id: "", supplier_ref: "", unit_price: "", delivery_time_days: "" });
  const [specsFormData, setSpecsFormData] = useState({ title: "", spec_text: "", isDefault: true });

  const getStockItemDetails = (stockItemId) => {
    if (!stockItemId) return null;
    return stockItems.find((item) => item.id === stockItemId) || null;
  };
  const getSupplierRefsForItem = (stockItemId) => {
    if (!stockItemId) return [];
    return supplierRefs[stockItemId] || [];
  };
  const getStandardSpecsForItem = (stockItemId) => {
    if (!stockItemId) return [];
    return standardSpecs[stockItemId] || [];
  };
  const getPreferredSupplier = useCallback((stockItemId) => {
    const refs = supplierRefs[stockItemId] || [];
    const pref = refs.find((r) => r.isPreferred);
    return pref?.supplier_id?.name || null;
  }, [supplierRefs]);
  const getStockItemRef = useCallback((stockItemId) => {
    if (!stockItemId) return null;
    const item = stockItems.find((item) => item.id === stockItemId) || null;
    return item?.ref || null;
  }, [stockItems]);
  const getAgeDays = (createdAt) => {
    const ms = Date.now() - new Date(createdAt).getTime();
    return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
  };
  const getRowAgeColor = (days) => {
    if (days < 2) return "transparent"; // neutre/blanc
    if (days <= 5) return "var(--amber-2)"; // 3-5j: orange clair
    return "var(--red-2)"; // >=5j: rouge clair
  };
  const getAgeColor = (days) => {
    if (days < 2) return "transparent";
    if (days <= 5) return "var(--amber-2)";
    return "var(--red-2)";
  };
  const getBusinessStatus = (request) => {
    const hasLink = !!request.stockItemId;
    const hasQty = Number(request.quantity) > 0;
    const hasRef = !!getStockItemRef(request.stockItemId);
    const hasPrefSupp = !!getPreferredSupplier(request.stockItemId);
    const missing = !(hasLink && hasQty && hasRef && hasPrefSupp);
    if (missing) return { key: "to_qualify", icon: FileQuestion, label: "À qualifier" };
    const statusId = typeof request.status === "string" ? request.status : request.status?.id;
    if (statusId === "received") return { key: "received", icon: Package, label: "Reçue" };
    if (statusId === "ordered") return { key: "ordered", icon: Package, label: "Commandée" };
    if (statusId === "in_progress") return { key: "waiting", icon: Hourglass, label: "Attente fournisseur" };
    return { key: "sent", icon: Send, label: "Envoyée" };
  };
  const getMissingList = (request) => {
    const items = [];
    if (!request.stockItemId) items.push("Lien article manquant");
    if (!(Number(request.quantity) > 0)) items.push("Quantité manquante");
    if (!getStockItemRef(request.stockItemId)) items.push("Référence article manquante");
    if (!getPreferredSupplier(request.stockItemId)) items.push("Fournisseur préféré manquant");
    return items;
  };
  const getBlockageCause = (request) => {
    const causes = [];
    if (!request.stockItemId) causes.push("article non lié");
    if (!getStockItemRef(request.stockItemId)) causes.push("référence manquante");
    if (!getPreferredSupplier(request.stockItemId)) causes.push("fournisseur manquant");
    return causes.join(" + ");
  };

  // Tri : moins complet en premier, puis par âge décroissant, commandées en bas
  const sortedRequests = useMemo(() => {
    // Calcul du score de complétude : moins complet (score bas) = priorité haute
    const getCompletenessScore = (request) => {
      let score = 0;
      const hasLink = !!request.stockItemId;
      const hasRef = !!getStockItemRef(request.stockItemId);
      const hasPrefSupp = !!getPreferredSupplier(request.stockItemId);
      
      // Chaque critère = +100 points
      if (hasLink) score += 100;
      if (hasRef) score += 100;
      if (hasPrefSupp) score += 100;
      
      return score; // 0 (aucun) à 300 (complet)
    };

    return [...requests].sort((a, b) => {
      // Priorité 0 : Statut - "À qualifier" en haut, commandées/reçues en bas
      const getStatusPriority = (status) => {
        const statusId = typeof status === "string" ? status : status?.id;
        if (statusId === "received" || statusId === "ordered") return 3; // Bas : commandée/reçue
        if (statusId === "in_progress") return 2; // Milieu : en attente fournisseur
        return 0; // Haut : autres (à qualifier, envoyée, etc.)
      };
      
      const statusPrioA = getStatusPriority(a.status);
      const statusPrioB = getStatusPriority(b.status);
      if (statusPrioA !== statusPrioB) return statusPrioA - statusPrioB;
      
      // Priorité 1 : Complétude - moins complet en premier (score croissant)
      const scoreA = getCompletenessScore(a);
      const scoreB = getCompletenessScore(b);
      if (scoreA !== scoreB) return scoreA - scoreB;
      
      // Priorité 2 : Âge décroissant (plus vieux en premier)
      const ageA = getAgeDays(a.createdAt);
      const ageB = getAgeDays(b.createdAt);
      return ageB - ageA;
    });
  }, [requests, getStockItemRef, getPreferredSupplier]);

  if (requests.length === 0) {
    return (
      <Table.Root variant="surface" size={compact ? "1" : "2"}>
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>⚠️</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Article</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Référence</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Qté</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Âge (j)</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Action</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.Cell colSpan={8}>
              <Flex align="center" justify="between" p="4" gap="3" wrap="wrap">
                <Text color="gray">Aucune demande trouvée</Text>
                {onRefresh && (
                  <Button size="2" variant="soft" color="blue" onClick={onRefresh}>
                    Rafraîchir
                  </Button>
                )}
              </Flex>
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    );
  }

  return (
    <Table.Root variant="surface" size={compact ? "1" : "2"}>
      <Table.Header style={{ position: "sticky", top: 0, background: "var(--gray-1)", zIndex: 1 }}>
        <Table.Row>
          <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>⚠️</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Article</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Référence</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Qté</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Âge (j)</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Action</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>

      <Table.Body>
        {sortedRequests.map((request) => (
          <Fragment key={request.id}>
            {(() => {
              const age = getAgeDays(request.createdAt);
              const bg = getRowAgeColor(age);
              const biz = getBusinessStatus(request);
              const MissingIcon = AlertTriangle;
              const missingList = getMissingList(request);
              const hasMissing = missingList.length > 0;
              const BizIcon = biz.icon;
              const stockItem = getStockItemDetails(request.stockItemId);
              const supplierName = getPreferredSupplier(request.stockItemId);
              return (
                <Table.Row style={{ background: bg }}>
                  <Table.Cell>
                    <Badge variant="soft">
                      <Flex align="center" gap="1">
                        <BizIcon size={14} />
                        {biz.label}
                      </Flex>
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    {hasMissing ? (
                      <Button
                        size="1"
                        variant="soft"
                        color="amber"
                        onClick={() => setMissingExpandedId(missingExpandedId === request.id ? null : request.id)}
                        aria-label={`Bloquée: ${getBlockageCause(request)}`}
                        title={getBlockageCause(request)}
                      >
                        <MissingIcon size={14} />
                        Bloquée
                      </Button>
                    ) : (
                      <Text color="gray">✓</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Text weight="medium">{request.itemLabel || stockItem?.name || "-"}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    {getStockItemRef(request.stockItemId) ? (
                      <Badge color="green" variant="soft">{getStockItemRef(request.stockItemId)}</Badge>
                    ) : (
                      <Text color="gray">-</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Text weight="medium">{request.quantity || "-"}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    {supplierName ? (
                      <Text>{supplierName}</Text>
                    ) : (
                      <Flex align="center" gap="1">
                        <AlertTriangle size={14} color="var(--amber-9)" />
                        <Text color="amber" size="2">À définir</Text>
                      </Flex>
                    )}
                  </Table.Cell>
                  <Table.Cell style={{ background: getAgeColor(age) }}>
                    <Text weight="medium">{age}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    {(() => {
                      if (hasMissing) {
                        return (
                          <Button
                            size="1"
                            color={expandedRequestId === request.id ? "gray" : "blue"}
                            variant="soft"
                            onClick={() => onToggleExpand(request.id)}
                            aria-expanded={expandedRequestId === request.id}
                          >
                            Qualifier
                          </Button>
                        );
                      }
                      if (biz.key === "waiting") {
                        const canRelance = age > 2;
                        return canRelance ? (
                          <Button size="1" color="amber" variant="soft" aria-label="Relancer le fournisseur">
                            Relancer
                          </Button>
                        ) : (
                          <Text size="2" color="gray">En attente</Text>
                        );
                      }
                      if (biz.key === "sent") {
                        return (
                          <Button size="1" color="blue" variant="soft" onClick={() => setDetailsExpandedId(detailsExpandedId === request.id ? null : request.id)}>
                            Voir devis
                          </Button>
                        );
                      }
                      if (biz.key === "ordered") {
                        return (
                          <Button size="1" color="green" variant="soft" disabled aria-label="Attendez la réception">
                            Réception
                          </Button>
                        );
                      }
                      return (
                        <Button
                          size="1"
                          variant="soft"
                          color={detailsExpandedId === request.id ? "gray" : "blue"}
                          onClick={() => setDetailsExpandedId(detailsExpandedId === request.id ? null : request.id)}
                        >
                          Détails
                        </Button>
                      );
                    })()}
                  </Table.Cell>
                </Table.Row>
              );
            })()}

            {expandedRequestId === request.id && renderExpandedContent(request)}

            {missingExpandedId === request.id && (
              <ExpandableDetailsRow colSpan={8} withCard={false}>
                <Card>
                  <Flex direction="column" gap="2" p="3">
                    <Text weight="bold">Informations manquantes</Text>
                    {getMissingList(request).map((m, idx) => (
                      <Text key={idx} size="2">• {m}</Text>
                    ))}
                  </Flex>
                </Card>
              </ExpandableDetailsRow>
            )}

            {detailsExpandedId === request.id && request.stockItemId && (
              <ExpandableDetailsRow colSpan={8} withCard={false}>
                <Flex direction="column" gap="3" p="4">
                  {(() => {
                    const stockItem = getStockItemDetails(request.stockItemId);
                    return (
                      stockItem && (
                        <Flex align="center" justify="between">
                          <Flex align="center" gap="2">
                            <Package size={16} color="var(--gray-9)" />
                            <Box>
                              <Text weight="bold" size="3" pl="3">Article en stock</Text>
                              <Badge variant="outline" size="3">{stockItem.ref}</Badge>
                            </Box>
                          </Flex>
                          <Flex gap="2">
                            <Text size="2">{stockItem.name}</Text>
                            <Badge variant="soft">{stockItem.family_code}</Badge>
                          </Flex>
                        </Flex>
                      )
                    );
                  })()}

                  {(() => {
                    const refs = getSupplierRefsForItem(request.stockItemId);
                    const isAddingRefs = addingSupplierRefId === request.stockItemId;
                    return (
                      <Card>
                        <Flex direction="column" gap="2" p="3">
                          <Flex align="center" justify="between">
                            <Flex align="center" gap="2">
                              <Building2 size={16} color="var(--gray-9)" />
                              <Box>
                                <Text weight="bold" size="3" pl="3">Références fournisseurs</Text>
                                <Badge variant="outline" size="3">{refs.length}</Badge>
                              </Box>
                            </Flex>
                            {onAddSupplierRef && !isAddingRefs && (
                              <Button size="2" variant="soft" color="blue" onClick={() => setAddingSupplierRefId(request.stockItemId)}>
                                <Plus size={14} />
                                Ajouter
                              </Button>
                            )}
                          </Flex>
                          {refs.length > 0 && (
                            <Table.Root size="1">
                              <Table.Header>
                                <Table.Row>
                                  <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
                                  <Table.ColumnHeaderCell>Référence</Table.ColumnHeaderCell>
                                  <Table.ColumnHeaderCell>Prix</Table.ColumnHeaderCell>
                                  <Table.ColumnHeaderCell>Délai</Table.ColumnHeaderCell>
                                  <Table.ColumnHeaderCell>Préféré</Table.ColumnHeaderCell>
                                </Table.Row>
                              </Table.Header>
                              <Table.Body>
                                {refs.map((ref, idx) => (
                                  <Table.Row key={idx} style={{ background: ref.isPreferred ? "var(--green-2)" : undefined }}>
                                    <Table.Cell>
                                      <Text size="2" weight={ref.isPreferred ? "bold" : "regular"}>
                                        {ref.supplier?.name || "Fournisseur inconnu"}
                                      </Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Text size="2" weight={ref.isPreferred ? "bold" : "regular"}>
                                        {ref.supplierRef}
                                      </Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Text size="2">{ref.unitPrice ? `${ref.unitPrice}€` : "-"}</Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Badge variant="soft" size="1" color="blue">{ref.deliveryTimeDays ? `${ref.deliveryTimeDays}j` : "-"}</Badge>
                                    </Table.Cell>
                                    <Table.Cell>
                                      {ref.isPreferred && <Badge color="green" size="1" variant="solid">Préféré</Badge>}
                                    </Table.Cell>
                                  </Table.Row>
                                ))}
                              </Table.Body>
                            </Table.Root>
                          )}
                          {refs.length === 0 && !isAddingRefs && (
                            <Flex direction="column" gap="1" align="center" p="3">
                              <AlertCircle size={20} color="var(--gray-8)" />
                              <Text size="2" color="gray">Aucune référence fournisseur</Text>
                            </Flex>
                          )}
                          {isAddingRefs && (
                            <Flex direction="column" gap="3" p="3" style={{ borderTop: "1px solid var(--gray-4)" }}>
                              <Text weight="bold" size="2">Ajouter une référence fournisseur</Text>
                              <Box>
                                <Text size="2" weight="bold" mb="2" style={{ display: "block" }}>Fournisseur</Text>
                                <Select.Root value={refFormData.supplier_id} onValueChange={(value) => setRefFormData({ ...refFormData, supplier_id: value })}>
                                  <Select.Trigger placeholder="Sélectionner un fournisseur" />
                                  <Select.Content>
                                    {suppliers.map((supplier) => (
                                      <Select.Item key={supplier.id} value={String(supplier.id)}>
                                        {supplier.name}
                                      </Select.Item>
                                    ))}
                                  </Select.Content>
                                </Select.Root>
                              </Box>
                              <Box>
                                <Text size="2" weight="bold" mb="2" style={{ display: "block" }}>Référence fournisseur</Text>
                                <TextField.Root placeholder="Ex: 51775.040.020" value={refFormData.supplier_ref} onChange={(e) => setRefFormData({ ...refFormData, supplier_ref: e.target.value })} />
                              </Box>
                              <Box>
                                <Text size="2" weight="bold" mb="2" style={{ display: "block" }}>Prix unitaire (optionnel)</Text>
                                <TextField.Root type="number" step="0.01" placeholder="0.00" value={refFormData.unit_price} onChange={(e) => setRefFormData({ ...refFormData, unit_price: e.target.value })} />
                              </Box>
                              <Box>
                                <Text size="2" weight="bold" mb="2" style={{ display: "block" }}>Délai livraison en jours (optionnel)</Text>
                                <TextField.Root type="number" placeholder="7" value={refFormData.delivery_time_days} onChange={(e) => setRefFormData({ ...refFormData, delivery_time_days: e.target.value })} />
                              </Box>
                              <Flex gap="2" justify="end">
                                <Button variant="soft" color="gray" onClick={() => { setAddingSupplierRefId(null); setRefFormData({ supplier_id: "", supplier_ref: "", unit_price: "", delivery_time_days: "" }); }}>Annuler</Button>
                                <Button color="blue" disabled={loading} onClick={async () => {
                                  const trimmedSupplierId = refFormData.supplier_id?.trim() || '';
                                  const trimmedSupplierRef = refFormData.supplier_ref?.trim() || '';
                                  if (onAddSupplierRef && trimmedSupplierId && trimmedSupplierRef) {
                                    try {
                                      await onAddSupplierRef(request.stockItemId, {
                                        supplier_id: trimmedSupplierId,
                                        supplier_ref: trimmedSupplierRef,
                                        unit_price: refFormData.unit_price ? parseFloat(refFormData.unit_price) : null,
                                        delivery_time_days: refFormData.delivery_time_days ? parseInt(refFormData.delivery_time_days) : null,
                                      });
                                      await new Promise((resolve) => setTimeout(resolve, 500));
                                      setRefFormData({ supplier_id: "", supplier_ref: "", unit_price: "", delivery_time_days: "" });
                                    } catch (err) {
                                      console.error("Erreur:", err);
                                    }
                                  }
                                }}>{loading ? "Enregistrement..." : "Ajouter"}</Button>
                              </Flex>
                            </Flex>
                          )}
                        </Flex>
                      </Card>
                    );
                  })()}

                  {(() => {
                    const specs = getStandardSpecsForItem(request.stockItemId);
                    const isAddingSpecs = addingSpecsId === request.stockItemId;
                    return (
                      <Card>
                        <Flex direction="column" gap="2" p="3">
                          <Flex align="center" justify="between">
                            <Flex align="center" gap="2">
                              <FileText size={16} color="var(--gray-9)" />
                              <Box>
                                <Text weight="bold" size="3" pl="3">Spécifications standard</Text>
                                <Badge variant="outline" size="3">{specs.length}</Badge>
                              </Box>
                            </Flex>
                            {onAddStandardSpec && !isAddingSpecs && (
                              <Flex gap="2">
                                <SearchSpecsDialog
                                  stockItemId={request.stockItemId}
                                  stockItemName={getStockItemDetails(request.stockItemId)?.name || "Article"}
                                  onSpecAdded={async () => {
                                    const { stock } = await import("@/lib/api/facade");
                                    await stock.fetchStockItemStandardSpecs(request.stockItemId);
                                    if (setDispatchResult) {
                                      setDispatchResult({ type: "success", message: "Spécification copiée" });
                                      setTimeout(() => setDispatchResult(null), 3000);
                                    }
                                  }}
                                />
                                <Button size="2" variant="soft" color="blue" onClick={() => setAddingSpecsId(request.stockItemId)}>
                                  <Plus size={14} />
                                  Ajouter
                                </Button>
                              </Flex>
                            )}
                          </Flex>
                          {specs.length > 0 && (
                            <Table.Root size="1">
                              <Table.Header>
                                <Table.Row>
                                  <Table.ColumnHeaderCell>Titre</Table.ColumnHeaderCell>
                                  <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                                  <Table.ColumnHeaderCell>Défaut</Table.ColumnHeaderCell>
                                </Table.Row>
                              </Table.Header>
                              <Table.Body>
                                {specs.map((spec, idx) => (
                                  <Table.Row key={idx} style={{ background: spec.isDefault ? "var(--blue-2)" : undefined }}>
                                    <Table.Cell>
                                      <Text size="2" weight="bold">{spec.title}</Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                      <Text size="2" color="gray" style={{ whiteSpace: "pre-wrap" }}>{spec.text}</Text>
                                    </Table.Cell>
                                    <Table.Cell>
                                      {spec.isDefault && <Badge color="blue" size="1" variant="solid">Défaut</Badge>}
                                    </Table.Cell>
                                  </Table.Row>
                                ))}
                              </Table.Body>
                            </Table.Root>
                          )}
                          {specs.length === 0 && !isAddingSpecs && (
                            <Flex direction="column" gap="1" align="center" p="3">
                              <AlertCircle size={20} color="var(--gray-8)" />
                              <Text size="2" color="gray">Aucune spécification standard</Text>
                            </Flex>
                          )}
                          {isAddingSpecs && (
                            <Flex direction="column" gap="3" p="3" style={{ borderTop: "1px solid var(--gray-4)" }}>
                              <Text weight="bold" size="2">Ajouter une spécification standard</Text>
                              <Box>
                                <Text size="2" weight="bold" mb="2" style={{ display: "block" }}>Titre</Text>
                                <TextField.Root placeholder="Ex: Taraud machine métrique" value={specsFormData.title} onChange={(e) => setSpecsFormData({ ...specsFormData, title: e.target.value })} />
                              </Box>
                              <Box>
                                <Text size="2" weight="bold" mb="2" style={{ display: "block" }}>Description</Text>
                                <TextArea placeholder="Description détaillée..." value={specsFormData.spec_text} onChange={(e) => setSpecsFormData({ ...specsFormData, spec_text: e.target.value })} style={{ minHeight: "100px" }} />
                              </Box>
                              <Flex asChild gap="2">
                                <label>
                                  <Checkbox checked={specsFormData.isDefault} onCheckedChange={(checked) => setSpecsFormData({ ...specsFormData, isDefault: checked })} />
                                  <Text size="2">Utiliser par défaut dans les demandes</Text>
                                </label>
                              </Flex>
                              <Flex gap="2" justify="end">
                                <Button variant="soft" color="gray" onClick={() => { setAddingSpecsId(null); setSpecsFormData({ title: "", spec_text: "", is_default: true }); }}>Annuler</Button>
                                <Button color="blue" disabled={loading} onClick={async () => {
                                  if (onAddStandardSpec && specsFormData.title && specsFormData.spec_text) {
                                    try {
                                      await onAddStandardSpec(request.stockItemId, { title: specsFormData.title, spec_text: specsFormData.spec_text, is_default: specsFormData.isDefault });
                                      await new Promise((resolve) => setTimeout(resolve, 500));
                                      setSpecsFormData({ title: "", spec_text: "", is_default: true });
                                    } catch (err) {
                                      console.error("Erreur:", err);
                                    }
                                  }
                                }}>{loading ? "Enregistrement..." : "Ajouter"}</Button>
                              </Flex>
                            </Flex>
                          )}
                        </Flex>
                      </Card>
                    );
                  })()}
                </Flex>
              </ExpandableDetailsRow>
            )}
          </Fragment>
        ))}
      </Table.Body>
    </Table.Root>
  );
}

PurchaseRequestsTable.propTypes = {
  requests: PropTypes.array.isRequired,
  expandedRequestId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onToggleExpand: PropTypes.func,
  renderExpandedContent: PropTypes.func,
  stockItems: PropTypes.array,
  supplierRefs: PropTypes.object,
  standardSpecs: PropTypes.object,
  onRefresh: PropTypes.func,
  onAddSupplierRef: PropTypes.func,
  onAddStandardSpec: PropTypes.func,
  suppliers: PropTypes.array,
  loading: PropTypes.bool,
  setDispatchResult: PropTypes.func,
  compact: PropTypes.bool,
};
