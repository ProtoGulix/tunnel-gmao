import { useEffect, useState } from 'react';

/**
 * Navigation clavier générique pour un combobox à liste de résultats
 * (ArrowUp/Down, Home/End, Enter pour sélectionner, Escape pour désactiver).
 */
export function useListboxKeyboardNav(results, onSelect) {
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => { setActiveIndex(-1); }, [results]);

  const moveActiveIndex = (delta) => {
    if (results.length === 0) return;
    setActiveIndex((prev) => {
      const next = prev + delta;
      if (next < 0) return results.length - 1;
      if (next >= results.length) return 0;
      return next;
    });
  };

  const handleKeyDown = (event) => {
    if (results.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActiveIndex(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActiveIndex(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(results.length - 1);
    } else if (event.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < results.length) {
        event.preventDefault();
        onSelect(results[activeIndex]);
      }
    } else if (event.key === 'Escape') {
      setActiveIndex(-1);
    }
  };

  return { activeIndex, setActiveIndex, handleKeyDown };
}
