import PropTypes from 'prop-types';
import { Flex, Text, Button, Dialog, Separator } from '@radix-ui/themes';

export default function ChangelogModal({ open, entries, dismissing, onClose }) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <Dialog.Content style={{ maxWidth: 560 }}>
        <Dialog.Title>Nouveautés</Dialog.Title>
        <Flex direction="column" gap="4" mt="2" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          {entries.map((entry) => (
            <Flex key={entry.version} direction="column" gap="2">
              <Text size="2" weight="bold" color="gray">
                Version {entry.version}{entry.date ? ` — ${entry.date}` : ''}
              </Text>
              {entry.sections.map((section) => (
                <Flex key={section.title} direction="column" gap="1" ml="2">
                  <Text size="2" weight="medium" as="div">{section.title}</Text>
                  <ul style={{ margin: 0, paddingLeft: '1.25em' }}>
                    {section.items.map((item, idx) => (
                      <li key={idx}>
                        <Text size="2">{item}</Text>
                      </li>
                    ))}
                  </ul>
                </Flex>
              ))}
              <Separator size="4" mt="1" />
            </Flex>
          ))}
        </Flex>
        <Flex justify="end" mt="4">
          <Button variant="solid" type="button" disabled={dismissing} onClick={onClose}>
            {dismissing ? 'Fermeture...' : 'Compris'}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

ChangelogModal.propTypes = {
  open: PropTypes.bool.isRequired,
  entries: PropTypes.arrayOf(PropTypes.shape({
    version: PropTypes.string.isRequired,
    date: PropTypes.string,
    sections: PropTypes.arrayOf(PropTypes.shape({
      title: PropTypes.string.isRequired,
      items: PropTypes.arrayOf(PropTypes.string).isRequired,
    })).isRequired,
  })).isRequired,
  dismissing: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
