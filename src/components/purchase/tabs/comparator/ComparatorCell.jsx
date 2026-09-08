/**
 * Cellule référence x panier du tableau comparateur : une card par état
 * (absent / pending / priced), sélection au clic sur la card, édition
 * prix/délai révélée au clic sur le bouton crayon plutôt que toujours visible.
 * @module components/purchase/tabs/comparator/ComparatorCell
 */
import { useState } from 'react';
import { Badge, Box, Flex, Spinner, Text } from '@radix-ui/themes';
import { CheckCircle2, Circle, Pencil, Trophy, XCircle } from 'lucide-react';
import PropTypes from 'prop-types';
import { CELL_CARD_MIN_HEIGHT, cellStatus } from './comparatorHelpers';
import { EditFields, PricedDisplay } from './ComparatorCellDisplay';

function AbsentCell() {
  return (
    <Box style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--gray-2)', border: '1px dashed var(--gray-5)', textAlign: 'center', minHeight: CELL_CARD_MIN_HEIGHT, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Text size="1" color="gray">Absent de ce panier</Text>
    </Box>
  );
}

function EditButton({ onClick, title = 'Modifier prix / délai' }) {
  return (
    <Box
      role="button" tabIndex={0}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onClick(); } }}
      title={title}
      style={{ cursor: 'pointer', display: 'flex', opacity: 0.6 }}
    >
      <Pencil size={12} />
    </Box>
  );
}
EditButton.propTypes = { onClick: PropTypes.func.isRequired, title: PropTypes.string };

function PendingCell({ onStartEdit }) {
  return (
    <Box
      style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--amber-2)', border: '1px solid var(--amber-6)', minHeight: CELL_CARD_MIN_HEIGHT, boxSizing: 'border-box' }}
    >
      <Flex align="center" mb="1">
        <EditButton onClick={onStartEdit} title="Saisir prix / délai" />
      </Flex>
      <Flex align="center" justify="center" style={{ minHeight: CELL_CARD_MIN_HEIGHT - 36 }}>
        <Text size="1" color="amber" weight="medium">En attente de prix</Text>
      </Flex>
    </Box>
  );
}
PendingCell.propTypes = { onStartEdit: PropTypes.func.isRequired };

// Hauteur commune du contrôle de sélection (badge, spinner ou cercle nu) — évite
// que la ligne d'en-tête change de hauteur selon l'état et décale le contenu.
const SELECT_CONTROL_HEIGHT = 24;

/** Contrôle de sélection : badge (texte + icône) quand il y a quelque chose à
 *  signaler (retenue ou meilleure offre), simple cercle vide sinon. Pendant que
 *  la sélection est en cours d'enregistrement, tout est remplacé par un rolling
 *  circle (spinner) — seule l'action en cours doit s'afficher, jamais un texte
 *  d'état transitoire. Toujours au même endroit, même hauteur dans tous les cas. */
function SelectBadge({ isSelected, isWinner, isSelecting, onSelect }) {
  const handleClick = (e) => { e.stopPropagation(); onSelect(); };
  const handleKeyDown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onSelect(); } };

  if (isSelecting) {
    return (
      <Flex align="center" justify="center" style={{ height: SELECT_CONTROL_HEIGHT, width: SELECT_CONTROL_HEIGHT }} title="Sélection en cours…">
        <Spinner size="2" />
      </Flex>
    );
  }

  if (!isSelected && !isWinner) {
    return (
      <Box
        role="button" tabIndex={0}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        title="Retenir cette offre"
        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', height: SELECT_CONTROL_HEIGHT }}
      >
        <Circle size={16} color="var(--gray-7)" />
      </Box>
    );
  }

  const icon = isSelected ? <CheckCircle2 size={16} /> : <Trophy size={16} />;
  const label = isSelected ? 'Retenu' : 'Meilleur';
  const badgeProps = isSelected ? { color: 'green', variant: 'solid' } : { color: 'green', variant: 'soft' };

  return (
    <Badge
      {...badgeProps}
      size="2"
      role="button" tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      title={isSelected ? 'Offre retenue' : 'Meilleure offre — cliquer pour la retenir'}
      style={{ cursor: 'pointer', gap: 4, height: SELECT_CONTROL_HEIGHT, boxSizing: 'border-box' }}
    >
      {label}
      {icon}
    </Badge>
  );
}
SelectBadge.propTypes = { isSelected: PropTypes.bool, isWinner: PropTypes.bool, isSelecting: PropTypes.bool, onSelect: PropTypes.func.isRequired };

function CellHeader({ isSelected, isWinner, isSelecting, onToggleEdit, onSelect }) {
  return (
    <Flex align="center" justify="between" mb="1" style={{ minHeight: SELECT_CONTROL_HEIGHT }}>
      <EditButton onClick={onToggleEdit} />
      <SelectBadge isSelected={isSelected} isWinner={isWinner} isSelecting={isSelecting} onSelect={onSelect} />
    </Flex>
  );
}
CellHeader.propTypes = {
  isSelected: PropTypes.bool,
  isWinner: PropTypes.bool,
  isSelecting: PropTypes.bool,
  onToggleEdit: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
};

function CellBody({ editing, line, draft, onChangeDraft, isPriceWinner, isDelayWinner, saving, saved, error }) {
  return (
    <>
      {editing ? (
        <EditFields
          draft={draft}
          onChange={(field, val) => onChangeDraft(line.id, field, val)}
          saving={saving} saved={saved} hasError={!!error}
        />
      ) : (
        <PricedDisplay line={line} draft={draft} quantity={line.quantity} isPriceWinner={isPriceWinner} isDelayWinner={isDelayWinner} />
      )}
      {error && (
        <Flex align="center" gap="1" mt="1">
          <XCircle size={11} color="var(--red-9)" />
          <Text size="1" color="red">{error}</Text>
        </Flex>
      )}
    </>
  );
}
CellBody.propTypes = {
  editing: PropTypes.bool,
  line: PropTypes.object.isRequired,
  draft: PropTypes.object,
  onChangeDraft: PropTypes.func.isRequired,
  isPriceWinner: PropTypes.bool,
  isDelayWinner: PropTypes.bool,
  saving: PropTypes.bool,
  saved: PropTypes.bool,
  error: PropTypes.string,
};

function priceCardStyle(editing, isSelected) {
  return {
    padding: '8px 10px', borderRadius: 6, cursor: editing ? 'default' : 'pointer',
    background: isSelected ? 'var(--green-2)' : 'var(--gray-1)',
    border: isSelected ? '1px solid var(--green-7)' : '1px solid var(--gray-4)',
    boxSizing: 'border-box', overflow: 'hidden',
  };
}

function handleCardKeyDown(e, onSelect) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); }
}

export default function ComparatorCell({ line, draft, onChangeDraft, isPriceWinner, isDelayWinner, isSelected, onSelect, selecting, saving, saved, error }) {
  const [editing, setEditing] = useState(false);
  const status = cellStatus(line, draft);

  if (status === 'absent') return <AbsentCell />;
  if (status === 'pending' && !editing) return <PendingCell onStartEdit={() => setEditing(true)} />;

  return (
    <Box
      role={editing ? undefined : 'button'}
      tabIndex={editing ? undefined : 0}
      onClick={editing ? undefined : onSelect}
      onKeyDown={editing ? undefined : (e) => handleCardKeyDown(e, onSelect)}
      style={priceCardStyle(editing, isSelected)}
    >
      <CellHeader
        isSelected={isSelected}
        isWinner={isPriceWinner || isDelayWinner}
        isSelecting={selecting === line.id}
        onToggleEdit={() => setEditing((v) => !v)}
        onSelect={onSelect}
      />
      <CellBody
        editing={editing} line={line} draft={draft} onChangeDraft={onChangeDraft}
        isPriceWinner={isPriceWinner} isDelayWinner={isDelayWinner} saving={saving} saved={saved} error={error}
      />
    </Box>
  );
}
ComparatorCell.propTypes = {
  line: PropTypes.object,
  draft: PropTypes.object,
  onChangeDraft: PropTypes.func.isRequired,
  isPriceWinner: PropTypes.bool,
  isDelayWinner: PropTypes.bool,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  selecting: PropTypes.string,
  saving: PropTypes.bool,
  saved: PropTypes.bool,
  error: PropTypes.string,
};
