import { Flex, Text } from "@radix-ui/themes";
import { Factory } from "lucide-react";

export default function ManufacturerBadge({ name, reference, designation }) {
  if (!name && !reference && !designation) return null;

  return (
    <Flex align="center" gap="2" style={{ marginTop: 4, color: "var(--gray-11)" }}>
      <Factory size={14} />
      <Text size="1">
        {name ? `${name}` : "Fabricant inconnu"}
        {reference ? ` • Ref: ${reference}` : ""}
        {designation ? ` • ${designation}` : ""}
      </Text>
    </Flex>
  );
}
