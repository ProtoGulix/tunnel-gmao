/**
 * @fileoverview Tableau de gestion des familles de pièces
 *
 * Permet d'afficher, rechercher et créer des familles et sous-familles de pièces
 * avec validation des doublons.
 *
 * @module components/stock/StockFamiliesTable
 * @requires react
 * @requires @/contexts/ErrorContext
 * @requires @radix-ui/themes
 * @requires lucide-react
 * @requires @/lib/api/facade
 */

import { useEffect, useState, useCallback } from "react";
import PropTypes from 'prop-types';
import { useError } from '@/contexts/ErrorContext';
import { Box, Flex, Text, Card, TextField, Button } from "@radix-ui/themes";
import { Plus } from "lucide-react";
import { stock } from "@/lib/api/facade";
import StatusCallout from "@/components/common/StatusCallout";
import FamilyRow from "./FamilyRow";

// ===== CONSTANTES =====
const MIN_SEARCH_LENGTH = 1;

const FORM_DATA_KEYS = {
  FAMILY_CODE: 'familyCode',
  FAMILY_LABEL: 'familyLabel',
};

const INITIAL_FAMILY_STATE = {
  [FORM_DATA_KEYS.FAMILY_CODE]: "",
  [FORM_DATA_KEYS.FAMILY_LABEL]: "",
};

// ===== HELPERS =====
/**
 * Valide les données d'une famille
 *
 * @param {Object} formData - Données du formulaire
 * @param {Array} families - Liste des familles existantes
 * @returns {Object} { valid: boolean, error?: string }
 */
const validateFamilyData = (formData, families = []) => {
  const code = formData[FORM_DATA_KEYS.FAMILY_CODE]?.trim();
  const label = formData[FORM_DATA_KEYS.FAMILY_LABEL]?.trim();

  if (!code || !label) {
    return { valid: false, error: "Veuillez renseigner le code et le libellé de la famille" };
  }

  const duplicateCode = families.some(fam => fam.code?.toLowerCase() === code.toLowerCase());
  if (duplicateCode) {
    return { valid: false, error: `Le code "${code}" existe déjà` };
  }

  const duplicateLabel = families.some(fam => fam.label?.toLowerCase() === label.toLowerCase());
  if (duplicateLabel) {
    return { valid: false, error: `Le libellé "${label}" existe déjà dans une autre famille` };
  }

  return { valid: true };
};

/**
 * Filtre les familles selon la recherche
 *
 * @param {Array} families - Liste des familles
 * @param {string} searchQuery - Texte de recherche
 * @returns {Array} Familles filtrées
 */
const filterFamilies = (families, searchQuery) => {
  if (!searchQuery || searchQuery.length < MIN_SEARCH_LENGTH) return families;

  const q = searchQuery.toLowerCase();
  return families.filter(fam =>
    (fam.code || "").toLowerCase().includes(q) ||
    (fam.label || "").toLowerCase().includes(q)
  );
};

/**
 * Tableau de gestion des familles et sous-familles
 *
 * @component
 */
export default function StockFamiliesTable({ onFamiliesUpdated }) {
  const { showError } = useError();
  const [families, setFamilies] = useState([]);
  const [subfamiliesByFamily, setSubfamiliesByFamily] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(INITIAL_FAMILY_STATE);
  const [formError, setFormError] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const loadFamilies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await stock.fetchStockFamilies();
      setFamilies(data || []);

      const subfamiliesMap = {};
      for (const family of (data || [])) {
        const subs = await stock.fetchStockSubFamilies(family.code);
        subfamiliesMap[family.code] = subs || [];
      }
      setSubfamiliesByFamily(subfamiliesMap);
    } catch (e) {
      console.error("Erreur chargement familles:", e);
      setError(e?.message || "Erreur de chargement");
      showError(e instanceof Error ? e : new Error("Erreur de chargement"));
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const handleAddFamily = async () => {
    const validation = validateFamilyData(formData, families);
    if (!validation.valid) {
      setFormError(validation.error);
      return;
    }

    try {
      setFormLoading(true);
      setFormError(null);
      const newFamily = await stock.createStockFamily({
        code: formData[FORM_DATA_KEYS.FAMILY_CODE].trim(),
        label: formData[FORM_DATA_KEYS.FAMILY_LABEL].trim(),
      });

      if (newFamily) {
        setFamilies([...families, newFamily]);
        setSubfamiliesByFamily({ ...subfamiliesByFamily, [newFamily.code]: [] });
        setFormData(INITIAL_FAMILY_STATE);
        if (onFamiliesUpdated) onFamiliesUpdated();
      }
    } catch (e) {
      console.error("Erreur création famille:", e);
      setFormError(e?.message || "Erreur lors de la création");
      showError(e instanceof Error ? e : new Error("Erreur lors de la création"));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeleteFamily = async (code) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la famille "${code}" ?`)) return;

    try {
      setLoading(true);
      await stock.deleteStockFamily(code);
      setFamilies(families.filter(f => f.code !== code));
      const newSubs = { ...subfamiliesByFamily };
      delete newSubs[code];
      setSubfamiliesByFamily(newSubs);
      if (onFamiliesUpdated) onFamiliesUpdated();
    } catch (e) {
      console.error("Erreur suppression famille:", e);
      setError(e?.message || "Erreur lors de la suppression");
      showError(e instanceof Error ? e : new Error("Erreur lors de la suppression"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubfamily = async (familyCode, subfamilyData) => {
    try {
      const newSub = await stock.createStockSubFamily(subfamilyData);
      if (newSub) {
        setSubfamiliesByFamily({
          ...subfamiliesByFamily,
          [familyCode]: [...(subfamiliesByFamily[familyCode] || []), newSub]
        });
        if (onFamiliesUpdated) onFamiliesUpdated();
      }
    } catch (e) {
      console.error("Erreur création sous-famille:", e);
      throw e;
    }
  };

  const handleDeleteSubfamily = async (subfamilyId) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette sous-famille ?")) return;

    try {
      setLoading(true);
      await stock.deleteStockSubFamily(subfamilyId);

      const newSubs = { ...subfamiliesByFamily };
      for (const familyCode in newSubs) {
        newSubs[familyCode] = newSubs[familyCode].filter(sub => sub.id !== subfamilyId);
      }
      setSubfamiliesByFamily(newSubs);
      if (onFamiliesUpdated) onFamiliesUpdated();
    } catch (e) {
      console.error("Erreur suppression sous-famille:", e);
      setError(e?.message || "Erreur lors de la suppression");
      showError(e instanceof Error ? e : new Error("Erreur lors de la suppression"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  const filteredFamilies = filterFamilies(families, search);

  if (loading && families.length === 0) {
    return <Text>Chargement des familles...</Text>;
  }

  return (
    <Box>
      <Flex direction="column" gap="3">
        <Card style={{ background: "var(--blue-2)", border: "1px solid var(--blue-6)" }}>
          <Flex direction="column" gap="3">
            <Flex align="center" gap="2">
              <Plus size={20} />
              <Text size="3" weight="bold">Ajouter une famille</Text>
            </Flex>

            {formError && <StatusCallout type="error" title={formError} />}

            <Flex gap="2" wrap="wrap" align="end">
              <Box style={{ flex: 1, minWidth: "150px" }}>
                <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>Code *</Text>
                <TextField.Root
                  placeholder="Ex: ELECTRIQUE"
                  value={formData[FORM_DATA_KEYS.FAMILY_CODE]}
                  onChange={(e) => {
                    setFormData({ ...formData, [FORM_DATA_KEYS.FAMILY_CODE]: e.target.value });
                    setFormError(null);
                  }}
                  disabled={formLoading}
                  size="2"
                />
              </Box>

              <Box style={{ flex: 1.5, minWidth: "250px" }}>
                <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>Libellé *</Text>
                <TextField.Root
                  placeholder="Ex: Articles électriques"
                  value={formData[FORM_DATA_KEYS.FAMILY_LABEL]}
                  onChange={(e) => {
                    setFormData({ ...formData, [FORM_DATA_KEYS.FAMILY_LABEL]: e.target.value });
                    setFormError(null);
                  }}
                  disabled={formLoading}
                  size="2"
                />
              </Box>

              <Button onClick={handleAddFamily} disabled={formLoading} size="2">
                <Plus size={16} />
                Enregistrer
              </Button>

              <Button onClick={() => { setFormData(INITIAL_FAMILY_STATE); setFormError(null); }} variant="soft" color="gray" size="2">
                Annuler
              </Button>
            </Flex>
          </Flex>
        </Card>

        <Box>
          <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>Rechercher</Text>
          <TextField.Root placeholder="Recherche (code, libellé)..." value={search} onChange={(e) => setSearch(e.target.value)} size="2" />
        </Box>

        {error && <StatusCallout type="error" title="Erreur"><Text size="2">{error}</Text></StatusCallout>}

        {filteredFamilies.length === 0 ? (
          <Box p="3" style={{ background: "var(--gray-2)", borderRadius: "var(--radius-2)", textAlign: "center" }}>
            <Text color="gray">{search ? "Aucune famille ne correspond à votre recherche" : "Aucune famille créée. Commencez par ajouter une première famille."}</Text>
          </Box>
        ) : (
          <Box>
            {filteredFamilies.map(family => (
              <FamilyRow
                key={family.code}
                family={family}
                subfamilies={subfamiliesByFamily[family.code] || []}
                onDelete={handleDeleteFamily}
                onAddSubfamily={handleAddSubfamily}
                onDeleteSubfamily={handleDeleteSubfamily}
                loading={loading}
              />
            ))}
          </Box>
        )}
      </Flex>
    </Box>
  );
}

StockFamiliesTable.propTypes = {
  onFamiliesUpdated: PropTypes.func,
};
