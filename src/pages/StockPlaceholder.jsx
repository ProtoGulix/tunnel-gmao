import { Box, Container, Heading, Text } from "@radix-ui/themes";
import PageHeader from "@/components/layout/PageHeader";
import { usePageHeaderProps } from "@/hooks/usePageConfig";

export default function StockPlaceholder() {
  const headerProps = usePageHeaderProps();

  return (
    <Box>
      <PageHeader {...headerProps} />
      <Container size="4" p="6">
        <Box style={{ textAlign: "center", padding: "60px 20px" }}>
          <Heading size="6" mb="3">
            Page Stock
          </Heading>
          <Text color="gray" size="3">
            Cette page est en cours de développement.
          </Text>
        </Box>
      </Container>
    </Box>
  );
}
