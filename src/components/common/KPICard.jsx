/**
 * @fileoverview Carte KPI générique avec progression et colorisation intelligente
 * 
 * @module components/common/KPICard
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 */
import { Card, Box, Text, Heading, Progress } from "@radix-ui/themes";
import PropTypes from "prop-types";

/** Seuils pour déterminer les couleurs de disponibilité */
const AVAILABILITY_THRESHOLDS = {
  EXCELLENT: 95,
  GOOD: 85
};

/** Couleur par défaut des KPIs */
const DEFAULT_COLOR = "blue";

/**
 * Détermine la couleur en fonction du contexte et de la valeur de progression
 * @param {string|undefined} color - Couleur explicite fournie
 * @param {number|undefined} progress - Valeur de progression 0-100
 * @returns {string} Nom de la couleur Radix UI
 */
const determineColor = (color, progress) => {
  if (color) return color;
  
  if (progress !== undefined && typeof progress === "number") {
    if (progress >= AVAILABILITY_THRESHOLDS.EXCELLENT) return "green";
    if (progress >= AVAILABILITY_THRESHOLDS.GOOD) return "orange";
    return "red";
  }
  
  return DEFAULT_COLOR;
};

/**
 * Carte KPI générique avec valeur, sous-titre et barre de progression
 * @component
 * @param {Object} props
 * @param {string} props.label - Label du KPI
 * @param {string|number} props.value - Valeur principale à afficher
 * @param {string} [props.subtitle] - Texte additionnel sous la valeur
 * @param {string} [props.color] - Couleur du badge (green, orange, red, blue, etc.)
 * @param {number} [props.progress] - Valeur de progression 0-100
 * @returns {JSX.Element} Card avec KPI formaté
 * @example
 * <KPICard label="Disponibilité" value="92.5%" progress={92.5} />
 * <KPICard label="Interventions" value={8} subtitle="sur 15 total" color="orange" />
 */
export default function KPICard({ label, value, subtitle, color, progress }) {
  const displayColor = determineColor(color, progress);

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

KPICard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  color: PropTypes.string,
  progress: PropTypes.number,
};