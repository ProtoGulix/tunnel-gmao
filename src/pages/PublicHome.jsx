// ===== IMPORTS =====
// 1. React core

// 2. React Router
import { useNavigate } from 'react-router-dom';

// 3. UI Libraries (Radix)
import { Box, Flex, Grid, Card, Text, Button, Heading, Container } from '@radix-ui/themes';

// 4. Icons (conformément aux conventions, via '@/lib/icons')
import { ShoppingCart, ClipboardList } from '@/lib/icons';

// ===== MAIN COMPONENT =====
/**
 * Page d'accueil publique avec accès aux services publics.
 * 
 * Permet aux utilisateurs externes de soumettre :
 * - Demandes d'achat (pièces, équipements)
 * - Demandes d'intervention (signalement pannes, maintenance)
 * 
 * Le personnel autorisé peut se connecter via la sidebar.
 *
 * @component
 * @returns {JSX.Element} Page d'accueil sobre avec 2 cartes CTA
 *
 * @example
 * // Route publique dans App.jsx
 * <Route path="/" element={<PublicHome />} />
 */
export default function PublicHome() {
  // ----- Router Hooks -----
  const navigate = useNavigate();

  // ===== HANDLERS =====
  const handlePurchaseRequest = () => {
    navigate('/public/purchase-request');
  };

  const handleInterventionRequest = () => {
    navigate('/public/intervention-request');
  };

  // ===== RENDER =====
  return (
    <Box style={{ minHeight: '100vh', background: 'var(--gray-1)' }}>
      <Container size="3" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <Flex direction="column" gap="6">
          {/* Hero Section */}
          <Box>
            <Heading size="7" mb="3">
              Comment pouvons-nous vous aider ?
            </Heading>
            <Text size="3" color="gray">
              Soumettez une demande d&apos;achat ou d&apos;intervention ci-dessous.
            </Text>
          </Box>

          {/* Public Services Cards */}
          <Grid columns={{ initial: '1', sm: '2' }} gap="4" style={{ marginTop: '2rem' }}>
            {/* Purchase Request Card */}
            <Card 
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: '1px solid var(--gray-7)'
              }}
              onClick={handlePurchaseRequest}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(31, 58, 95, 0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Flex direction="column" gap="3" align="center" p="4">
                <Box 
                  style={{ 
                    background: 'var(--blue-3)',
                    borderRadius: '50%',
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ShoppingCart size={48} color="var(--blue-9)" />
                </Box>
                <Heading size="5" align="center">Demande d&apos;achat</Heading>
                <Text color="gray" align="center" size="2">
                  Pièces, équipements ou fournitures
                </Text>
                <Button 
                  variant="soft" 
                  size="2" 
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  onClick={handlePurchaseRequest}
                >
                  Accéder au formulaire
                </Button>
              </Flex>
            </Card>

            {/* Intervention Request Card */}
            <Card 
              style={{ 
                cursor: 'pointer',
                transition: 'all 0.2s',
                border: '1px solid var(--gray-7)'
              }}
              onClick={handleInterventionRequest}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(31, 58, 95, 0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Flex direction="column" gap="3" align="center" p="4">
                <Box 
                  style={{ 
                    background: 'var(--amber-3)',
                    borderRadius: '50%',
                    padding: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <ClipboardList size={48} color="var(--amber-9)" />
                </Box>
                <Heading size="5" align="center">Demande d&apos;intervention</Heading>
                <Text color="gray" align="center" size="2">
                  Signaler une panne ou demander une maintenance
                </Text>
                <Button 
                  variant="soft" 
                  size="2" 
                  style={{ width: '100%', marginTop: '0.5rem' }}
                  onClick={handleInterventionRequest}
                >
                  Accéder au formulaire
                </Button>
              </Flex>
            </Card>
          </Grid>
        </Flex>
      </Container>
    </Box>
  );
}
