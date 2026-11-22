/**
 * Les deux blocs d'action de la fenêtre « Fiches fermées » : Exporter (PDF, ZIP, marquage
 * imprimé) et Archiver (sans exporter, avec confirmation). Côte à côte, l'un sous l'autre
 * sur écran étroit.
 */

import PropTypes from 'prop-types';
import { Button, Card, Flex, Grid, Heading, Text } from '@radix-ui/themes';
import { Archive, CheckCheck, Download, Printer } from 'lucide-react';
import ArchiveConfirmation from '@/components/interventions/ArchiveConfirmation';
import { ResultCallout } from '@/components/interventions/ExportFeedback';

function Block({ title, help, children }) {
  return (
    <Card>
      <Flex direction="column" gap="2">
        <Heading as="h3" size="3">{title}</Heading>
        <Text size="2" color="gray">{help}</Text>
        {children}
      </Flex>
    </Card>
  );
}

Block.propTypes = { title: PropTypes.string.isRequired, help: PropTypes.string.isRequired, children: PropTypes.node };

export function ExportBlock({ onExport, onMark, disabled, busyFormat, canMark, marking, markResult }) {
  return (
    <Block title="Exporter" help="Pour imprimer ou classer les fiches.">
      <Button variant="soft" disabled={disabled} loading={busyFormat === 'pdf'} onClick={() => onExport('pdf')}>
        <Printer size={16} />
        Imprimer (PDF)
      </Button>
      <Button disabled={disabled} loading={busyFormat === 'zip'} onClick={() => onExport('zip')}>
        <Download size={16} />
        Télécharger (ZIP)
      </Button>
      {canMark && (
        <Button variant="soft" color="green" loading={marking} onClick={onMark}>
          <CheckCheck size={16} />
          Marquer ces fiches comme imprimées
        </Button>
      )}
      <ResultCallout result={markResult} />
    </Block>
  );
}

ExportBlock.propTypes = {
  onExport: PropTypes.func.isRequired,
  onMark: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  busyFormat: PropTypes.string,
  canMark: PropTypes.bool,
  marking: PropTypes.bool,
  markResult: PropTypes.string,
};

export function ArchiveBlock({
  onArchive, onConfirm, onCancel, disabled, marking, confirming, count, archiveResult, scope,
}) {
  const label = count > 0 ? `Archiver ${count} ${count > 1 ? 'fiches' : 'fiche'}` : 'Archiver';
  return (
    <Block title="Archiver" help="Sortir les fiches de la liste, sans les imprimer.">
      <Button variant="soft" color="orange" disabled={disabled} loading={marking} onClick={onArchive}>
        <Archive size={16} />
        {label}
      </Button>
      {confirming && (
        <ArchiveConfirmation {...scope} count={count} onConfirm={onConfirm} onCancel={onCancel} />
      )}
      <ResultCallout result={archiveResult} />
    </Block>
  );
}

ArchiveBlock.propTypes = {
  onArchive: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  marking: PropTypes.bool,
  confirming: PropTypes.bool,
  count: PropTypes.number,
  archiveResult: PropTypes.string,
  scope: PropTypes.object,
};

export function ExportBlocks({ children }) {
  return <Grid columns={{ initial: '1', sm: '2' }} gap="3">{children}</Grid>;
}

ExportBlocks.propTypes = { children: PropTypes.node };
