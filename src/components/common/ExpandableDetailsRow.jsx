/**
 * @fileoverview Ligne de tableau expansible pour afficher des détails dans un panel
 * 
 * @module components/common/ExpandableDetailsRow
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * 
 * @example
 * // Usage basique avec card wrapper
 * <Table.Root>
 *   <Table.Body>
 *     <Table.Row>
 *       <Table.Cell>Machine A</Table.Cell>
 *     </Table.Row>
 *     <ExpandableDetailsRow colSpan={3}>
 *       <Text>Détails de la machine...</Text>
 *     </ExpandableDetailsRow>
 *   </Table.Body>
 * </Table.Root>
 * 
 * @example
 * // Sans card wrapper, personnalisé
 * <ExpandableDetailsRow
 *   colSpan={5}
 *   withCard={false}
 *   bgColor="var(--blue-2)"
 *   padding={16}
 * >
 *   <CustomDetailsPanel />
 * </ExpandableDetailsRow>
 */
import { Table, Box } from "@radix-ui/themes";
import PropTypes from "prop-types";

/** Couleur de fond par défaut de la cellule */
const DEFAULT_BG_COLOR = "var(--gray-2)";

/** Padding par défaut de la cellule */
const DEFAULT_PADDING = 0;

/** Margin par défaut du Box wrapper */
const DEFAULT_CARD_MARGIN = "3";

/**
 * Construit le style de la cellule de tableau
 * @param {string} bgColor - Couleur de fond
 * @param {number} padding - Padding en pixels
 * @returns {Object} Style CSS
 */
const buildCellStyle = (bgColor, padding) => ({
  background: bgColor,
  padding: padding,
});

/**
 * Construit le style du Box wrapper
 * @param {string} cardBgColor - Couleur de fond du Box
 * @param {Object} cardStyle - Styles additionnels
 * @returns {Object} Style CSS
 */
const buildBoxStyle = (cardBgColor, cardStyle) => ({
  background: cardBgColor,
  ...cardStyle,
});

/**
 * Wrapper conditionnel pour le contenu (Box ou direct)
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenu
 * @param {boolean} props.withCard - Utiliser Box wrapper
 * @param {string} props.cardMargin - Margin du Box
 * @param {string} props.cardBgColor - Couleur de fond du Box
 * @param {Object} props.cardStyle - Styles additionnels
 * @returns {JSX.Element} Contenu wrappé ou direct
 */
function ContentWrapper({ children, withCard, cardMargin, cardBgColor, cardStyle }) {
  if (!withCard) return children;

  return (
    <Box m={cardMargin} style={buildBoxStyle(cardBgColor, cardStyle)}>
      {children}
    </Box>
  );
}

ContentWrapper.propTypes = {
  children: PropTypes.node.isRequired,
  withCard: PropTypes.bool.isRequired,
  cardMargin: PropTypes.string.isRequired,
  cardBgColor: PropTypes.string,
  cardStyle: PropTypes.object.isRequired,
};

/**
 * Ligne de tableau expansible pour afficher des détails
 * 
 * Composant standard pour afficher du contenu détaillé dans une ligne de tableau
 * qui span plusieurs colonnes. Utilisé pour maintenir une cohérence visuelle des
 * panels de détails expansibles à travers l'application (machines, interventions, etc.).
 * 
 * @component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenu à afficher dans le panneau
 * @param {number} props.colSpan - Nombre de colonnes à fusionner
 * @param {string} [props.bgColor="var(--gray-2)"] - Couleur de fond de la cellule
 * @param {number} [props.padding=0] - Padding de la cellule en pixels
 * @param {boolean} [props.withCard=true] - Afficher un Box wrapper autour du contenu
 * @param {string} [props.cardMargin="3"] - Margin du Box wrapper
 * @param {string} [props.cardBgColor] - Couleur de fond du Box wrapper
 * @param {Object} [props.cardStyle={}] - Styles CSS additionnels du Box
 * 
 * @returns {JSX.Element} Table.Row avec cellule fusionnée contenant le panneau
 * 
 * @example
 * // Panel de détails machine
 * <ExpandableDetailsRow colSpan={4}>
 *   <MachineDetailsPanel machine={selectedMachine} />
 * </ExpandableDetailsRow>
 * 
 * @example
 * // Panel sans wrapper, style personnalisé
 * <ExpandableDetailsRow
 *   colSpan={6}
 *   withCard={false}
 *   bgColor="var(--blue-1)"
 *   padding={12}
 * >
 *   <InterventionTimeline />
 * </ExpandableDetailsRow>
 * 
 * @example
 * // Panel avec card personnalisée
 * <ExpandableDetailsRow
 *   colSpan={3}
 *   cardMargin="4"
 *   cardBgColor="var(--accent-2)"
 *   cardStyle={{ borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
 * >
 *   <ActionsList actions={actions} />
 * </ExpandableDetailsRow>
 */
export default function ExpandableDetailsRow({ 
  children, 
  colSpan, 
  bgColor = DEFAULT_BG_COLOR,
  padding = DEFAULT_PADDING,
  withCard = true,
  cardMargin = DEFAULT_CARD_MARGIN,
  cardBgColor,
  cardStyle = {}
}) {
  return (
    <Table.Row>
      <Table.Cell colSpan={colSpan} style={buildCellStyle(bgColor, padding)}>
        <ContentWrapper
          withCard={withCard}
          cardMargin={cardMargin}
          cardBgColor={cardBgColor}
          cardStyle={cardStyle}
        >
          {children}
        </ContentWrapper>
      </Table.Cell>
    </Table.Row>
  );
}

ExpandableDetailsRow.propTypes = {
  children: PropTypes.node.isRequired,
  colSpan: PropTypes.number.isRequired,
  bgColor: PropTypes.string,
  padding: PropTypes.number,
  withCard: PropTypes.bool,
  cardMargin: PropTypes.string,
  cardBgColor: PropTypes.string,
  cardStyle: PropTypes.object,
};
