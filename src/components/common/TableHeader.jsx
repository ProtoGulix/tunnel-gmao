import { Flex, Text, TextField, Button, Box} from "@radix-ui/themes";
import { RefreshCw, X } from "lucide-react";

export default function TableHeader({
  icon: Icon,
  title,
  count,
  searchValue = "",
  onSearchChange = () => {},
  onRefresh = () => {},
  loading = false,
  searchPlaceholder = "Recherche...",
  searchLabel = "Recherche",
  showResetButton = true,
  showRefreshButton = true,
  mb = "3",
  actions,
  children,
}) {
  const hasFilters = searchValue.trim().length > 0;

  return (
    <Box mb={mb}>
      <Flex align="end" justify="between" gap="3" wrap="wrap">
        <Flex align="center" gap="2">
          {Icon && <Icon size={18} />}
          <Text weight="bold">{title}</Text>
          {count !== undefined && <Text color="gray" size="2">{count} élément(s)</Text>}
        </Flex>
        <Flex align="end" gap="2">
          {actions && <Flex gap="2" align="end">{actions}</Flex>}
          <Box style={{ minWidth: 280 }}>
            <Text size="1" color="gray" mb="1" style={{ display: "block" }}>
              {searchLabel}
            </Text>
            <TextField.Root
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </Box>
          {showResetButton && hasFilters && (
            <Button
              variant="soft"
              color="gray"
              onClick={() => onSearchChange("")}
              size="2"
            >
              Réinitialiser
            </Button>
          )}
          {showRefreshButton && (
            <Button size="2" onClick={onRefresh} disabled={loading}>
              <RefreshCw size={14} />
              Rafraîchir
            </Button>
          )}
        </Flex>
      </Flex>
      
      {hasFilters && (
        <Flex mt="2" gap="2" wrap="wrap">
          <Button 
            size="1" 
            variant="soft" 
            aria-label="Supprimer le filtre de recherche" 
            onClick={() => onSearchChange("")}
          >
            Recherche: &quot;{searchValue}&quot; 
            <X size={12} style={{ marginLeft: 4 }} />
          </Button>
        </Flex>
      )}
      
      {children}
    </Box>
  );
}
