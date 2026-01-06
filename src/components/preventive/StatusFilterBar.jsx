/**
 * @fileoverview Barre de filtres par statut pour préconisations
 */

import PropTypes from 'prop-types';
import { Flex, Button } from '@radix-ui/themes';

const STATUS_DISPLAY = {
  NEW: { label: 'En attente', color: 'blue' },
  REVIEWED: { label: 'Examinée', color: 'gray' },
  ACCEPTED: { label: 'Acceptée', color: 'green' },
  REJECTED: { label: 'Rejetée', color: 'red' },
};

/**
 * Barre de filtres par statut
 */
export default function StatusFilterBar({ currentStatus, onChange }) {
  return (
    <Flex gap="2" mb="4">
      {Object.entries(STATUS_DISPLAY).map(([status, config]) => (
        <Button
          key={status}
          onClick={() => onChange(status)}
          variant={currentStatus === status ? 'solid' : 'soft'}
          color={config.color}
          size="sm"
        >
          {config.label}
        </Button>
      ))}
    </Flex>
  );
}

StatusFilterBar.propTypes = {
  currentStatus: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
