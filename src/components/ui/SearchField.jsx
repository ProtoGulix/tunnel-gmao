/**
 * @fileoverview Champ de recherche réutilisable
 * 
 * @module components/common/SearchField
 * @requires react
 * @requires prop-types
 * @requires @radix-ui/themes
 * @requires @/lib/icons
 */

import PropTypes from 'prop-types';
import { TextField, Button } from '@radix-ui/themes';
import { Search } from '@/lib/icons';

/**
 * Champ de recherche avec icône et bouton de réinitialisation
 * 
 * Affiche un champ texte avec:
 * - Icône de recherche à gauche
 * - Bouton de réinitialisation (✕) à droite si du texte est présent
 * 
 * @component
 * @param {Object} props
 * @param {string} [props.value=''] - Valeur du champ
 * @param {Function} props.onChange - Callback appelé lors du changement de valeur
 * @param {string} [props.placeholder='Rechercher...'] - Texte placeholder
 * @param {string} [props.size='3'] - Taille du champ (Radix UI sizes)
 * @param {string} [props.iconSize=18] - Taille de l'icône de recherche
 * @returns {JSX.Element} Champ de recherche
 * 
 * @example
 * const [searchTerm, setSearchTerm] = useState("");
 * 
 * <SearchField
 *   value={searchTerm}
 *   onChange={(e) => setSearchTerm(e.target.value)}
 *   placeholder="Rechercher une machine..."
 * />
 * 
 * @example
 * <SearchField
 *   value={searchTerm}
 *   onChange={(e) => setSearchTerm(e.target.value)}
 *   placeholder="Rechercher par code machine ou intervention"
 *   size="2"
 * />
 */
export default function SearchField({
  value = '',
  onChange,
  placeholder = 'Rechercher...',
  size = '3',
  iconSize = 18,
}) {
  const handleClear = () => {
    onChange({ target: { value: '' } });
  };

  return (
    <TextField.Root
      size={size}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
    >
      <TextField.Slot>
        <Search size={iconSize} />
      </TextField.Slot>
      {value && (
        <TextField.Slot>
          <Button
            size="1"
            variant="ghost"
            color="gray"
            onClick={handleClear}
            style={{ cursor: 'pointer' }}
          >
            ✕
          </Button>
        </TextField.Slot>
      )}
    </TextField.Root>
  );
}

SearchField.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  size: PropTypes.string,
  iconSize: PropTypes.number,
};
