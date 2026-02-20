import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Flex,
  Box,
  Button,
  TextField,
  Text,
  Select,
  Card,
  Badge,
} from "@radix-ui/themes";
import { Plus, FileCode, X } from "lucide-react";
import { useStockSubFamilies } from "@/hooks/useStockFamilies";
import { useTemplate } from "@/hooks/useTemplate";
import { generatePattern, validateRequiredFields } from "@/lib/utils/templatePatternGenerator";
import { generateStockReference } from "@/lib/utils/stockReferenceGenerator";

export default function AddStockItemForm({ onAdd, onCancel, loading, stockFamilies = [] }) {
  
  const [name, setName] = useState("");
  const [familyCode, setFamilyCode] = useState("");
  const [subFamilyCode, setSubFamilyCode] = useState("");
  const [spec, setSpec] = useState("");
  const [dimension, setDimension] = useState("");
  const [unit, setUnit] = useState("pcs");
  const [location, setLocation] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [validationError, setValidationError] = useState(null);

  // Template-based characteristics
  const [characteristics, setCharacteristics] = useState({});

  const { subFamilies } = useStockSubFamilies(familyCode);

  // Get selected subfamily with template info
  const selectedSubFamily = useMemo(() => 
    subFamilies.find(sf => sf.code === subFamilyCode),
    [subFamilies, subFamilyCode]
  );

  // Load template if subfamily has one
  const { template, fields, enums, loading: templateLoading } = useTemplate(
    selectedSubFamily?.part_template_id
  );

  // Reset characteristics when template changes
  useEffect(() => {
    if (template) {
      setCharacteristics({});
    }
  }, [template]);

  // Generate dimension preview from template
  const generatedDimension = useMemo(() => {
    if (template && template.pattern) {
      return generatePattern(template.pattern, characteristics);
    }
    return dimension;
  }, [template, characteristics, dimension]);

  const resetForm = () => {
    setName("");
    setFamilyCode("");
    setSubFamilyCode("");
    setSpec("");
    setDimension("");
    setUnit("pcs");
    setLocation("");
    setQuantity("0");
    setCharacteristics({});
  };

  const handleSubmit = async () => {
    setValidationError(null);
    
    // Validation commune
    if (!name.trim() || !familyCode || !subFamilyCode) {
      return;
    }

    // Si template : validation des champs requis + dimension générée par le backend
    if (template) {
      const validation = validateRequiredFields(fields, characteristics);
      if (!validation.valid) {
        setValidationError(`Champs requis manquants : ${validation.missing.join(', ')}`);
        return;
      }

      const itemData = {
        name: name.trim(),
        familyCode: familyCode,
        subFamilyCode: subFamilyCode,
        spec: spec.trim() || null,
        // dimension: INTERDIT en mode template (généré par le backend via le pattern)
        unit,
        location: location.trim() || null,
        quantity: parseInt(quantity) || 0,
        // Caractéristiques du template
        characteristics: characteristics,
      };

      await onAdd(itemData);
    } else {
      // Legacy mode : validation manuelle dimension
      if (!dimension.trim()) {
        return;
      }

      const itemData = {
        name: name.trim(),
        familyCode: familyCode,
        subFamilyCode: subFamilyCode,
        spec: spec.trim() || null,
        dimension: dimension.trim(),
        unit,
        location: location.trim() || null,
        quantity: parseInt(quantity) || 0,
      };

      await onAdd(itemData);
    }

    resetForm();
    onCancel?.();
  };

  const handleCharacteristicChange = (fieldKey, value) => {
    setCharacteristics(prev => ({
      ...prev,
      [fieldKey]: value
    }));
  };

  const generatedRef = generateStockReference({
    family_code: familyCode,
    sub_family_code: subFamilyCode,
    spec: spec,
    dimension: generatedDimension,
  });

  const hasTemplate = !!template;
  const validation = hasTemplate ? validateRequiredFields(fields, characteristics) : { valid: true };

  return (
    <Card style={{ background: "var(--blue-2)", border: "1px solid var(--blue-6)" }}>
      <Flex direction="column" gap="3">
        {/* En-tête */}
        <Flex align="center" justify="between">
          <Flex align="center" gap="2">
            <Plus size={20} />
            <Text size="3" weight="bold">Ajouter un article au stock</Text>
          </Flex>
          <Button
            size="1"
            variant="ghost"
            color="gray"
            onClick={onCancel}
          >
            <X size={16} />
          </Button>
        </Flex>

        <Text size="2" color="gray">
          Créer un nouvel article dans le stock avec sa famille et sous-famille.
        </Text>

        {/* Erreur de validation */}
        {validationError && (
          <Box p="2" style={{ background: "var(--red-3)", border: "1px solid var(--red-7)", borderRadius: "var(--radius-2)" }}>
            <Text size="2" color="red" weight="medium">
              {validationError}
            </Text>
          </Box>
        )}

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
                  setCharacteristics({});
                }} 
                size="2"
              >
                <Select.Trigger placeholder="Sélectionner..." />
                <Select.Content>
                  {stockFamilies.map((family, index) => (
                    <Select.Item key={`${family.code}-${index}`} value={family.code}>
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
                onValueChange={(v) => {
                  setSubFamilyCode(v);
                  setCharacteristics({});
                }}
                disabled={!familyCode}
                size="2"
              >
                <Select.Trigger placeholder="Sélectionner..." />
                <Select.Content>
                  {subFamilies.map((subFamily) => (
                    <Select.Item key={subFamily.id} value={subFamily.code}>
                      <Flex align="center" gap="2">
                        {subFamily.label}
                        {subFamily.part_template_id && (
                          <Badge size="1" color="blue" variant="soft">
                            <FileCode size={10} />
                          </Badge>
                        )}
                      </Flex>
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select.Root>
            </Box>
          </Flex>

          {/* Template-based form */}
          {hasTemplate && !templateLoading && (
            <Card style={{ background: "var(--blue-2)", border: "1px solid var(--blue-6)" }}>
              <Flex direction="column" gap="3">
                <Flex align="center" gap="2">
                  <FileCode size={16} />
                  <Text size="2" weight="bold">Template : {template.label}</Text>
                  <Badge size="1" color="blue">v{template.version}</Badge>
                </Flex>
                
                <Text size="1" color="gray">
                  Pattern : <Text weight="bold" style={{ fontFamily: 'monospace' }}>{template.pattern}</Text>
                </Text>

                {fields.map((field, fieldIndex) => (
                  <Box key={`${field.field_key}-${fieldIndex}`}>
                    <Text size="2" color="gray" mb="1" style={{ display: "block" }}>
                      {field.label} {field.required && <Text color="red">*</Text>}
                      {field.unit && <Text size="1"> ({field.unit})</Text>}
                    </Text>
                    
                    {field.type === 'enum' ? (
                      <Select.Root
                        value={characteristics[field.field_key] || ''}
                        onValueChange={(v) => handleCharacteristicChange(field.field_key, v)}
                        size="2"
                      >
                        <Select.Trigger placeholder={`Choisir ${field.label.toLowerCase()}`} />
                        <Select.Content>
                          {(enums[field.field_key] || []).map((ev, evIndex) => (
                            <Select.Item key={`${ev.value}-${evIndex}`} value={ev.value}>
                              {ev.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select.Root>
                    ) : field.type === 'number' ? (
                      <TextField.Root
                        type="number"
                        placeholder={`Ex: ${field.field_key === 'DIAM' ? '8' : '30'}`}
                        value={characteristics[field.field_key] || ''}
                        onChange={(e) => handleCharacteristicChange(field.field_key, e.target.value)}
                        size="2"
                      />
                    ) : (
                      <TextField.Root
                        placeholder={`Ex: ${field.label.toLowerCase()}`}
                        value={characteristics[field.field_key] || ''}
                        onChange={(e) => handleCharacteristicChange(field.field_key, e.target.value)}
                        size="2"
                      />
                    )}
                  </Box>
                ))}

                {!validation.valid && (
                  <Text size="1" color="red">
                    Champs requis manquants : {validation.missing.join(', ')}
                  </Text>
                )}
              </Flex>
            </Card>
          )}

          {/* Legacy form (no template) */}
          {!hasTemplate && subFamilyCode && (
            <>
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
            </>
          )}

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
              {hasTemplate ? 'Dimension (prévisualisée, générée par le serveur) :' : 'Dimension :'}
            </Text>
            <Text size="2" weight="bold" style={{ display: "block", marginTop: "4px" }}>
              {generatedDimension || '(incomplet)'}
            </Text>
            <Text size="1" color="gray" weight="medium" style={{ marginTop: "8px", display: "block" }}>
              Référence (prévisualisée, générée par le serveur) :
            </Text>
            <Text size="2" weight="bold" style={{ display: "block", marginTop: "4px" }}>
              {generatedRef}
            </Text>
          </Box>

        {/* Boutons */}
        <Flex gap="2" justify="end">
          <Button 
            variant="soft" 
            color="gray"
            size="2"
            onClick={onCancel}
          >
            Annuler
          </Button>
          <Button
            size="2"
            onClick={handleSubmit}
            disabled={
              !name.trim() || 
              !familyCode || 
              !subFamilyCode || 
              (hasTemplate && !validation.valid) ||
              (!hasTemplate && !dimension.trim()) ||
              loading
            }
          >
            <Plus size={16} />
            {loading ? "Création..." : "Enregistrer"}
          </Button>
        </Flex>
      </Flex>
    </Card>
  );
}

AddStockItemForm.propTypes = {
  onAdd: PropTypes.func.isRequired,
  onCancel: PropTypes.func,
  loading: PropTypes.bool,
  stockFamilies: PropTypes.array,
};
