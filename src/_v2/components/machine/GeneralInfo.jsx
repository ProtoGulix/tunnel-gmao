import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Card, Box, Heading, Text, Grid, Badge, Flex } from "@radix-ui/themes";

/**
 * Carte d'informations générales d'une machine/équipement
 * Affiche zone, atelier, machine mère (avec lien), et sous-équipements
 * 
 * ✅ Implémenté :
 * - Grid 2 colonnes pour affichage compact
 * - Lien cliquable vers machine mère avec couleur bleue
 * - Gestion des valeurs nulles/manquantes ("N/A", "Aucune")
 * - Compteur de sous-équipements avec singulier/pluriel
 * - Navigation React Router vers machine mère
 * - Utilise les noms de domaine : zone, workshop, parent, tree (API_CONTRACTS.md)
 */
export default function GeneralInfo({ machine }) {
  return (
    <Card>
      <Box p="3">
        <Heading size="4" mb="3">Informations générales</Heading>
        <Grid columns="2" gap="3">
          {/* Zone */}
          <Box>
            <Text size="1" color="gray">Zone</Text>
            <Text size="2" weight="bold">
              {machine.zone?.name || "N/A"}
            </Text>
          </Box>

          {/* Atelier */}
          <Box>
            <Text size="1" color="gray">Atelier</Text>
            <Text size="2" weight="bold">
              {machine.workshop?.name || "N/A"}
            </Text>
          </Box>

          {/* Machine mère */}
          <Box>
            <Text size="1" color="gray">Machine mère</Text>
            <Text size="2" weight="bold">
              {machine.parent ? (
                <Link 
                  to={`/machine/${machine.parent.id}`} 
                  style={{ textDecoration: 'none' }}
                >
                  <Text color="blue">
                    {machine.parent.code || machine.parent.name}
                  </Text>
                </Link>
              ) : (
                "Aucune"
              )}
            </Text>
          </Box>

          {/* Sous-équipements */}
          <Box>
            <Text size="1" color="gray">Sous-équipements</Text>
            <Flex align="center" gap="2" mt="1">
              <Badge color={machine.tree?.length > 0 ? "blue" : "gray"} variant="soft">
                {machine.tree?.length || 0}
              </Badge>
              <Text size="2" weight="medium">
                {machine.tree?.length === 1 ? 'élément' : 'éléments'}
              </Text>
            </Flex>
          </Box>
        </Grid>
      </Box>
    </Card>
  );
}

GeneralInfo.propTypes = {
  machine: PropTypes.shape({
    zone: PropTypes.shape({
      name: PropTypes.string,
    }),
    workshop: PropTypes.shape({
      name: PropTypes.string,
    }),
    parent: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      code: PropTypes.string,
      name: PropTypes.string,
    }),
    tree: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      })
    ),
  }).isRequired,
};