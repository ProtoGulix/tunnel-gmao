// ===== IMPORTS =====
// 1. React Router
import { useNavigate } from 'react-router-dom';

// 2. UI Libraries (Radix)
import { Box, Flex, Grid, Card, Text, Button, Heading, Container } from '@radix-ui/themes';

// 3. Icons
import { ShoppingCart, ClipboardList, LogIn, Wrench } from 'lucide-react';

// ===== COMPONENT =====
/**
 * Public home page with access to public services.
 * Provides forms for purchase requests and intervention requests without authentication.
 * Staff members can navigate to the login page from here.
 *
 * @component
 * @returns {JSX.Element} Public landing page with service cards
 *
 * @example
 * <Route path="/" element={<PublicHome />} />
 */
export default function PublicHome() {
  // ----- Router Hooks -----
  const navigate = useNavigate();

  // ----- Handlers -----
  const handleLogin = () => {
    navigate('/login');
  };

  const handlePurchaseRequest = () => {
    navigate('/public/purchase-request');
  };

  const handleInterventionRequest = () => {
    navigate('/public/intervention-request');
  };

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
                <Wrench size={32} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '0.5rem' }} />
                GMAO MVP
              </Heading>
              <Text size="4" style={{ color: 'white', opacity: 0.9 }}>
                Maintenance Management System
              </Text>
            </Flex>
            <Button 
              size="3" 
              variant="surface"
              onClick={handleLogin}
            >
              <LogIn size={18} />
              Staff Login
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* Main Content */}
      <Container size="4">
        <Flex direction="column" gap="6">
          {/* Welcome Section */}
          <Box>
            <Heading size="6" mb="2">Welcome</Heading>
            <Text color="gray" size="3">
              You can submit a purchase request or an intervention request using the forms below.
            </Text>
          </Box>

          {/* Public Services Cards */}
          <Grid columns={{ initial: '1', sm: '2' }} gap="4">
            {/* Purchase Request Card */}
            <Card 
              style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
              onClick={handlePurchaseRequest}
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
                <Heading size="5" align="center">Purchase Request</Heading>
                <Text color="gray" align="center" size="2">
                  Submit a purchase request for parts or equipment
                </Text>
                <Button variant="soft" size="2" style={{ width: '100%' }}>
                  Access Form
                </Button>
              </Flex>
            </Card>

            {/* Intervention Request Card */}
            <Card 
              style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
              onClick={handleInterventionRequest}
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
                <Heading size="5" align="center">Intervention Request</Heading>
                <Text color="gray" align="center" size="2">
                  Report an issue or request a maintenance intervention
                </Text>
                <Button variant="soft" size="2" style={{ width: '100%' }}>
                  Access Form
                </Button>
              </Flex>
            </Card>
          </Grid>

          {/* Info Section */}
          <Card mt="4">
            <Flex direction="column" gap="2" p="3">
              <Heading size="4">Authorized Staff</Heading>
              <Text color="gray" size="2">
                If you are part of the maintenance staff, click on the &quot;Staff Login&quot; 
                button at the top right to access all management features.
              </Text>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </Box>
  );
}
