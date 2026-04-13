/**
 * @fileoverview Bannière d'infos d'un équipement
 * @module components/equipements/equipementInfoBanner
 */

import { Link } from 'react-router-dom';
import { Box, Card, Callout, Flex, Grid, Text, Badge } from '@radix-ui/themes';
import { BanIcon } from 'lucide-react';
import PropTypes from 'prop-types';
import EquipementHealthBadge from '@/components/ui/EquipementHealthBadge';

function InfoField({ label, children }) {
  return (
    <Box>
      <Text size="1" color="gray" weight="medium">
        {label}
      </Text>
      <Box mt="2">{children}</Box>
    </Box>
  );
}

InfoField.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

function EquipementLink({ to, label, children }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <Flex align="center" gap="2">
        <Text size="2" weight="medium" color="blue">
          {label}
        </Text>
        {children}
      </Flex>
    </Link>
  );
}

EquipementLink.propTypes = {
  to: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  children: PropTypes.node,
};

export default function EquipementInfoBanner({
  equipement,
  health,
  parent,
}) {
  if (!equipement) return null;

  const interventionsBlocked = equipement.statut?.interventions === false;

  return (
    <Box mb="5">
      {interventionsBlocked && (
        <Callout.Root color="red" variant="soft" mb="3">
          <Callout.Icon><BanIcon size={16} /></Callout.Icon>
          <Callout.Text>
            Cet équipement est en statut <strong>{equipement.statut.label}</strong> — la création d&apos;interventions est bloquée.
          </Callout.Text>
        </Callout.Root>
      )}
    <Card style={{ marginBottom: '0', padding: '1.5rem' }}>
      <Grid columns="2" gap="3">
        {/* Colonne gauche */}
        <Box>
          <InfoField label="Code">
            <Text weight="medium" size="3">
              {equipement.code || '—'}
            </Text>
          </InfoField>

          <Box mt="4">
            <InfoField label="Nom">
              <Text weight="medium" size="3">
                {equipement.name}
              </Text>
            </InfoField>
          </Box>

          <Box mt="4">
            <InfoField label="Classe">
              {equipement.equipement_class ? (
                <Badge variant="soft" size="2">
                  {equipement.equipement_class.code}
                </Badge>
              ) : (
                <Text color="gray">—</Text>
              )}
            </InfoField>
          </Box>
        </Box>

        {/* Colonne droite */}
        <Box>
          <InfoField label="État de santé">
            <Flex align="center" gap="2" mt="1">
              <EquipementHealthBadge level={health.level} showLabel />
              <Text size="2" color="gray">
                {health.reason}
              </Text>
            </Flex>
          </InfoField>

          <Box mt="4">
            <InfoField label="Statut">
              {equipement.statut ? (
                <Flex align="center" gap="2">
                  <Badge
                    variant="soft"
                    style={{
                      backgroundColor: equipement.statut.couleur ? `${equipement.statut.couleur}22` : 'var(--gray-3)',
                      color: equipement.statut.couleur || 'var(--gray-11)',
                      border: `1px solid ${equipement.statut.couleur || 'var(--gray-6)'}44`,
                    }}
                  >
                    {equipement.statut.label}
                  </Badge>
                  {equipement.statut.interventions === false && (
                    <Text size="1" color="gray">Interventions bloquées</Text>
                  )}
                </Flex>
              ) : (
                <Text color="gray" size="2">—</Text>
              )}
            </InfoField>
          </Box>

          {health.rules_triggered && health.rules_triggered.length > 0 && (
            <Box mt="4">
              <InfoField label="Règles déclenchées">
                <Flex gap="2" wrap="wrap">
                  {health.rules_triggered.map((rule) => (
                    <Badge key={rule} variant="soft" color="orange" size="1">
                      {rule}
                    </Badge>
                  ))}
                </Flex>
              </InfoField>
            </Box>
          )}

          {parent && (
            <Box mt="4">
              <InfoField label="Équipement parent">
                <EquipementLink
                  to={`/equipements/${parent.id}`}
                  label={[parent.code, parent.name].filter(Boolean).join(' – ')}
                />
              </InfoField>
            </Box>
          )}
        </Box>
      </Grid>
    </Card>
    </Box>
  );
}

EquipementInfoBanner.propTypes = {
  equipement: PropTypes.object.isRequired,
  health: PropTypes.object.isRequired,
  parent: PropTypes.shape({ id: PropTypes.string, code: PropTypes.string, name: PropTypes.string }),
};
