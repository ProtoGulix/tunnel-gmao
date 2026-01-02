/**
 * @fileoverview Badge d'affichage des informations fabricant avec icône
 * 
 * Composant compact pour afficher le nom du fabricant, sa référence et sa désignation.
 * Retourne null si aucune information n'est fournie.
 * 
 * @module components/common/ManufacturerBadge
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires lucide-react
 */

import PropTypes from "prop-types";
import { Flex, Text } from "@radix-ui/themes";
import { Factory } from "lucide-react";

/** Taille de l'icône fabricant */
const ICON_SIZE = 14;

/** Texte par défaut si aucun nom de fabricant */
const DEFAULT_MANUFACTURER = "Fabricant inconnu";

/** Couleur du badge */
const BADGE_COLOR = "var(--gray-11)";

/** Séparateur entre les informations */
const SEPARATOR = " • ";

/**
 * Construit le texte du badge avec nom, référence et désignation
 * @param {string|null} name - Nom du fabricant
 * @param {string|null} reference - Référence produit
 * @param {string|null} designation - Désignation produit
 * @returns {string} Texte formaté
 */
const buildBadgeText = (name, reference, designation) => {
  const parts = [];
  
  parts.push(name || DEFAULT_MANUFACTURER);
  
  if (reference) {
    parts.push(`Ref: ${reference}`);
  }
  
  if (designation) {
    parts.push(designation);
  }
  
  return parts.join(SEPARATOR);
};

/**
 * Vérifie si au moins une information est fournie
 * @param {string|null} name - Nom du fabricant
 * @param {string|null} reference - Référence
 * @param {string|null} designation - Désignation
 * @returns {boolean} True si au moins une valeur existe
 */
const hasContent = (name, reference, designation) => {
  return Boolean(name || reference || designation);
};

/**
 * Badge compact d'informations fabricant
 * 
 * Affiche une icône d'usine suivie du nom du fabricant, référence et désignation.
 * Si aucune information n'est fournie, le composant ne rend rien (null).
 * 
 * @component
 * @param {Object} props
 * @param {string} [props.name] - Nom du fabricant
 * @param {string} [props.reference] - Référence du produit
 * @param {string} [props.designation] - Désignation du produit
 * @returns {JSX.Element|null} Badge avec infos fabricant ou null
 * 
 * @example
 * // Avec toutes les informations
 * <ManufacturerBadge 
 *   name="Bosch" 
 *   reference="REF-123" 
 *   designation="Moteur électrique" 
 * />
 * 
 * @example
 * // Avec nom uniquement
 * <ManufacturerBadge name="Siemens" />
 * 
 * @example
 * // Sans nom (affiche "Fabricant inconnu")
 * <ManufacturerBadge reference="REF-456" designation="Capteur" />
 */
export default function ManufacturerBadge({ name, reference, designation }) {
  if (!hasContent(name, reference, designation)) {
    return null;
  }

  return (
    <Flex 
      align="center" 
      gap="2" 
      style={{ marginTop: 4, color: BADGE_COLOR }}
    >
      <Factory size={ICON_SIZE} />
      <Text size="1">
        {buildBadgeText(name, reference, designation)}
      </Text>
    </Flex>
  );
}

ManufacturerBadge.propTypes = {
  name: PropTypes.string,
  reference: PropTypes.string,
  designation: PropTypes.string,
};
