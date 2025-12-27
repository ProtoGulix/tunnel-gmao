import { Callout, Text } from "@radix-ui/themes";
import { CheckCircle, AlertCircle, Info } from "lucide-react";

const TYPE_CONFIG = {
  success: { color: "green", Icon: CheckCircle, ariaLive: "polite", role: "status" },
  warning: { color: "amber", Icon: AlertCircle, ariaLive: "polite", role: "status" },
  error: { color: "red", Icon: AlertCircle, ariaLive: "assertive", role: "status" },
  info: { color: "blue", Icon: Info, ariaLive: "polite", role: "status" },
};

export default function StatusCallout({ type = "info", title, children, dialog = false }) {
  const { color, Icon, ariaLive, role } = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const finalRole = dialog ? "dialog" : role;
  const finalAriaLive = dialog ? "assertive" : ariaLive;

  return (
    <Callout.Root color={color} mb="3" role={finalRole} aria-live={finalAriaLive} aria-atomic="true">
      <Callout.Icon>
        <Icon size={20} />
      </Callout.Icon>
      {/* Render the text container as a div to allow block-level children inside */}
      <Callout.Text as="div">
        {title && (
          <Text as="div" weight="bold" size="3">{title}</Text>
        )}
        {children}
      </Callout.Text>
    </Callout.Root>
  );
}
