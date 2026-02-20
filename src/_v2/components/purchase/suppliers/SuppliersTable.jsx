import { useState, forwardRef, useImperativeHandle, useCallback } from "react";
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
import DataTable from "@/components/common/DataTable";
import ExpandableDetailsRow from "@/components/common/ExpandableDetailsRow";
import SupplierRefsBySupplierPanel from "@/components/purchase/suppliers/SupplierRefsBySupplierPanel";

const SUPPLIER_COLUMNS = [
  { key: "name", header: "Nom" },
  { key: "contact", header: "Contact" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Téléphone" },
  { key: "preferred", header: "Préférées", width: 110 },
  { key: "leadtime", header: "Délai moyen", width: 130 },
  { key: "items", header: "Articles liés", width: 120 },
  { key: "actions", header: "Actions", width: 180 },
];

const DEFAULT_FORM = {
  name: "",
  email: "",
  phone: "",
  address: "",
  contact_name: "",
};

/**
 * Table de gestion des fournisseurs avec expansion inline pour références
 * Permet CRUD complet, affichage métriques (préférées, délai moyen, articles liés)
 */
const SuppliersTable = forwardRef(function SuppliersTable({ suppliers, onRefresh }, ref) {
  const { showError } = useError();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [expandedSupplierId, setExpandedSupplierId] = useState(null);
  const [supplierSummaries, setSupplierSummaries] = useState({});
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);

  const getContactName = useCallback((s) => s?.contactName ?? s?.contact_name ?? "", []);
  const getItemCount = useCallback((s) => s?.itemCount ?? s?.item_count ?? 0, []);

  useImperativeHandle(ref, () => ({
    openAddDialog: () => {
      setEditingSupplier(null);
      setFormData(DEFAULT_FORM);
      setDialogOpen(true);
    }
  }));

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
      setFormData(DEFAULT_FORM);
    }
    setDialogOpen(true);
  }, [getContactName]);

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

  const handleSummary = useCallback((supplierId, summary) => {
    setSupplierSummaries((prev) => ({ ...prev, [supplierId]: summary }));
  }, []);

  const buildMailto = useCallback((supplier) => {
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
  }, [supplierSummaries, getContactName]);

  const renderRow = (supplier) => {
    const summary = supplierSummaries[supplier.id] || {};
    const isExpanded = expandedSupplierId === supplier.id;

    return (
      <>
        <Table.Row
          key={`row-${supplier.id}`}
          style={{ background: isExpanded ? "var(--blue-2)" : undefined }}
        >
          <Table.Cell>
            <Flex align="center" gap="2">
              <Building2 size={16} color="var(--gray-9)" />
              <Text weight="bold">{supplier.name}</Text>
            </Flex>
          </Table.Cell>
          <Table.Cell>
            <Text size="2" color="gray">{getContactName(supplier) || "-"}</Text>
          </Table.Cell>
          <Table.Cell>
            <Text size="2" color="gray">{supplier.email || "-"}</Text>
          </Table.Cell>
          <Table.Cell>
            <Text size="2" color="gray">{supplier.phone || "-"}</Text>
          </Table.Cell>
          <Table.Cell>
            <Badge color="green" variant="soft">{summary.preferredCount ?? "-"}</Badge>
          </Table.Cell>
          <Table.Cell>
            <Text size="2" color="gray">
              {summary.avgLeadTime != null ? `${summary.avgLeadTime} j` : "-"}
            </Text>
          </Table.Cell>
          <Table.Cell>
            <Badge color="blue" variant="soft">{getItemCount(supplier)}</Badge>
          </Table.Cell>
          <Table.Cell>
            <Flex gap="2" align="center">
              <Button
                size="1"
                variant={isExpanded ? "solid" : "soft"}
                color="gray"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedSupplierId(isExpanded ? null : supplier.id);
                }}
                aria-label={isExpanded ? "Masquer les références" : "Afficher les références"}
              >
                <ChevronDown
                  size={14}
                  style={{
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s"
                  }}
                />
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
                disabled={(summary.refCount || 0) > 0 || (summary.preferredCount || 0) > 0}
                title={(summary.refCount || 0) > 0 || (summary.preferredCount || 0) > 0
                  ? "Impossible de supprimer un fournisseur ayant des références/préférences"
                  : "Supprimer le fournisseur"}
              >
                <Trash2 size={14} />
              </Button>
            </Flex>
          </Table.Cell>
        </Table.Row>

        {isExpanded && (
          <ExpandableDetailsRow key={`expanded-${supplier.id}`} colSpan={SUPPLIER_COLUMNS.length} withCard>
            <SupplierRefsBySupplierPanel
              supplier={supplier}
              onChanged={async () => { await onRefresh(); }}
              onSummary={(summaryData) => handleSummary(supplier.id, summaryData)}
            />
          </ExpandableDetailsRow>
        )}
      </>
    );
  };

  const emptyState = {
    icon: Building2,
    title: "Aucun fournisseur trouvé",
    description: "Ajoutez un fournisseur ou modifiez votre recherche",
    action: (
      <Button size="2" onClick={() => handleOpenDialog()}>
        <Plus size={16} />
        Créer un fournisseur
      </Button>
    )
  };

  return (
    <Box>
      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Content style={{ maxWidth: 500 }}>
          <Dialog.Title>
            {editingSupplier ? "Modifier le fournisseur" : "Nouveau fournisseur"}
          </Dialog.Title>

          <form onSubmit={handleSubmit}>
            <Flex direction="column" gap="3" mt="4">
              <label>
                <Text size="2" weight="bold" mb="1" as="div">Nom *</Text>
                <TextField.Root
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: WURTH, MANUTAN..."
                  required
                />
              </label>

              <label>
                <Text size="2" weight="bold" mb="1" as="div">Contact</Text>
                <TextField.Root
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  placeholder="Nom du contact"
                />
              </label>

              <label>
                <Text size="2" weight="bold" mb="1" as="div">Email</Text>
                <TextField.Root
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@fournisseur.com"
                />
              </label>

              <label>
                <Text size="2" weight="bold" mb="1" as="div">Téléphone</Text>
                <TextField.Root
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+33 1 23 45 67 89"
                />
              </label>

              <label>
                <Text size="2" weight="bold" mb="1" as="div">Adresse</Text>
                <TextField.Root
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Adresse complète"
                />
              </label>
            </Flex>

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray" type="button">Annuler</Button>
              </Dialog.Close>
              <Button type="submit" disabled={loading}>
                {loading ? "Enregistrement..." : editingSupplier ? "Modifier" : "Créer"}
              </Button>
            </Flex>
          </form>
        </Dialog.Content>
      </Dialog.Root>

      <DataTable
        columns={SUPPLIER_COLUMNS}
        data={suppliers}
        variant="surface"
        size="2"
        emptyState={emptyState}
        rowRenderer={renderRow}
      />
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
