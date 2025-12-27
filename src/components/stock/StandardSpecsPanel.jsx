import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Box,
  Flex,
  Text,
  Button,
  Card,
  TextField,
  TextArea,
  Badge,
  Checkbox,
  Callout,
} from "@radix-ui/themes";
import {
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  AlertCircle,
  FileText,
} from "lucide-react";
import { stock } from "@/lib/api/facade";
import SearchSpecsDialog from "./SearchSpecsDialog";

/**
 * Panneau de gestion des spécifications standard pour un article de stock
 */
export default function StandardSpecsPanel({ stockItemId, stockItemName }) {
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    spec_text: "",
    is_default: false,
  });

  const loadSpecs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await stock.fetchStockItemStandardSpecs(stockItemId);
      setSpecs(data);
      setError(null);
    } catch (err) {
      console.error("Erreur chargement specs:", err);
      setError("Erreur lors du chargement des spécifications");
    } finally {
      setLoading(false);
    }
  }, [stockItemId]);

  useEffect(() => {
    loadSpecs();
  }, [loadSpecs]);

  const handleAdd = async () => {
    if (!formData.title.trim() || !formData.spec_text.trim()) {
      setError("Le titre et la spécification sont obligatoires");
      return;
    }

    try {
      await stock.createStockItemStandardSpec({
        stock_item_id: stockItemId,
        ...formData,
      });
      await loadSpecs();
      setFormData({ title: "", spec_text: "", is_default: false });
      setIsAdding(false);
      setError(null);
    } catch (err) {
      console.error("Erreur ajout spec:", err);
      setError("Erreur lors de l'ajout de la spécification");
    }
  };

  const handleUpdate = async (id) => {
    if (!formData.title.trim() || !formData.spec_text.trim()) {
      setError("Le titre et la spécification sont obligatoires");
      return;
    }

    try {
      await stock.updateStockItemStandardSpec(id, formData);
      await loadSpecs();
      setEditingId(null);
      setFormData({ title: "", spec_text: "", is_default: false });
      setError(null);
    } catch (err) {
      console.error("Erreur mise à jour spec:", err);
      setError("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm("Supprimer cette spécification ?"); // eslint-disable-line no-alert
    if (!confirmed) return;

    try {
      await stock.deleteStockItemStandardSpec(id);
      await loadSpecs();
      setError(null);
    } catch (err) {
      console.error("Erreur suppression spec:", err);
      setError("Erreur lors de la suppression");
    }
  };

  const startEdit = (spec) => {
    setEditingId(spec.id);
    setFormData({
      title: spec.title,
      spec_text: spec.text,
      is_default: spec.isDefault,
    });
    setIsAdding(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({ title: "", spec_text: "", is_default: false });
    setError(null);
  };

  if (loading) {
    return (
      <Box p="4">
        <Text size="2" color="gray">
          Chargement des spécifications...
        </Text>
      </Box>
    );
  }

  return (
    <Box p="4">
      <Flex direction="column" gap="3">
        {/* Header */}
        <Flex align="center" justify="between">
          <Flex align="center" gap="2">
            <FileText size={16} color="var(--blue-9)" />
            <Box>
              <Text weight="bold" size="3">
                Spécifications standard
              </Text>
              <Text size="2" color="gray" style={{ display: "block" }}>
                {stockItemName}
              </Text>
            </Box>
          </Flex>
          {!isAdding && !editingId && (
            <Flex gap="2">
              <SearchSpecsDialog
                stockItemId={stockItemId}
                stockItemName={stockItemName}
                onSpecAdded={loadSpecs}
              />
              <Button
                size="2"
                variant="soft"
                onClick={() => setIsAdding(true)}
              >
                <Plus size={14} />
                Ajouter une spécification
              </Button>
            </Flex>
          )}
        </Flex>

        {/* Error message */}
        {error && (
          <Callout.Root color="red" size="1">
            <Callout.Icon>
              <AlertCircle size={16} />
            </Callout.Icon>
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        {/* Add form */}
        {isAdding && (
          <Card>
            <Flex direction="column" gap="3" p="3">
              <Box>
                <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
                  Titre *
                </Text>
                <TextField.Root
                  placeholder="ex: Taraud machine métrique"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  size="2"
                />
              </Box>

              <Box>
                <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
                  Spécification détaillée *
                </Text>
                <TextArea
                  placeholder="ex: M3–M12, ISO, HSS, pour taraudage machine"
                  value={formData.spec_text}
                  onChange={(e) =>
                    setFormData({ ...formData, spec_text: e.target.value })
                  }
                  rows={3}
                  size="2"
                />
              </Box>

              <Flex asChild gap="2">
                <label>
                  <Checkbox
                    checked={formData.is_default}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, is_default: checked })
                    }
                  />
                  <Text size="2">Utiliser par défaut dans les demandes</Text>
                </label>
              </Flex>

              <Flex gap="2">
                <Button size="2" onClick={handleAdd}>
                  <Check size={14} />
                  Ajouter
                </Button>
                <Button size="2" variant="soft" color="gray" onClick={cancelEdit}>
                  <X size={14} />
                  Annuler
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}

        {/* Specs list */}
        {specs.length === 0 && !isAdding ? (
          <Card>
            <Flex direction="column" align="center" gap="2" p="4">
              <FileText size={32} color="var(--gray-8)" />
              <Text color="gray" size="2">
                Aucune spécification définie
              </Text>
              <Text color="gray" size="1">
                Ajoutez des spécifications détaillées pour les demandes de prix
              </Text>
            </Flex>
          </Card>
        ) : (
          <Flex direction="column" gap="2">
            {specs.map((spec) => (
              <Card key={spec.id}>
                {editingId === spec.id ? (
                  // Edit mode
                  <Flex direction="column" gap="3" p="3">
                    <Box>
                      <Text
                        size="2"
                        weight="bold"
                        mb="1"
                        style={{ display: "block" }}
                      >
                        Titre *
                      </Text>
                      <TextField.Root
                        value={formData.title}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                        size="2"
                      />
                    </Box>

                    <Box>
                      <Text
                        size="2"
                        weight="bold"
                        mb="1"
                        style={{ display: "block" }}
                      >
                        Spécification détaillée *
                      </Text>
                      <TextArea
                        value={formData.spec_text}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            spec_text: e.target.value,
                          })
                        }
                        rows={3}
                        size="2"
                      />
                    </Box>

                    <Flex asChild gap="2">
                      <label>
                        <Checkbox
                          checked={formData.is_default}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, is_default: checked })
                          }
                        />
                        <Text size="2">Utiliser par défaut</Text>
                      </label>
                    </Flex>

                    <Flex gap="2">
                      <Button size="2" onClick={() => handleUpdate(spec.id)}>
                        <Check size={14} />
                        Enregistrer
                      </Button>
                      <Button
                        size="2"
                        variant="soft"
                        color="gray"
                        onClick={cancelEdit}
                      >
                        <X size={14} />
                        Annuler
                      </Button>
                    </Flex>
                  </Flex>
                ) : (
                  // View mode
                  <Flex direction="column" gap="2" p="3">
                    <Flex align="center" justify="between">
                      <Flex align="center" gap="2">
                        <Text weight="bold" size="2">
                          {spec.title}
                        </Text>
                        {spec.isDefault && (
                          <Badge color="blue" size="1">
                            Par défaut
                          </Badge>
                        )}
                      </Flex>
                      <Flex gap="1">
                        <Button
                          size="1"
                          variant="ghost"
                          color="gray"
                          onClick={() => startEdit(spec)}
                        >
                          <Edit2 size={14} />
                        </Button>
                        <Button
                          size="1"
                          variant="ghost"
                          color="red"
                          onClick={() => handleDelete(spec.id)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </Flex>
                    </Flex>
                    <Text
                      size="2"
                      color="gray"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {spec.text}
                    </Text>
                    <Text size="1" color="gray">
                      Créé le{" "}
                      {new Date(spec.createdAt).toLocaleDateString("fr-FR")}
                    </Text>
                  </Flex>
                )}
              </Card>
            ))}
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

StandardSpecsPanel.propTypes = {
  stockItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  stockItemName: PropTypes.string,
};
