/**
 * @fileoverview Sélecteur de rattachement (équipement mère) pour EditableProperty (ADR 0012)
 * @module components/equipements/ParentPicker
 *
 * Recherche GET /equipements?search=…, en excluant l'équipement et ses descendants
 * (ids obtenus par subtree_of à l'ouverture). Propose « Aucun rattachement » (parent_id null).
 */

import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Popover, Text, TextField } from '@radix-ui/themes';
import { fetchEquipements } from '@/api/equipements';
import { useDebounce } from '@/hooks/useDebounce';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

const optionStyle = { display: 'block', width: '100%', textAlign: 'left', padding: '6px 8px', border: 'none', background: 'none', color: 'inherit', cursor: 'pointer', borderRadius: 'var(--radius-2)' };

function Option({ onPick, children }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      onClick={onPick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      style={{ ...optionStyle, backgroundColor: hover ? 'var(--gray-a3)' : undefined }}
    >
      {children}
    </button>
  );
}
Option.propTypes = { onPick: PropTypes.func.isRequired, children: PropTypes.node };

const pathOf = (eq) => (eq.ancestors ?? []).map((a) => a.code || a.name).join(' › ');

/**
 * @param {string} equipementId - équipement modifié (exclu, ainsi que ses descendants)
 * @param {Function} onCommit - appelée avec l'id choisi ou null (détacher)
 * @param {Function} onCancel - fermeture sans choix
 */
export default function ParentPicker({ equipementId, onCommit, onCancel }) {
  const [query, setQuery] = useState('');
  const debounced = useDebounce(query, 300);
  const [excluded, setExcluded] = useState(null); // Set d'ids, null = pas encore chargé
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchEquipements({ subtreeOf: equipementId, limit: 500 })
      .then((r) => { if (alive) setExcluded(new Set([equipementId, ...(r.items ?? []).map((e) => String(e.id))])); })
      .catch((err) => { if (alive) setError(extractApiErrorMessage(err, 'Erreur lors du chargement')); });
    return () => { alive = false; };
  }, [equipementId]);

  useEffect(() => {
    if (!excluded) return undefined;
    let alive = true;
    fetchEquipements({ search: debounced, limit: 30 })
      .then((r) => {
        if (!alive) return;
        setError(null);
        setResults((r.items ?? []).filter((e) => !excluded.has(String(e.id))).slice(0, 15));
      })
      .catch((err) => { if (alive) setError(extractApiErrorMessage(err, 'Erreur lors de la recherche')); });
    return () => { alive = false; };
  }, [debounced, excluded]);

  return (
    <Popover.Root open onOpenChange={(o) => { if (!o) onCancel(); }}>
      <Popover.Trigger>
        <Text size="2" color="gray">Choisir un rattachement…</Text>
      </Popover.Trigger>
      <Popover.Content size="1" style={{ width: 360, maxWidth: '90vw' }} onEscapeKeyDown={onCancel}>
        <TextField.Root
          autoFocus
          size="2"
          placeholder="Rechercher un équipement mère…"
          aria-label="Rechercher un équipement mère"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Box mt="2" style={{ maxHeight: 260, overflowY: 'auto' }}>
          <Option onPick={() => onCommit(null)}><Text size="2" color="gray">Aucun rattachement</Text></Option>
          {error && <Text as="div" size="1" color="red" p="2">{error}</Text>}
          {results.map((eq) => (
            <Option key={eq.id} onPick={() => onCommit(String(eq.id))}>
              <Text as="div" size="2" weight="medium">{eq.code ? `${eq.code} – ${eq.name}` : eq.name}</Text>
              {pathOf(eq) && <Text as="div" size="1" color="gray">{pathOf(eq)}</Text>}
            </Option>
          ))}
          {excluded && !error && results.length === 0 && (
            <Text as="div" size="1" color="gray" p="2">Aucun résultat</Text>
          )}
        </Box>
      </Popover.Content>
    </Popover.Root>
  );
}

ParentPicker.propTypes = {
  equipementId: PropTypes.string.isRequired,
  onCommit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};
