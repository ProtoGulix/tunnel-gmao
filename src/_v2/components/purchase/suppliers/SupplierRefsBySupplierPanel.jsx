import { useEffect, useState } from "react";
import { useError } from '@/contexts/ErrorContext';
import { Table, Flex, Text, Badge, Button, Box } from "@radix-ui/themes";
import { Link2, CheckCircle, Star } from "lucide-react";
import { stockSuppliers } from "@/lib/api/facade";
import ManufacturerBadge from "@/components/common/ManufacturerBadge";

/**
 * Panneau affichant les références d'articles fournis par un fournisseur spécifique
 * Permet de visualiser, éditer et gérer les références et préférences du fournisseur
 * 
 * @param {Object} supplier - Fournisseur sélectionné avec id et name
 * @param {Function} onChanged - Callback déclenché après modification
 */
export default function SupplierRefsBySupplierPanel({ supplier, onChanged, onSummary }) {
  const { showError } = useError();
  // Liste des références articles pour ce fournisseur
  const [refs, setRefs] = useState([]);
  
  // Messages d'erreur lors du chargement
  const [error, setError] = useState(null);

  // Charge les références du fournisseur via API
  const load = async () => {
    if (!supplier?.id) return;
    try {
      setError(null);
      // Récupère la liste des articles fournis par ce fournisseur
      const data = await stockSuppliers.fetchSupplierRefsBySupplier(supplier.id);
      setRefs(data || []);
      if (data) {
        const preferredRefs = data.filter((r) => r.isPreferred);
        const leadTimes = data
          .map((r) => r.deliveryTimeDays)
          .filter((v) => typeof v === "number");
        const avgLeadTime = leadTimes.length
          ? Math.round(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length)
          : null;
        const preferredLabels = preferredRefs.map((r) => {
          const itemRef = r.stockItem?.ref || "?";
          const itemName = r.stockItem?.name || "";
          return `${itemRef} ${itemName}`.trim();
        });
        onSummary?.({
          refCount: data.length,
          preferredCount: preferredRefs.length,
          avgLeadTime,
          preferredRefs: preferredLabels,
        });
      }
    } catch (e) {
      console.error("Erreur chargement références fournisseur:", e);
      setError(e?.message || "Erreur de chargement");
    }
  };

  // Auto-charge les références quand le fournisseur change
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplier?.id]);

  // Marque un fournisseur comme préféré pour un article
  const handleSetPreferred = async (link) => {
    try {
      // Met à jour la préférence via API
      await stockSuppliers.setPreferredSupplier(link.stockItem.id, link.id);
      // Recharge la liste pour refléter les changements
      await load();
      // Notifie le composant parent
      onChanged?.();
    } catch (e) {
      console.error("Erreur définition préféré:", e);
      showError(e instanceof Error ? e : new Error("Erreur lors de la définition du fournisseur préféré"));
    }
  };

  // Supprime une référence fournisseur après confirmation
  const handleDelete = async (link) => {
    // Demande confirmation avant suppression
    const confirmed = window.confirm("Supprimer cette référence fournisseur ?"); // eslint-disable-line no-alert
    if (!confirmed) return;
    try {
      // Supprime la référence via API
      await stockSuppliers.deleteStockItemSupplier(link.id);
      // Recharge la liste
      await load();
      // Notifie le composant parent
      onChanged?.();
    } catch (e) {
      console.error("Erreur suppression ref:", e);
      showError(e instanceof Error ? e : new Error("Erreur lors de la suppression"));
    }
  };

  return (
      <Box p="3">
        <Flex direction="column" gap="3">
          {/* En-tête du panneau avec nom du fournisseur et nombre de références */}
          <Flex align="center" gap="2">
            <Link2 size={18} />
            <Text weight="bold">Références de {supplier?.name}</Text>
            <Badge color="gray" variant="soft" size="1">{refs.length}</Badge>
          </Flex>

          {/* Affiche les erreurs de chargement si présentes */}
          {error && (
            <Text color="red" size="2">{error}</Text>
          )}

          {/* Tableau des références fournisseur */}
          <Table.Root variant="surface" size="2">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Article</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Réf fournisseur</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Prix</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Délai (j)</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Fabricant</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Préféré</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell></Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {/* État vide : pas de références */}
              {refs.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7}>
                    <Flex align="center" justify="center" p="4">
                      <Text color="gray">Aucune référence pour ce fournisseur</Text>
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              ) : (
                /* Liste des références : article, réf, prix, délai, fabricant, préférence */
                refs.map((link) => {
                  const manu = link.manufacturerItem || {};
                  return (
                    <Table.Row key={link.id}>
                      {/* Colonne article : référence et nom */}
                      <Table.Cell>
                        <Flex direction="column" gap="1">
                          <Text size="2" weight="bold">{link.stockItem?.ref}</Text>
                          <Text size="2" color="gray">{link.stockItem?.name}</Text>
                        </Flex>
                      </Table.Cell>
                      {/* Colonne référence fournisseur */}
                      <Table.Cell>
                        <Text size="2">{link.supplierRef}</Text>
                      </Table.Cell>
                      {/* Colonne prix unitaire */}
                      <Table.Cell>
                        <Text size="2">{link.unitPrice ?? "-"}</Text>
                      </Table.Cell>
                      {/* Colonne délai livraison */}
                      <Table.Cell>
                        <Text size="2">{link.deliveryTimeDays ?? "-"}</Text>
                      </Table.Cell>
                      {/* Colonne fabricant */}
                      <Table.Cell>
                        {(manu.manufacturerName || manu.manufacturerRef || manu.designation) ? (
                          <ManufacturerBadge
                            name={manu.manufacturerName}
                            refCode={manu.manufacturerRef}
                            designation={manu.designation}
                          />
                        ) : (
                          <Text size="2" color="gray">-</Text>
                        )}
                      </Table.Cell>
                      {/* Colonne statut préféré */}
                      <Table.Cell>
                        {link.isPreferred ? (
                          <Flex align="center" gap="1">
                            <CheckCircle size={16} color="var(--green-9)" />
                            <Text size="2" color="green">Préféré pour cet article</Text>
                          </Flex>
                        ) : (
                          <Badge color="gray" variant="soft">Non</Badge>
                        )}
                      </Table.Cell>
                      {/* Colonne actions : marquer préféré ou supprimer */}
                      <Table.Cell>
                        <Flex gap="2">
                          {!link.isPreferred && (
                            <Button size="1" onClick={() => handleSetPreferred(link)}>
                              <Star size={14} />
                              Préférer
                            </Button>
                          )}
                          <Button size="1" variant="soft" color="red" onClick={() => handleDelete(link)}>
                            Supprimer
                          </Button>
                        </Flex>
                      </Table.Cell>
                    </Table.Row>
                  );
                })
              )}
            </Table.Body>
          </Table.Root>
        </Flex>
      </Box>
  );
}
