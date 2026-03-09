/**
 * @fileoverview Bouton avec état de chargement/succès intégré (Level 1)
 * @module components/ui/StatusButton
 *
 * @example
 * <StatusButton status={status} size="1" type="submit" disabled={!valid}>
 *   Enregistrer
 * </StatusButton>
 */

import PropTypes from 'prop-types';
import { Button } from '@radix-ui/themes';
import { Loader2, Check } from 'lucide-react';

const SPIN = { display: 'inline-flex', animation: 'spin 0.6s linear infinite' };
const ICON = { display: 'inline-flex' };

export function StatusButton({ status = 'idle', children, disabled, ...props }) {
  return (
    <Button {...props} disabled={status === 'loading' || disabled}>
      {status === 'loading' && <span style={SPIN}><Loader2 size={12} /></span>}
      {status === 'success' && <span style={ICON}><Check size={12} /></span>}
      {children}
    </Button>
  );
}

StatusButton.propTypes = {
  status: PropTypes.oneOf(['idle', 'loading', 'success', 'error']),
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
};
