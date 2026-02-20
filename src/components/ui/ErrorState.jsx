/**
 * @fileoverview Composant d'affichage d'erreurs avec options de récupération
 * 
 * @module components/common/ErrorState
 * @requires react
 * @requires prop-types
 * @requires react-router-dom
 * @requires @radix-ui/themes
 * 
 * @example
 * // Erreur basique avec retry
 * <ErrorState
 *   error="Impossible de charger les données"
 *   onRetry={() => refetch()}
 * />
 * 
 * @example
 * // Erreur personnalisée avec navigation
 * <ErrorState
 *   error="Machine introuvable"
 *   backLink="/machines"
 *   backLabel="Retour aux machines"
 * />
 */
import { Link } from "react-router-dom";
import { Container, Box, Card, Flex, Heading, Text, Button } from "@radix-ui/themes";
import PropTypes from "prop-types";
import { AlertCircle } from "lucide-react";

/** Message d'erreur par défaut */
const DEFAULT_ERROR_MESSAGE = "Une erreur est survenue";

/** Lien de retour par défaut */
const DEFAULT_BACK_LINK = "/machines";

/** Label du bouton retour par défaut */
const DEFAULT_BACK_LABEL = "Retour à la liste";

/** Style pour le lien sans décoration */
const LINK_STYLE = { textDecoration: "none", color: "inherit" };

/**
 * Affiche l'icône et le titre d'erreur
 * @returns {JSX.Element} Header avec icône et titre
 */
function ErrorHeader() {
  return (
    <Flex direction="column" align="center" gap="2">
      <AlertCircle size={48} color="var(--red-9)" strokeWidth={1.5} />
      <Heading size="5" color="red">Erreur</Heading>
    </Flex>
  );
}

/**
 * Affiche le message d'erreur
 * @param {string} message - Message à afficher
 * @returns {JSX.Element} Texte du message d'erreur
 */
function ErrorMessage({ message }) {
  return (
    <Text color="gray" size="3" align="center" style={{ maxWidth: "500px" }}>
      {message || DEFAULT_ERROR_MESSAGE}
    </Text>
  );
}

ErrorMessage.propTypes = {
  message: PropTypes.string,
};

/**
 * Bouton de retry
 * @param {Function} onRetry - Callback de retry
 * @returns {JSX.Element|null} Bouton retry ou null
 */
function RetryButton({ onRetry }) {
  if (!onRetry) return null;

  return (
    <Button onClick={onRetry} color="red" size="2">
      Réessayer
    </Button>
  );
}

RetryButton.propTypes = {
  onRetry: PropTypes.func,
};

/**
 * Bouton de navigation retour
 * @param {string} backLink - URL de retour
 * @param {string} backLabel - Label du bouton
 * @returns {JSX.Element} Bouton avec Link
 */
function BackButton({ backLink, backLabel }) {
  return (
    <Button variant="soft" size="2" asChild>
      <Link to={backLink} style={LINK_STYLE}>
        {backLabel}
      </Link>
    </Button>
  );
}

BackButton.propTypes = {
  backLink: PropTypes.string.isRequired,
  backLabel: PropTypes.string.isRequired,
};

/**
 * Composant d'affichage d'erreurs avec options de récupération
 * 
 * Affiche un état d'erreur élégant dans une Card centrée avec icône,
 * message personnalisé et actions (retry + navigation retour). Utile pour
 * les pages de détail, listes vides ou erreurs de chargement.
 * 
 * @component
 * @param {Object} props
 * @param {string} [props.error] - Message d'erreur à afficher
 * @param {Function} [props.onRetry] - Callback pour réessayer l'opération
 * @param {string} [props.backLink="/machines"] - URL du lien de retour
 * @param {string} [props.backLabel="Retour à la liste"] - Label du bouton retour
 * 
 * @returns {JSX.Element} Container avec Card d'erreur et actions
 * 
 * @example
 * // Minimal avec message par défaut
 * <ErrorState />
 * 
 * @example
 * // Avec retry et message personnalisé
 * <ErrorState
 *   error="Échec du chargement des interventions"
 *   onRetry={handleRefetch}
 * />
 * 
 * @example
 * // Avec navigation personnalisée
 * <ErrorState
 *   error="Cette machine n'existe pas"
 *   backLink="/interventions"
 *   backLabel="Voir les interventions"
 * />
 * 
 * @example
 * // Dans un boundary d'erreur
 * try {
 *   await fetchData();
 * } catch (err) {
 *   return <ErrorState error={err.message} onRetry={refetch} />;
 * }
 */
export default function ErrorState({ 
  error, 
  onRetry, 
  backLink = DEFAULT_BACK_LINK, 
  backLabel = DEFAULT_BACK_LABEL 
}) {
  return (
    <Container size="4">
      <Box p="2">
        <Card>
          <Flex direction="column" align="center" gap="4" p="6">
            <ErrorHeader />
            <ErrorMessage message={error} />
            <Flex gap="2" wrap="wrap">
              <RetryButton onRetry={onRetry} />
              <BackButton backLink={backLink} backLabel={backLabel} />
            </Flex>
          </Flex>
        </Card>
      </Box>
    </Container>
  );
}

ErrorState.propTypes = {
  error: PropTypes.string,
  onRetry: PropTypes.func,
  backLink: PropTypes.string,
  backLabel: PropTypes.string,
};