/**
 * Cellule fantôme de fin de tableau — même pattern que GhostCreateRow : au repos,
 * un "+ Ajouter un panier" discret ; au clic, un champ de recherche inline avec
 * résultats filtrés apparaît à la place. La liste de résultats est rendue dans un
 * portail en position fixed (coordonnées du champ) : la cellule parente est sticky
 * et le tableau scrollable, un simple position:absolute resterait piégé dans ce
 * contexte d'empilement et serait tronqué par l'overflow du tableau.
 * @module components/purchase/tabs/comparator/GhostAddOrderCell
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Box, Flex, Text, TextField } from '@radix-ui/themes';
import { Plus, Search, X } from 'lucide-react';
import PropTypes from 'prop-types';
import { formatPrice } from '@/utils/formatPrice';
import { ORDER_COLUMN_WIDTH } from './comparatorHelpers';

function OrderOption({ order, onSelect }) {
  return (
    <Box
      role="button" tabIndex={0}
      onClick={() => onSelect(order.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(order.id); } }}
      style={{ padding: '6px 8px', cursor: 'pointer', borderRadius: 4 }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gray-3)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
    >
      <Flex align="center" justify="between" gap="2">
        <Text size="2" weight="medium">{order.order_number}</Text>
        <Text size="1" color="gray">{formatPrice(order.total_amount)}</Text>
      </Flex>
      <Text size="1" color="gray">{order.supplier?.name || 'Fournisseur inconnu'}</Text>
    </Box>
  );
}
OrderOption.propTypes = { order: PropTypes.object.isRequired, onSelect: PropTypes.func.isRequired };

function IdleGhost({ onActivate }) {
  return (
    <Flex
      align="center" gap="2" px="2" py="2"
      onClick={onActivate}
      style={{ cursor: 'pointer', userSelect: 'none', opacity: 0.5, borderRadius: 6, width: '100%', boxSizing: 'border-box' }}
      onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--gray-2)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.background = ''; }}
    >
      <Plus size={13} color="var(--blue-9)" style={{ flexShrink: 0 }} />
      <Text size="1" style={{ fontStyle: 'italic', color: 'var(--gray-9)' }}>Ajouter un panier…</Text>
    </Flex>
  );
}
IdleGhost.propTypes = { onActivate: PropTypes.func.isRequired };

/** Liste de résultats en portail, positionnée en fixed sous `anchorRect`. */
function ResultsPortal({ anchorRect, filtered, onSelect, portalRef }) {
  if (!anchorRect) return null;
  return createPortal(
    <Box
      ref={portalRef}
      style={{
        position: 'fixed', zIndex: 1000,
        top: anchorRect.bottom + 4, left: anchorRect.left, width: Math.max(anchorRect.width, ORDER_COLUMN_WIDTH),
        maxHeight: 260, overflowY: 'auto',
        background: 'var(--color-panel-solid)', border: '1px solid var(--gray-5)',
        borderRadius: 'var(--radius-3)', boxShadow: 'var(--shadow-4)',
      }}
    >
      {filtered.length === 0 && (
        <Flex align="center" justify="center" p="3">
          <Text size="1" color="gray">Aucun panier comparable trouvé</Text>
        </Flex>
      )}
      {filtered.map((order) => (
        <OrderOption key={order.id} order={order} onSelect={onSelect} />
      ))}
    </Box>,
    document.body,
  );
}
ResultsPortal.propTypes = {
  anchorRect: PropTypes.object,
  filtered: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
  portalRef: PropTypes.object,
};

export default function GhostAddOrderCell({ candidates, onSelect }) {
  const [active, setActive] = useState(false);
  const [search, setSearch] = useState('');
  const [anchorRect, setAnchorRect] = useState(null);
  const fieldBoxRef = useRef(null);
  const portalRef = useRef(null);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((o) =>
      o.order_number?.toLowerCase().includes(q) || o.supplier?.name?.toLowerCase().includes(q));
  }, [candidates, search]);

  const deactivate = () => { setActive(false); setSearch(''); setAnchorRect(null); };
  const activate = () => { setActive(true); setTimeout(() => inputRef.current?.focus(), 0); };

  const handleSelect = (id) => {
    onSelect(id);
    deactivate();
  };

  // Repositionne le portail au scroll/resize tant que la liste est ouverte.
  useEffect(() => {
    if (!active) return undefined;
    const updateRect = () => setAnchorRect(fieldBoxRef.current?.getBoundingClientRect() ?? null);
    updateRect();
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);
    return () => {
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [active]);

  // Ferme au clic en dehors du champ ET du dropdown (celui-ci vit dans un portail,
  // donc hors de fieldBoxRef — sans l'exclure aussi, cliquer une option la fermerait
  // avant que son onClick ne se déclenche).
  useEffect(() => {
    if (!active) return undefined;
    const handleClickOutside = (e) => {
      if (fieldBoxRef.current?.contains(e.target)) return;
      if (portalRef.current?.contains(e.target)) return;
      deactivate();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [active]);

  if (!active) return <IdleGhost onActivate={activate} />;

  return (
    <Box ref={fieldBoxRef} style={{ width: '100%' }}>
      <TextField.Root
        ref={inputRef}
        size="1"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') deactivate(); }}
        placeholder="Rechercher un panier…"
        aria-label="Rechercher un panier"
      >
        <TextField.Slot><Search size={13} color="var(--gray-9)" /></TextField.Slot>
        <TextField.Slot side="right" style={{ cursor: 'pointer' }} onClick={deactivate}>
          <X size={13} color="var(--gray-9)" />
        </TextField.Slot>
      </TextField.Root>

      <ResultsPortal anchorRect={anchorRect} filtered={filtered} onSelect={handleSelect} portalRef={portalRef} />
    </Box>
  );
}
GhostAddOrderCell.propTypes = {
  candidates: PropTypes.array.isRequired,
  onSelect: PropTypes.func.isRequired,
};
