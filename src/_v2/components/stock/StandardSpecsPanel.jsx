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
  Table,
} from "@radix-ui/themes";
import {
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { stock } from "@/lib/api/facade";

/**
 * Panneau de gestion des spécifications standard pour un article de stock
 * Pattern cohérent avec SpecificationsInlinePanel
 */
export default function StandardSpecsPanel({ stockItemId, stockItemName }) {
  const [specs, setSpecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États de contrôle
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
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

  const resetForm = useCallback(() => {
    setFormData({ title: "", spec_text: "", is_default: false });
    setError(null);
  }, []);

  const startAdd = useCallback(() => {
    resetForm();
    setIsAdding(true);
  }, [resetForm]);

  const startEdit = useCallback((spec) => {
    setEditingId(spec.id);
    setFormData({
      title: spec.title,
      spec_text: spec.text,
      is_default: spec.isDefault,
    });
    setError(null);
  }, []);

  const cancelEdit = useCallback(() => {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  }, [resetForm]);

  const handleAdd = useCallback(async () => {
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
      setIsAdding(false);
      resetForm();
    } catch (err) {
      console.error("Erreur ajout spec:", err);
      setError("Erreur lors de l'ajout de la spécification");
    }
  }, [formData, stockItemId, loadSpecs, resetForm]);

  const handleUpdate = useCallback(async (id) => {
    if (!formData.title.trim() || !formData.spec_text.trim()) {
      setError("Le titre et la spécification sont obligatoires");
      return;
    }

    try {
      await stock.updateStockItemStandardSpec(id, formData);
      await loadSpecs();
      setEditingId(null);
      resetForm();
    } catch (err) {
      console.error("Erreur mise à jour spec:", err);
      setError("Erreur lors de la mise à jour");
    }
  }, [formData, loadSpecs, resetForm]);

  const handleDeleteConfirm = useCallback(async (id) => {
    try {
      await stock.deleteStockItemStandardSpec(id);
      await loadSpecs();
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Erreur suppression spec:", err);
      setError("Erreur lors de la suppression");
    }
  }, [loadSpecs]);

  if (loading) {
    return (
      <Card>
        <Flex p="4">
          <Text size="2" color="gray">
            Chargement des spécifications...
          </Text>
        </Flex>
      </Card>
    );
  }

  const defaultCount = specs.filter(s => s.isDefault).length;

  return (
    <Card>
      <Flex direction="column" gap="4">
        {/* En-tête */}
        <Flex justify="between" align="center">
          <Flex gap="2" align="center">
            <FileText size={20} />
            <Text size="3" weight="bold">
              Spécifications standard pour {stockItemName || ""}
            </Text>
            <Badge color="blue" variant="soft">
              {specs.length}
            </Badge>
            <Badge color="green" variant="soft">
              {defaultCount} par défaut
            </Badge>
          </Flex>
          {!isAdding && editingId === null && (
            <Button
              size="2"
              color="blue"
              onClick={startAdd}
              disabled={loading}
            >
              <Plus size={16} />
              Ajouter
            </Button>
          )}
        </Flex>

        {/* Erreurs */}
        {error && (
          <Callout color="red" role="alert">
            <AlertCircle size={16} />
            <Text size="2">{error}</Text>
          </Callout>
        )}

        {/* Liste vide */}
        {specs.length === 0 && !isAdding ? (
          <Box p="4" style={{ textAlign: 'center', background: 'var(--gray-2)', borderRadius: '8px' }}>
            <Flex direction="column" gap="2" align="center">
              <FileText size={20} color="var(--gray-8)" />
              <Text size="2" weight="bold" color="gray">
                Aucune spécification définie
              </Text>
              <Text size="1" color="gray">
                Ajoutez des spécifications détaillées pour les demandes de prix
              </Text>
            </Flex>
          </Box>
        ) : (
          <Box style={{ overflowX: 'auto' }}>
            <Table.Root>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Titre</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Spécification</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Par défaut</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell style={{ width: '120px' }}>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {specs.map((spec) => (
                  <Table.Row
                    key={spec.id}
                    style={{
                      background: spec.isDefault ? "var(--green-2)" : undefined,
                    }}
                  >
                    {editingId === spec.id ? (
                      // Mode édition
                      <Table.Cell colSpan={4}>
                        <Box p="3" style={{ background: 'var(--blue-2)', border: '1px solid var(--blue-6)', borderRadius: '8px' }}>
                          <Flex direction="column" gap="3">
                            <Flex align="center" gap="2">
                              <Edit2 size={20} color="var(--blue-9)" />
                              <Text size="3" weight="bold">Éditer la spécification</Text>
                            </Flex>

                            {/* Ligne 1: Titre et Checkbox */}
                            <Flex gap="3" wrap="wrap" align="end">
                              <Box style={{ flex: '2', minWidth: '250px' }}>
                                <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                  Titre *
                                </Text>
                                <TextField.Root
                                  placeholder="ex: Taraud machine métrique"
                                  value={formData.title}
                                  onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                  }
                                  disabled={loading}
                                />
                              </Box>

                              <Flex asChild gap="2" style={{ paddingBottom: '8px' }}>
                                <label>
                                  <Checkbox
                                    checked={formData.is_default}
                                    onCheckedChange={(checked) =>
                                      setFormData({ ...formData, is_default: checked })
                                    }
                                  />
                                  <Text size="2" weight="medium">Par défaut</Text>
                                </label>
                              </Flex>
                            </Flex>

                            {/* Ligne 2: Spécification et Boutons */}
                            <Flex gap="3" wrap="wrap" align="end">
                              <Box style={{ flex: '1', minWidth: '300px' }}>
                                <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                  Spécification *
                                </Text>
                                <TextArea
                                  placeholder="ex: M3–M12, ISO, HSS, pour taraudage machine"
                                  value={formData.spec_text}
                                  onChange={(e) =>
                                    setFormData({ ...formData, spec_text: e.target.value })
                                  }
                                  rows={3}
                                  disabled={loading}
                                  style={{ width: '100%' }}
                                />
                              </Box>

                              {/* Boutons alignés avec le champ */}
                              <Flex gap="2">
                                <Button
                                  variant="soft"
                                  color="gray"
                                  onClick={cancelEdit}
                                  disabled={loading}
                                  size="2"
                                >
                                  Annuler
                                </Button>
                                <Button
                                  color="blue"
                                  onClick={() => handleUpdate(spec.id)}
                                  disabled={loading || !formData.title.trim() || !formData.spec_text.trim()}
                                  size="2"
                                >
                                  {loading ? 'Enregistrement...' : 'Enregistrer'}
                                </Button>
                              </Flex>
                            </Flex>
                          </Flex>
                        </Box>
                      </Table.Cell>
                    ) : (
                      // Mode affichage
                      <>
                        <Table.Cell>
                          <Text size="2" weight={spec.isDefault ? "bold" : "regular"}>
                            {spec.title}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2" style={{ whiteSpace: 'pre-wrap' }}>
                            {spec.text}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          {spec.isDefault && (
                            <Badge color="green" variant="soft">
                              Par défaut
                            </Badge>
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap="2">
                            <Button
                              size="1"
                              variant="soft"
                              color="blue"
                              onClick={() => startEdit(spec)}
                              disabled={loading || isAdding || editingId !== null}
                              title="Éditer"
                            >
                              <Edit2 size={14} />
                            </Button>
                            <Button
                              size="1"
                              variant="soft"
                              color="red"
                              onClick={() => setDeleteConfirmId(spec.id)}
                              disabled={loading || isAdding || editingId !== null}
                              title="Supprimer"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </Flex>
                        </Table.Cell>
                      </>
                    )}
                  </Table.Row>
                ))}

                {/* Formulaire d'ajout inline */}
                {isAdding && (
                  <Table.Row>
                    <Table.Cell colSpan={4}>
                      <Box p="3" style={{ background: 'var(--blue-2)', border: '1px solid var(--blue-6)', borderRadius: '8px' }}>
                        <Flex direction="column" gap="3">
                          <Flex align="center" gap="2">
                            <Plus size={20} color="var(--blue-9)" />
                            <Text size="3" weight="bold">Ajouter une spécification</Text>
                          </Flex>

                          {/* Ligne 1: Titre et Checkbox */}
                          <Flex gap="3" wrap="wrap" align="end">
                            <Box style={{ flex: '2', minWidth: '250px' }}>
                              <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                Titre *
                              </Text>
                              <TextField.Root
                                placeholder="ex: Taraud machine métrique"
                                value={formData.title}
                                onChange={(e) =>
                                  setFormData({ ...formData, title: e.target.value })
                                }
                                disabled={loading}
                                autoFocus
                              />
                            </Box>

                            <Flex asChild gap="2" style={{ paddingBottom: '8px' }}>
                              <label>
                                <Checkbox
                                  checked={formData.is_default}
                                  onCheckedChange={(checked) =>
                                    setFormData({ ...formData, is_default: checked })
                                  }
                                />
                                <Text size="2" weight="medium">Par défaut</Text>
                              </label>
                            </Flex>
                          </Flex>

                          {/* Ligne 2: Spécification et Boutons */}
                          <Flex gap="3" wrap="wrap" align="end">
                            <Box style={{ flex: '1', minWidth: '300px' }}>
                              <Text size="2" weight="bold" mb="1" style={{ display: 'block' }}>
                                Spécification *
                              </Text>
                              <TextArea
                                placeholder="ex: M3–M12, ISO, HSS, pour taraudage machine"
                                value={formData.spec_text}
                                onChange={(e) =>
                                  setFormData({ ...formData, spec_text: e.target.value })
                                }
                                rows={3}
                                disabled={loading}
                                style={{ width: '100%' }}
                              />
                            </Box>

                            {/* Boutons alignés avec le champ */}
                            <Flex gap="2">
                              <Button
                                variant="soft"
                                color="gray"
                                onClick={cancelEdit}
                                disabled={loading}
                                size="2"
                              >
                                Annuler
                              </Button>
                              <Button
                                color="blue"
                                onClick={handleAdd}
                                disabled={loading || !formData.title.trim() || !formData.spec_text.trim()}
                                size="2"
                              >
                                {loading ? 'Enregistrement...' : 'Enregistrer'}
                              </Button>
                            </Flex>
                          </Flex>
                        </Flex>
                      </Box>
                    </Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table.Root>
          </Box>
        )}

        {/* Confirmation suppression */}
        {deleteConfirmId !== null && (
          <Card style={{ background: 'var(--red-2)', borderLeft: '4px solid var(--red-9)' }}>
            <Flex gap="3" align="center">
              <AlertCircle size={20} color="var(--red-9)" />
              <Flex direction="column" gap="2" style={{ flex: 1 }}>
                <Text weight="bold" color="red">
                  Êtes-vous sûr de vouloir supprimer cette spécification ?
                </Text>
                <Text size="2" color="gray">
                  Cette action ne peut pas être annulée.
                </Text>
              </Flex>
              <Flex gap="2">
                <Button
                  variant="soft"
                  color="gray"
                  onClick={() => setDeleteConfirmId(null)}
                  disabled={loading}
                >
                  Annuler
                </Button>
                <Button
                  color="red"
                  onClick={() => handleDeleteConfirm(deleteConfirmId)}
                  disabled={loading}
                >
                  {loading ? 'Suppression...' : 'Supprimer'}
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}
      </Flex>
    </Card>
  );
}

StandardSpecsPanel.propTypes = {
  stockItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  stockItemName: PropTypes.string,
};
