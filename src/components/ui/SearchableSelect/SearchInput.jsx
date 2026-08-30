import PropTypes from 'prop-types';
import { Search } from 'lucide-react';

/**
 * Champ de recherche avec icône
 */
export default function SearchInput({
  value, onChange, placeholder, label,
  onKeyDown, listboxId, expanded, activeOptionId,
}) {
  return (
    <div style={{ position: 'relative', zIndex: 2, pointerEvents: 'auto' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        style={{
          width: '100%',
          padding: '8px 12px 8px 36px',
          borderRadius: '6px',
          border: '1px solid var(--gray-7)',
          fontSize: '14px',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
          height: '44px',
          background: 'var(--color-background, white)',
          pointerEvents: 'auto'
        }}
        aria-label={label}
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={activeOptionId || undefined}
        autoComplete="off"
        inputMode="text"
      />
      <Search size={16} style={{
        position: 'absolute',
        left: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--gray-9)',
        pointerEvents: 'none'
      }} />
    </div>
  );
}

SearchInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  onKeyDown: PropTypes.func,
  listboxId: PropTypes.string,
  expanded: PropTypes.bool,
  activeOptionId: PropTypes.string,
};
