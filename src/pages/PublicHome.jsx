// ===== IMPORTS =====
import { Box, Flex, Grid, Card, Text, Button, Heading, Container } from '@radix-ui/themes';
import { ShoppingCartIcon, ClipboardListIcon, LogInIcon, WrenchIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ===== COMPONENT =====
export default function PublicHome() {
  const navigate = useNavigate();

  // ----- Main Render -----
  return (
    <Box style={{ minHeight: '100vh', background: 'var(--gray-2)' }}>
      {/* Header */}
      <Box 
        style={{ 
          background: 'linear-gradient(135deg, var(--accent-9) 0%, var(--accent-10) 100%)',
          padding: '2rem 0',
          marginBottom: '3rem'
        }}
      >
        <Container size="4">
          <Flex justify="between" align="center">
            <Flex direction="column" gap="2">
              <Heading size="8" style={{ color: 'white' }}>
                <WrenchIcon size={32} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />
                GMAO MVP
              </Heading>
              <Text size="4" style={{ color: 'white', opacity: 0.9 }}>
                Système de gestion de maintenance
              </Text>
            </Flex>
            <Button 
              size="3" 
              variant="surface"
              onClick={() => navigate('/login')}
            >
              <LogInIcon size={18} />
              Connexion Personnel
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Welcome Section */}
          <Box>
            <Heading size="6" mb="2">Bienvenue</Heading>
            <Text color="gray" size="3">
              Vous pouvez soumettre une demande d'achat ou une demande d'intervention en utilisant les formulaires ci-dessous.
            </Text>
          </Box>

          {/* Public Services Cards */}
          <Grid columns={{ initial: '1', sm: '2' }} gap="4">
            {/* Purchase Request Card */}
            <Card 
              style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
              onClick={() => navigate('/public/purchase-request')}
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
                  <ShoppingCartIcon size={48} color="var(--blue-9)" />
                </Box>
                <Heading size="5" align="center">Demande d'Achat</Heading>
                <Text color="gray" align="center" size="2">
                  Soumettez une demande d'achat de pièces ou d'équipements
                </Text>
                <Button variant="soft" size="2" style={{ width: '100%' }}>
                  Accéder au formulaire
                </Button>
              </Flex>
            </Card>

            {/* Intervention Request Card */}
            <Card 
              style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
              onClick={() => navigate('/public/intervention-request')}
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
                  <ClipboardListIcon size={48} color="var(--amber-9)" />
                </Box>
                <Heading size="5" align="center">Demande d'Intervention</Heading>
                <Text color="gray" align="center" size="2">
                  Signalez un problème ou demandez une intervention de maintenance
                </Text>
                <Button variant="soft" size="2" style={{ width: '100%' }}>
                  Accéder au formulaire
                </Button>
              </Flex>
            </Card>
          </Grid>

          {/* Info Section */}
          <Card mt="4">
            <Flex direction="column" gap="2" p="3">
              <Heading size="4">Personnel autorisé</Heading>
              <Text color="gray" size="2">
                Si vous faites partie du personnel de maintenance, cliquez sur le bouton "Connexion Personnel" 
                en haut à droite pour accéder à toutes les fonctionnalités de gestion.
              </Text>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Box>
  );
}
