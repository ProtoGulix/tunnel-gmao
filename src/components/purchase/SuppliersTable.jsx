import { useState, Fragment, forwardRef, useImperativeHandle, useCallback } from "react";
import PropTypes from "prop-types";
import { useError } from '@/contexts/ErrorContext';
import {
  Table,
  Flex,
  Text,
  Button,
  Badge,
  Dialog,
  TextField,
  Box,
} from "@radix-ui/themes";
import { Building2, Pencil, Trash2, Plus, ChevronDown, Mail } from "lucide-react";
import { suppliers as suppliersApi } from "@/lib/api/facade";
import ExpandableDetailsRow from "@/components/common/ExpandableDetailsRow";
import SupplierRefsBySupplierPanel from "@/components/stock/SupplierRefsBySupplierPanel";
import EmptyState from "@/components/common/EmptyState";

/**
 * Table de gestion des fournisseurs avec expansion inline pour références
 * Permet CRUD complet, affichage métriques (préférées, délai moyen, articles liés)
 * 
 * ✅ Implémenté :
 * - CRUD complet : Create, Update, Delete avec validation
 * - forwardRef avec useImperativeHandle pour contrôle externe (openAddDialog)
 * - Expansion inline pour voir/gérer références fournisseur par article
 * - Cache métriques : refCount, preferredCount, avgLeadTime depuis panneau enfant
 * - Protection suppression : interdite si refs ou préférées existent
 * - Email mailto pré-rempli avec refs préférées (slice 8 max)
 * - Badge avec compteurs : préférées (vert), articles liés (bleu)
 * - Bouton toggle avec rotation chevron 180° pour expansion
 * - Highlight ligne expandée (background bleu)
 * - EmptyState avec actions si aucun fournisseur
 * - Dialog formulaire avec 5 champs (nom*, contact, email, tél, adresse)
 * - Bouton email désactivé si pas d'email + tooltip explicatif
 * - Bouton delete désactivé si refs liées + tooltip sécurité
 * 
 * TODO: Améliorations futures :
 * - Tri cliquable sur colonnes (nom, préférées, délai, articles)
 * - Filtres avancés : par délai (<7j, 7-14j, >14j), par nb références
 * - Import CSV en masse pour création multiple fournisseurs
 * - Export Excel de la liste complète avec métriques
 * - Score fournisseur : fiabilité, délai respecté, prix compétitif
 * - Historique commandes passées par fournisseur (montant total, nb commandes)
 * - Tags/labels personnalisés (local, international, premium...)
 * - Notes/commentaires sur chaque fournisseur avec markdown
 * - Alertes email si fournisseur inactif depuis X jours
 * - Fusion de fournisseurs doublons avec transfert références
 * - API externe : enrichissement auto (SIRET, TVA intracommunautaire)
 * - Gestion conditions commerciales : remises, minimums commande, franco de port
 * - Timeline interactions : emails, appels, relances
 */
const SuppliersTable = forwardRef(function SuppliersTable(
  { suppliers, onRefresh },
  ref
) {
  const { showError } = useError();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);

  useImperativeHandle(ref, () => ({
    openAddDialog: () => {
      setEditingSupplier(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        contact_name: "",
      });
      setDialogOpen(true);
    }
  }));

  // État pour tracker la ligne expansible du fournisseur sélectionné
  const [expandedSupplierId, setExpandedSupplierId] = useState(null);
  // Cache des métriques calculées côté panneau (refs/preferred/délai)
  const [supplierSummaries, setSupplierSummaries] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    contact_name: "",
  });
  const [loading, setLoading] = useState(false);

  // DTO-friendly getters (camelCase with legacy fallback)
  const getContactName = (s) => s?.contactName ?? s?.contact_name ?? "";
  const getItemCount = (s) => s?.itemCount ?? s?.item_count ?? 0;

  const handleOpenDialog = useCallback((supplier = null) => {
    if (supplier) {
      setEditingSupplier(supplier);
      setFormData({
        name: supplier.name || "",
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        contact_name: getContactName(supplier) || "",
      });
    } else {
      setEditingSupplier(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        contact_name: "",
      });
    }
    setDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!formData.name) {
      showError(new Error("Le nom est obligatoire"));
      return;
    }

    try {
      setLoading(true);
      if (editingSupplier) {
        await suppliersApi.updateSupplier(editingSupplier.id, formData);
      } else {
        await suppliersApi.createSupplier(formData);
      }
      setDialogOpen(false);
      await onRefresh();
    } catch (error) {
      showError(error instanceof Error ? error : new Error("Erreur lors de la sauvegarde"));
    } finally {
      setLoading(false);
    }
  }, [formData, editingSupplier, onRefresh, showError]);

  const handleDelete = useCallback(async (supplierId) => {
    // Sécurise la suppression : interdite si refs ou refs préférées existent
    const summary = supplierSummaries[supplierId];
    const hasRefs = summary?.refCount > 0;
    const hasPreferred = summary?.preferredCount > 0;
    if (hasRefs || hasPreferred) {
      const refText = hasRefs ? `${summary.refCount} référence(s)` : "";
      const prefText = hasPreferred ? `${summary.preferredCount} préférée(s)` : "";
      const connector = hasRefs && hasPreferred ? " dont " : "";
      const message = `Suppression impossible : ${refText}${connector}${prefText} sont liées à ce fournisseur.`;
      showError(new Error(message));
      return;
    }

    const confirmed = window.confirm("Supprimer ce fournisseur ? Cette action est définitive."); // eslint-disable-line no-alert
    if (!confirmed) return;

    try {
      await suppliersApi.deleteSupplier(supplierId);
      await onRefresh();
    } catch (error) {
      showError(error instanceof Error ? error : new Error("Erreur lors de la suppression"));
    }
  }, [supplierSummaries, onRefresh, showError]);

  // Alimente le cache des métriques depuis le panneau enfant
  const handleSummary = useCallback((supplierId, summary) => {
    setSupplierSummaries((prev) => ({ ...prev, [supplierId]: summary }));
  }, []);

  const buildMailto = useCallback((supplier) => {
    // Pré-remplit un mail avec les refs préférées connues pour ce fournisseur
    const summary = supplierSummaries[supplier.id];
    const preferredLines = summary?.preferredRefs?.slice(0, 8).map((r) => `- ${r}`) || [];
    const bodyLines = [
      `Bonjour ${getContactName(supplier) || ""},`,
      "",
      "Nous souhaitons confirmer les références préférées suivantes :",
      ...(preferredLines.length ? preferredLines : ["- (aucune référence préférée enregistrée)"]),
      "",
      "Merci de nous indiquer vos délais et disponibilités.",
    ];
    const subject = encodeURIComponent(`Demande d'information - ${supplier.name}`);
    const body = encodeURIComponent(bodyLines.join("\n"));
    return `mailto:${supplier.email || ""}?subject=${subject}&body=${body}`;
  }, [supplierSummaries]);

  return (
    <Box>
      {suppliers.length === 0 ? (
        <EmptyState
          icon={<Building2 size={64} />}
          title="Aucun fournisseur trouvé"
          description="Ajoutez un fournisseur ou modifiez votre recherche"
          actions={[
            <Button key="add-supplier" size="2" onClick={() => handleOpenDialog()}>
              <Plus size={16} />
              Créer un fournisseur
            </Button>,
          ]}
        />
      ) : (
        <Flex direction="column" gap="3">
          <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>

          <Dialog.Content style={{ maxWidth: 500 }}>
            <Dialog.Title>
              {editingSupplier
                ? "Modifier le fournisseur"
                : "Nouveau fournisseur"}
            </Dialog.Title>

            <form onSubmit={handleSubmit}>
              <Flex direction="column" gap="3" mt="4">
                <label>
                  <Text size="2" weight="bold" mb="1" as="div">
                    Nom *
                  </Text>
                  <TextField.Root
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="Ex: WURTH, MANUTAN..."
                    required
                  />
                </label>

                <label>
                  <Text size="2" weight="bold" mb="1" as="div">
                    Contact
                  </Text>
                  <TextField.Root
                    value={formData.contact_name}
                    onChange={(e) =>
                      setFormData({ ...formData, contact_name: e.target.value })
                    }
                    placeholder="Nom du contact"
                  />
                </label>

                <label>
                  <Text size="2" weight="bold" mb="1" as="div">
                    Email
                  </Text>
                  <TextField.Root
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="contact@fournisseur.com"
                  />
                </label>

                <label>
                  <Text size="2" weight="bold" mb="1" as="div">
                    Téléphone
                  </Text>
                  <TextField.Root
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+33 1 23 45 67 89"
                  />
                </label>

                <label>
                  <Text size="2" weight="bold" mb="1" as="div">
                    Adresse
                  </Text>
                  <TextField.Root
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Adresse complète"
                  />
                </label>
              </Flex>

              <Flex gap="3" mt="4" justify="end">
                <Dialog.Close>
                  <Button variant="soft" color="gray" type="button">
                    Annuler
                  </Button>
                </Dialog.Close>
                <Button type="submit" disabled={loading}>
                  {loading
                    ? "Enregistrement..."
                    : editingSupplier
                    ? "Modifier"
                    : "Créer"}
                </Button>
              </Flex>
            </form>
          </Dialog.Content>
        </Dialog.Root>

        <Table.Root variant="surface">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>Nom</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Contact</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Email</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Téléphone</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Préférées</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Délai moyen</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Articles liés</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {suppliers.map((supplier) => (
                <Fragment key={`supplier-${supplier.id}`}>
                  <Table.Row
                    style={{ background: expandedSupplierId === supplier.id ? 'var(--blue-2)' : undefined }}
                  >
                    <Table.Cell>
                      <Flex align="center" gap="2">
                        <Building2 size={16} color="var(--gray-9)" />
                        <Text weight="bold">{supplier.name}</Text>
                      </Flex>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {getContactName(supplier) || "-"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {supplier.email || "-"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {supplier.phone || "-"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color="green" variant="soft">
                        {supplierSummaries[supplier.id]?.preferredCount ?? "-"}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Text size="2" color="gray">
                        {supplierSummaries[supplier.id]?.avgLeadTime != null
                          ? `${supplierSummaries[supplier.id].avgLeadTime} j`
                          : "-"}
                      </Text>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color="blue" variant="soft">
                        {getItemCount(supplier)}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Flex gap="2" align="center">
                        {/* Bouton toggle pour afficher les références */}
                        <Button
                          size="1"
                          variant={expandedSupplierId === supplier.id ? "solid" : "soft"}
                          color="gray"
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedSupplierId(expandedSupplierId === supplier.id ? null : supplier.id);
                          }}
                          aria-label={expandedSupplierId === supplier.id ? "Masquer les références" : "Afficher les références"}
                        >
                          <ChevronDown size={14} style={{ transform: expandedSupplierId === supplier.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                        </Button>
                        <Button
                          size="1"
                          variant="soft"
                          color="gray"
                          onClick={() => handleOpenDialog(supplier)}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <Pencil size={14} />
                        </Button>
                        <Button
                          size="1"
                          variant="soft"
                          color="blue"
                          asChild
                          disabled={!supplier.email}
                          title={supplier.email ? "Contacter le fournisseur" : "Email indisponible"}
                        >
                          <a href={buildMailto(supplier)} onMouseDown={(e) => e.stopPropagation()}>
                            <Mail size={14} />
                          </a>
                        </Button>
                        <Button
                          size="1"
                          variant="soft"
                          color="red"
                          onClick={() => handleDelete(supplier.id)}
                          onMouseDown={(e) => e.stopPropagation()}
                          disabled={(supplierSummaries[supplier.id]?.refCount || 0) > 0 || (supplierSummaries[supplier.id]?.preferredCount || 0) > 0}
                          title={(supplierSummaries[supplier.id]?.refCount || 0) > 0 || (supplierSummaries[supplier.id]?.preferredCount || 0) > 0
                            ? "Impossible de supprimer un fournisseur ayant des références/préférences"
                            : "Supprimer le fournisseur"}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </Flex>
                    </Table.Cell>
                  </Table.Row>
                  
                  {/* Ligne expansible avec les références du fournisseur */}
                  {expandedSupplierId === supplier.id && (
                    <ExpandableDetailsRow colSpan={8} withCard={true}>
                      <SupplierRefsBySupplierPanel
                        supplier={supplier}
                        onChanged={async () => { await onRefresh(); }}
                        onSummary={(summary) => handleSummary(supplier.id, summary)}
                      />
                    </ExpandableDetailsRow>
                  )}
                </Fragment>
              ))}
          </Table.Body>
        </Table.Root>
        </Flex>
      )}
    </Box>
  );
});

SuppliersTable.propTypes = {
  suppliers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      contact_name: PropTypes.string,
      contactName: PropTypes.string,
      email: PropTypes.string,
      phone: PropTypes.string,
      address: PropTypes.string,
      item_count: PropTypes.number,
      itemCount: PropTypes.number,
    })
  ).isRequired,
  onRefresh: PropTypes.func.isRequired,
};

SuppliersTable.displayName = 'SuppliersTable';

export default SuppliersTable;
