import { useState, useEffect, useCallback } from "react";
import PropTypes from 'prop-types';
import { useError } from '@/contexts/ErrorContext';
import {
  Card,
  Flex,
  Text,
  Button,
  Table,
  Badge,
  Dialog,
  TextField,
  Select,
} from "@radix-ui/themes";
import { Plus, Star, Trash2, AlertCircle } from "lucide-react";
import {
  fetchStockItemSuppliers,
  createStockItemSupplier,
  setPreferredSupplier,
  deleteStockItemSupplier,
} from "@/lib/api";

/**
 * Gestionnaire de liens fournisseurs pour un article du stock
 * Permet d'ajouter, modifier, supprimer des fournisseurs et définir le préféré
 * 
 * ✅ Implémenté :
 * - CRUD complet des liens fournisseurs (Create, Read, Delete)
 * - Système de fournisseur préféré (star) pour dispatch automatique
 * - Validation : empêche suppression du préféré sans remplacement
 * - Premier fournisseur ajouté = préféré par défaut
 * - Dialog formulaire avec prix, délai livraison, référence fournisseur
 * - Warning visuel si aucun préféré défini
 * 
 * TODO: Améliorations futures :
 * - Édition inline des prix et délais (sans ouvrir dialog)
 * - Historique des prix avec graphique d'évolution
 * - Comparaison automatique des prix/délais entre fournisseurs
 * - Import CSV pour ajout en masse de fournisseurs
 * - Export Excel de la liste complète
 * - Filtrage par statut (actif/inactif)
 * - Notes/commentaires sur chaque lien fournisseur
 * - Gestion des remises quantitatives (paliers de prix)
 * - Alerte email si prix change de >10%
 */
export default function StockItemSuppliersManager({ stockItem, suppliers, onRefreshSuppliers }) {
  const { showError } = useError();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: "",
    supplier_ref: "",
    price: "",
    lead_time_days: "",
  });

  // Mémoïser loadLinks pour éviter re-création à chaque render
  const loadLinks = useCallback(async () => {
    if (!stockItem?.id) return;
    
    try {
      setLoading(true);
      const data = await fetchStockItemSuppliers(stockItem.id);
      setLinks(data);
    } catch (error) {
      showError(error instanceof Error ? error : new Error("Erreur lors du chargement des liens fournisseurs"));
    } finally {
      setLoading(false);
    }
  }, [stockItem?.id, showError]);

  useEffect(() => {
    if (stockItem) {
      loadLinks();
    } else {
      setLinks([]);
    }
  }, [stockItem, loadLinks]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const trimmedSupplierId = formData.supplier_id?.trim() || '';
    const trimmedSupplierRef = formData.supplier_ref?.trim() || '';
    
    if (!trimmedSupplierId || !trimmedSupplierRef) {
      showError(new Error("Fournisseur et référence fournisseur sont obligatoires"));
      return;
    }

    try {
      setLoading(true);
      await createStockItemSupplier({
        stock_item_id: stockItem.id,
        supplier_id: trimmedSupplierId,
        supplier_ref: trimmedSupplierRef,
        unit_price: formData.price ? parseFloat(formData.price) : null,
        delivery_time_days: formData.lead_time_days ? parseInt(formData.lead_time_days) : null,
        is_preferred: links.length === 0, // Premier = préféré par défaut
      });
      
      setDialogOpen(false);
      setFormData({
        supplier_id: "",
        supplier_ref: "",
        price: "",
        lead_time_days: "",
      });
      await loadLinks();
      // Rafraîchir les fournisseurs pour mettre à jour le count
      if (onRefreshSuppliers) await onRefreshSuppliers();
    } catch (error) {
      showError(error instanceof Error ? error : new Error("Erreur lors de la création du lien"));
    } finally {
      setLoading(false);
    }
  }, [formData, stockItem?.id, links.length, loadLinks, onRefreshSuppliers, showError]);

  const handleSetPreferred = useCallback(async (linkId) => {
    try {
      await setPreferredSupplier(stockItem.id, linkId);
      await loadLinks();
      // Pas de refresh global - juste les liens locaux suffisent
    } catch (error) {
      showError(error instanceof Error ? error : new Error("Erreur lors de la définition du fournisseur préféré"));
    }
  }, [stockItem?.id, loadLinks, showError]);

  const handleDelete = useCallback(async (linkId) => {
    const link = links.find(l => l.id === linkId);
    if (link?.is_preferred && links.length > 1) {
      showError(new Error("Vous devez d'abord définir un autre fournisseur comme préféré"));
      return;
    }

    const confirmed = window.confirm("Supprimer ce lien fournisseur ?"); // eslint-disable-line no-alert
    if (!confirmed) return;

    try {
      await deleteStockItemSupplier(linkId);
      await loadLinks();
      // Rafraîchir les fournisseurs pour mettre à jour le count
      if (onRefreshSuppliers) await onRefreshSuppliers();
    } catch (error) {
      showError(error instanceof Error ? error : new Error("Erreur lors de la suppression"));
    }
  }, [links, loadLinks, onRefreshSuppliers, showError]);

  if (!stockItem) {
    return (
      <Card>
        <Flex align="center" justify="center" p="4">
          <Text color="gray">Sélectionnez un article</Text>
        </Flex>
      </Card>
    );
  }

  const preferredLink = links.find(l => l.is_preferred);

  return (
    <Card>
      <Flex direction="column" gap="3">
        <Flex justify="between" align="center">
          <Flex direction="column">
            <Text size="4" weight="bold">
              {stockItem.name}
            </Text>
            <Text size="2" color="gray">
              Réf: {stockItem.ref} | Famille: {stockItem.family_code}
            </Text>
          </Flex>

          <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
            <Dialog.Trigger>
              <Button>
                <Plus size={16} />
                Ajouter fournisseur
              </Button>
            </Dialog.Trigger>

            <Dialog.Content style={{ maxWidth: 500 }}>
              <Dialog.Title>Ajouter un fournisseur</Dialog.Title>

              <form onSubmit={handleSubmit}>
                <Flex direction="column" gap="3" mt="4">
                  <label>
                    <Text size="2" weight="bold" mb="1" as="div">
                      Fournisseur *
                    </Text>
                    <Select.Root
                      value={formData.supplier_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, supplier_id: value })
                      }
                      required
                    >
                      <Select.Trigger placeholder="Sélectionnez un fournisseur" />
                      <Select.Content>
                        {suppliers.map((supplier) => (
                          <Select.Item key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </Select.Item>
                        ))}
                      </Select.Content>
                    </Select.Root>
                  </label>

                  <label>
                    <Text size="2" weight="bold" mb="1" as="div">
                      Référence fournisseur *
                    </Text>
                    <TextField.Root
                      value={formData.supplier_ref}
                      onChange={(e) =>
                        setFormData({ ...formData, supplier_ref: e.target.value })
                      }
                      placeholder="Ex: WRT-12345"
                      required
                    />
                  </label>

                  <label>
                    <Text size="2" weight="bold" mb="1" as="div">
                      Prix unitaire (€)
                    </Text>
                    <TextField.Root
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      placeholder="12.50"
                    />
                  </label>

                  <label>
                    <Text size="2" weight="bold" mb="1" as="div">
                      Délai livraison (jours)
                    </Text>
                    <TextField.Root
                      type="number"
                      value={formData.lead_time_days}
                      onChange={(e) =>
                        setFormData({ ...formData, lead_time_days: e.target.value })
                      }
                      placeholder="5"
                    />
                  </label>

                  {links.length === 0 && (
                    <Flex
                      p="3"
                      style={{
                        background: "var(--blue-2)",
                        borderRadius: "var(--radius-3)",
                      }}
                      align="center"
                      gap="2"
                    >
                      <Star size={16} color="var(--blue-9)" />
                      <Text size="2" color="blue">
                        Ce sera le fournisseur préféré par défaut
                      </Text>
                    </Flex>
                  )}
                </Flex>

                <Flex gap="3" mt="4" justify="end">
                  <Dialog.Close>
                    <Button variant="soft" color="gray" type="button">
                      Annuler
                    </Button>
                  </Dialog.Close>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Création..." : "Créer"}
                  </Button>
                </Flex>
              </form>
            </Dialog.Content>
          </Dialog.Root>
        </Flex>

        {!preferredLink && links.length > 0 && (
          <Flex
            p="3"
            style={{
              background: "var(--amber-2)",
              borderRadius: "var(--radius-3)",
            }}
            align="center"
            gap="2"
          >
            <AlertCircle size={16} color="var(--amber-9)" />
            <Text size="2" color="amber">
              Aucun fournisseur préféré défini - le dispatch automatique ne
              fonctionnera pas
            </Text>
          </Flex>
        )}

        {loading && links.length === 0 ? (
          <Flex align="center" justify="center" p="4">
            <Text color="gray">Chargement...</Text>
          </Flex>
        ) : links.length === 0 ? (
          <Flex
            direction="column"
            align="center"
            justify="center"
            p="6"
            style={{ background: "var(--gray-2)", borderRadius: "var(--radius-3)" }}
          >
            <Text color="gray" mb="2">
              Aucun fournisseur lié
            </Text>
            <Text size="2" color="gray">
              Ajoutez un fournisseur pour activer le dispatch automatique
            </Text>
          </Flex>
        ) : (
          <Table.Root variant="surface">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Fournisseur</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Réf. fournisseur</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Prix</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Délai</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {links.map((link) => (
                <Table.Row key={link.id}>
                  <Table.Cell>
                    <Text weight="bold">
                      {link.supplier_id?.name || "?"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge color="gray" variant="soft">
                      {link.supplier_ref}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Text>
                      {link.unit_price ? `${parseFloat(link.unit_price).toFixed(2)} €` : "-"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text>
                      {link.delivery_time_days ? `${link.delivery_time_days}j` : "-"}
                    </Text>
                  </Table.Cell>
                  <Table.Cell>
                    {link.is_preferred ? (
                      <Badge color="yellow" variant="solid">
                        <Star size={12} fill="currentColor" />
                        Préféré
                      </Badge>
                    ) : (
                      <Button
                        size="1"
                        variant="soft"
                        color="gray"
                        onClick={() => handleSetPreferred(link.id)}
                      >
                        <Star size={12} />
                        Définir préféré
                      </Button>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      size="1"
                      variant="soft"
                      color="red"
                      onClick={() => handleDelete(link.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Flex>
    </Card>
  );
}

StockItemSuppliersManager.propTypes = {
  stockItem: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    name: PropTypes.string.isRequired,
    ref: PropTypes.string.isRequired,
    family_code: PropTypes.string,
  }),
  suppliers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onRefreshSuppliers: PropTypes.func,
};
