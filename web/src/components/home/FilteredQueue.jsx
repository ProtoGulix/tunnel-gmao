/**
 * @fileoverview Liste filtrée à gauche, détail de la ligne choisie à droite (sous le rappel du bilan, sur la hauteur restante).
 * @module components/home/FilteredQueue
 */
import PropTypes from 'prop-types';
import { Box, Text } from '@radix-ui/themes';
import { ListChecks } from 'lucide-react';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import QueueSections from '@/components/home/QueueSections';
import QueueDetail from '@/components/home/QueueDetail';

export default function FilteredQueue({ title, home, canAnticipate, anticipate, onAccept }) {
  const { sections, lines, failed, selectedKey, select, target } = home;
  return (
    <Box px="4" pt="2" pb="2" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
      <MasterDetailLayout
        freeDetail
        ratio="40% 1fr"
        masterProps={{
          icon: ListChecks,
          title,
          count: lines.length,
          children: lines.length === 0 && failed.length === 0
            ? <Text as="p" color="gray" m="3">Rien à traiter.</Text>
            : <QueueSections sections={sections} selectedKey={selectedKey} onSelect={select} />,
        }}
        detailChildren={target ? (
          <QueueDetail
            target={target}
            row={lines.find((l) => l.key === selectedKey)?.row}
            requests={home.requestItems}
            canAnticipate={canAnticipate}
            anticipate={anticipate}
            onAccept={onAccept}
            onChanged={home.reload}
          />
        ) : null}
        emptyLabel="Sélectionnez une ligne pour voir son détail"
      />
    </Box>
  );
}

FilteredQueue.propTypes = {
  title: PropTypes.string.isRequired,
  home: PropTypes.object.isRequired,
  canAnticipate: PropTypes.bool,
  anticipate: PropTypes.object.isRequired,
  onAccept: PropTypes.func.isRequired,
};
