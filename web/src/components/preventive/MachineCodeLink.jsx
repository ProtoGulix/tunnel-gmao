/**
 * @fileoverview Code d'un équipement cliquable vers sa fiche (ADR 0009 : code avec icône = lien)
 * @module components/preventive/MachineCodeLink
 */

import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Badge } from '@radix-ui/themes';
import { ExternalLink } from 'lucide-react';

export default function MachineCodeLink({ id, code }) {
  if (!id || !code) return code ? <Badge variant="outline" color="gray" style={{ fontFamily: 'monospace' }}>{code}</Badge> : null;
  return (
    <Link to={`/equipements?id=${encodeURIComponent(id)}`} title={`Ouvrir la fiche équipement ${code}`} style={{ textDecoration: 'none' }}>
      <Badge variant="outline" color="gray" style={{ fontFamily: 'monospace', fontWeight: 700, gap: 4 }}>
        {code}<ExternalLink size={12} />
      </Badge>
    </Link>
  );
}

MachineCodeLink.propTypes = { id: PropTypes.string, code: PropTypes.string };
