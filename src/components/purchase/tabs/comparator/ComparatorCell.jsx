/**
 * Cellule référence x panier du tableau comparateur : une card par état
 * (absent / pending / priced), sélection au clic sur la card, édition
 * prix/délai révélée au clic sur le bouton crayon plutôt que toujours visible.
 * @module components/purchase/tabs/comparator/ComparatorCell
 */
import { useState } from 'react';
import { Badge, Box, Flex, Spinner, Text } from '@radix-ui/themes';
import { CheckCircle2, Pencil, Trophy } from 'lucide-react';
import PropTypes from 'prop-types';
import { cellStatus } from './comparatorHelpers';
import { EditFields, PricedDisplay } from './ComparatorCellDisplay';

function AbsentCell() {
  return (
    <Box style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--gray-2)', border: '1px dashed var(--gray-5)', textAlign: 'center' }}>
      <Text size="1" color="gray">Absent de ce panier</Text>
    </Box>
  );
}

function PendingCell({ onStartEdit }) {
  return (
    <Box
      role="button" tabIndex={0}
      onClick={onStartEdit}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStartEdit(); } }}
      style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--amber-2)', border: '1px solid var(--amber-6)', cursor: 'pointer', textAlign: 'center' }}
    >
      <Text size="1" color="amber" weight="medium">En attente de prix</Text>
    </Box>
  );
}
PendingCell.propTypes = { onStartEdit: PropTypes.func.isRequired };

function CellBadges({ isSelected, isWinner }) {
  if (isSelected) return <Badge color="green" variant="solid" size="1"><CheckCircle2 size={9} /> Retenu</Badge>;
  if (isWinner) return <Badge color="green" variant="soft" size="1"><Trophy size={9} /> Meilleur</Badge>;
  return null;
}
CellBadges.propTypes = { isSelected: PropTypes.bool, isWinner: PropTypes.bool };

function EditToggle({ saving, onToggle }) {
  return (
    <Flex align="center" gap="1">
      {saving && <Spinner size="1" />}
      <Box
        role="button" tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onToggle(); } }}
        title="Modifier prix / délai"
        style={{ cursor: 'pointer', display: 'flex', opacity: 0.6 }}
      >
        <Pencil size={12} />
      </Box>
    </Flex>
  );
}
EditToggle.propTypes = { saving: PropTypes.bool, onToggle: PropTypes.func.isRequired };

function CellHeader({ isSelected, isWinner, saving, onToggleEdit }) {
  return (
    <Flex align="center" justify="between" mb="1">
      <CellBadges isSelected={isSelected} isWinner={isWinner} />
      <EditToggle saving={saving} onToggle={onToggleEdit} />
    </Flex>
  );
}
CellHeader.propTypes = {
  isSelected: PropTypes.bool,
  isWinner: PropTypes.bool,
  saving: PropTypes.bool,
  onToggleEdit: PropTypes.func.isRequired,
};

function CellBody({ editing, line, draft, onChangeDraft, isPriceWinner, isDelayWinner, selecting, error }) {
  return (
    <>
      {editing ? (
        <EditFields draft={draft} onChange={(field, val) => onChangeDraft(line.id, field, val)} />
      ) : (
        <PricedDisplay line={line} draft={draft} quantity={line.quantity} isPriceWinner={isPriceWinner} isDelayWinner={isDelayWinner} />
      )}
      {selecting === line.id && <Text size="1" color="gray">Sélection…</Text>}
      {error && <Text size="1" color="red">{error}</Text>}
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
  selecting: PropTypes.string,
  error: PropTypes.string,
};

function priceCardStyle(editing, isSelected) {
  return {
    padding: '8px 10px', borderRadius: 6, cursor: editing ? 'default' : 'pointer',
    background: isSelected ? 'var(--green-2)' : 'var(--gray-1)',
    border: isSelected ? '1px solid var(--green-7)' : '1px solid var(--gray-4)',
  };
}

function handleCardKeyDown(e, onSelect) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); }
}

export default function ComparatorCell({ line, draft, onChangeDraft, isPriceWinner, isDelayWinner, isSelected, onSelect, selecting, saving, error }) {
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
        saving={saving}
        onToggleEdit={() => setEditing((v) => !v)}
      />
      <CellBody
        editing={editing} line={line} draft={draft} onChangeDraft={onChangeDraft}
        isPriceWinner={isPriceWinner} isDelayWinner={isDelayWinner} selecting={selecting} error={error}
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
  error: PropTypes.string,
};
