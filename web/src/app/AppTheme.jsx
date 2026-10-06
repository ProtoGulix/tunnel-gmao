import PropTypes from 'prop-types';
import { Theme } from '@radix-ui/themes';
import { useThemeAppearance } from '@/hooks/shared/useThemeAppearance';

/**
 * Point d'insertion unique pour le thème Radix. Isolé de main.jsx pour qu'un
 * futur toggle clair/sombre puisse piloter `appearance` sans toucher au
 * bootstrap de l'app. Actuellement toujours 'light' tant qu'aucun toggle UI
 * n'appelle useThemeAppearance().setAppearance — aucun changement de rendu.
 */
export default function AppTheme({ children }) {
  const { appearance } = useThemeAppearance();

  return (
    <Theme accentColor="blue" grayColor="slate" radius="medium" scaling="95%" appearance={appearance}>
      {children}
    </Theme>
  );
}

AppTheme.propTypes = {
  children: PropTypes.node.isRequired,
};
