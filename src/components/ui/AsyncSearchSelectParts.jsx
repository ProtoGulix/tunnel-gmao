import PropTypes from 'prop-types';
import { Box } from '@radix-ui/themes';
import { Loader2, Search } from 'lucide-react';

// Hauteur fixe = 4 lignes de résultats (padding 8px × 2 + line-height ~20px = 36px/ligne)
export const RESULTS_HEIGHT = 144;

const STATE_BOX = {
  height: RESULTS_HEIGHT,
  marginTop: 6,
  borderRadius: 'var(--radius-2)',
  border: '1px solid var(--gray-5)',
  background: 'var(--gray-2)',
  padding: '12px 10px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  boxSizing: 'border-box',
};

export function StateBox({ children }) {
  return <Box style={STATE_BOX}>{children}</Box>;
}
StateBox.propTypes = { children: PropTypes.node };

export function ResultsListbox({ listboxId, results, activeIndex, getOptionId, renderItem, onSelect }) {
  return (
    <Box id={listboxId} role="listbox" mt="1" style={{
      height: RESULTS_HEIGHT,
      border: '1px solid var(--gray-6)', borderRadius: 'var(--radius-2)',
      background: 'var(--color-background)', overflowY: 'auto',
      boxShadow: 'var(--shadow-3)', position: 'relative', zIndex: 10,
      boxSizing: 'border-box',
    }}>
      {results.map((item, idx) => {
        const active = idx === activeIndex;
        return (
          <button
            key={item.id}
            id={getOptionId(idx)}
            role="option"
            aria-selected={active}
            type="button"
            onClick={() => onSelect(item)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, width: '100%',
              padding: '8px 12px', border: 'none',
              background: active ? 'var(--gray-3)' : 'transparent',
              cursor: 'pointer', textAlign: 'left', fontSize: 'var(--font-size-2)',
              fontFamily: 'inherit', color: 'var(--gray-12)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gray-3)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = active ? 'var(--gray-3)' : 'transparent'; }}
          >
            {renderItem(item)}
          </button>
        );
      })}
    </Box>
  );
}
ResultsListbox.propTypes = {
  listboxId: PropTypes.string.isRequired,
  results: PropTypes.array.isRequired,
  activeIndex: PropTypes.number.isRequired,
  getOptionId: PropTypes.func.isRequired,
  renderItem: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export function SearchField({ search, onChange, onKeyDown, placeholder, busy, ariaProps }) {
  return (
    <Box style={{ position: 'relative' }}>
      <input
        value={search}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '8px 12px 8px 36px',
          borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-7)',
          fontSize: 'var(--font-size-2)', fontFamily: 'inherit',
          boxSizing: 'border-box', height: 36,
          background: 'var(--color-background)', color: 'var(--gray-12)',
        }}
        role="combobox"
        aria-autocomplete="list"
        autoComplete="off"
        {...ariaProps}
      />
      {busy
        ? <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--blue-9)', pointerEvents: 'none',
            display: 'flex', alignItems: 'center',
          }}>
            <Loader2 size={14} style={{ animation: 'spin 0.6s linear infinite' }} />
          </span>
        : <Search size={14} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: search.length > 0 ? 'var(--blue-9)' : 'var(--gray-9)',
            pointerEvents: 'none',
          }} />
      }
    </Box>
  );
}
SearchField.propTypes = {
  search: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  busy: PropTypes.bool.isRequired,
  ariaProps: PropTypes.object.isRequired,
};
