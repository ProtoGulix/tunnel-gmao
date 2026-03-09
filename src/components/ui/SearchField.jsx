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
import { useState, useEffect, useRef } from 'react';
import { TextField, Button } from '@radix-ui/themes';
import { Loader2 } from 'lucide-react';
import { Search } from '@/lib/icons';

export default function SearchField({
  value = '',
  onChange,
  placeholder = 'Rechercher...',
  size = '3',
  iconSize = 18,
}) {
  const [isTyping, setIsTyping] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!value) { setIsTyping(false); return; }
    setIsTyping(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsTyping(false), 500);
    return () => clearTimeout(timerRef.current);
  }, [value]);

  const handleClear = () => onChange({ target: { value: '' } });
  const hasValue = value.length > 0;

  return (
    <TextField.Root
      size={size}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      color={hasValue ? 'blue' : undefined}
    >
      <TextField.Slot>
        {isTyping
          ? <Loader2 size={iconSize} style={{ animation: 'spin 0.6s linear infinite' }} />
          : <Search size={iconSize} color={hasValue ? 'var(--blue-9)' : undefined} />}
      </TextField.Slot>
      {hasValue && (
        <TextField.Slot>
          <Button size="1" variant="ghost" color="gray" onClick={handleClear} style={{ cursor: 'pointer' }}>
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
