import { Table, Box } from "@radix-ui/themes";

/**
 * Composant standard pour afficher une ligne de détails expansibles dans un tableau
 * Combine la ligne de tableau et le panneau de détails en un seul composant
 * Utilisé pour maintenir une cohérence visuelle à travers l'application
 * 
 * @param {React.ReactNode} children - Contenu à afficher dans le panneau
 * @param {number} colSpan - Nombre de colonnes à fusionner
 * @param {string} bgColor - Couleur de fond de la cellule (défaut: "var(--gray-2)")
 * @param {number} padding - Padding de la cellule en pixels (défaut: 0)
 * @param {boolean} withCard - Afficher un Card autour du contenu (défaut: true)
 * @param {string} cardMargin - Margin du Card (défaut: "3")
 * @param {string} cardBgColor - Couleur de fond du Card (défaut: transparent)
 * @param {object} cardStyle - Styles additionnels du Card
 */
export default function ExpandableDetailsRow({ 
  children, 
  colSpan, 
  bgColor = "var(--gray-2)",
  padding = 0,
  withCard = true,
  cardMargin = "3",
  cardBgColor,
  cardStyle = {}
}) {
  return (
    <Table.Row>
      <Table.Cell 
        colSpan={colSpan} 
        style={{ 
          background: bgColor, 
          padding: padding 
        }}
      >
        {withCard ? (
          <Box 
            m={cardMargin}
            style={{
              background: cardBgColor,
              ...cardStyle
            }}
          >
            {children}
          </Box>
        ) : (
          children
        )}
      </Table.Cell>
    </Table.Row>
  );
}
