// ═══════════════════════════════════════════════════════════════════════════════
// MachineSearchSelect.jsx
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Composant de recherche et sélection de machine avec autocomplete.
 * 
 * @description
 * Permet de rechercher une machine par code, nom ou emplacement avec une liste
 * déroulante interactive. Supporte la sélection, le clear et affiche les infos
 * de la machine (code, nom, emplacement, statut).
 * 
 * @usage
 * Utilisé dans :
 * - InterventionCreate.jsx : Sélection de la machine pour une intervention
 * 
 * @features_implemented
 * ✅ Recherche multi-critères (code, nom, emplacement)
 * ✅ Dropdown interactif avec filtrage réactif
 * ✅ Click outside pour fermer
 * ✅ Clear button pour effacer la sélection
 * ✅ Loading state pendant le chargement
 * ✅ Highlight de la machine sélectionnée
 * 
 * @todo
 * [ ] Migrer vers Radix UI (TextField, ScrollArea, Badge, Card)
 * [ ] Remplacer emoji 📍 par Lucide MapPin
 * [ ] Créer MachineSearchSelect.module.css pour styles inline
 * [ ] Ajouter accessibilité complète (role="combobox", aria-expanded, keyboard ↑↓ Enter Esc)
 * [ ] Intégrer ErrorDisplay pour erreurs de chargement
 * [ ] Utiliser COLOR_PALETTE.md (var(--gray-1), var(--blue-9))
 * [ ] Optimiser avec useCallback pour loadMachines
 * [ ] Ajouter debounce sur la recherche (performance)
 * [ ] Support multi-sélection (optionnel)
 * [ ] Ajouter tests unitaires
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 */

import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { machines } from "@/lib/api/facade";

/**
 * Composant de recherche et sélection de machine.
 * 
 * @component
 * @param {Object} props - Props du composant
 * @param {string|null} props.value - ID de la machine sélectionnée
 * @param {Function} props.onChange - Callback appelé lors de la sélection (machineId)
 * @param {boolean} [props.required=false] - Si le champ est requis
 * @returns {JSX.Element}
 * 
 * @example
 * // Utilisation basique
 * <MachineSearchSelect
 *   value={formData.machine_id}
 *   onChange={(machineId) => handleChange("machine_id", machineId)}
 *   required
 * />
 * 
 * @example
 * // Sans required
 * <MachineSearchSelect
 *   value={selectedMachine}
 *   onChange={setSelectedMachine}
 * />
 */
export default function MachineSearchSelect({ value, onChange, required = false }) {
  const [search, setSearch] = useState("");
  const [machinesList, setMachinesList] = useState([]);
  const [filteredMachines, setFilteredMachines] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const dropdownRef = useRef(null);

  const loadMachines = useCallback(async () => {
    try {
      setLoading(true);
      const data = await machines.fetchMachines();
      setMachinesList(data);
      setFilteredMachines(data);
      
      // Si une valeur est déjà sélectionnée, charger les infos de la machine
      if (value) {
        const selected = data.find((m) => m.id === value);
        if (selected) {
          setSelectedMachine(selected);
          setSearch(`${selected.code || ""} - ${selected.name || ""}`);
        }
      }
    } catch (err) {
      console.error("Erreur chargement machines:", err);
    } finally {
      setLoading(false);
    }
  }, [value]);

  useEffect(() => {
    loadMachines();
  }, [loadMachines]);

  useEffect(() => {
    // Fermer le dropdown si on clique ailleurs
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // Filtrer les machines selon la recherche
    if (search.trim()) {
      const filtered = machinesList.filter((m) => {
        const searchLower = search.toLowerCase();
        return (
          m.code?.toLowerCase().includes(searchLower) ||
          m.name?.toLowerCase().includes(searchLower) ||
          m.location?.toLowerCase().includes(searchLower)
        );
      });
      setFilteredMachines(filtered);
    } else {
      setFilteredMachines(machinesList);
    }
  }, [search, machinesList]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setShowDropdown(true);
    if (!e.target.value) {
      setSelectedMachine(null);
      onChange(null);
    }
  };

  const handleSelectMachine = (machine) => {
    setSelectedMachine(machine);
    setSearch(`${machine.code || ""} - ${machine.name || ""}`);
    setShowDropdown(false);
    onChange(machine.id);
  };

  const handleClear = () => {
    setSearch("");
    setSelectedMachine(null);
    setShowDropdown(false);
    onChange(null);
  };

  return (
    <div style={{ position: "relative" }} ref={dropdownRef}>
      <div style={{ position: "relative" }}>
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          onFocus={() => setShowDropdown(true)}
          className="form-input"
          placeholder="Rechercher une machine (code, nom, emplacement)..."
          required={required && !selectedMachine}
          style={{ paddingRight: selectedMachine ? "2.5rem" : "0.5rem" }}
        />
        
        {selectedMachine && (
          <button
            type="button"
            onClick={handleClear}
            style={{
              position: "absolute",
              right: "0.5rem",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#999",
              fontSize: "1.2rem",
              padding: "0.25rem",
              lineHeight: 1,
            }}
            title="Effacer"
          >
            ×
          </button>
        )}
      </div>

      {showDropdown && filteredMachines.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #d0d0d0",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
            maxHeight: "250px",
            overflowY: "auto",
            zIndex: 1000,
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          {filteredMachines.map((machine) => (
            <div
              key={machine.id}
              onClick={() => handleSelectMachine(machine)}
              style={{
                padding: "0.75rem",
                cursor: "pointer",
                borderBottom: "1px solid #f0f0f0",
                background: selectedMachine?.id === machine.id ? "#f0f0f0" : "white",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#f8f8f8";
              }}
              onMouseLeave={(e) => {
                e.target.style.background =
                  selectedMachine?.id === machine.id ? "#f0f0f0" : "white";
              }}
            >
              <div style={{ fontWeight: "500", fontSize: "0.9rem" }}>
                {machine.code && (
                  <span className="badge badge-secondary" style={{ marginRight: "0.5rem" }}>
                    {machine.code}
                  </span>
                )}
                {machine.name}
              </div>
              {machine.location && (
                <div style={{ fontSize: "0.8rem", color: "#757575", marginTop: "0.25rem" }}>
                  📍 {machine.location}
                </div>
              )}
              {machine.status && (
                <span
                  className="badge badge-info"
                  style={{ fontSize: "0.75rem", marginTop: "0.25rem" }}
                >
                  {machine.status}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {showDropdown && filteredMachines.length === 0 && search && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            background: "white",
            border: "1px solid #d0d0d0",
            borderTop: "none",
            borderRadius: "0 0 4px 4px",
            padding: "1rem",
            zIndex: 1000,
            color: "#757575",
            fontSize: "0.9rem",
            textAlign: "center",
          }}
        >
          Aucune machine trouvée
        </div>
      )}

      {loading && (
        <div style={{ fontSize: "0.85rem", color: "#757575", marginTop: "0.25rem" }}>
          Chargement des machines...
        </div>
      )}
    </div>
  );
}

// PropTypes validation
MachineSearchSelect.propTypes = {
  /** ID de la machine sélectionnée */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Callback appelé lors de la sélection (machineId) */
  onChange: PropTypes.func.isRequired,
  /** Si le champ est requis */
  required: PropTypes.bool,
};