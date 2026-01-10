/**
 * @fileoverview Tableau de gestion des références fabricants
 *
 * Permet d'afficher, rechercher et créer des références de fabricants
 * avec leurs détails (nom, référence, désignation).
 *
 * @module components/purchase/manufacturers/ManufacturersTable
 * @requires react
 * @requires @/contexts/ErrorContext
 * @requires @radix-ui/themes
 * @requires lucide-react
 * @requires @/lib/api/facade
 */

import { useEffect, useState } from "react";
import { useError } from '@/contexts/ErrorContext';
import { Box, Flex, Text } from "@radix-ui/themes";
import { Factory } from "lucide-react";
import { manufacturerItems } from "@/lib/api/facade";
import DataTable from "@/components/common/DataTable";
import ManufacturerForm, { FORM_DATA_KEYS, INITIAL_FORM_STATE } from "./ManufacturerForm";

// ===== CONSTANTES =====
/** Nombre minimum de caractères pour la recherche */
const MIN_SEARCH_LENGTH = 1;

// ===== HELPERS =====
/**
 * Filtre les fabricants selon la recherche
 *
 * @param {Array<Object>} items - Liste des fabricants
 * @param {string} searchQuery - Texte de recherche
 * @returns {Array<Object>} Fabricants filtrés
 */
const filterManufacturers = (items, searchQuery) => {
  if (!searchQuery || searchQuery.length < MIN_SEARCH_LENGTH) return items;

  const q = searchQuery.toLowerCase();
  return items.filter((m) =>
    (m.manufacturerName || "").toLowerCase().includes(q) ||
    (m.manufacturerRef || "").toLowerCase().includes(q) ||
    (m.designation || "").toLowerCase().includes(q)
  );
};

/**
 * Valide les données du formulaire
 *
 * @param {Object} formData - Données du formulaire
 * @returns {Object} { valid: boolean, error?: string }
 */
const validateFormData = (formData) => {
  const name = formData[FORM_DATA_KEYS.MANUFACTURER_NAME]?.trim();
  const ref = formData[FORM_DATA_KEYS.MANUFACTURER_REF]?.trim();

  if (!name && !ref) {
    return {
      valid: false,
      error: "Veuillez renseigner au moins le nom du fabricant ou la référence"
    };
  }

  return { valid: true };
};

/**
 * Construit l'objet à envoyer à l'API
 *
 * @param {Object} formData - Données du formulaire
 * @returns {Object} Objet pour l'API
 */
const buildSubmitData = (formData) => ({
  name: formData[FORM_DATA_KEYS.MANUFACTURER_NAME]?.trim(),
  ref: formData[FORM_DATA_KEYS.MANUFACTURER_REF]?.trim(),
  designation: formData[FORM_DATA_KEYS.DESIGNATION]?.trim()
});

// ===== COMPOSANT =====
/**
 * Tableau de gestion des références fabricants
 *
 * Affiche une liste des fabricants avec capacités de recherche et création.
 * Permet d'ajouter de nouveaux fabricants via un formulaire inline.
 *
 * @component
 * @returns {JSX.Element} Tableau des fabricants
 *
 * @example
 * <ManufacturersTable />
 */
export default function ManufacturersTable() {
  // ----- State -----
  const { showError } = useError();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [addLoading, setAddLoading] = useState(false);

  // ----- API Calls -----
  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await manufacturerItems.fetchManufacturerItems();
      setItems(data);
    } catch (e) {
      console.error("Erreur chargement fabricants:", e);
      setError(e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  // ----- Effects -----
  useEffect(() => { load(); }, []);

  // ----- Handlers -----
  const handleAdd = async () => {
    const validation = validateFormData(formData);
    if (!validation.valid) {
      showError(new Error(validation.error));
      return;
    }

    try {
      setAddLoading(true);
      setError(null);
      const submitData = buildSubmitData(formData);
      const newItem = await manufacturerItems.createManufacturerItem(submitData);
      
      if (newItem) {
        setItems([...items, newItem]);
        setFormData(INITIAL_FORM_STATE);
      }
    } catch (e) {
      console.error("Erreur création fabricant:", e);
      setError(e?.message || "Erreur lors de la création");
      showError(e instanceof Error ? e : new Error("Erreur lors de la création"));
    } finally {
      setAddLoading(false);
    }
  };

  // ----- Computed Values -----
  const filtered = filterManufacturers(items, search);

  const columns = [
    { key: "manufacturer", header: "Fabricant", render: (row) => <Text weight="bold">{row.manufacturerName}</Text> },
    { key: "ref", header: "Référence", render: (row) => <Text size="2">{row.manufacturerRef}</Text> },
    { key: "designation", header: "Désignation", render: (row) => <Text size="2" color="gray">{row.designation || "-"}</Text> },
  ];

  const headerProps = {
    icon: Factory,
    title: "Références fabricant",
    count: filtered.length,
    searchValue: search,
    onSearchChange: setSearch,
    onRefresh: load,
    loading,
    searchPlaceholder: "Recherche (nom, ref, désignation)",
    showRefreshButton: false,
  };

  // ----- Render -----
  return (
    <Box>
      <Flex direction="column" gap="3">
        {error && (
          <Text color="red" size="2">{error}</Text>
        )}

        <ManufacturerForm
          formData={formData}
          setFormData={setFormData}
          onAdd={handleAdd}
          loading={addLoading}
        />

        <DataTable
          headerProps={headerProps}
          columns={columns}
          data={filtered}
          loading={loading}
          emptyState={{
            icon: Factory,
            title: "Aucune référence fabricant",
            description: search ? "Aucun résultat pour cette recherche" : "Ajoutez une première référence pour commencer",
          }}
        />
      </Flex>
    </Box>
  );
}

// ===== PROP TYPES =====
ManufacturersTable.propTypes = {
  // Ce composant n'accepte actuellement pas de props
  // Les données sont chargées directement depuis l'API
};
