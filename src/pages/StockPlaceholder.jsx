// ===== IMPORTS =====
// 1. UI Libraries (Radix)
import { Box, Container, Heading, Text } from "@radix-ui/themes";

// 2. Custom Components
import PageHeader from "@/components/layout/PageHeader";

// 3. Custom Hooks
import { usePageHeaderProps } from "@/hooks/usePageConfig";

// ===== COMPONENT =====
/**
 * Stock placeholder page displayed during development.
 * Temporary page shown while the full stock management feature is being implemented.
 *
 * @component
 * @returns {JSX.Element} Placeholder page with development message
 *
 * @example
 * <Route path="/stock" element={<StockPlaceholder />} />
 */
export default function StockPlaceholder() {
  // ----- Custom Hooks -----
  const headerProps = usePageHeaderProps();

  // ----- Main Render -----
  return (
    <Box>
      <PageHeader {...headerProps} />
      <Container size="4" p="6">
        <Box style={{ textAlign: "center", padding: "60px 20px" }}>
          <Heading size="6" mb="3">
            Stock Page
          </Heading>
          <Text color="gray" size="3">
            This page is under development.
          </Text>
        </Box>
      </Container>
    </Box>
  );
}
