/**
 * @fileoverview Guide de lecture décisionnel
 * @module components/charge/DecisionGuide
 */

import PropTypes from 'prop-types';
import { Box, Flex, Grid, Text, Card, Heading } from '@radix-ui/themes';
import { Info } from 'lucide-react';

/**
 * Indicateur de seuil coloré
 */
function SeuilBadge({ seuil }) {
  const label = seuil.max !== null
    ? `${seuil.min}-${seuil.max}%`
    : `>${seuil.min}%`;

  return (
    <Flex align="start" gap="2">
      <Box
        style={{
          minWidth: 60,
          padding: '2px 8px',
          borderRadius: 4,
          background: `var(--${seuil.color}-9)`,
          color: 'white',
          fontSize: 12,
          fontWeight: 500,
          textAlign: 'center',
        }}
      >
        {label}
      </Box>
      <Text size="2">{seuil.action}</Text>
    </Flex>
  );
}

SeuilBadge.propTypes = {
  seuil: PropTypes.shape({
    min: PropTypes.number,
    max: PropTypes.number,
    color: PropTypes.string,
    action: PropTypes.string,
  }).isRequired,
};

/**
 * Action par catégorie
 */
function CategorieAction({ item }) {
  return (
    <Flex align="center" gap="2">
      <Box
        style={{
          minWidth: 90,
          padding: '2px 8px',
          borderRadius: 4,
          background: item.color,
          color: 'white',
          fontSize: 12,
          fontWeight: 500,
          textAlign: 'center',
        }}
      >
        {item.category}
      </Box>
      <Text size="2">{item.action}</Text>
    </Flex>
  );
}

CategorieAction.propTypes = {
  item: PropTypes.shape({
    category: PropTypes.string,
    color: PropTypes.string,
    action: PropTypes.string,
  }).isRequired,
};

/**
 * Guide de lecture décisionnel
 */
export function DecisionGuide({ guide }) {
  if (!guide) return null;

  const { objectif, seuilsTauxEvitable, actionsParCategorie } = guide;

  return (
    <Box mb="5">
      <Heading size="4" mb="3">
        <Flex align="center" gap="2">
          <Info size={20} />
          Guide de lecture
        </Flex>
      </Heading>
      
      <Card>
        <Box p="4">
          <Grid columns={{ initial: '1', md: '2' }} gap="4">
            <Box>
              <Text weight="bold" size="3" mb="2">Objectif de la charge technique</Text>
              <Text size="2" color="gray">{objectif}</Text>
            </Box>
            
            {seuilsTauxEvitable.length > 0 && (
              <Box>
                <Text weight="bold" size="3" mb="2">Actions selon le taux évitable</Text>
                <Flex direction="column" gap="2" mt="2">
                  {seuilsTauxEvitable.map((seuil, i) => (
                    <SeuilBadge key={i} seuil={seuil} />
                  ))}
                </Flex>
              </Box>
            )}
          </Grid>
          
          {actionsParCategorie.length > 0 && (
            <Box mt="4" pt="3" style={{ borderTop: '1px solid var(--gray-5)' }}>
              <Text weight="bold" size="3" mb="2">Actions par catégorie dominante</Text>
              <Grid columns={{ initial: '1', sm: '2' }} gap="3" mt="2">
                {actionsParCategorie.map((item, i) => (
                  <CategorieAction key={i} item={item} />
                ))}
              </Grid>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
}

DecisionGuide.propTypes = {
  guide: PropTypes.shape({
    objectif: PropTypes.string,
    seuilsTauxEvitable: PropTypes.arrayOf(PropTypes.shape({
      min: PropTypes.number,
      max: PropTypes.number,
      color: PropTypes.string,
      label: PropTypes.string,
      action: PropTypes.string,
    })),
    actionsParCategorie: PropTypes.arrayOf(PropTypes.shape({
      category: PropTypes.string,
      color: PropTypes.string,
      action: PropTypes.string,
    })),
  }),
};
