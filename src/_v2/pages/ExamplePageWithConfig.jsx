// ===== IMPORTS =====
// 1. React Core
import { useEffect, useState, useCallback } from "react";

// 2. UI Libraries (Radix)
import { Container, Box } from "@radix-ui/themes";

// 3. Custom Components
import PageHeader from "@/components/layout/PageHeader";

// 4. Custom Hooks
import { usePageHeaderProps } from "@/hooks/usePageConfig";

// ===== COMPONENT =====
/**
 * Example page demonstrating centralized header configuration.
 * Shows three methods to use usePageHeaderProps hook:
 * 1. Auto-generated props from menuConfig
 * 2. Override dynamic values (subtitle, badges)
 * 3. Add custom actions (export, refresh, add)
 *
 * @component
 * @returns {JSX.Element} Example page with different header configurations
 *
 * @example
 * <Route path="/example" element={<ExamplePageWithConfig />} />
 */
export default function ExamplePageWithConfig() {
  // ----- State -----
  const [data, /* setData */] = useState([]);
  const [loading, setLoading] = useState(true);

  // ----- Callbacks -----
  const loadData = useCallback(async () => {
    setLoading(true);
    // TODO: Implement your data loading logic here
    // Example: const result = await api.fetchData();
    // setData(result);
    setLoading(false);
  }, []);

  const handleExport = useCallback(() => {
    // TODO: Implement export logic
  }, []);

  const handleAdd = useCallback(() => {
    // TODO: Implement add logic
  }, []);

  // ----- Effects -----
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ----- Header Configurations -----
  
  // Method 1: Use hook to auto-generate props
  // Icon, title and subtitle come automatically from menuConfig.js
  const headerProps = usePageHeaderProps();
  
  // Method 2: Override certain dynamic values
  // eslint-disable-next-line no-unused-vars
  const headerPropsWithOverride = usePageHeaderProps({
    subtitle: `${data.length} elements found`,
    urgentBadge: data.filter(d => d.urgent).length > 0 ? {
      count: data.filter(d => d.urgent).length,
      label: "Urgent"
    } : null,
  });
  
  // Method 3: Add custom actions
  // eslint-disable-next-line no-unused-vars
  const completeHeaderProps = usePageHeaderProps({
    actions: [
      {
        label: "Export",
        onClick: handleExport,
        variant: "soft"
      }
    ],
    onRefresh: loadData,
    onAdd: handleAdd,
    addLabel: "+ New Entry"
  });

  // ----- Main Render -----
  return (
    <Container size="4">
      {/* Simple: all info comes from config */}
      <PageHeader {...headerProps} />
      
      {/* With override for dynamic info */}
      {/* <PageHeader {...headerPropsWithOverride} /> */}
      
      {/* With custom actions */}
      {/* <PageHeader {...completeHeaderProps} /> */}

      <Box>
        {/* Your page content */}
        {loading ? (
          <Box>Loading...</Box>
        ) : (
          <Box>Content with {data.length} items</Box>
        )}
      </Box>
    </Container>
  );
}
