/**
 * @fileoverview Composant d'état vide réutilisable avec icône, titre, description et actions
 * 
 * @module components/common/EmptyState
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * 
 * @example
 * // État vide avec emoji
 * <EmptyState
 *   icon="📭"
 *   title="Aucune intervention"
 *   description="Aucune intervention n'a été enregistrée pour cette machine."
 * />
 * 
 * @example
 * // État vide avec composant icône et actions
 * <EmptyState
 *   icon={<AlertCircle size={48} />}
 *   title="Aucun résultat"
 *   description="Essayez de modifier vos filtres."
 *   actions={[
 *     <Button onClick={resetFilters}>Réinitialiser</Button>,
 *     <Button variant="soft" onClick={clearSearch}>Effacer</Button>
 *   ]}
 * />
 */
import { Card, Flex, Text, Box } from "@radix-ui/themes";
import { Fragment, isValidElement } from "react";
import PropTypes from "prop-types";

/** Style par défaut pour l'icône avec opacité réduite */
const ICON_STYLE = { opacity: 0.3 };

/** Style pour centrer le texte */
const TEXT_CENTER_STYLE = { textAlign: "center" };

/**
 * Rend l'icône selon son type (string emoji ou composant React)
 * @param {string|React.ReactElement} icon - Icône à afficher
 * @returns {JSX.Element} Élément icône stylisé
 */
function IconDisplay({ icon }) {
  if (typeof icon === "string") {
    return <Text size="9" style={ICON_STYLE}>{icon}</Text>;
  }

  return (
    <Box style={ICON_STYLE}>
      {isValidElement(icon) ? icon : null}
    </Box>
  );
}

IconDisplay.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
};

/**
 * Affiche le contenu textuel (titre et description)
 * @param {string} title - Titre principal
 * @param {string} description - Description détaillée
 * @returns {JSX.Element} Flex avec titre et description centrés
 */
function TextContent({ title, description }) {
  return (
    <Flex direction="column" align="center" gap="2" style={TEXT_CENTER_STYLE}>
      <Text size="5" weight="bold" color="gray">{title}</Text>
      {description && <Text color="gray" size="3">{description}</Text>}
    </Flex>
  );
}

TextContent.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
};

/**
 * Affiche les boutons d'action si présents
 * @param {Array<React.ReactElement>} actions - Tableau de composants boutons
 * @returns {JSX.Element|null} Flex avec actions ou null
 */
function ActionsBar({ actions }) {
  if (!actions?.length) return null;

  return (
    <Flex gap="2" wrap="wrap">
      {actions.map((action, idx) => (
        <Fragment key={idx}>{action}</Fragment>
      ))}
    </Flex>
  );
}

ActionsBar.propTypes = {
  actions: PropTypes.arrayOf(PropTypes.element),
};

/**
 * Composant d'état vide avec icône, titre, description et actions optionnelles
 * 
 * Affiche un état vide élégant et centré dans une Card. Supporte les icônes emoji
 * (string) ou composants React (ex: Lucide icons). Permet d'ajouter des boutons
 * d'action pour guider l'utilisateur (réinitialiser filtres, créer item, etc.).
 * 
 * @component
 * @param {Object} props
 * @param {string|React.ReactElement} [props.icon] - Icône emoji (string) ou composant React
 * @param {string} props.title - Titre principal de l'état vide
 * @param {string} [props.description] - Description détaillée optionnelle
 * @param {Array<React.ReactElement>} [props.actions=[]] - Tableau de boutons/liens d'action
 * 
 * @returns {JSX.Element} Card centrée avec contenu d'état vide
 * 
 * @example
 * // Minimal
 * <EmptyState title="Aucune donnée" />
 * 
 * @example
 * // Complet avec emoji et actions
 * <EmptyState
 *   icon="🔍"
 *   title="Aucun résultat trouvé"
 *   description="Modifiez vos critères de recherche."
 *   actions={[
 *     <Button onClick={handleReset}>Réinitialiser</Button>
 *   ]}
 * />
 * 
 * @example
 * // Avec composant icône Lucide
 * <EmptyState
 *   icon={<FileQuestion size={48} strokeWidth={1.5} />}
 *   title="Fichier introuvable"
 *   description="Le fichier demandé n'existe pas ou a été supprimé."
 * />
 */
export default function EmptyState({ icon, title, description, actions = [] }) {
  return (
    <Card size="3">
      <Flex direction="column" align="center" justify="center" p="8" gap="3">
        {icon && <IconDisplay icon={icon} />}
        <TextContent title={title} description={description} />
        <ActionsBar actions={actions} />
      </Flex>
    </Card>
  );
}

EmptyState.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actions: PropTypes.arrayOf(PropTypes.element),
};
