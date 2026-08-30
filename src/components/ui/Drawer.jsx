/**
 * @fileoverview Panneau latéral (drawer) plein écran ancré à droite, basé sur Radix Dialog
 * pour l'accessibilité (piège de focus, Échap, aria) — sans le style de modale centrée.
 * @module components/ui/Drawer
 */
import { Dialog, Flex, IconButton, Text } from '@radix-ui/themes';
import { X } from 'lucide-react';
import PropTypes from 'prop-types';

export default function Drawer({ open, onOpenChange, title, width = 480, children }) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Content
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          margin: 0,
          height: '100vh',
          maxHeight: '100vh',
          width,
          maxWidth: '100vw',
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          animation: 'none',
        }}
      >
        <Flex align="center" justify="between" p="4" style={{ borderBottom: '1px solid var(--gray-5)', flexShrink: 0 }}>
          <Dialog.Title mb="0"><Text size="4" weight="bold">{title}</Text></Dialog.Title>
          <Dialog.Close>
            <IconButton variant="ghost" color="gray" aria-label="Fermer">
              <X size={18} />
            </IconButton>
          </Dialog.Close>
        </Flex>
        <Flex direction="column" p="4" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {children}
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

Drawer.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  children: PropTypes.node,
};
