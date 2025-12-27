import { Link } from "react-router-dom";
import { Container, Box, Card, Flex, Heading, Text, Button } from "@radix-ui/themes";

/**
 * Composant d'affichage des erreurs avec options de récupération
 * @param {string} error - Message d'erreur à afficher
 * @param {function} onRetry - Callback pour réessayer l'opération
 * @param {string} backLink - Lien de retour (par défaut "/machines")
 * @param {string} backLabel - Label du bouton retour (par défaut "Retour à la liste")
 */
export default function ErrorState({ 
  error, 
  onRetry, 
  backLink = "/machines", 
  backLabel = "Retour à la liste" 
}) {
  return (
    <Container size="4">
      <Box p="2">
        <Card>
          <Flex direction="column" align="center" gap="2" p="3">
            {/* Titre de l'erreur */}
            <Heading size="4" color="red">Erreur</Heading>
            
            {/* Message d'erreur */}
            <Text color="gray" size="2">
              {error || "Une erreur est survenue"}
            </Text>
            
            {/* Actions */}
            <Flex gap="2">
              {onRetry && (
                <Button onClick={onRetry} color="red" size="2">
                  Réessayer
                </Button>
              )}
              
              <Button variant="soft" size="2" asChild>
                <Link to={backLink} style={{ textDecoration: 'none', color: 'inherit' }}>
                  {backLabel}
                </Link>
              </Button>
            </Flex>
          </Flex>
        </Card>
      </Box>
    </Container>
  );
}