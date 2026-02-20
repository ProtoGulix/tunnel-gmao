/**
 * @fileoverview Bandeau d'informations d'un équipement
 * @module components/equipements/EquipementInfoBanner
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Card, Box, Flex, Grid, Text, Badge, IconButton } from '@radix-ui/themes';
import { Info, ArrowUpRight, Pencil } from 'lucide-react';
import EquipementEditPanel from './EquipementEditPanel';
import PaginatedList from '@/components/common/PaginatedList';

function InfoField({ label, children }) {
  return (
    <Box>
      <Text size="1" color="gray" weight="medium">{label}</Text>
      <Box mt="1">{children}</Box>
    </Box>
  );
}

InfoField.propTypes = {
  label: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

function EquipementLink({ to, label }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <Flex align="center" gap="1">
        <Text size="2" color="blue" weight="medium">{label}</Text>
        <ArrowUpRight size={12} color="var(--blue-9)" />
      </Flex>
    </Link>
  );
}

EquipementLink.propTypes = {
  to: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

export default function EquipementInfoBanner({ equipement, parentInfo, childrenInfo, onSaved }) {
  const [isEditingMode, setIsEditingMode] = useState(false);

  if (!equipement) return null;

  return (
    <>
      <Card variant="surface" mb="4">
        <Box p="3">
          <Flex align="center" justify="between" mb="3">
            <Flex align="center" gap="2">
              <Info size={16} />
              <Text size="2" weight="bold">Informations</Text>
            </Flex>
            <IconButton
              variant="ghost"
              size="1"
              onClick={() => setIsEditingMode(true)}
              aria-label="Modifier"
              disabled={isEditingMode}
            >
              <Pencil size={14} />
            </IconButton>
          </Flex>

          <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="4">
            <InfoField label="Code">
              <Text size="2" weight="bold">{equipement.code || '—'}</Text>
            </InfoField>

            <InfoField label="Nom">
              <Text size="2" weight="bold">{equipement.name || '—'}</Text>
            </InfoField>

            <InfoField label="Classe">
              {equipement.equipmentClass ? (
                <Badge variant="soft" color="blue" size="1">
                  {equipement.equipmentClass.code} – {equipement.equipmentClass.label}
                </Badge>
              ) : (
                <Text size="2" color="gray">Non classé</Text>
              )}
            </InfoField>

            <InfoField label="Équipement mère">
              {parentInfo ? (
                <EquipementLink
                  to={`/equipements/${parentInfo.id}`}
                  label={`${parentInfo.code || '—'} – ${parentInfo.name}`}
                />
              ) : (
                <Text size="2" color="gray">Aucun</Text>
              )}
            </InfoField>

            <InfoField label="Sous-équipements">
              <PaginatedList
                items={childrenInfo}
                pageSize={8}
                emptyText="Aucun"
                itemLabel="sous-equipement"
                renderItem={(child) => (
                  <EquipementLink
                    to={`/equipements/${child.id}`}
                    label={`${child.code || '—'} – ${child.name}`}
                  />
                )}
              />
            </InfoField>

            <InfoField label="Equipement mere">
              <Text size="2" weight="bold">
                {childrenInfo.length > 0 ? 'Oui' : 'Non'}
              </Text>
            </InfoField>
          </Grid>
        </Box>
      </Card>

      {isEditingMode && (
        <EquipementEditPanel
          equipement={equipement}
          onSaved={onSaved}
          onCancel={() => setIsEditingMode(false)}
        />
      )}
    </>
  );
}

EquipementInfoBanner.propTypes = {
  equipement: PropTypes.shape({
    code: PropTypes.string,
    name: PropTypes.string,
    parentId: PropTypes.string,
    equipmentClass: PropTypes.shape({
      id: PropTypes.string,
      code: PropTypes.string,
      label: PropTypes.string,
    }),
  }),
  parentInfo: PropTypes.shape({
    id: PropTypes.string.isRequired,
    code: PropTypes.string,
    name: PropTypes.string.isRequired,
  }),
  childrenInfo: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      code: PropTypes.string,
      name: PropTypes.string.isRequired,
    })
  ),
  onSaved: PropTypes.func,
};
