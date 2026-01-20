/**
 * @fileoverview Tableau de gestion des catégories et sous-catégories d'actions
 *
 * Permet d'afficher, rechercher et créer des catégories et sous-catégories d'actions
 * avec validation des doublons.
 *
 * @module components/actions/ActionCategoriesTable
 * @requires react
 * @requires @/contexts/ErrorContext
 * @requires @radix-ui/themes
 * @requires lucide-react
 * @requires @/lib/api/facade
 */

import { useEffect, useState, useCallback } from "react";
import PropTypes from 'prop-types';
import { useError } from '@/contexts/ErrorContext';
import { Box, Flex, Text, Card, TextField, Button, Select } from "@radix-ui/themes";
import { Plus } from "lucide-react";
import { actionSubcategories } from "@/lib/api/facade";
import StatusCallout from "@/components/common/StatusCallout";
import CategoryRow from "./CategoryRow";
import { COLOR_PALETTE } from "@/config/colorPalette";

// ===== CONSTANTES =====
const MIN_SEARCH_LENGTH = 1;

const FORM_DATA_KEYS = {
  CATEGORY_CODE: 'categoryCode',
  CATEGORY_NAME: 'categoryName',
  CATEGORY_COLOR: 'categoryColor',
};

const CATEGORY_COLOR_KEYS = [
  'primary', 
  'primaryTone1', 'primaryTone2', 'primaryTone3', 'primaryTone4', 'primaryTone5',
  'primaryTone6', 'primaryTone7', 'primaryTone8', 'primaryTone9', 'primaryTone10',
  'success',
  'successTone1', 'successTone2', 'successTone3', 'successTone4', 'successTone5',
  'successTone6', 'successTone7', 'successTone8', 'successTone9', 'successTone10',
  'warning',
  'warningTone1', 'warningTone2', 'warningTone3', 'warningTone4', 'warningTone5',
  'warningTone6', 'warningTone7', 'warningTone8', 'warningTone9', 'warningTone10',
  'error',
  'errorTone1', 'errorTone2', 'errorTone3', 'errorTone4', 'errorTone5',
  'errorTone6', 'errorTone7', 'errorTone8', 'errorTone9', 'errorTone10',
  'grayTone1', 'grayTone2', 'grayTone3', 'grayTone4', 'grayTone5',
  'grayTone6', 'grayTone7', 'grayTone8', 'grayTone9', 'grayTone10',
];
const CATEGORY_ALLOWED_COLORS = CATEGORY_COLOR_KEYS.map((key) => ({ key, hex: COLOR_PALETTE[key] }));

const INITIAL_CATEGORY_STATE = {
  [FORM_DATA_KEYS.CATEGORY_CODE]: "",
  [FORM_DATA_KEYS.CATEGORY_NAME]: "",
  [FORM_DATA_KEYS.CATEGORY_COLOR]: COLOR_PALETTE.primary,
};

// ===== HELPERS =====
/**
 * Valide les données d'une catégorie
 *
 * @param {Object} formData - Données du formulaire
 * @param {Array} categories - Liste des catégories existantes
 * @returns {Object} { valid: boolean, error?: string }
 */
const validateCategoryData = (formData, categories = []) => {
  const code = formData[FORM_DATA_KEYS.CATEGORY_CODE]?.trim();
  const name = formData[FORM_DATA_KEYS.CATEGORY_NAME]?.trim();
  const color = formData[FORM_DATA_KEYS.CATEGORY_COLOR]?.trim();

  if (!code || !name) {
    return { valid: false, error: "Veuillez renseigner le code et le nom de la catégorie" };
  }

  const allowedHex = new Set(CATEGORY_ALLOWED_COLORS.map(c => c.hex));
  if (!color || !allowedHex.has(color)) {
    return { valid: false, error: "Couleur invalide: sélectionnez une couleur de la palette" };
  }

  const duplicateCode = categories.some(cat => cat.code?.toLowerCase() === code.toLowerCase());
  if (duplicateCode) {
    return { valid: false, error: `Le code "${code}" existe déjà` };
  }

  const duplicateName = categories.some(cat => cat.name?.toLowerCase() === name.toLowerCase());
  if (duplicateName) {
    return { valid: false, error: `Le nom "${name}" existe déjà dans une autre catégorie` };
  }

  return { valid: true };
};

/**
 * Filtre les catégories selon la recherche
 *
 * @param {Array} categories - Liste des catégories
 * @param {string} searchQuery - Texte de recherche
 * @returns {Array} Catégories filtrées
 */
const filterCategories = (categories, searchQuery) => {
  if (!searchQuery || searchQuery.length < MIN_SEARCH_LENGTH) return categories;

  const q = searchQuery.toLowerCase();
  return categories.filter(cat =>
    (cat.code || "").toLowerCase().includes(q) ||
    (cat.name || "").toLowerCase().includes(q)
  );
};

/**
 * Tableau de gestion des catégories et sous-catégories
 *
 * @component
 * @param {Object} props - Props du composant
 * @param {Function} [props.onCategoriesUpdated] - Callback appelé après modification des catégories
 * @returns {JSX.Element} Tableau de gestion des catégories
 *
 * @example
 * <ActionCategoriesTable onCategoriesUpdated={handleUpdate} />
 */
export default function ActionCategoriesTable({ onCategoriesUpdated }) {
  const { showError } = useError();
  const [categories, setCategories] = useState([]);
  const [subcategoriesByCategory, setSubcategoriesByCategory] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(INITIAL_CATEGORY_STATE);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await actionSubcategories.fetchActionCategories();
      setCategories(data || []);

      const subcategoriesMap = {};
      for (const category of (data || [])) {
        const subs = await actionSubcategories.fetchSubcategoriesByCategory(category.code);
        subcategoriesMap[category.code] = subs || [];
      }
      setSubcategoriesByCategory(subcategoriesMap);
    } catch (e) {
      console.error("Erreur chargement catégories:", e);
      setError(e?.message || "Erreur de chargement");
      showError(e instanceof Error ? e : new Error("Erreur de chargement"));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const handleAddCategory = async () => {
    const validation = validateCategoryData(formData, categories);
    if (!validation.valid) {
      setFormError(validation.error);
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);
      
      // Note: L'API pour créer des catégories n'existe pas encore
      // Cette partie devra être implémentée côté backend
      setFormError("Fonctionnalité de création non disponible (API à implémenter)");
      
      // Code à activer quand l'API sera disponible:
      // const newCategory = await actionSubcategories.createActionCategory({
      //   code: formData[FORM_DATA_KEYS.CATEGORY_CODE].trim(),
      //   name: formData[FORM_DATA_KEYS.CATEGORY_NAME].trim(),
      //   color: formData[FORM_DATA_KEYS.CATEGORY_COLOR].trim(),
      // });
      //
      // if (newCategory) {
      //   setCategories([...categories, newCategory]);
      //   setSubcategoriesByCategory({ ...subcategoriesByCategory, [newCategory.code]: [] });
      //   setFormData(INITIAL_CATEGORY_STATE);
      //   if (onCategoriesUpdated) onCategoriesUpdated();
      // }
    } catch (e) {
      console.error("Erreur création catégorie:", e);
      setFormError(e?.message || "Erreur lors de la création");
      showError(e instanceof Error ? e : new Error("Erreur lors de la création"));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteCategory = async (code) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${code}" ?`)) return;

    try {
      setLoading(true);
      
      // Note: L'API pour supprimer des catégories n'existe pas encore
      setError("Fonctionnalité de suppression non disponible (API à implémenter)");
      
      // Code à activer quand l'API sera disponible:
      // await actionSubcategories.deleteActionCategory(code);
      // setCategories(categories.filter(c => c.code !== code));
      // const newSubs = { ...subcategoriesByCategory };
      // delete newSubs[code];
      // setSubcategoriesByCategory(newSubs);
      // if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (e) {
      console.error("Erreur suppression catégorie:", e);
      setError(e?.message || "Erreur lors de la suppression");
      showError(e instanceof Error ? e : new Error("Erreur lors de la suppression"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubcategory = async (categoryCode, subcategoryData) => {
    try {
      // Note: L'API pour créer des sous-catégories n'existe pas encore
      throw new Error("Fonctionnalité de création non disponible (API à implémenter)");
      
      // Code à activer quand l'API sera disponible:
      // const newSub = await actionSubcategories.createActionSubcategory(subcategoryData);
      // if (newSub) {
      //   setSubcategoriesByCategory({
      //     ...subcategoriesByCategory,
      //     [categoryCode]: [...(subcategoriesByCategory[categoryCode] || []), newSub]
      //   });
      //   if (onCategoriesUpdated) onCategoriesUpdated();
      // }
    } catch (e) {
      console.error("Erreur création sous-catégorie:", e);
      throw e;
    }
  };

  const handleDeleteSubcategory = async (subcategoryId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette sous-catégorie ?")) return;

    try {
      setLoading(true);
      
      // Note: L'API pour supprimer des sous-catégories n'existe pas encore
      setError("Fonctionnalité de suppression non disponible (API à implémenter)");
      
      // Code à activer quand l'API sera disponible:
      // await actionSubcategories.deleteActionSubcategory(subcategoryId);
      //
      // const newSubs = { ...subcategoriesByCategory };
      // for (const categoryCode in newSubs) {
      //   newSubs[categoryCode] = newSubs[categoryCode].filter(sub => sub.id !== subcategoryId);
      // }
      // setSubcategoriesByCategory(newSubs);
      // if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (e) {
      console.error("Erreur suppression sous-catégorie:", e);
      setError(e?.message || "Erreur lors de la suppression");
      showError(e instanceof Error ? e : new Error("Erreur lors de la suppression"));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCategory = async (update) => {
    try {
      await actionSubcategories.updateActionCategory(update);
      await loadCategories();
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (e) {
      console.error("Erreur modification catégorie:", e);
      showError(e instanceof Error ? e : new Error("Erreur lors de la modification"));
      throw e;
    }
  };

  const handleUpdateSubcategory = async (subcategoryId, update) => {
    try {
      const updated = await actionSubcategories.updateActionSubcategory({ id: subcategoryId, ...update });
      const newMap = { ...subcategoriesByCategory };
      for (const code in newMap) {
        newMap[code] = (newMap[code] || []).map(sub => sub.id === subcategoryId ? updated : sub);
      }
      setSubcategoriesByCategory(newMap);
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (e) {
      console.error("Erreur modification sous-catégorie:", e);
      showError(e instanceof Error ? e : new Error("Erreur lors de la modification"));
      throw e;
    }
  };

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const filteredCategories = filterCategories(categories, search);

  if (loading && categories.length === 0) {
    return <Text>Chargement des catégories...</Text>;
  }

  return (
    <Box>
      <Flex direction="column" gap="3">
        <Card style={{ background: "var(--blue-2)", border: "1px solid var(--blue-6)" }}>
          <Flex direction="column" gap="3">
            <Flex align="center" gap="2">
              <Plus size={20} />
              <Text size="3" weight="bold">Ajouter une catégorie</Text>
            </Flex>

            {formError && <StatusCallout type="error" title={formError} />}

            <Flex gap="2" wrap="wrap" align="end">
              <Box style={{ flex: 1, minWidth: "120px" }}>
                <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>Code *</Text>
                <TextField.Root
                  placeholder="Ex: DEP"
                  value={formData[FORM_DATA_KEYS.CATEGORY_CODE]}
                  onChange={(e) => {
                    setFormData({ ...formData, [FORM_DATA_KEYS.CATEGORY_CODE]: e.target.value.toUpperCase() });
                    setFormError(null);
                  }}
                  disabled={formLoading}
                  size="2"
                />
              </Box>

              <Box style={{ flex: 2, minWidth: "200px" }}>
                <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>Nom *</Text>
                <TextField.Root
                  placeholder="Ex: Dépannage"
                  value={formData[FORM_DATA_KEYS.CATEGORY_NAME]}
                  onChange={(e) => {
                    setFormData({ ...formData, [FORM_DATA_KEYS.CATEGORY_NAME]: e.target.value });
                    setFormError(null);
                  }}
                  disabled={formLoading}
                  size="2"
                />
              </Box>

              <Box style={{ flex: 1, minWidth: "180px" }}>
                <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>Couleur *</Text>
                <Select.Root
                  value={CATEGORY_ALLOWED_COLORS.find(c => c.hex === formData[FORM_DATA_KEYS.CATEGORY_COLOR])?.key || 'primary'}
                  onValueChange={(key) => {
                    const selected = CATEGORY_ALLOWED_COLORS.find(c => c.key === key);
                    setFormData({ ...formData, [FORM_DATA_KEYS.CATEGORY_COLOR]: selected?.hex || COLOR_PALETTE.primary });
                    setFormError(null);
                  }}
                  disabled={formLoading}
                >
                  <Select.Trigger />
                  <Select.Content>
                    {CATEGORY_ALLOWED_COLORS.map(({ key, hex }) => (
                      <Select.Item key={key} value={key}>
                        <Flex align="center" gap="2">
                          <Box style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: hex, border: '1px solid var(--gray-7)' }} />
                          <Text>{key}</Text>
                        </Flex>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>

              <Button onClick={handleAddCategory} disabled={formLoading} size="2">
                <Plus size={16} />
                Enregistrer
              </Button>

              <Button 
                onClick={() => { 
                  setFormData(INITIAL_CATEGORY_STATE); 
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

        <Box>
          <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>Rechercher</Text>
          <TextField.Root 
            placeholder="Recherche (code, nom)..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            size="2" 
          />
        </Box>

        {error && (
          <StatusCallout type="error" title="Erreur">
            <Text size="2">{error}</Text>
          </StatusCallout>
        )}

        {filteredCategories.length === 0 ? (
          <Box p="3" style={{ background: "var(--gray-2)", borderRadius: "var(--radius-2)", textAlign: "center" }}>
            <Text color="gray">
              {search 
                ? "Aucune catégorie ne correspond à votre recherche" 
                : "Aucune catégorie créée. Commencez par ajouter une première catégorie."}
            </Text>
          </Box>
        ) : (
          <Box>
            {filteredCategories.map(category => (
              <CategoryRow
                key={category.code}
                category={category}
                subcategories={subcategoriesByCategory[category.code] || []}
                onDelete={handleDeleteCategory}
                onAddSubcategory={handleAddSubcategory}
                onDeleteSubcategory={handleDeleteSubcategory}
                onUpdateSubcategory={handleUpdateSubcategory}
                onUpdateCategory={handleUpdateCategory}
                loading={loading}
              />
            ))}
          </Box>
        )}
      </Flex>
    </Box>
  );
}

ActionCategoriesTable.propTypes = {
  onCategoriesUpdated: PropTypes.func,
};
