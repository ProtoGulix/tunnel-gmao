import { Container } from "@radix-ui/themes";
import { CONTAINER_MAX_WIDTH } from "@/config/layoutConfig";

/**
 * Container standardisé pour toutes les pages de l'application
 * Applique automatiquement la largeur maximale définie globalement
 */
export default function PageContainer({ children, p = "3", style = {}, ...props }) {
  return (
    <Container 
      p={p} 
      style={{ maxWidth: CONTAINER_MAX_WIDTH, ...style }} 
      {...props}
    >
      {children}
    </Container>
  );
}
