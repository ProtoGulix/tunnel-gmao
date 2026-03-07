/**
 * @fileoverview En-tête de tableau avec recherche et rafraîchissement
 *
 * Composant de contrôle pour listes: titre, recherche, boutons d'action et compteur.
 *
 * @module components/common/TableHeader
 * @requires react, prop-types, @radix-ui/themes, lucide-react
 */

import PropTypes from 'prop-types';
import { Flex, Text, Button, Box } from '@radix-ui/themes';
import { RefreshCw } from 'lucide-react';
import SearchField from '@/components/ui/SearchField';

const DEFAULTS = {
  SEARCH_PLACEHOLDER: 'Recherche...',
  SEARCH_LABEL: 'Recherche',
  MARGIN_BOTTOM: '3',
};

function TableHeaderTitle({ Icon, title, count }) {
  return (
    <Flex align="center" gap="2">
      {Icon && <Icon size={18} />}
      <Text weight="bold">{title}</Text>
      {count !== undefined && (
        <Text color="gray" size="2">
          {count} élément(s)
        </Text>
      )}
    </Flex>
  );
}

TableHeaderTitle.propTypes = {
  Icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  count: PropTypes.number,
};

function SearchInput({ value, onChange, label, placeholder }) {
  return (
    <Box style={{ minWidth: 280 }}>
      <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>
        {label}
      </Text>
      <SearchField
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        size="2"
      />
    </Box>
  );
}

SearchInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string.isRequired,
};

function ControlBar(props) {
  const {
    actions,
    rightActions,
    searchValue,
    onSearchChange,
    searchLabel,
    searchPlaceholder,
    showSearchInput,
    showRefreshButton,
    onRefresh,
    loading,
  } = props;

  return (
    <Flex align="end" gap="2">
      {actions}
      {showSearchInput && (
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          label={searchLabel}
          placeholder={searchPlaceholder}
        />
      )}
      {showRefreshButton && (
        <Button size="2" onClick={onRefresh} disabled={loading}>
          <RefreshCw size={14} />
          Rafraîchir
        </Button>
      )}
      {rightActions}
    </Flex>
  );
}

ControlBar.propTypes = {
  actions: PropTypes.node,
  rightActions: PropTypes.node,
  searchValue: PropTypes.string.isRequired,
  onSearchChange: PropTypes.func.isRequired,
  searchLabel: PropTypes.string.isRequired,
  searchPlaceholder: PropTypes.string.isRequired,
  showSearchInput: PropTypes.bool.isRequired,
  showRefreshButton: PropTypes.bool.isRequired,
  onRefresh: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
};

/**
 * En-tête de tableau avec recherche et contrôles
 *
 * @component
 * @param {Object} props
 * @param {React.ComponentType} [props.icon] - Composant icône Lucide
 * @param {string} props.title - Titre principal
 * @param {number} [props.count] - Nombre total d'éléments
 * @param {string} [props.searchValue=''] - Valeur de recherche
 * @param {Function} [props.onSearchChange] - Callback recherche
 * @param {Function} [props.onRefresh] - Callback rafraîchissement
 * @param {boolean} [props.loading=false] - État de chargement
 * @param {string} [props.searchPlaceholder] - Placeholder
 * @param {string} [props.searchLabel] - Label
 * @param {boolean} [props.showSearchInput=true] - Afficher le champ de recherche
 * @param {boolean} [props.showResetButton=true] - Afficher réinitialisation
 * @param {boolean} [props.showRefreshButton=true] - Afficher rafraîchissement
 * @param {string} [props.mb='3'] - Marge inférieure
 * @param {JSX.Element} [props.actions] - Actions personnalisées
 * @param {React.ReactNode} [props.children] - Contenu additionnel
 * @returns {JSX.Element}
 *
 * @example
 * <TableHeader
 *   icon={Users}
 *   title="Utilisateurs"
 *   count={42}
 *   searchValue={search}
 *   onSearchChange={setSearch}
 * />
 */
function TableHeader({
  icon,
  title,
  count,
  searchValue = '',
  onSearchChange = () => {},
  onRefresh = () => {},
  loading = false,
  searchPlaceholder = DEFAULTS.SEARCH_PLACEHOLDER,
  searchLabel = DEFAULTS.SEARCH_LABEL,
  showSearchInput = true,
  showRefreshButton = true,
  mb = DEFAULTS.MARGIN_BOTTOM,
  actions,
  rightActions,
  children,
}) {
  return (
    <Box mb={mb}>
      <Flex align="end" justify="between" gap="3" wrap="wrap">
        <TableHeaderTitle Icon={icon} title={title} count={count} />
        <ControlBar
          actions={actions}
          rightActions={rightActions}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          searchLabel={searchLabel}
          searchPlaceholder={searchPlaceholder}
          showSearchInput={showSearchInput}
          showRefreshButton={showRefreshButton}
          onRefresh={onRefresh}
          loading={loading}
        />
      </Flex>
      {children}
    </Box>
  );
}

TableHeader.propTypes = {
  icon: PropTypes.elementType,
  title: PropTypes.string.isRequired,
  count: PropTypes.number,
  searchValue: PropTypes.string,
  onSearchChange: PropTypes.func,
  onRefresh: PropTypes.func,
  loading: PropTypes.bool,
  searchPlaceholder: PropTypes.string,
  searchLabel: PropTypes.string,
  showSearchInput: PropTypes.bool,
  showRefreshButton: PropTypes.bool,
  mb: PropTypes.string,
  actions: PropTypes.node,
  rightActions: PropTypes.node,
  children: PropTypes.node,
};

export default TableHeader;
