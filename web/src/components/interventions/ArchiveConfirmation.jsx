/**
 * Confirmation de l'archivage en masse (ADR 0040) : rappelle la période, l'équipement
 * éventuel et l'effet (les fiches sortent de la liste). Aucun appel tant qu'on n'a pas confirmé.
 */

import PropTypes from 'prop-types';
import { Button, Callout, Flex } from '@radix-ui/themes';
import { Archive } from 'lucide-react';
import { formatInterventionDate } from '@/lib/utils/interventionUtils';

export default function ArchiveConfirmation({ dateFrom, dateTo, equipement, count, onConfirm, onCancel }) {
  const scope = equipement ? ` de l'équipement ${equipement.code} (${equipement.name})` : '';
  return (
    <Callout.Root color="orange" size="1" role="alertdialog">
      <Callout.Icon><Archive size={16} /></Callout.Icon>
      <Callout.Text>
        Archiver {count > 1 ? `les ${count} fiches fermées` : count === 1 ? 'la fiche fermée' : 'les fiches fermées'} du {formatInterventionDate(dateFrom)} au {formatInterventionDate(dateTo)}{scope} sans les exporter ?
        Ces fiches sortiront de la liste des interventions. L’archivage ne se défait pas depuis l’écran.
        <Flex gap="2" mt="2" wrap="wrap">
          <Button size="1" color="orange" onClick={onConfirm}>Archiver</Button>
          <Button size="1" variant="soft" color="gray" onClick={onCancel}>Annuler</Button>
        </Flex>
      </Callout.Text>
    </Callout.Root>
  );
}

ArchiveConfirmation.propTypes = {
  dateFrom: PropTypes.string.isRequired,
  dateTo: PropTypes.string.isRequired,
  count: PropTypes.number,
  equipement: PropTypes.shape({ code: PropTypes.string, name: PropTypes.string }),
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
