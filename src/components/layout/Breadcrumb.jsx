import PropTypes from 'prop-types';
import { Link, useLocation } from 'react-router-dom';
import { Flex, Text } from '@radix-ui/themes';
import { ChevronRight } from 'lucide-react';
import { PAGES_CONFIG, SECTION_LABELS } from '@/config/menuConfig';

// Trouve la page dont le path est le préfixe le plus long du pathname courant —
// couvre les sous-routes de détail (ex: /interventions/:id) sans avoir besoin
// de les déclarer une à une dans PAGES_CONFIG.
export function findPageForPath(pathname) {
  let best = null;
  for (const page of PAGES_CONFIG) {
    if (page.path === '/') {
      if (pathname === '/' && (!best || best.path.length < 1)) best = page;
      continue;
    }
    if (pathname === page.path || pathname.startsWith(`${page.path}/`)) {
      if (!best || page.path.length > best.path.length) best = page;
    }
  }
  return best;
}

/**
 * Fil d'Ariane dérivé de PAGES_CONFIG : Section > Page.
 * N'affiche rien sur la page d'accueil.
 *
 * @param {boolean} [inline] - Mode compact sans padding propre, destiné à être
 *   posé au-dessus du titre dans PageHeader (hérite du padding du conteneur).
 */
export default function Breadcrumb({ inline = false, marginBottom }) {
  const { pathname } = useLocation();
  const page = findPageForPath(pathname);

  if (!page || page.path === '/') return null;

  const sectionLabel = SECTION_LABELS[page.section];
  const style = inline
    ? { marginBottom: 6 }
    : { padding: '10px 24px', marginBottom };

  return (
    <Flex align="center" gap="1" style={style} aria-label="Fil d'Ariane">
      <Text size="1" color="gray">
        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Accueil</Link>
      </Text>
      {sectionLabel && (
        <>
          <ChevronRight size={12} color="var(--gray-8)" />
          <Text size="1" color="gray">{sectionLabel}</Text>
        </>
      )}
      <ChevronRight size={12} color="var(--gray-8)" />
      <Text size="1" color="gray" weight="medium">{page.label}</Text>
    </Flex>
  );
}

Breadcrumb.propTypes = {
  inline: PropTypes.bool,
  marginBottom: PropTypes.string,
};
