import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useError } from '@/contexts/ErrorContext';
import {
  Dialog,
  Button,
  Flex,
  Text,
  TextField,
  Select,
  Box,
  Card,
} from "@radix-ui/themes";
import { Edit2, Save } from "lucide-react";
import { useStockSubFamilies } from "@/hooks/useStockFamilies";

/**
 * Dialogue pour modifier un article de stock
 */
export default function EditStockItemDialog({ item, onSave, loading, stockFamilies = [], allManufacturers = [] }) {
  const { showError } = useError();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    family_code: "",
    sub_family_code: "",
    spec: "",
    dimension: "",
    ref: "",
    quantity: 0,
    unit: "pcs",
    location: "",
    manufacturer_ref: "",
    manufacturer_name: "",
    manufacturer_designation: "",
  });

  const [manuRefSuggestions, setManuRefSuggestions] = useState([]);
  const [showManuRefSuggestions, setShowManuRefSuggestions] = useState(false);

  const { subFamilies } = useStockSubFamilies(formData.family_code);

  // Filtrer les suggestions par ref
  useEffect(() => {
    const q = formData.manufacturer_ref.trim().toLowerCase();
    if (!q) {
      setManuRefSuggestions([]);
      return;
    }
    const byRef = allManufacturers.filter(m => (m.manufacturer_ref || "").toLowerCase().includes(q));
    const byName = allManufacturers.filter(
      m => (m.manufacturer_name || "").toLowerCase().includes(q) && !byRef.some(x => x.id === m.id)
    );
    setManuRefSuggestions([...byRef, ...byName].slice(0, 8));
  }, [formData.manufacturer_ref, allManufacturers]);

  useEffect(() => {
    if (item && open) {
      setFormData({
        name: item.name || "",
        family_code: item.family_code || "",
        sub_family_code: item.sub_family_code || "",
        spec: item.spec || "",
        dimension: item.dimension || "",
        ref: item.ref || "",
        quantity: item.quantity || 0,
        unit: item.unit || "pcs",
        location: item.location || "",
        manufacturer_ref: item.manufacturer_item_id?.manufacturer_ref || "",
        manufacturer_name: item.manufacturer_item_id?.manufacturer_name || "",
        manufacturer_designation: item.manufacturer_item_id?.designation || "",
      });
    }
  }, [item, open]);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.family_code || !formData.dimension.trim()) {
      showError(new Error("Veuillez remplir tous les champs obligatoires"));
      return;
    }

    await onSave(item.id, formData);
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button size="1" variant="soft" color="blue">
          <Edit2 size={14} />
          Modifier
        </Button>
      </Dialog.Trigger>

      <Dialog.Content maxWidth="600px">
        <Dialog.Title>Modifier l&apos;article</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Modifiez les informations de l&apos;article de stock
        </Dialog.Description>

        <Flex direction="column" gap="3">
          {/* Référence */}
          <Box>
            <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
              Référence *
            </Text>
            <TextField.Root
              placeholder="ex: VIS-M8-20"
              value={formData.ref}
              onChange={(e) => setFormData({ ...formData, ref: e.target.value })}
              size="2"
            />
          </Box>

          {/* Nom */}
          <Box>
            <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
              Nom *
            </Text>
            <TextField.Root
              placeholder="ex: Vis M8x20 Inox"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              size="2"
            />
          </Box>

          {/* Famille */}
          <Box>
            <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
              Famille *
            </Text>
            <Select.Root
              value={formData.family_code}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  family_code: value,
                  sub_family_code: "",
                })
              }
              size="2"
            >
              <Select.Trigger placeholder="Sélectionner une famille" />
              <Select.Content>
                {stockFamilies.map((fam) => (
                  <Select.Item key={fam.code} value={fam.code}>
                    {fam.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Root>
          </Box>

          {/* Sous-famille */}
          {formData.family_code && (
            <Box>
              <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
                Sous-famille
              </Text>
              <Select.Root
                value={formData.sub_family_code}
                onValueChange={(value) =>
                  setFormData({ ...formData, sub_family_code: value })
                }
                size="2"
              >
                <Select.Trigger placeholder="Sélectionner une sous-famille" />
                <Select.Content>
                  {subFamilies.map((sub) => (
                    <Select.Item key={sub.code} value={sub.code}>
                      {sub.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>
          )}

          {/* Dimension */}
          <Box>
            <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
              Dimension *
            </Text>
            <TextField.Root
              placeholder="ex: M8x20"
              value={formData.dimension}
              onChange={(e) =>
                setFormData({ ...formData, dimension: e.target.value })
              }
              size="2"
            />
          </Box>

          {/* Spécification */}
          <Box>
            <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
              Spécification (ancienne)
            </Text>
            <TextField.Root
              placeholder="ex: Inox A2"
              value={formData.spec}
              onChange={(e) =>
                setFormData({ ...formData, spec: e.target.value })
              }
              size="2"
            />
            <Text size="1" color="gray" mt="1">
              Utilisez plutôt les spécifications standard (bouton 📄)
            </Text>
          </Box>

          {/* Quantité et unité */}
          <Flex gap="3">
            <Box style={{ flex: 1 }}>
              <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
                Quantité
              </Text>
              <TextField.Root
                type="number"
                placeholder="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantity: parseFloat(e.target.value) || 0,
                  })
                }
                size="2"
              />
            </Box>
            <Box style={{ flex: 1 }}>
              <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
                Unité
              </Text>
              <Select.Root
                value={formData.unit}
                onValueChange={(value) =>
                  setFormData({ ...formData, unit: value })
                }
                size="2"
              >
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="pcs">pcs</Select.Item>
                  <Select.Item value="kg">kg</Select.Item>
                  <Select.Item value="L">L</Select.Item>
                  <Select.Item value="m">m</Select.Item>
                  <Select.Item value="m²">m²</Select.Item>
                  <Select.Item value="m³">m³</Select.Item>
                  <Select.Item value="boîte">boîte</Select.Item>
                  <Select.Item value="lot">lot</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>
          </Flex>

          {/* Localisation */}
          <Box>
            <Text size="2" weight="bold" mb="1" style={{ display: "block" }}>
              Localisation
            </Text>
            <TextField.Root
              placeholder="ex: Magasin A - Étagère 3"
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              size="2"
            />
          </Box>

          {/* Section Fabricant */}
          <Card style={{ background: "var(--gray-2)", padding: "12px", marginTop: "8px" }}>
            <Text size="2" weight="bold" mb="2" style={{ display: "block" }}>
              🏭 Fabricant (référence normative)
            </Text>
            <Flex direction="column" gap="2">
              <Box style={{ position: "relative" }}>
                <Text size="1" weight="bold" mb="1" style={{ display: "block" }}>
                  Référence constructeur
                </Text>
                <TextField.Root
                  placeholder="Ex: RXM2AB2BD"
                  value={formData.manufacturer_ref}
                  onChange={(e) => {
                    setFormData({ ...formData, manufacturer_ref: e.target.value });
                    setShowManuRefSuggestions(true);
                  }}
                  onFocus={() => setShowManuRefSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowManuRefSuggestions(false), 200)}
                  size="2"
                />
                {showManuRefSuggestions && manuRefSuggestions.length > 0 && (
                  <Card style={{
                    position: "absolute",
                    bottom: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 10000,
                    maxHeight: "180px",
                    overflowY: "auto",
                    marginBottom: "4px",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                  }}>
                    {manuRefSuggestions.map((mfr, idx) => (
                      <Box
                        key={mfr.id || idx}
                        p="2"
                        style={{ cursor: "pointer", borderBottom: idx < manuRefSuggestions.length - 1 ? "1px solid var(--gray-4)" : "none" }}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setFormData({
                            ...formData,
                            manufacturer_ref: mfr.manufacturer_ref || "",
                            manufacturer_name: mfr.manufacturer_name || "",
                            manufacturer_designation: mfr.designation || "",
                          });
                          setShowManuRefSuggestions(false);
                        }}
                      >
                        <Text size="2" weight="bold">{mfr.manufacturer_ref || "(sans réf)"}</Text>
                        {mfr.manufacturer_name && (
                          <Text size="1" color="gray"> — {mfr.manufacturer_name}</Text>
                        )}
                      </Box>
                    ))}
                  </Card>
                )}
              </Box>
              <Box>
                <Text size="1" weight="bold" mb="1" style={{ display: "block" }}>
                  Fabricant
                </Text>
                <TextField.Root
                  placeholder="Ex: Schneider Electric"
                  value={formData.manufacturer_name}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer_name: e.target.value })
                  }
                  size="2"
                />
              </Box>
              <Box>
                <Text size="1" weight="bold" mb="1" style={{ display: "block" }}>
                  Désignation (optionnel)
                </Text>
                <TextField.Root
                  placeholder="Désignation fabricant"
                  value={formData.manufacturer_designation}
                  onChange={(e) =>
                    setFormData({ ...formData, manufacturer_designation: e.target.value })
                  }
                  size="2"
                />
              </Box>
            </Flex>
          </Card>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Annuler
            </Button>
          </Dialog.Close>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save size={14} />
            Enregistrer
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

EditStockItemDialog.propTypes = {
  item: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  stockFamilies: PropTypes.array,
  allManufacturers: PropTypes.array,
};
