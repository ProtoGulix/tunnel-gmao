import { useState, useEffect } from "react";
import { useError } from '@/contexts/ErrorContext';
import {
  Dialog,
  Button,
  Flex,
  Text,
  TextField,
  Box,
  Card,
  Badge,
  ScrollArea,
} from "@radix-ui/themes";
import { Search, Copy, Plus } from "lucide-react";
import { searchAllStandardSpecs, copyStandardSpec } from "../../lib/api";

/**
 * Dialogue pour rechercher et copier des spécifications existantes
 */
export default function SearchSpecsDialog({ stockItemId, stockItemName, onSpecAdded }) {
  const { showError } = useError();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [allSpecs, setAllSpecs] = useState([]);
  const [filteredSpecs, setFilteredSpecs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [copying, setCopying] = useState(null);

  // Charger toutes les specs au montage
  useEffect(() => {
    if (open) {
      loadAllSpecs();
    }
  }, [open]);

  // Filtrer localement quand le terme de recherche change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSpecs(allSpecs);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = allSpecs.filter(
      (spec) =>
        spec.title.toLowerCase().includes(term) ||
        spec.spec_text.toLowerCase().includes(term) ||
        spec.stock_item_id?.name?.toLowerCase().includes(term) ||
        spec.stock_item_id?.ref?.toLowerCase().includes(term)
    );
    setFilteredSpecs(filtered);
  }, [searchTerm, allSpecs]);

  const loadAllSpecs = async () => {
    try {
      setLoading(true);
      const specs = await searchAllStandardSpecs();
      
      // Exclure les specs du stock item actuel
      const filtered = specs.filter(
        (spec) => spec.stock_item_id?.id !== stockItemId
      );
      
      setAllSpecs(filtered);
      setFilteredSpecs(filtered);
    } catch (error) {
      console.error("Erreur chargement specs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopySpec = async (spec) => {
    try {
      setCopying(spec.id);
      await copyStandardSpec(spec.id, stockItemId);
      
      // Callback pour rafraîchir la liste des specs
      if (onSpecAdded) {
        await onSpecAdded();
      }
      
      setOpen(false);
      setSearchTerm("");
    } catch (error) {
      console.error("Erreur copie spec:", error);
      showError(error instanceof Error ? error : new Error("Erreur lors de la copie de la spécification"));
    } finally {
      setCopying(null);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button size="2" variant="soft" color="blue">
          <Search size={14} />
          Rechercher une spécification
        </Button>
      </Dialog.Trigger>

      <Dialog.Content maxWidth="800px">
        <Dialog.Title>Rechercher une spécification existante</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Recherchez et copiez une spécification depuis un autre article vers{" "}
          <strong>{stockItemName}</strong>
        </Dialog.Description>

        <Flex direction="column" gap="3">
          {/* Champ de recherche */}
          <TextField.Root
            placeholder="Rechercher par titre, description, article..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="3"
          >
            <TextField.Slot>
              <Search size={16} />
            </TextField.Slot>
          </TextField.Root>

          {/* Statistiques */}
          <Flex gap="2" align="center">
            <Text size="2" color="gray">
              {filteredSpecs.length} spécification{filteredSpecs.length > 1 ? "s" : ""} trouvée{filteredSpecs.length > 1 ? "s" : ""}
            </Text>
            {searchTerm && (
              <Button
                size="1"
                variant="ghost"
                color="gray"
                onClick={() => setSearchTerm("")}
              >
                Réinitialiser
              </Button>
            )}
          </Flex>

          {/* Liste des résultats */}
          <ScrollArea
            style={{
              height: "400px",
              border: "1px solid var(--gray-6)",
              borderRadius: "var(--radius-3)",
            }}
          >
            <Flex direction="column" gap="2" p="2">
              {loading ? (
                <Box p="4">
                  <Text size="2" color="gray" align="center">
                    Chargement des spécifications...
                  </Text>
                </Box>
              ) : filteredSpecs.length === 0 ? (
                <Box p="4">
                  <Text size="2" color="gray" align="center">
                    {searchTerm
                      ? "Aucune spécification trouvée"
                      : "Aucune spécification disponible"}
                  </Text>
                </Box>
              ) : (
                filteredSpecs.map((spec) => (
                  <Card key={spec.id} style={{ background: "var(--gray-2)" }}>
                    <Flex direction="column" gap="2" p="2">
                      {/* Header avec article source */}
                      <Flex align="center" justify="between">
                        <Flex align="center" gap="2">
                          <Badge variant="soft" color="blue" size="1">
                            {spec.stock_item_id?.ref || "N/A"}
                          </Badge>
                          <Text size="1" color="gray">
                            {spec.stock_item_id?.name || "Article inconnu"}
                          </Text>
                        </Flex>
                        {spec.is_default && (
                          <Badge color="green" size="1">
                            Par défaut
                          </Badge>
                        )}
                      </Flex>

                      {/* Titre de la spec */}
                      <Text weight="bold" size="2">
                        {spec.title}
                      </Text>

                      {/* Description */}
                      <Box
                        p="2"
                        style={{
                          background: "var(--gray-3)",
                          borderRadius: "var(--radius-2)",
                          maxHeight: "100px",
                          overflow: "auto",
                        }}
                      >
                        <Text
                          size="1"
                          color="gray"
                          style={{ whiteSpace: "pre-wrap" }}
                        >
                          {spec.spec_text}
                        </Text>
                      </Box>

                      {/* Actions */}
                      <Flex justify="end">
                        <Button
                          size="1"
                          onClick={() => handleCopySpec(spec)}
                          disabled={copying !== null}
                          loading={copying === spec.id}
                        >
                          <Copy size={12} />
                          {copying === spec.id ? "Copie..." : "Copier vers cet article"}
                        </Button>
                      </Flex>
                    </Flex>
                  </Card>
                ))
              )}
            </Flex>
          </ScrollArea>

          {/* Info */}
          <Card style={{ background: "var(--blue-2)" }}>
            <Flex gap="2" p="2">
              <Text size="1" color="blue">
                💡 <strong>Astuce :</strong> Les spécifications copiées ne seront pas
                marquées "par défaut". Vous pouvez les modifier après la copie.
              </Text>
            </Flex>
          </Card>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Fermer
            </Button>
          </Dialog.Close>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
