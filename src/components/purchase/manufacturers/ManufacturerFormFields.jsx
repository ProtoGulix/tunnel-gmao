import PropTypes from 'prop-types';
import { Box, Text, TextField, Card, Flex, Button, Tabs } from "@radix-ui/themes";
import { useState } from 'react';
import { Plus } from 'lucide-react';

/**
 * @fileoverview Composant pour lier/créer références fabricant
 * @module components/purchase/manufacturers/ManufacturerFormFields
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

/**
 * Formulaire en deux étapes pour gérer les références fabricant:
 * 1. Rechercher dans les existantes
 * 2. Créer une nouvelle si nécessaire
 *
 * @component
 * @param {string} props.selectedRefId - ID de la référence sélectionnée
 * @param {Function} props.onSelectRef - Callback sélection référence existante
 * @param {Function} props.onCreateRef - Callback création nouvelle référence
 * @param {Array} props.availableRefs - Liste des références disponibles
 * @param {boolean} [props.loading=false] - État de chargement
 * @returns {JSX.Element}
 * @example
 * <ManufacturerFormFields
 *   selectedRefId={selectedRefId}
 *   onSelectRef={handleSelectRef}
 *   onCreateRef={handleCreateRef}
 *   availableRefs={allManufacturers}
 *   loading={loading}
 * />
 */
export default function ManufacturerFormFields({
  selectedRefId,
  onSelectRef,
  onCreateRef,
  availableRefs = [],
  loading = false,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("search");
  
  // Création nouvelle référence
  const [newName, setNewName] = useState("");
  const [newRef, setNewRef] = useState("");
  const [newDesignation, setNewDesignation] = useState("");

  // Filtrer les références selon la recherche
  const filteredRefs = searchTerm.trim() ? availableRefs.filter(ref => {
    const q = searchTerm.toLowerCase();
    return (
      (ref.manufacturer_ref || "").toLowerCase().includes(q) ||
      (ref.manufacturer_name || "").toLowerCase().includes(q) ||
      (ref.designation || "").toLowerCase().includes(q)
    );
  }) : [];

  const handleSelectRef = (ref) => {
    onSelectRef?.(ref);
    setSearchTerm("");
  };

  const handleCreateRef = () => {
    if (!newName.trim() && !newRef.trim()) {
      return;
    }
    onCreateRef?.({
      manufacturer_name: newName.trim(),
      manufacturer_ref: newRef.trim(),
      designation: newDesignation.trim(),
    });
    // Reset form
    setNewName("");
    setNewRef("");
    setNewDesignation("");
    setActiveTab("search");
  };

  return (
    <Card style={{
      background: 'var(--blue-1)',
      borderLeft: '4px solid var(--blue-9)',
    }}>
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Trigger value="search">Rechercher</Tabs.Trigger>
          <Tabs.Trigger value="create"><Plus size={14} /> Créer</Tabs.Trigger>
        </Tabs.List>

        {/* TAB: Search */}
        <Box pt="4">
          <Tabs.Content value="search">
            <Flex direction="column" gap="3">
              {/* Champ de recherche unique */}
              <Box>
                <Text size="2" as="label" weight="bold" style={{ display: "block", marginBottom: "4px" }}>
                  Rechercher une référence fabricant
                </Text>
                <TextField.Root
                  placeholder="Ref constructeur, fabricant ou désignation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Box>

              {/* Résultats de recherche */}
              {searchTerm.trim() && (
                <Box>
                  {filteredRefs.length > 0 ? (
                    <Card>
                      <Box style={{ maxHeight: "300px", overflowY: "auto" }}>
                        {filteredRefs.map((ref, idx) => (
                          <Box
                            key={ref.id || idx}
                            p="3"
                            style={{
                              cursor: "pointer",
                              borderBottom: idx < filteredRefs.length - 1 ? "1px solid var(--gray-4)" : "none",
                              transition: "background-color 0.15s",
                              backgroundColor: selectedRefId === ref.id ? "var(--blue-3)" : "transparent",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = selectedRefId === ref.id ? "var(--blue-4)" : "var(--gray-3)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = selectedRefId === ref.id ? "var(--blue-3)" : "transparent";
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              handleSelectRef(ref);
                            }}
                          >
                            <Flex direction="column" gap="1">
                              <Text size="2" weight="bold" color="blue">
                                {ref.manufacturer_ref || "(sans réf)"}
                              </Text>
                              {ref.manufacturer_name && (
                                <Text size="1" color="gray">
                                  {ref.manufacturer_name}
                                </Text>
                              )}
                              {ref.designation && (
                                <Text size="1" color="gray">
                                  {ref.designation}
                                </Text>
                              )}
                            </Flex>
                          </Box>
                        ))}
                      </Box>
                    </Card>
                  ) : (
                    <Card>
                      <Box p="3">
                        <Text size="2" color="gray" style={{ textAlign: "center", display: "block" }}>
                          Aucune référence trouvée
                        </Text>
                        <Text size="1" color="gray" style={{ textAlign: "center", marginTop: "8px", display: "block" }}>
                          Créez une nouvelle référence dans l&apos;onglet "Créer"
                        </Text>
                      </Box>
                    </Card>
                  )}
                </Box>
              )}

              {/* Message aide si champ vide */}
              {!searchTerm.trim() && (
                <Text size="1" color="gray">
                  Tapez pour rechercher parmi {availableRefs.length} référence{availableRefs.length > 1 ? "s" : ""}
                </Text>
              )}

              {/* Ref sélectionnée */}
              {selectedRefId && (
                <Box>
                  <Box style={{
                    padding: "12px",
                    backgroundColor: "var(--green-2)",
                    borderRadius: "6px",
                    borderLeft: "4px solid var(--green-9)",
                    marginBottom: "12px",
                  }}>
                    <Text size="2" weight="bold" color="green">
                      ✓ Référence sélectionnée
                    </Text>
                  </Box>
                  <Flex gap="2">
                    <Button
                      size="2"
                      color="green"
                      onClick={() => {
                        const selected = availableRefs.find(r => r.id === selectedRefId);
                        if (selected) {
                          onCreateRef?.(selected);
                          setSearchTerm("");
                        }
                      }}
                      disabled={loading}
                    >
                      {loading ? "Liaison en cours..." : "Lier cette référence"}
                    </Button>
                  </Flex>
                </Box>
              )}
            </Flex>
          </Tabs.Content>

          {/* TAB: Create */}
          <Tabs.Content value="create">
            <Flex direction="column" gap="3">
              <Box>
                <Text size="2" as="label" weight="bold" style={{ display: "block", marginBottom: "4px" }}>
                  Fabricant *
                </Text>
                <TextField.Root
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ex: Schneider Electric"
                  disabled={loading}
                />
              </Box>

              <Box>
                <Text size="2" as="label" weight="bold" style={{ display: "block", marginBottom: "4px" }}>
                  Référence constructeur *
                </Text>
                <TextField.Root
                  value={newRef}
                  onChange={(e) => setNewRef(e.target.value)}
                  placeholder="Ex: RXM2AB2BD"
                  disabled={loading}
                />
              </Box>

              <Box>
                <Text size="2" as="label" weight="bold" style={{ display: "block", marginBottom: "4px" }}>
                  Désignation (optionnel)
                </Text>
                <TextField.Root
                  value={newDesignation}
                  onChange={(e) => setNewDesignation(e.target.value)}
                  placeholder="Description détaillée"
                  disabled={loading}
                />
              </Box>

              <Flex gap="2">
                <Button
                  size="2"
                  color="green"
                  onClick={handleCreateRef}
                  disabled={loading || (!newName.trim() && !newRef.trim())}
                >
                  {loading ? "Création en cours..." : "Créer et lier"}
                </Button>
                <Button
                  size="2"
                  variant="soft"
                  color="gray"
                  onClick={() => setActiveTab("search")}
                  disabled={loading}
                >
                  Annuler
                </Button>
              </Flex>
            </Flex>
          </Tabs.Content>
        </Box>
      </Tabs.Root>
    </Card>
  );
}

ManufacturerFormFields.propTypes = {
  selectedRefId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onSelectRef: PropTypes.func.isRequired,
  onCreateRef: PropTypes.func.isRequired,
  availableRefs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    manufacturer_ref: PropTypes.string,
    manufacturer_name: PropTypes.string,
    designation: PropTypes.string,
  })),
  loading: PropTypes.bool,
};
