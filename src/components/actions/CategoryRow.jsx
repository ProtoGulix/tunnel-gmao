/**
 * @fileoverview Ligne de catégorie avec sous-catégories expandables
 *
 * Composant pour afficher une catégorie d'action avec ses sous-catégories
 *
 * @module components/actions/ActionCategoriesTable/CategoryRow
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import { useState } from "react";
import PropTypes from 'prop-types';
import { Box, Flex, Text, Card, TextField, Button, Table, Badge, Select } from "@radix-ui/themes";
import { Plus, Trash2, ChevronDown, Edit2 } from "lucide-react";
import StatusCallout from "@/components/common/StatusCallout";
import SubcategoryRow from "./SubcategoryRow";
import { COLOR_PALETTE } from "@/config/colorPalette";

// ===== CONSTANTES =====
const FORM_DATA_KEYS = {
  SUBCATEGORY_CODE: 'subcategoryCode',
  SUBCATEGORY_NAME: 'subcategoryName',
};

const INITIAL_SUBCATEGORY_STATE = {
  [FORM_DATA_KEYS.SUBCATEGORY_CODE]: "",
  [FORM_DATA_KEYS.SUBCATEGORY_NAME]: "",
};

/**
 * Valide les données d'une sous-catégorie
 *
 * @param {Object} formData - Données du formulaire
 * @param {Array} subcategories - Liste des sous-catégories de la catégorie
 * @returns {Object} { valid: boolean, error?: string }
 */
const validateSubcategoryData = (formData, subcategories = []) => {
  const code = formData[FORM_DATA_KEYS.SUBCATEGORY_CODE]?.trim();
  const name = formData[FORM_DATA_KEYS.SUBCATEGORY_NAME]?.trim();

  if (!code || !name) {
    return {
      valid: false,
      error: "Veuillez renseigner le code et le nom de la sous-catégorie"
    };
  }

  const duplicateCode = subcategories.some(sub => sub.code?.toLowerCase() === code.toLowerCase());
  if (duplicateCode) {
    return {
      valid: false,
      error: `Le code "${code}" existe déjà dans cette catégorie`
    };
  }

  const duplicateName = subcategories.some(sub => sub.name?.toLowerCase() === name.toLowerCase());
  if (duplicateName) {
    return {
      valid: false,
      error: `Le nom "${name}" existe déjà dans cette catégorie`
    };
  }

  return { valid: true };
};

/**
 * Ligne de catégorie avec sous-catégories
 *
 * @component
 * @param {Object} props - Props du composant
 * @param {Object} props.category - Objet catégorie
 * @param {Array} props.subcategories - Liste des sous-catégories
 * @param {Function} props.onDelete - Callback suppression catégorie
 * @param {Function} props.onAddSubcategory - Callback ajout sous-catégorie
 * @param {Function} props.onDeleteSubcategory - Callback suppression sous-catégorie
 * @param {boolean} [props.loading=false] - État de chargement
 * @returns {JSX.Element} Ligne de catégorie
 *
 * @example
 * <CategoryRow
 *   category={{ code: 'DEP', name: 'Dépannage', color: '#ef4444' }}
 *   subcategories={[...]}
 *   onDelete={handleDelete}
 *   onAddSubcategory={handleAdd}
 *   onDeleteSubcategory={handleDeleteSub}
 * />
 */
export default function CategoryRow({
  category,
  subcategories,
  onDelete,
  onAddSubcategory,
  onDeleteSubcategory,
  onUpdateSubcategory,
  onUpdateCategory,
  loading = false
}) {
  const [expanded, setExpanded] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState(INITIAL_SUBCATEGORY_STATE);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [editData, setEditData] = useState({
    code: category.code,
    name: category.name,
    color: category.color || COLOR_PALETTE.primary,
  });
  const [editError, setEditError] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const handleAddSubcategory = async () => {
    const validation = validateSubcategoryData(formData, subcategories);
    if (!validation.valid) {
      setFormError(validation.error);
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);
      await onAddSubcategory(category.code, {
        categoryId: category.id,
        code: formData[FORM_DATA_KEYS.SUBCATEGORY_CODE].trim(),
        name: formData[FORM_DATA_KEYS.SUBCATEGORY_NAME].trim(),
      });
      setFormData(INITIAL_SUBCATEGORY_STATE);
      setShowForm(false);
    } catch (e) {
      console.error("Erreur ajout sous-catégorie:", e);
      setFormError(e?.message || "Erreur lors de l'ajout");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Card mb="2">
      <Flex direction="column" gap="2">
        <Flex align="center" justify="between">
          <Flex align="center" gap="3" style={{ flex: 1 }}>
            <Button
              variant="ghost"
              color="gray"
              size="1"
              onClick={() => setExpanded(!expanded)}
              style={{
                transform: expanded ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform 0.2s"
              }}
            >
              <ChevronDown size={16} />
            </Button>

            <Badge
              color={category.color ? undefined : "gray"}
              size="2"
              style={category.color ? { backgroundColor: category.color } : {}}
            >
              {category.code}
            </Badge>

            <Text size="3" weight="bold">{category.name}</Text>

            <Badge color="blue" variant="soft" size="1">
              {subcategories.length} sous-catégorie{subcategories.length > 1 ? 's' : ''}
            </Badge>
          </Flex>

          <Flex gap="2">
            <Button
              variant="soft"
              color="violet"
              size="2"
              onClick={() => setShowEditForm(!showEditForm)}
            >
              <Edit2 size={16} />
              Modifier
            </Button>
            <Button
              variant="soft"
              color="blue"
              size="2"
              onClick={() => setShowForm(!showForm)}
            >
              <Plus size={16} />
              Sous-catégorie
            </Button>

            <Button
              variant="soft"
              color="red"
              size="2"
              onClick={() => onDelete(category.code)}
              disabled={loading}
            >
              <Trash2 size={16} />
            </Button>
          </Flex>
        </Flex>

        {showEditForm && (
          <Card style={{ background: "var(--blue-2)", border: "1px solid var(--blue-6)" }}>
            <Flex direction="column" gap="3">
              <Flex align="center" gap="2">
                <Edit2 size={20} />
                <Text size="3" weight="bold">
                  Modifier la catégorie {category.code}
                </Text>
              </Flex>

              {editError && <StatusCallout type="error" title={editError} />}

              <Flex gap="2" wrap="wrap" align="end">
                <Box style={{ flex: 1, minWidth: "120px" }}>
                  <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>Code *</Text>
                  <TextField.Root
                    placeholder="Ex: DEP"
                    value={editData.code}
                    onChange={(e) => {
                      setEditData({ ...editData, code: e.target.value.toUpperCase() });
                      setEditError(null);
                    }}
                    disabled={editLoading}
                    size="2"
                  />
                </Box>

                <Box style={{ flex: 2, minWidth: "200px" }}>
                  <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>Nom *</Text>
                  <TextField.Root
                    placeholder="Ex: Dépannage"
                    value={editData.name}
                    onChange={(e) => {
                      setEditData({ ...editData, name: e.target.value });
                      setEditError(null);
                    }}
                    disabled={editLoading}
                    size="2"
                  />
                </Box>

                <Box style={{ flex: 1, minWidth: "180px" }}>
                  <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>Couleur *</Text>
                  <Select.Root
                    value={(() => {
                      const entries = Object.entries(COLOR_PALETTE);
                      const match = entries.find(([_, hex]) => hex === editData.color);
                      return match ? match[0] : 'primary';
                    })()}
                    onValueChange={(key) => {
                      const hex = COLOR_PALETTE[key] || COLOR_PALETTE.primary;
                      setEditData({ ...editData, color: hex });
                      setEditError(null);
                    }}
                    disabled={editLoading}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      {[
                        'primary', 'primaryTone1', 'primaryTone2', 'primaryTone3', 'primaryTone4', 'primaryTone5',
                        'primaryTone6', 'primaryTone7', 'primaryTone8', 'primaryTone9', 'primaryTone10',
                        'success', 'successTone1', 'successTone2', 'successTone3', 'successTone4', 'successTone5',
                        'successTone6', 'successTone7', 'successTone8', 'successTone9', 'successTone10',
                        'warning', 'warningTone1', 'warningTone2', 'warningTone3', 'warningTone4', 'warningTone5',
                        'warningTone6', 'warningTone7', 'warningTone8', 'warningTone9', 'warningTone10',
                        'error', 'errorTone1', 'errorTone2', 'errorTone3', 'errorTone4', 'errorTone5',
                        'errorTone6', 'errorTone7', 'errorTone8', 'errorTone9', 'errorTone10',
                        'grayTone1', 'grayTone2', 'grayTone3', 'grayTone4', 'grayTone5',
                        'grayTone6', 'grayTone7', 'grayTone8', 'grayTone9', 'grayTone10',
                      ].map((key) => (
                        <Select.Item key={key} value={key}>
                          <Flex align="center" gap="2">
                            <Box style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: COLOR_PALETTE[key], border: '1px solid var(--gray-7)' }} />
                            <Text>{key}</Text>
                          </Flex>
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Root>
                </Box>

                <Button
                  onClick={async () => {
                    if (!editData.code?.trim() || !editData.name?.trim()) {
                      setEditError('Veuillez renseigner le code et le nom');
                      return;
                    }
                    const allowedColorKeys = [
                      'primary', 'primaryTone1', 'primaryTone2', 'primaryTone3', 'primaryTone4', 'primaryTone5',
                      'primaryTone6', 'primaryTone7', 'primaryTone8', 'primaryTone9', 'primaryTone10',
                      'success', 'successTone1', 'successTone2', 'successTone3', 'successTone4', 'successTone5',
                      'successTone6', 'successTone7', 'successTone8', 'successTone9', 'successTone10',
                      'warning', 'warningTone1', 'warningTone2', 'warningTone3', 'warningTone4', 'warningTone5',
                      'warningTone6', 'warningTone7', 'warningTone8', 'warningTone9', 'warningTone10',
                      'error', 'errorTone1', 'errorTone2', 'errorTone3', 'errorTone4', 'errorTone5',
                      'errorTone6', 'errorTone7', 'errorTone8', 'errorTone9', 'errorTone10',
                      'grayTone1', 'grayTone2', 'grayTone3', 'grayTone4', 'grayTone5',
                      'grayTone6', 'grayTone7', 'grayTone8', 'grayTone9', 'grayTone10',
                    ];
                    const allowedColors = new Set(allowedColorKeys.map(k => COLOR_PALETTE[k]));
                    if (!allowedColors.has(editData.color || '')) {
                      setEditError('Couleur invalide: sélectionnez une couleur de la palette');
                      return;
                    }
                    try {
                      setEditLoading(true);
                      await onUpdateCategory({
                        id: category.id,
                        code: editData.code.trim(),
                        name: editData.name.trim(),
                        color: editData.color.trim(),
                      });
                      setShowEditForm(false);
                    } catch (e) {
                      setEditError(e?.message || 'Erreur lors de la modification');
                    } finally {
                      setEditLoading(false);
                    }
                  }}
                  disabled={editLoading}
                  size="2"
                >
                  <Edit2 size={16} />
                  Enregistrer
                </Button>

                <Button
                  onClick={() => { setShowEditForm(false); setEditError(null); setEditData({ code: category.code, name: category.name, color: category.color || '#3b82f6' }); }}
                  variant="soft"
                  color="gray"
                  size="2"
                >
                  Annuler
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}

        {showForm && (
          <Card style={{ background: "var(--blue-2)", border: "1px solid var(--blue-6)" }}>
            <Flex direction="column" gap="3">
              <Flex align="center" gap="2">
                <Plus size={20} />
                <Text size="3" weight="bold">
                  Ajouter une sous-catégorie à {category.code}
                </Text>
              </Flex>

              {formError && <StatusCallout type="error" title={formError} />}

              <Flex gap="2" wrap="wrap" align="end">
                <Box style={{ flex: 1, minWidth: "150px" }}>
                  <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
                    Code *
                  </Text>
                  <TextField.Root
                    placeholder={`Ex: ${category.code}_ELEC`}
                    value={formData[FORM_DATA_KEYS.SUBCATEGORY_CODE]}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        [FORM_DATA_KEYS.SUBCATEGORY_CODE]: e.target.value.toUpperCase() 
                      });
                      setFormError(null);
                    }}
                    disabled={formLoading}
                    size="2"
                  />
                </Box>

                <Box style={{ flex: 2, minWidth: "250px" }}>
                  <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
                    Nom *
                  </Text>
                  <TextField.Root
                    placeholder="Ex: Dépannage Électrique"
                    value={formData[FORM_DATA_KEYS.SUBCATEGORY_NAME]}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        [FORM_DATA_KEYS.SUBCATEGORY_NAME]: e.target.value 
                      });
                      setFormError(null);
                    }}
                    disabled={formLoading}
                    size="2"
                  />
                </Box>

                <Button onClick={handleAddSubcategory} disabled={formLoading} size="2">
                  <Plus size={16} />
                  Enregistrer
                </Button>

                <Button
                  onClick={() => {
                    setShowForm(false);
                    setFormData(INITIAL_SUBCATEGORY_STATE);
                    setFormError(null);
                  }}
                  variant="soft"
                  color="gray"
                  size="2"
                >
                  Annuler
                </Button>
              </Flex>
            </Flex>
          </Card>
        )}

        {expanded && (
          <Box>
            {subcategories.length === 0 ? (
              <Box p="3" style={{ background: "var(--gray-2)", borderRadius: "var(--radius-2)" }}>
                <Text size="2" color="gray">
                  Aucune sous-catégorie. Cliquez sur "+ Sous-catégorie" pour en ajouter.
                </Text>
              </Box>
            ) : (
              <Table.Root variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Code</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Nom</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell style={{ width: "80px" }}>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {subcategories.map(subcategory => (
                    <SubcategoryRow
                      key={subcategory.id}
                      subcategory={subcategory}
                      onDelete={onDeleteSubcategory}
                      onUpdate={onUpdateSubcategory}
                      loading={loading}
                    />
                  ))}
                </Table.Body>
              </Table.Root>
            )}
          </Box>
        )}
      </Flex>
    </Card>
  );
}

CategoryRow.propTypes = {
  category: PropTypes.shape({
    id: PropTypes.number,
    code: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    color: PropTypes.string,
  }).isRequired,
  subcategories: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.number.isRequired,
      code: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddSubcategory: PropTypes.func.isRequired,
  onDeleteSubcategory: PropTypes.func.isRequired,
  onUpdateSubcategory: PropTypes.func.isRequired,
  onUpdateCategory: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};
