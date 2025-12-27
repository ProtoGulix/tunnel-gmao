import { Card, Box, Text, Heading, Progress } from "@radix-ui/themes";

/**
 * Seuils pour déterminer les couleurs de disponibilité
 */
const AVAILABILITY_THRESHOLDS = {
  EXCELLENT: 95,
  GOOD: 85
};

/**
 * Composant carte KPI générique
 * @param {string} label - Label du KPI
 * @param {string|number} value - Valeur principale à afficher
 * @param {string} subtitle - Texte additionnel sous la valeur
 * @param {string} color - Couleur du badge (optionnel)
 * @param {number} progress - Valeur de progression 0-100 (optionnel)
 */
export default function KPICard({ label, value, subtitle, color, progress }) {
  /**
   * Détermine la couleur en fonction du contexte
   * @returns {string} Nom de la couleur
   */
  const getColor = () => {
    if (color) return color;
    
    if (progress !== undefined && typeof progress === 'number') {
      if (progress >= AVAILABILITY_THRESHOLDS.EXCELLENT) return 'green';
      if (progress >= AVAILABILITY_THRESHOLDS.GOOD) return 'orange';
      return 'red';
    }
    
    return 'blue';
  };

  const displayColor = getColor();

  return (
    <Card>
      <Box p="3">
        <Text size="1" color="gray">{label}</Text>
        <Heading size="5" color={displayColor}>
          {value}
        </Heading>
        
        {subtitle && (
          <Text size="1" color="gray" mt="1">{subtitle}</Text>
        )}
        
        {progress !== undefined && (
          <Progress value={progress || 0} color={displayColor} mt="2" />
        )}
      </Box>
    </Card>
  );
}