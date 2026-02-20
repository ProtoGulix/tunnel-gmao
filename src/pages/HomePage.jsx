import { Box, Container, Flex, Heading, Text, Card, Button } from '@radix-ui/themes';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import BrandLogo from '@/components/ui/BrandLogo';

/**
 * Page d'accueil temporaire — Tunnel GMAO V3
 * 
 * Page minimale affichant l'état de la migration V2 → V3.
 * Permet de tester que l'authentification et le routing fonctionnent.
 * 
 * @component
 * @returns {JSX.Element} Page d'accueil avec infos V3
 */
export default function HomePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--gray-2)',
        padding: '2rem',
      }}
    >
      <Container size="2">
        <Card size="4">
          <Flex direction="column" gap="6" align="center">
            {/* Logo */}
            <BrandLogo size="desktop" showTitle={true} logoSizeOverride="400" showSubtitle={true} />

            {/* Message V3 */}
            <Flex direction="column" gap="3" align="center" style={{ textAlign: 'center' }}>
              <Heading size="6" weight="bold">
                🚧 Tunnel GMAO V3 — En Construction 🚧
              </Heading>
              
              <Text size="3" color="gray">
                La nouvelle architecture est en cours de mise en place.
              </Text>

              {user && (
                <Card size="2" variant="surface">
                  <Flex direction="column" gap="2">
                    <Text size="2" weight="bold">
                      Connecté en tant que :
                    </Text>
                    <Text size="2" color="blue">
                      {user.email || 'Utilisateur inconnu'}
                    </Text>
                  </Flex>
                </Card>
              )}
            </Flex>

            {/* Actions */}
            <Flex gap="3">
              {user ? (
                <Button size="3" variant="soft" onClick={handleLogout}>
                  Se déconnecter
                </Button>
              ) : (
                <Button size="3" onClick={() => navigate('/login')}>
                  Se connecter
                </Button>
              )}
            </Flex>

            {/* Info technique */}
            <Card size="2" variant="surface" style={{ width: '100%' }}>
              <Flex direction="column" gap="2">
                <Text size="2" weight="bold">
                  ✅ Éléments fonctionnels
                </Text>
                <Text size="1" color="gray">
                  • Structure V3 créée
                  <br />
                  • Code V2 préservé dans src/_v2
                  <br />
                  • Authentification JWT active
                  <br />
                  • Router React configuré
                  <br />
                  • Layout et composants UI disponibles
                </Text>
              </Flex>
            </Card>
          </Flex>
        </Card>
      </Container>
    </Box>
  );
}
