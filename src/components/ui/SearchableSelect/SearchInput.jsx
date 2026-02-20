import PropTypes from 'prop-types';
import { Search } from 'lucide-react';

/**
 * Champ de recherche avec icône
 */
export default function SearchInput({ value, onChange, placeholder, required, label }) {
  return (
    <div style={{ position: 'relative', zIndex: 2, pointerEvents: 'auto' }}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
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
        required={required}
        aria-label={label}
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
  required: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired
};
