/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🎯 DropdownButton.jsx - Bouton dropdown réutilisable avec couleurs
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Composant générique bouton avec dropdown menu pour sélections (statut, priorité, actions).
 * 
 * Fonctionnalités:
 * - Bouton personnalisable (couleur fond, texte)
 * - Chevron indicateur (ChevronDown Lucide)
 * - Menu items avec couleurs optionnelles (dots + border left)
 * - Click handlers par item
 * - Color dot optionnel sur trigger button
 * - Support icônes Lucide dans items (futur)
 * 
 * ✅ IMPLÉMENTÉ:
 * - Button Radix variant="soft" avec couleurs custom
 * - DropdownMenu.Root avec Trigger + Content
 * - Items array flexible [{label, value, color, icon, onClick, type}]
 * - Icônes Lucide dans items (item.icon avec <Icon size={16} />)
 * - Dividers entre groupes (item.type='separator' → DropdownMenu.Separator)
 * - Color dots (8px circles) sur items
 * - Border left (4px) coloré sur items
 * - showColorDot sur trigger button (optionnel)
 * - ChevronDown icon 14px sur trigger
 * - PropTypes complets pour validation runtime
 * - aria-label sur trigger button pour accessibilité
 * - Item key unique (value || label || index)
 * 
 * 🎯 USAGES:
 * - InterventionDetail: statusDropdown (ouvert, attente_pieces, attente_prod, fermé)
 * - InterventionDetail: priorityDropdown (urgent, important, normal, faible)
 * - Potentiel: SupplierOrdersTable actions menu (à migrer depuis DropdownMenu.Root direct)
 * 
 * 📋 TODO:
 * - [x] Support icônes Lucide dans items (item.icon prop avec <Icon size={16} />)
 * - [x] Dividers entre groupes items (DropdownMenu.Separator avec item.type='separator')
 * - [ ] Keyboard shortcuts display (item.shortcut prop, ex: "⌘S")
 * - [ ] Loading state (isLoading prop, spinner sur trigger)
 * - [ ] Disabled items (item.disabled prop)
 * - [ ] Item key unique (item.value || item.label au lieu de index)
 * - [ ] Badge count sur trigger (ex: "3" pour notifications)
 * - [ ] Animation fade-in content (framer-motion)
 * - [ ] Tests unitaires (Jest + RTL: render, click, callbacks)
 * - [ ] Storybook stories (variants: colors, items, icons)
 * - [ ] Accessibility: aria-label descriptif sur trigger
 * - [ ] Accessibility: focus visible styles
 * - [ ] Close on item select configurable (closeOnSelect prop)
 * 
 * @module components/common/DropdownButton
 * @requires @radix-ui/themes - Button, Flex, Box, DropdownMenu
 * @requires lucide-react - ChevronDown
 * @see InterventionDetail - Usage statusDropdown et priorityDropdown
 */

import PropTypes from "prop-types";
import { Button, Flex, Box, DropdownMenu } from "@radix-ui/themes";
import { ChevronDown } from "lucide-react";

/**
 * Bouton dropdown avec menu items colorés
 * 
 * @component
 * @param {Object} props - Propriétés du composant
 * @param {string} props.label - Label à afficher sur le bouton
 * @param {string} [props.color='var(--gray-6)'] - Couleur de fond du bouton (CSS color)
 * @param {string} [props.textColor='white'] - Couleur du texte du bouton
 * @param {Array<{label?: string, value?: string, color?: string, icon?: Function, onClick?: Function, type?: string}>} [props.items=[]] - Items du menu dropdown (si type='separator', affiche DropdownMenu.Separator)
 * @param {boolean} [props.showColorDot=false] - Afficher un point de couleur sur le bouton (utilise première couleur items)
 * @returns {JSX.Element} DropdownMenu.Root avec Button trigger et items
 * 
 * @example
 * // Usage basique avec items colorés
 * <DropdownButton
 *   label="Statut: Ouvert"
 *   color="var(--blue-6)"
 *   items={[
 *     { label: 'Ouvert', color: 'var(--blue-6)', onClick: () => setStatus('ouvert') },
 *     { label: 'En attente', color: 'var(--orange-6)', onClick: () => setStatus('attente') },
 *     { label: 'Fermé', color: 'var(--green-6)', onClick: () => setStatus('ferme') }
 *   ]}
 * />
 * 
 * @example
 * // Usage avancé avec icônes Lucide et dividers
 * <DropdownButton
 *   label="Actions"
 *   color="var(--gray-6)"
 *   items={[
 *     { label: 'Modifier', icon: Edit, onClick: () => handleEdit() },
 *     { label: 'Dupliquer', icon: Copy, color: 'var(--blue-6)', onClick: () => handleDuplicate() },
 *     { type: 'separator' },
 *     { label: 'Supprimer', icon: Trash2, color: 'var(--red-6)', onClick: () => handleDelete() }
 *   ]}
 * />
 * 
 * @example
 * // Usage avec color dot sur trigger
 * <DropdownButton
 *   label="Urgent"
 *   color="var(--red-6)"
 *   textColor="white"
 *   showColorDot={true}
 *   items={[
 *     { label: 'Urgent', color: 'var(--red-6)', onClick: () => setPriority('urgent') },
 *     { label: 'Normal', color: 'var(--gray-6)', onClick: () => setPriority('normal') }
 *   ]}
 * />
 */
export default function DropdownButton({ 
  label, 
  color = 'var(--gray-6)', 
  textColor = 'white',
  items = [],
  showColorDot = false,
  disabled = false,
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger disabled={disabled}>
        <Button 
          size="2" 
          variant="soft"
          disabled={disabled}
          style={{
            backgroundColor: color,
            color: textColor,
            border: 'none',
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
          }}
          aria-label={`Sélectionner ${label}`}
        >
          <Flex align="center" gap="2">
            {showColorDot && (
              <Box 
                style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%',
                  backgroundColor: color
                }}
              />
            )}
            {label}
            <ChevronDown size={14} />
          </Flex>
        </Button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Content>
        {items.map((item, index) => {
          // Separator entre groupes d'items
          if (item.type === 'separator') {
            return <DropdownMenu.Separator key={`separator-${index}`} />;
          }

          const Icon = item.icon;

          return (
            <DropdownMenu.Item 
              key={item.value || item.label || `item-${index}`} 
              onClick={item.onClick}
              style={{
                borderLeft: item.color ? `4px solid ${item.color}` : undefined,
                paddingLeft: '8px'
              }}
            >
              <Flex align="center" gap="2">
                {Icon && <Icon size={16} />}
                {item.color && (
                  <Box 
                    style={{ 
                      width: '8px', 
                      height: '8px', 
                      borderRadius: '50%', 
                      backgroundColor: item.color 
                    }} 
                  />
                )}
                {item.label}
              </Flex>
            </DropdownMenu.Item>
          );
        })}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}

// PropTypes pour validation runtime
DropdownButton.propTypes = {
  label: PropTypes.string.isRequired,
  color: PropTypes.string,
  textColor: PropTypes.string,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string,
      value: PropTypes.string,
      color: PropTypes.string,
      icon: PropTypes.func,
      onClick: PropTypes.func,
      type: PropTypes.oneOf(['separator'])
    })
  ),
  showColorDot: PropTypes.bool
};
