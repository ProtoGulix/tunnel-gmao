/**
 * @fileoverview Propriété modifiable sur place (ADR 0012) : valeur au repos, champ au clic
 * @module components/equipements/EditableProperty
 *
 * Volontairement dans components/equipements/ : conçu pour la fiche équipement, il ne devient un
 * composant ui/ générique que par une décision séparée (ADR 0012, conséquence 2).
 *
 * Types : text, textarea, date, select, checkbox, custom (renderEditor, ex. ParentPicker).
 * Entrée / clic dehors enregistre, Échap annule, valeur inchangée = rien envoyé.
 * onSave(valeur) renvoie une promesse ; un rejet affiche son message sous la ligne et la valeur
 * affichée reste celle de `value` (le parent ne la change qu'après un succès).
 */

import { useState, useRef, useEffect, useCallback, isValidElement } from 'react';
import PropTypes from 'prop-types';
import { Box, Checkbox, Flex, Select, Spinner, Text, TextArea, TextField } from '@radix-ui/themes';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

const NONE = '__none__';
const hoverStyle = { cursor: 'pointer', borderRadius: 'var(--radius-2)', padding: '2px 6px', margin: '-2px -6px' };

/** Valeur vide -> null ; sinon texte nettoyé */
const normalize = (type, v) => {
  if (type === 'checkbox' || type === 'select') return v ?? null;
  const s = (v ?? '').toString().trim();
  return s === '' ? null : s;
};

function Ghost() {
  return <Text size="2" color="gray" style={{ opacity: 0.6 }}>Vide</Text>;
}

/** Logique d'édition : brouillon, envoi, erreur. `settled` évite Entrée puis blur = double envoi. */
function useEditing({ type, value, required, requiredMessage, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const settled = useRef(false);

  const start = () => {
    settled.current = false;
    setError(null);
    setDraft(type === 'select' ? String(value ?? NONE) : (value ?? '').toString());
    setEditing(true);
  };

  const cancel = useCallback(() => {
    settled.current = true;
    setEditing(false);
  }, []);

  const commit = useCallback(async (raw) => {
    if (settled.current) return;
    settled.current = true;
    setEditing(false);
    const next = normalize(type, raw);
    if (required && next === null) {
      setError(requiredMessage);
      return;
    }
    const current = normalize(type, type === 'select' && value != null ? String(value) : value);
    if (next === current) return;
    setSaving(true);
    try {
      await onSave(next);
    } catch (err) {
      setError(extractApiErrorMessage(err, "Erreur lors de l'enregistrement"));
    } finally {
      setSaving(false);
    }
  }, [type, value, required, requiredMessage, onSave]);

  // Un changement de valeur extérieur (autre équipement, rechargement) efface une erreur périmée
  useEffect(() => { setError(null); }, [value]);

  return { editing, draft, setDraft, saving, error, settled, start, cancel, commit };
}

/** Champ d'édition des types text, textarea, date et select */
function InlineField({ type, label, draft, setDraft, options, commit, cancel, required = false }) {
  if (type === 'select') {
    return (
      <Select.Root
        defaultOpen
        size="1"
        value={draft}
        onValueChange={(v) => commit(v === NONE ? null : v)}
        onOpenChange={(o) => { if (!o) setTimeout(cancel, 0); }}
      >
        <Select.Trigger aria-label={label} />
        <Select.Content>
          {!required && <Select.Item value={NONE}>Aucun</Select.Item>}
          {options.map((o) => <Select.Item key={o.value} value={o.value}>{o.label}</Select.Item>)}
        </Select.Content>
      </Select.Root>
    );
  }
  const multiline = type === 'textarea';
  // Date à moitié saisie : le navigateur renvoie '' ; on annule plutôt que d'effacer la date
  const commitOrCancel = (e) => (type === 'date' && e.target.validity?.badInput ? cancel() : commit(draft));
  const onKeyDown = (e) => {
    if (e.key === 'Escape') { e.preventDefault(); cancel(); return; }
    const submit = e.key === 'Enter' && (!multiline || e.ctrlKey || e.metaKey);
    if (submit) { e.preventDefault(); commitOrCancel(e); }
  };
  const common = {
    autoFocus: true, size: '2', value: draft, 'aria-label': label, onKeyDown,
    onChange: (e) => setDraft(e.target.value), onBlur: commitOrCancel,
  };
  if (multiline) return <TextArea {...common} rows={4} style={{ width: '100%' }} />;
  return <TextField.Root {...common} type={type === 'date' ? 'date' : 'text'} />;
}
InlineField.propTypes = {
  type: PropTypes.string.isRequired, label: PropTypes.string.isRequired, draft: PropTypes.string,
  setDraft: PropTypes.func, options: PropTypes.array, commit: PropTypes.func, cancel: PropTypes.func,
  required: PropTypes.bool,
};

/** Valeur au repos ; focusable et réactive au survol quand elle est modifiable */
function ReadValue({ shown, editable, ariaLabel, onStart, textProps }) {
  const [hover, setHover] = useState(false);
  let body;
  if (shown == null) body = <Ghost />;
  else if (isValidElement(shown)) body = shown; // rendu personnalisé (ex. chemin du rattachement)
  else body = <Text size="2" weight="medium" style={{ whiteSpace: 'pre-wrap' }} {...textProps}>{shown}</Text>;
  if (!editable) return body;
  const current = typeof shown === 'string' || typeof shown === 'number' ? `valeur actuelle : ${shown}` : 'valeur actuelle : voir fiche';
  return (
    <Flex
      align="center"
      gap="2"
      role="button"
      tabIndex={0}
      aria-label={`${ariaLabel} (${current})`}
      onClick={onStart}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onStart(); } }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ ...hoverStyle, backgroundColor: hover ? 'var(--gray-a3)' : undefined, minWidth: 0 }}
    >
      {body}
    </Flex>
  );
}
ReadValue.propTypes = {
  shown: PropTypes.node, editable: PropTypes.bool, ariaLabel: PropTypes.string.isRequired,
  onStart: PropTypes.func.isRequired, textProps: PropTypes.object,
};

function PropertyContent({ label, value, display, type, options, editable, renderEditor, textProps, ed, required }) {
  const ariaLabel = `Modifier ${label.toLowerCase()}`;
  if (type === 'checkbox') {
    return (
      <Checkbox
        checked={value === true}
        disabled={!editable || ed.saving}
        aria-label={ariaLabel}
        onCheckedChange={(c) => { ed.settled.current = false; ed.commit(c === true); }}
      />
    );
  }
  if (ed.editing && type === 'custom') return renderEditor({ onCommit: ed.commit, onCancel: ed.cancel });
  if (ed.editing) {
    return <InlineField type={type} label={label} draft={ed.draft} setDraft={ed.setDraft} options={options} commit={ed.commit} cancel={ed.cancel} required={required} />;
  }
  return (
    <ReadValue
      shown={display ?? (value == null || value === '' ? null : value)}
      editable={editable && !ed.saving}
      ariaLabel={ariaLabel}
      onStart={ed.start}
      textProps={textProps}
    />
  );
}
PropertyContent.propTypes = {
  label: PropTypes.string.isRequired, value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  display: PropTypes.node, type: PropTypes.string.isRequired, options: PropTypes.array, editable: PropTypes.bool,
  renderEditor: PropTypes.func, textProps: PropTypes.object, ed: PropTypes.object.isRequired,
  required: PropTypes.bool,
};

/**
 * @param {string} label - libellé de la ligne (aussi utilisé dans l'aria-label)
 * @param {*} value - valeur courante (brute)
 * @param {React.ReactNode} [display] - rendu en lecture ; défaut : value, ou « Vide » en gris
 * @param {'text'|'textarea'|'date'|'select'|'checkbox'|'custom'} [type]
 * @param {Array<{value:string,label:string}>} [options] - type select (value chaîne)
 * @param {boolean} [editable] - faux = lecture seule, sans survol
 * @param {boolean} [required] - vide refusé avec requiredMessage
 * @param {Function} [onSave] - async (valeur normalisée) ; rejette en cas d'erreur
 * @param {Function} [renderEditor] - type custom : ({ onCommit, onCancel }) => nœud
 * @param {boolean} [bare] - sans libellé ni mise en ligne (ex. nom dans l'en-tête)
 * @param {Object} [textProps] - props du Text de la valeur (ex. size)
 */
export default function EditableProperty({
  type = 'text', bare = false, required = false, requiredMessage = 'Ce champ est obligatoire', ...props
}) {
  const { label } = props;
  const ed = useEditing({ type, value: props.value, required, requiredMessage, onSave: props.onSave });
  const content = <PropertyContent {...props} type={type} ed={ed} required={required} />;
  const indicator = ed.saving ? <Spinner size="1" aria-label="Enregistrement en cours" /> : null;
  const errorLine = ed.error ? <Text as="div" size="1" color="red" role="alert" mt="1">{ed.error}</Text> : null;

  if (bare) {
    return (
      <Box>
        <Flex align="center" gap="2">{content}{indicator}</Flex>
        {errorLine}
      </Box>
    );
  }
  return (
    <Box py="1" style={{ borderBottom: '1px solid var(--gray-4)' }}>
      <Flex align={type === 'textarea' ? 'start' : 'center'} gap="3" style={{ minHeight: 28 }}>
        <Text size="1" color="gray" style={{ width: 130, flexShrink: 0 }}>{label}</Text>
        <Flex align="center" gap="2" style={{ flex: 1, minWidth: 0 }}>{content}{indicator}</Flex>
      </Flex>
      {errorLine && <Box style={{ paddingLeft: 142 }}>{errorLine}</Box>}
    </Box>
  );
}

EditableProperty.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  display: PropTypes.node,
  type: PropTypes.oneOf(['text', 'textarea', 'date', 'select', 'checkbox', 'custom']),
  options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string, label: PropTypes.string })),
  editable: PropTypes.bool,
  required: PropTypes.bool,
  requiredMessage: PropTypes.string,
  onSave: PropTypes.func,
  renderEditor: PropTypes.func,
  bare: PropTypes.bool,
  textProps: PropTypes.object,
};
