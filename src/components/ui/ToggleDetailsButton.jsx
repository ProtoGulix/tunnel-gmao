import { Button } from "@radix-ui/themes";
import { ChevronDown, ChevronRight } from "lucide-react";

/**
 * Composant standard pour afficher/masquer des détails dans un tableau
 * Utilisé pour maintenir une cohérence visuelle à travers l'application
 * Accessible avec aria-expanded et aria-label
 * 
 * @param {boolean} isExpanded - État d'expansion (ouvert/fermé)
 * @param {function} onToggle - Callback appelé lors du clic
 * @param {string} size - Taille du bouton (défaut: "2")
 * @param {boolean} disabled - Désactiver le bouton
 * @param {string} label - Label pour l'accessibilité (défaut: "Détails")
 * @param {boolean} showText - Afficher le texte "Détails" (défaut: true)
 */
export default function ToggleDetailsButton({ 
  isExpanded, 
  onToggle, 
  size = "1",
  disabled = false,
  label = "Détails",
  showText = true
}) {
  return (
    <Button
      size={size}
      variant="soft"
      color={isExpanded ? "blue" : "gray"}
      onClick={onToggle}
      disabled={disabled}
      aria-label={label}
      aria-expanded={isExpanded}
      title={label}
    >
      {showText && "Détails "}
      {isExpanded ? (
        <ChevronDown size={16} />
      ) : (
        <ChevronRight size={16} />
      )}
    </Button>
  );
}
