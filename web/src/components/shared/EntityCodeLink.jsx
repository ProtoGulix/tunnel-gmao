/**
 * EntityCodeLink — code interne (intervention, demande d'achat) cliquable.
 *
 * Règle (ADR 0009) : un code avec icône est un lien, un code sans icône n'en
 * est pas un. Sans id connu : badge seul. Id connu mais code vide : « sans code ».
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Badge } from '@radix-ui/themes';
import { ExternalLink } from 'lucide-react';
import { entityCodeLabel, entityCodeTitle, entityCodeUrl } from './entityCodeUrl';

const FONT_SIZE = { 1: 11, 2: 12, 3: 13 };

export function EntityCodeLink({ type, id, code, size = 2 }) {
  const [hover, setHover] = useState(false);
  const hasId = id !== undefined && id !== null && id !== '';
  const hasCode = Boolean(code);
  const badgeStyle = {
    fontFamily: 'monospace',
    fontWeight: 700,
    fontSize: FONT_SIZE[size] ?? 12,
    flexShrink: 0,
  };

  if (!hasId) {
    if (!hasCode) return null;
    return (
      <Badge variant="outline" color="gray" size={size} style={badgeStyle}>
        {code}
      </Badge>
    );
  }

  return (
    <Link
      to={entityCodeUrl(type, id)}
      title={entityCodeTitle(type, code)}
      onClick={(e) => e.stopPropagation()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{ textDecoration: 'none', flexShrink: 0, cursor: 'pointer' }}
    >
      <Badge
        variant="outline"
        color={hover ? 'blue' : 'gray'}
        size={size}
        style={{
          ...badgeStyle,
          gap: 4,
          fontStyle: hasCode ? 'normal' : 'italic',
          fontWeight: hasCode ? 700 : 400,
        }}
      >
        {entityCodeLabel(code)}
        <ExternalLink size={12} />
      </Badge>
    </Link>
  );
}

EntityCodeLink.propTypes = {
  type: PropTypes.oneOf(['intervention', 'purchase_request']).isRequired,
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  code: PropTypes.string,
  size: PropTypes.oneOf([1, 2, 3]),
};
