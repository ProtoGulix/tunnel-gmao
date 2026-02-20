// ===== IMPORTS =====
import { useNavigate } from 'react-router-dom';
import { Box, Container, Flex, Heading, Text, Button } from '@radix-ui/themes';
import { Home, AlertTriangle } from 'lucide-react';

// ===== COMPONENT =====
/**
 * 404 Not Found page.
 * Displays when user tries to access a non-existent route.
 *
 * @component
 * @returns {JSX.Element} 404 error page with navigation options
 *
 * @example
 * <Route path="*" element={<NotFound />} />
 */
export default function NotFound() {
  // ----- Router Hooks -----
  const navigate = useNavigate();

  // ----- Handlers -----
  const handleGoHome = () => {
    navigate('/interventions', { replace: true });
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  // ----- Main Render -----
  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--gray-2)',
        padding: '2rem'
      }}
    >
      <Container size="1" style={{ maxWidth: '600px' }}>
        <Flex direction="column" align="center" gap="6">
          {/* Icon */}
          <Box
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'var(--orange-3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <AlertTriangle size={60} color="var(--orange-9)" />
          </Box>

          {/* Title & Message */}
          <Flex direction="column" align="center" gap="2">
            <Heading size="8" align="center">
              404
            </Heading>
            <Heading size="5" align="center" color="gray">
              Page introuvable
            </Heading>
            <Text size="3" color="gray" align="center" style={{ maxWidth: '400px' }}>
              La page que vous recherchez n&#39;existe pas ou a été déplacée.
            </Text>
          </Flex>

          {/* Actions */}
          <Flex gap="3" wrap="wrap" justify="center">
            <Button size="3" onClick={handleGoHome}>
              <Home size={16} />
              Retour à l&#39;accueil
            </Button>
            <Button size="3" variant="soft" onClick={handleGoBack}>
              Retour
            </Button>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}
