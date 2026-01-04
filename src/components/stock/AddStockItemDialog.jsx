import { useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  Flex,
  Box,
  Button,
  TextField,
  Text,
  Select,
} from "@radix-ui/themes";
import { Plus } from "lucide-react";
import { useStockSubFamilies } from "@/hooks/useStockFamilies";
import { generateStockReference } from "@/lib/utils/stockReferenceGenerator";

export default function AddStockItemDialog({ onAdd, loading, stockFamilies = [] }) {
  const [open, setOpen] = useState(false);
  
  const [name, setName] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [subFamilyCode, setSubFamilyCode] = useState("");
  const [spec, setSpec] = useState("");
  const [dimension, setDimension] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState("0");

  const { subFamilies } = useStockSubFamilies(familyCode);

  const resetForm = () => {
    setName("");
    setFamilyCode("");
    setSubFamilyCode("");
    setSpec("");
    setDimension("");
    setUnit("pcs");
    setLocation("");
    setQuantity("0");
  };

  const handleSubmit = async () => {
    if (!name.trim() || !familyCode || !subFamilyCode || !dimension.trim()) {
      return;
    }

    const itemData = {
      name: name.trim(),
      family_code: familyCode,
      sub_family_code: subFamilyCode,
      spec: spec.trim() || null,
      dimension: dimension.trim(),
      unit,
      location: location.trim() || null,
      quantity: parseInt(quantity) || 0,
    };

    await onAdd(itemData);
    resetForm();
    setOpen(false);
  };

  const generatedRef = generateStockReference({
    family_code: familyCode,
    sub_family_code: subFamilyCode,
    spec: spec,
    dimension: dimension,
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger>
        <Button>
          <Plus size={16} />
          Nouvel article
        </Button>
      </Dialog.Trigger>

      <Dialog.Content style={{ maxWidth: 550 }}>
        <Dialog.Title>Ajouter un article au stock</Dialog.Title>
        <Dialog.Description size="2" mb="4">
          Créer un nouvel article dans le stock avec sa famille et sous-famille.
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <Box>
            <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
              Nom de l&apos;article *
            </Text>
            <TextField.Root
              placeholder="Ex: Vis à tête hexagonale"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="2"
            />
          </Box>

          <Flex gap="2">
            <Box style={{ flex: 1 }}>
              <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
                Famille *
              </Text>
              <Select.Root 
                value={familyCode} 
                onValueChange={(value) => {
                  setFamilyCode(value);
                  setSubFamilyCode("");
                }} 
                size="2"
              >
                <Select.Trigger placeholder="Sélectionner..." />
                <Select.Content>
                  {stockFamilies.map((family) => (
                    <Select.Item key={family.code} value={family.code}>
                      {family.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>

            <Box style={{ flex: 1 }}>
              <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
                Sous-famille *
              </Text>
              <Select.Root 
                value={subFamilyCode} 
                onValueChange={setSubFamilyCode}
                disabled={!familyCode}
                size="2"
              >
                <Select.Trigger placeholder="Sélectionner..." />
                <Select.Content>
                  {subFamilies.map((subFamily) => (
                    <Select.Item key={subFamily.code} value={subFamily.code}>
                      {subFamily.label}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>
          </Flex>

          <Flex gap="2">
            <Box style={{ flex: 1 }}>
              <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
                Spécification
              </Text>
              <TextField.Root
                placeholder="Ex: M8"
                value={spec}
                onChange={(e) => setSpec(e.target.value)}
                size="2"
              />
            </Box>

            <Box style={{ flex: 1 }}>
              <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
                Dimension *
              </Text>
              <TextField.Root
                placeholder="Ex: 20x50"
                value={dimension}
                onChange={(e) => setDimension(e.target.value)}
                size="2"
              />
            </Box>
          </Flex>

          <Flex gap="2">
            <Box style={{ flex: 1 }}>
              <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
                Quantité initiale
              </Text>
              <TextField.Root
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                size="2"
              />
            </Box>

            <Box style={{ flex: 1 }}>
              <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
                Unité
              </Text>
              <Select.Root value={unit} onValueChange={setUnit} size="2">
                <Select.Trigger />
                <Select.Content>
                  <Select.Item value="pcs">Pièces</Select.Item>
                  <Select.Item value="m">Mètres</Select.Item>
                  <Select.Item value="kg">Kg</Select.Item>
                  <Select.Item value="l">Litres</Select.Item>
                  <Select.Item value="boite">Boîte</Select.Item>
                  <Select.Item value="rouleau">Rouleau</Select.Item>
                </Select.Content>
              </Select.Root>
            </Box>
          </Flex>

          <Box>
            <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
              Localisation
            </Text>
            <TextField.Root
              placeholder="Ex: Atelier A - Étagère 3"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              size="2"
            />
          </Box>

          <Box p="2" style={{ background: "var(--gray-3)", borderRadius: "var(--radius-2)" }}>
            <Text size="1" color="gray" weight="medium">
              Référence auto-générée :
            </Text>
            <Text size="2" weight="bold" style={{ display: "block", marginTop: "4px" }}>
              {generatedRef}
            </Text>
          </Box>
        </Flex>

        <Flex gap="3" mt="4" justify="end">
          <Dialog.Close>
            <Button variant="soft" color="gray">
              Annuler
            </Button>
          </Dialog.Close>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || !familyCode || !subFamilyCode || !dimension.trim() || loading}
          >
            <Plus size={16} />
            {loading ? "Création..." : "Créer l'article"}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

AddStockItemDialog.propTypes = {
  onAdd: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  stockFamilies: PropTypes.array,
};
