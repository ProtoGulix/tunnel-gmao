import { Card, Flex, Text, Box } from "@radix-ui/themes";
import { Fragment, isValidElement } from "react";

export default function EmptyState({ icon, title, description, actions = [] }) {
  return (
    <Card size="3">
      <Flex direction="column" align="center" justify="center" p="8" gap="3">
        {typeof icon === 'string' ? (
          <Text size="9" style={{ opacity: 0.3 }}>{icon}</Text>
        ) : (
          <Box style={{ opacity: 0.3 }}>
            {isValidElement(icon) ? icon : null}
          </Box>
        )}
        <Flex direction="column" align="center" gap="2" style={{ textAlign: "center" }}>
          <Text size="5" weight="bold" color="gray">{title}</Text>
          <Text color="gray" size="3">{description}</Text>
        </Flex>
        {actions.length > 0 && (
          <Flex gap="2">
            {actions.map((action, idx) => (
              <Fragment key={idx}>{action}</Fragment>
            ))}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
