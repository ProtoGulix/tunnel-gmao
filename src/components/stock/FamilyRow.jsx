/**
 * @fileoverview Formulaire et composants d'ajout/édition de famille
 *
 * Sous-composants pour la gestion des familles et sous-familles
 *
 * @module components/stock/StockFamiliesTable/FamilyRow
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import { useState } from "react";
import PropTypes from 'prop-types';
import { Box, Flex, Text, Card, TextField, Button, Table, Badge } from "@radix-ui/themes";
import { Plus, Trash2, ChevronDown } from "lucide-react";
import StatusCallout from "@/components/common/StatusCallout";
import SubfamilyRow from "./SubfamilyRow";

// ===== CONSTANTES =====
const FORM_DATA_KEYS = {
  SUBFAMILY_CODE: 'subfamilyCode',
  SUBFAMILY_LABEL: 'subfamilyLabel',
};

const INITIAL_SUBFAMILY_STATE = {
  [FORM_DATA_KEYS.SUBFAMILY_CODE]: "",
  [FORM_DATA_KEYS.SUBFAMILY_LABEL]: "",
};

/**
 * Valide les données d'une sous-famille
 *
 * @param {Object} formData - Données du formulaire
 * @param {Array} subfamilies - Liste des sous-familles de la famille
 * @returns {Object} { valid: boolean, error?: string }
 */
const validateSubfamilyData = (formData, subfamilies = []) => {
  const code = formData[FORM_DATA_KEYS.SUBFAMILY_CODE]?.trim();
  const label = formData[FORM_DATA_KEYS.SUBFAMILY_LABEL]?.trim();

  if (!code || !label) {
    return {
      valid: false,
      error: "Veuillez renseigner le code et le libellé de la sous-famille"
    };
  }

  const duplicateCode = subfamilies.some(sub => sub.code?.toLowerCase() === code.toLowerCase());
  if (duplicateCode) {
    return {
      valid: false,
      error: `Le code "${code}" existe déjà dans cette famille`
    };
  }

  const duplicateLabel = subfamilies.some(sub => sub.label?.toLowerCase() === label.toLowerCase());
  if (duplicateLabel) {
    return {
      valid: false,
      error: `Le libellé "${label}" existe déjà dans cette famille`
    };
  }

  return { valid: true };
};

// ===== COMPOSANT =====
/**
 * Affiche et gère une famille avec ses sous-familles
 *
 * @component
 */
export default function FamilyRow({ family, subfamilies, onDelete, onAddSubfamily, onDeleteSubfamily, loading }) {
  const [expanded, setExpanded] = useState(false);
  const [subfamilyFormData, setSubfamilyFormData] = useState(INITIAL_SUBFAMILY_STATE);
  const [subfamilyError, setSubfamilyError] = useState(null);
  const [subfamilyLoading, setSubfamilyLoading] = useState(false);

  const handleAddSubfamily = async () => {
    const validation = validateSubfamilyData(subfamilyFormData, subfamilies);
    if (!validation.valid) {
      setSubfamilyError(validation.error);
      return;
    }

    try {
      setSubfamilyLoading(true);
      setSubfamilyError(null);
      await onAddSubfamily(family.code, {
        family_code: family.code,
        code: subfamilyFormData[FORM_DATA_KEYS.SUBFAMILY_CODE].trim(),
        label: subfamilyFormData[FORM_DATA_KEYS.SUBFAMILY_LABEL].trim(),
      });
      setSubfamilyFormData(INITIAL_SUBFAMILY_STATE);
    } catch (err) {
      setSubfamilyError(err?.message || "Erreur lors de l'ajout");
    } finally {
      setSubfamilyLoading(false);
    }
  };

  return (
    <Box mb="3" p="3" style={{ background: "var(--blue-2)", borderRadius: "var(--radius-2)", border: "1px solid var(--blue-6)" }}>
      <Flex direction="column" gap="3">
        {/* En-tête de la famille */}
        <Flex justify="between" align="center" wrap="wrap" gap="2">
          <Flex gap="3" align="center" onClick={() => setExpanded(!expanded)} style={{ cursor: "pointer", flex: 1, minWidth: 240 }}>
            <ChevronDown size={16} style={{ transform: expanded ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }} />
            <Box>
              <Flex align="center" gap="2">
                <Badge color="blue" variant="solid" size="1">{family.code}</Badge>
                <Text size="3" weight="bold">{family.label}</Text>
              </Flex>
              <Text size="1" color="gray">Cliquer pour afficher les sous-familles</Text>
            </Box>
          </Flex>
          <Button
            size="1"
            variant="soft"
            color="red"
            disabled={loading}
            onClick={() => onDelete(family.code)}
          >
            <Trash2 size={14} />
            Supprimer
          </Button>
        </Flex>

        {/* Contenu expandable */}
        {expanded && (
          <Flex direction="column" gap="3">
            {/* Liste des sous-familles */}
            <Box>
              <Text size="2" weight="bold" mb="2" style={{ display: "block" }}>Sous-familles</Text>
              <Table.Root variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell style={{ width: 160 }}>Code</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Libellé</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell style={{ width: 80 }} align="right">Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {subfamilies.length === 0 && (
                    <Table.Row>
                      <Table.Cell colSpan={3}>
                        <Text size="2" color="gray">Aucune sous-famille</Text>
                      </Table.Cell>
                    </Table.Row>
                  )}
                  {subfamilies.map(sub => (
                    <SubfamilyRow
                      key={sub.id}
                      subfamily={sub}
                      onDelete={onDeleteSubfamily}
                    />
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>

            {/* Formulaire d'ajout de sous-famille */}
            <Card style={{ background: "var(--blue-1)", border: "1px solid var(--blue-5)" }}>
              <Flex direction="column" gap="2">
                <Flex align="center" gap="2">
                  <Plus size={16} />
                  <Text size="2" weight="bold">Ajouter une sous-famille</Text>
                </Flex>

                {subfamilyError && (
                  <StatusCallout type="error" title={subfamilyError} />
                )}

                <Flex gap="2">
                  <Box style={{ flex: 1, minWidth: "150px" }}>
                    <Text size="1" weight="bold" mb="1" style={{ display: "block" }}>Code *</Text>
                    <TextField.Root
                      placeholder="Ex: MOTEUR"
                      value={subfamilyFormData[FORM_DATA_KEYS.SUBFAMILY_CODE]}
                      onChange={(e) => {
                        setSubfamilyFormData({
                          ...subfamilyFormData,
                          [FORM_DATA_KEYS.SUBFAMILY_CODE]: e.target.value
                        });
                        setSubfamilyError(null);
                      }}
                      disabled={subfamilyLoading}
                      size="1"
                    />
                  </Box>

                  <Box style={{ flex: 1.5, minWidth: "200px" }}>
                    <Text size="1" weight="bold" mb="1" style={{ display: "block" }}>Libellé *</Text>
                    <TextField.Root
                      placeholder="Ex: Moteurs électriques"
                      value={subfamilyFormData[FORM_DATA_KEYS.SUBFAMILY_LABEL]}
                      onChange={(e) => {
                        setSubfamilyFormData({
                          ...subfamilyFormData,
                          [FORM_DATA_KEYS.SUBFAMILY_LABEL]: e.target.value
                        });
                        setSubfamilyError(null);
                      }}
                      disabled={subfamilyLoading}
                      size="1"
                    />
                  </Box>

                  <Button
                    size="1"
                    onClick={handleAddSubfamily}
                    disabled={subfamilyLoading}
                  >
                    <Plus size={14} />
                    Ajouter
                  </Button>
                </Flex>
              </Flex>
            </Card>
          </Flex>
        )}
      </Flex>
    </Box>
  );
}

FamilyRow.propTypes = {
  family: PropTypes.shape({
    code: PropTypes.string.isRequired,
    label: PropTypes.string,
  }).isRequired,
  subfamilies: PropTypes.array,
  onDelete: PropTypes.func.isRequired,
  onAddSubfamily: PropTypes.func.isRequired,
  onDeleteSubfamily: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

FamilyRow.defaultProps = {
  subfamilies: [],
  loading: false,
};
