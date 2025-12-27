import { Box, Flex, Text, Card, TextField, Select, Badge, TextArea, Button } from "@radix-ui/themes";
import { Activity, Clock, Tag, Folder, BarChart3, Plus } from "lucide-react";
import { ACTION_CATEGORY_COLORS } from "@/config/interventionTypes";

const getCategoryColor = (subcategory) => {
  if (!subcategory?.category_id?.code) return 'gray';
  return ACTION_CATEGORY_COLORS[subcategory.category_id.code] || 'gray';
};

export default function ActionForm({
  actionTime,
  setActionTime,
  actionDate,
  setActionDate,
  actionCategory,
  setActionCategory,
  subcategories = [],
  actionDescription,
  setActionDescription,
  actionComplexity,
  setActionComplexity,
  complexityFactors = [],
  actionComplexityFactors = [],
  setActionComplexityFactors,
  onCancel,
  onSubmit,
  style
}) {
  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)', ...(style || {}) }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          <Activity size={20} color="var(--blue-9)" />
          <Text size="3" weight="bold" color="blue">
            Nouvelle action
          </Text>
        </Flex>

        <form onSubmit={onSubmit}>
          <Flex direction="column" gap="3">
            {/* Métadonnées en premier */}
            <Flex gap="2" wrap="wrap">
              {/* Temps passé */}
              <Box style={{ flex: '1', minWidth: '100px' }}>
                <Flex align="center" gap="1" mb="1">
                  <Clock size={14} color="var(--gray-9)" />
                  <Text size="1" weight="bold">Temps</Text>
                </Flex>
                <TextField.Root 
                  type="number"
                  step="0.25"
                  min="0"
                  placeholder="0.5"
                  value={actionTime}
                  onChange={(e) => setActionTime(e.target.value)}
                  style={{ backgroundColor: 'white' }}
                >
                  <TextField.Slot side="right">
                    <Text size="1" color="gray">h</Text>
                  </TextField.Slot>
                </TextField.Root>
              </Box>

              {/* Date de l'action */}
              <Box style={{ flex: '1', minWidth: '100px' }}>
                <Flex align="center" gap="1" mb="1">
                  <Activity size={14} color="var(--gray-9)" />
                  <Text size="1" weight="bold">Date</Text>
                </Flex>
                <TextField.Root 
                  type="date"
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                  style={{ backgroundColor: 'white' }}
                />
              </Box>

              {/* Catégorie / Type d'action */}
              <Box style={{ flex: '1', minWidth: '150px' }}>
                <Flex align="center" gap="1" mb="1">
                  <Tag size={14} color="var(--gray-9)" />
                  <Text size="1" weight="bold">Type</Text>
                </Flex>
                <Select.Root
                  value={actionCategory}
                  onValueChange={setActionCategory}
                >
                  <Select.Trigger 
                    placeholder="Sélectionner..."
                    style={{ backgroundColor: 'white', width: '100%' }}
                  />
                  <Select.Content>
                    {subcategories.map(cat => (
                      <Select.Item key={`cat-${cat.id}`} value={String(cat.id)}>
                        <Flex align="center" gap="2">
                          <Badge variant="soft" size="1" color={getCategoryColor(cat)}>
                            {cat.code}
                          </Badge>
                          <Text size="2">{cat.name}</Text>
                        </Flex>
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>
            </Flex>

            {/* Description */}
            <Box>
              <Flex align="center" gap="2" mb="2">
                <Folder size={16} color="var(--gray-9)" />
                <Text size="2" weight="bold">Description de l'action</Text>
                <Badge color="red" size="1">Obligatoire</Badge>
              </Flex>
              <TextArea 
                placeholder="Décris en détail ce qui a été fait : diagnostic, réparation, remplacement..."
                value={actionDescription}
                onChange={(e) => setActionDescription(e.target.value)}
                required
                rows={4}
                style={{ 
                  resize: 'vertical',
                  backgroundColor: 'white'
                }}
              />
              <Text size="1" color="gray" mt="1">
                Sois précis : cela aide pour l'analyse et les prochaines interventions
              </Text>
            </Box>

            {/* Facteurs de complexité (si complexité > 5) */}
            {parseInt(actionComplexity) > 5 && (
              <Box>
                <Flex align="center" gap="2" mb="2">
                  <BarChart3 size={16} color="var(--orange-9)" />
                  <Text size="2" weight="bold">Facteurs de complexité</Text>
                  <Badge color="orange" size="1">Obligatoire pour complexité &gt; 5</Badge>
                </Flex>
                <Flex gap="2" wrap="wrap">
                  {complexityFactors.map((factor, index) => {
                    const factorId = String(factor.id || index);
                    const isSelected = actionComplexityFactors.includes(factorId);
                    return (
                      <Button
                        key={factorId}
                        type="button"
                        size="2"
                        variant={isSelected ? "solid" : "soft"}
                        color={isSelected ? "orange" : "gray"}
                        onClick={(e) => {
                          e.preventDefault();
                          setActionComplexityFactors(prev => {
                            if (isSelected) {
                              return prev.filter(id => id !== factorId);
                            } else {
                              return [...prev, factorId];
                            }
                          });
                        }}
                      >
                        {factor.label}
                      </Button>
                    );
                  })}
                </Flex>
                <Text size="1" color="gray" mt="2">
                  Sélectionne les facteurs qui ont rendu cette action complexe
                </Text>
              </Box>
            )}

            {/* Complexité */}
            <Box>
              <Flex align="center" gap="2" mb="2">
                <BarChart3 size={16} color="var(--gray-9)" />
                <Text size="2" weight="bold">Complexité</Text>
              </Flex>
              <Select.Root
                value={actionComplexity}
                onValueChange={setActionComplexity}
              >
                <Select.Trigger 
                  placeholder="..."
                  style={{ backgroundColor: 'white', width: '100%' }}
                />
                <Select.Content>
                  <Select.Item value="1">1 - Très simple</Select.Item>
                  <Select.Item value="2">2 - Simple</Select.Item>
                  <Select.Item value="3">3 - Facile</Select.Item>
                  <Select.Item value="4">4 - Moyen-</Select.Item>
                  <Select.Item value="5">5 - Moyen</Select.Item>
                  <Select.Item value="6">6 - Moyen+</Select.Item>
                  <Select.Item value="7">7 - Difficile</Select.Item>
                  <Select.Item value="8">8 - Complexe</Select.Item>
                  <Select.Item value="9">9 - Très complexe</Select.Item>
                  <Select.Item value="10">10 - Expert</Select.Item>
                </Select.Content>
              </Select.Root>
              <Text size="1" color="gray" mt="1">
                Évalue la difficulté de l'intervention
              </Text>
            </Box>

            {/* Bouton submit */}
            <Flex justify="between" gap="2">
              <Button type="button" variant="soft" onClick={onCancel}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                size="3" 
                style={{ backgroundColor: 'var(--blue-9)', color: 'white' }}
              >
                <Plus size={16} />
                Ajouter l'action
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}
