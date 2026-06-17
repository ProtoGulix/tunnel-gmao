/**
 * @fileoverview Wizard d'import CSV de demandes d'achat en masse (4 étapes)
 * Étape 1 : Upload + sélection intervention
 * Étape 2 : Mapping colonnes + aperçu
 * Étape 3 : Révision — sélection des lignes avant import
 * Étape 4 : Rapport
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  Dialog,
  Flex,
  Select,
  Table,
  Text,
  TextField,
} from '@radix-ui/themes';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Upload,
  X,
} from 'lucide-react';
import { importPurchaseRequestsCsv, fetchCsvImportHeaders } from '@/api/purchaseRequests';
import { searchOpenInterventions } from '@/api/interventions';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';
import StatusCallout from '@/components/ui/StatusCallout';

// ─── Utilitaires CSV ──────────────────────────────────────────────────────────

function detectSeparator(text) {
  const sample = text.slice(0, 2048);
  const semicolons = (sample.match(/;/g) || []).length;
  const commas = (sample.match(/,/g) || []).length;
  return semicolons >= commas ? ';' : ',';
}

function parseCsvPreview(text) {
  const sep = detectSeparator(text);
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return { headers: [], rows: [], headerRowIndex: 0 };

  // Cherche la première ligne avec ≥2 cellules non vides (évite titres/lignes vides parasites)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const cells = lines[i].split(sep).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (cells.filter(Boolean).length >= 2) {
      headerIdx = i;
      break;
    }
  }

  const headers = lines[headerIdx].split(sep).map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const rows = lines.slice(headerIdx + 1, headerIdx + 6).map((line) =>
    line.split(sep).map((v) => v.trim().replace(/^["']|["']$/g, ''))
  );
  return { headers, rows, headerRowIndex: headerIdx };
}

// ─── Indicateur d'étape ───────────────────────────────────────────────────────

function StepIndicator({ step }) {
  const steps = ['Fichier', 'Mapping', 'Révision', 'Rapport'];
  return (
    <Flex align="center" gap="2" mb="4">
      {steps.map((label, i) => {
        const num = i + 1;
        const done = step > num;
        const active = step === num;
        return (
          <Flex key={num} align="center" gap="2">
            <Flex
              align="center"
              justify="center"
              style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: done
                  ? 'var(--green-9)'
                  : active
                  ? 'var(--blue-9)'
                  : 'var(--gray-5)',
                flexShrink: 0,
              }}
            >
              {done ? (
                <CheckCircle2 size={14} color="white" />
              ) : (
                <Text size="1" weight="bold" style={{ color: 'white' }}>
                  {num}
                </Text>
              )}
            </Flex>
            <Text
              size="2"
              weight={active ? 'bold' : 'regular'}
              color={active ? 'blue' : done ? 'green' : 'gray'}
            >
              {label}
            </Text>
            {i < steps.length - 1 && (
              <ChevronRight size={14} color="var(--gray-7)" />
            )}
          </Flex>
        );
      })}
    </Flex>
  );
}
StepIndicator.propTypes = { step: PropTypes.number.isRequired };

// ─── Étape 1 : Upload ─────────────────────────────────────────────────────────

function Step1Upload({ onNext }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [interventionSearch, setInterventionSearch] = useState('');
  const [interventions, setInterventions] = useState([]);
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [urgency, setUrgency] = useState('normal');
  const [error, setError] = useState(null);
  const [searching, setSearching] = useState(false);
  const fileInputRef = useRef(null);
  const searchTimeout = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.name.toLowerCase().endsWith('.csv')) {
      setError('Le fichier doit être un CSV (.csv)');
      return;
    }
    setError(null);
    setFile(f);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        let text;
        try {
          // Tente UTF-8 strict (avec gestion du BOM)
          const dec = new TextDecoder('utf-8', { fatal: true });
          text = dec.decode(buffer);
          if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
        } catch {
          // Fallback Latin-1 pour les CSV exportés depuis Excel
          text = new TextDecoder('iso-8859-1').decode(buffer);
        }
        setPreview(parseCsvPreview(text));
      } catch {
        setError('Impossible de lire le fichier CSV');
      }
    };
    reader.readAsArrayBuffer(f);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleInterventionSearch = (val) => {
    setInterventionSearch(val);
    setSelectedIntervention(null);
    clearTimeout(searchTimeout.current);
    if (!val.trim()) { setInterventions([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchOpenInterventions(val, { limit: 10 });
        setInterventions(results);
      } catch {
        // non-bloquant
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const canNext = file && selectedIntervention;

  return (
    <Flex direction="column" gap="4">
      {error && <StatusCallout type="error">{error}</StatusCallout>}

      {/* Zone de dépôt */}
      <Box>
        <Text as="label" size="2" weight="bold" mb="2" style={{ display: 'block' }}>
          Fichier CSV <Text color="red">*</Text>
        </Text>
        <Box
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? 'var(--blue-8)' : file ? 'var(--green-8)' : 'var(--gray-6)'}`,
            borderRadius: 'var(--radius-3)',
            padding: '24px',
            textAlign: 'center',
            cursor: 'pointer',
            background: dragOver ? 'var(--blue-2)' : file ? 'var(--green-2)' : 'var(--gray-2)',
            transition: 'all 0.15s',
          }}
        >
          {file ? (
            <Flex align="center" justify="center" gap="2">
              <FileText size={20} color="var(--green-9)" />
              <Text size="2" weight="medium" color="green">{file.name}</Text>
              <Button
                size="1"
                variant="ghost"
                color="gray"
                onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
              >
                <X size={12} />
              </Button>
            </Flex>
          ) : (
            <Flex direction="column" align="center" gap="2">
              <Upload size={24} color="var(--gray-8)" />
              <Text size="2" color="gray">Glisser-déposer ou cliquer pour sélectionner</Text>
              <Text size="1" color="gray">Formats : CSV (séparateur , ou ;)</Text>
            </Flex>
          )}
        </Box>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </Box>

      {/* Aperçu */}
      {preview && preview.headers.filter(Boolean).length > 0 && (
        <Box style={{ background: 'var(--gray-2)', borderRadius: 'var(--radius-2)', padding: '10px 12px' }}>
          <Text size="1" weight="bold" color="gray" mb="1" style={{ display: 'block' }}>
            Aperçu — {preview.headers.filter(Boolean).length} colonnes détectées
            {(preview.headerRowIndex ?? 0) > 0 && (
              <Text size="1" color="gray"> (en-tête détectée à la ligne {(preview.headerRowIndex ?? 0) + 1})</Text>
            )}
          </Text>
          <Box style={{ overflowX: 'auto' }}>
            <table style={{ fontSize: 11, borderCollapse: 'collapse', width: '100%' }}>
              <thead>
                <tr>
                  {preview.headers.map((h, i) => (
                    <th key={i} style={{ padding: '3px 8px', textAlign: 'left', background: 'var(--gray-4)', fontFamily: 'monospace' }}>
                      {h || <Text color="gray" style={{ fontStyle: 'italic' }}>(vide)</Text>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.rows.map((row, i) => (
                  <tr key={i} style={{ background: i % 2 ? 'var(--gray-2)' : 'white' }}>
                    {row.map((cell, j) => (
                      <td key={j} style={{ padding: '3px 8px', fontFamily: 'monospace' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </Box>
      )}

      {/* Sélection intervention */}
      <Box>
        <Text as="label" size="2" weight="bold" mb="2" style={{ display: 'block' }}>
          Intervention cible <Text color="red">*</Text>
        </Text>
        {selectedIntervention ? (
          <Flex
            align="center"
            gap="2"
            style={{
              padding: '8px 12px',
              background: 'var(--blue-2)',
              border: '1px solid var(--blue-6)',
              borderRadius: 'var(--radius-2)',
            }}
          >
            <Badge size="1" color="blue" style={{ fontFamily: 'monospace' }}>{selectedIntervention.code}</Badge>
            <Text size="2" style={{ flex: 1 }}>{selectedIntervention.title}</Text>
            <Button
              size="1"
              variant="ghost"
              color="gray"
              onClick={() => { setSelectedIntervention(null); setInterventionSearch(''); setInterventions([]); }}
            >
              <X size={12} />
            </Button>
          </Flex>
        ) : (
          <Box style={{ position: 'relative' }}>
            <TextField.Root
              placeholder="Rechercher une intervention (code, titre)…"
              value={interventionSearch}
              onChange={(e) => handleInterventionSearch(e.target.value)}
            >
              {searching && (
                <TextField.Slot side="right">
                  <Loader2 size={14} className="animate-spin" />
                </TextField.Slot>
              )}
            </TextField.Root>
            {interventions.length > 0 && (
              <Box
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  background: 'var(--color-panel-solid)',
                  border: '1px solid var(--gray-6)',
                  borderRadius: 'var(--radius-2)',
                  boxShadow: 'var(--shadow-4)',
                  maxHeight: 220,
                  overflowY: 'auto',
                }}
              >
                {interventions.map((iv) => (
                  <Box
                    key={iv.id}
                    onClick={() => { setSelectedIntervention(iv); setInterventions([]); setInterventionSearch(''); }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid var(--gray-4)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--blue-3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <Flex align="center" gap="2">
                      <Badge size="1" variant="soft" color="blue" style={{ fontFamily: 'monospace', flexShrink: 0 }}>
                        {iv.code}
                      </Badge>
                      <Text size="2" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {iv.title}
                      </Text>
                    </Flex>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Urgence */}
      <Box>
        <Text as="label" size="2" weight="bold" mb="2" style={{ display: 'block' }}>
          Urgence globale
        </Text>
        <Select.Root value={urgency} onValueChange={setUrgency}>
          <Select.Trigger style={{ width: 200 }} />
          <Select.Content>
            <Select.Item value="normal">Normal</Select.Item>
            <Select.Item value="high">Élevée</Select.Item>
            <Select.Item value="critical">Critique</Select.Item>
          </Select.Content>
        </Select.Root>
      </Box>

      <Flex justify="end">
        <Button
          disabled={!canNext}
          onClick={() => onNext({ file, preview, intervention: selectedIntervention, urgency })}
        >
          Suivant <ChevronRight size={14} />
        </Button>
      </Flex>
    </Flex>
  );
}
Step1Upload.propTypes = { onNext: PropTypes.func.isRequired };

// ─── Étape 2 : Mapping ────────────────────────────────────────────────────────

function Step2Mapping({ file, preview, intervention, urgency, onBack, onNext }) {
  const [colRef, setColRef] = useState('');
  const [colQty, setColQty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendHeaders, setBackendHeaders] = useState(null);
  const [headersLoading, setHeadersLoading] = useState(true);

  // Charge les colonnes telles que le backend les voit — garantit que les noms
  // envoyés à /import correspondent exactement à ceux que le backend lira.
  useEffect(() => {
    let cancelled = false;
    setHeadersLoading(true);
    fetchCsvImportHeaders(file)
      .then(({ headers }) => {
        if (!cancelled) setBackendHeaders(headers);
      })
      .catch((e) => {
        if (!cancelled) setError(extractApiErrorMessage(e, 'Impossible de lire les colonnes du fichier'));
      })
      .finally(() => {
        if (!cancelled) setHeadersLoading(false);
      });
    return () => { cancelled = true; };
  }, [file]);

  const headers = backendHeaders ?? preview?.headers ?? [];

  const validate = () => {
    if (!colRef) return 'Sélectionnez la colonne référence';
    if (!colQty) return 'Sélectionnez la colonne quantité';
    if (colRef === colQty) return 'Les deux colonnes doivent être différentes';
    const rows = preview?.rows ?? [];
    const hasNumeric = rows.some((row) => {
      const idx = headers.indexOf(colQty);
      const val = row[idx];
      return val && !isNaN(parseFloat(val));
    });
    if (!hasNumeric) return 'La colonne quantité ne semble pas contenir de nombres';
    return null;
  };

  const handleAnalyse = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError(null);
    setLoading(true);
    try {
      // dry_run=true : analyse sans créer
      const result = await importPurchaseRequestsCsv(
        file,
        intervention.id,
        colRef,
        colQty,
        urgency,
        true,
        []
      );
      onNext({ result, colRef, colQty });
    } catch (e) {
      setError(extractApiErrorMessage(e, "Erreur lors de l'analyse"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Flex direction="column" gap="4">
      {error && <StatusCallout type="error">{error}</StatusCallout>}

      <Flex gap="4" wrap="wrap">
        <Box style={{ flex: 1, minWidth: 180 }}>
          <Text as="label" size="2" weight="bold" mb="2" style={{ display: 'block' }}>
            Colonne référence <Text color="red">*</Text>
          </Text>
          <Select.Root value={colRef} onValueChange={setColRef} disabled={headersLoading}>
            <Select.Trigger style={{ width: '100%' }} placeholder={headersLoading ? 'Chargement…' : 'Choisir…'} />
            <Select.Content>
              {headers.map((h, i) => h ? (
                <Select.Item key={i} value={h}>{h}</Select.Item>
              ) : null)}
            </Select.Content>
          </Select.Root>
        </Box>
        <Box style={{ flex: 1, minWidth: 180 }}>
          <Text as="label" size="2" weight="bold" mb="2" style={{ display: 'block' }}>
            Colonne quantité <Text color="red">*</Text>
          </Text>
          <Select.Root value={colQty} onValueChange={setColQty} disabled={headersLoading}>
            <Select.Trigger style={{ width: '100%' }} placeholder={headersLoading ? 'Chargement…' : 'Choisir…'} />
            <Select.Content>
              {headers.map((h, i) => h ? (
                <Select.Item key={i} value={h}>{h}</Select.Item>
              ) : null)}
            </Select.Content>
          </Select.Root>
        </Box>
      </Flex>

      {/* Aperçu tableau */}
      {headers.length > 0 && (
        <Box style={{ overflowX: 'auto' }}>
          <Text size="1" weight="bold" color="gray" mb="1" style={{ display: 'block' }}>
            Aperçu (5 premières lignes)
          </Text>
          <table style={{ fontSize: 11, borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                {headers.map((h, i) => (
                  <th
                    key={i}
                    style={{
                      padding: '4px 8px',
                      textAlign: 'left',
                      background:
                        h === colRef
                          ? 'var(--blue-4)'
                          : h === colQty
                          ? 'var(--green-4)'
                          : 'var(--gray-4)',
                      fontFamily: 'monospace',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h || <Text color="gray" style={{ fontStyle: 'italic', fontSize: 10 }}>(vide)</Text>}
                    {h === colRef && <Badge size="1" color="blue" ml="1">ref</Badge>}
                    {h === colQty && <Badge size="1" color="green" ml="1">qté</Badge>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(preview?.rows ?? []).map((row, i) => (
                <tr key={i} style={{ background: i % 2 ? 'var(--gray-2)' : 'white' }}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      style={{
                        padding: '3px 8px',
                        fontFamily: 'monospace',
                        background:
                          headers[j] === colRef
                            ? 'var(--blue-2)'
                            : headers[j] === colQty
                            ? 'var(--green-2)'
                            : undefined,
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}

      <Flex justify="between">
        <Button variant="soft" color="gray" onClick={onBack} disabled={loading}>
          Retour
        </Button>
        <Button onClick={handleAnalyse} disabled={loading || headersLoading || !colRef || !colQty}>
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Analyse en cours…
            </>
          ) : (
            <>Analyser <ChevronRight size={14} /></>
          )}
        </Button>
      </Flex>
    </Flex>
  );
}
Step2Mapping.propTypes = {
  file: PropTypes.object.isRequired,
  preview: PropTypes.object.isRequired,
  intervention: PropTypes.object.isRequired,
  urgency: PropTypes.string.isRequired,
  onBack: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
};

// ─── Étape 3 : Révision ───────────────────────────────────────────────────────

function Step3Review({ file, intervention, urgency, colRef, colQty, preview, onBack, onDone }) {
  const validLines = preview.lines.filter((l) => l.status !== 'error');
  // Pré-décocher les doublons et les lignes "À qualifier" déjà existantes
  const [selected, setSelected] = useState(() => {
    const init = new Set();
    validLines.forEach((l) => {
      if (!l.duplicate_warning && l.existing_to_qualify === 0) {
        init.add(l.row);
      }
    });
    return init;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const errorLines = preview.lines.filter((l) => l.status === 'error');
  const allValidRows = validLines.map((l) => l.row);
  const allSelected = allValidRows.every((r) => selected.has(r));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allValidRows));
    }
  };

  const toggle = (row) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(row)) next.delete(row);
      else next.add(row);
      return next;
    });
  };

  const handleImport = async () => {
    setError(null);
    setLoading(true);
    const excludedRows = allValidRows.filter((r) => !selected.has(r));
    try {
      const result = await importPurchaseRequestsCsv(
        file,
        intervention.id,
        colRef,
        colQty,
        urgency,
        false,
        excludedRows
      );
      onDone(result);
    } catch (e) {
      setError(extractApiErrorMessage(e, "Erreur lors de l'import"));
    } finally {
      setLoading(false);
    }
  };

  const selectedCount = selected.size;

  return (
    <Flex direction="column" gap="4">
      {error && <StatusCallout type="error">{error}</StatusCallout>}

      {/* Résumé aperçu */}
      <Flex gap="3" wrap="wrap" align="center">
        <Text size="2" color="gray">{preview.total} ligne{preview.total > 1 ? 's' : ''} détectée{preview.total > 1 ? 's' : ''}</Text>
        {errorLines.length > 0 && (
          <Badge size="2" color="red" variant="surface">
            {errorLines.length} erreur{errorLines.length > 1 ? 's' : ''} (ignorée{errorLines.length > 1 ? 's' : ''})
          </Badge>
        )}
        <Badge size="2" color="blue" variant="surface">
          {selectedCount} sélectionnée{selectedCount > 1 ? 's' : ''} sur {validLines.length}
        </Badge>
      </Flex>

      {/* Légende */}
      <Flex gap="3" wrap="wrap">
        <Flex align="center" gap="1">
          <Box style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--amber-4)' }} />
          <Text size="1" color="gray">Doublon sur cette intervention</Text>
        </Flex>
        <Flex align="center" gap="1">
          <Box style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--orange-4)' }} />
          <Text size="1" color="gray">DA À qualifier existante</Text>
        </Flex>
      </Flex>

      {/* Tableau révision */}
      <Box style={{ overflowX: 'auto', maxHeight: 380, overflowY: 'auto' }}>
        <Table.Root size="1">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell style={{ width: 36 }}>
                <Checkbox
                  checked={allSelected ? true : selected.size === 0 ? false : 'indeterminate'}
                  onCheckedChange={toggleAll}
                />
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>#</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Référence brute</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Qté</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Résolution catalogue</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Alertes</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {preview.lines.map((line) => {
              const isError = line.status === 'error';
              const hasDuplicate = line.duplicate_warning;
              const hasExistingToQualify = line.existing_to_qualify > 0;
              const rowBg = isError
                ? 'var(--red-2)'
                : hasDuplicate
                ? 'var(--amber-2)'
                : hasExistingToQualify
                ? 'var(--orange-2)'
                : undefined;

              return (
                <Table.Row key={line.row} style={{ background: rowBg, opacity: isError ? 0.7 : 1 }}>
                  <Table.Cell>
                    {!isError && (
                      <Checkbox
                        checked={selected.has(line.row)}
                        onCheckedChange={() => toggle(line.row)}
                      />
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="1" color="gray">{line.row}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="1" style={{ fontFamily: 'monospace' }}>{line.raw_ref || '—'}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="1">{line.raw_qty}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    {isError ? (
                      <Text size="1" color="red">{line.error}</Text>
                    ) : line.internal_ref ? (
                      <Flex direction="column" gap="1">
                        <Badge size="1" color="blue" variant="soft" style={{ fontFamily: 'monospace' }}>
                          {line.internal_ref}
                        </Badge>
                        {line.display_name && (
                          <Text size="1" color="gray">{line.display_name}</Text>
                        )}
                      </Flex>
                    ) : (
                      <Badge size="1" color="orange" variant="soft">À qualifier</Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Flex direction="column" gap="1">
                      {hasDuplicate && (
                        <Flex align="center" gap="1">
                          <AlertTriangle size={11} color="var(--amber-9)" />
                          <Text size="1" color="amber">
                            {line.existing_qty != null ? `${line.existing_qty} déjà commandé(s)` : 'Doublon intervention'}
                          </Text>
                        </Flex>
                      )}
                      {hasExistingToQualify && (
                        <Flex align="center" gap="1">
                          <AlertTriangle size={11} color="var(--orange-9)" />
                          <Text size="1" color="orange">
                            {line.existing_to_qualify} DA À qualifier existante{line.existing_to_qualify > 1 ? 's' : ''}
                          </Text>
                        </Flex>
                      )}
                      {!hasDuplicate && !hasExistingToQualify && !isError && (
                        <Text size="1" color="gray">—</Text>
                      )}
                    </Flex>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>

      <Flex justify="between">
        <Button variant="soft" color="gray" onClick={onBack} disabled={loading}>
          Retour
        </Button>
        <Button onClick={handleImport} disabled={loading || selectedCount === 0}>
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Import en cours…
            </>
          ) : (
            <>Importer {selectedCount} DA <ChevronRight size={14} /></>
          )}
        </Button>
      </Flex>
    </Flex>
  );
}
Step3Review.propTypes = {
  file: PropTypes.object.isRequired,
  intervention: PropTypes.object.isRequired,
  urgency: PropTypes.string.isRequired,
  colRef: PropTypes.string.isRequired,
  colQty: PropTypes.string.isRequired,
  preview: PropTypes.object.isRequired,
  onBack: PropTypes.func.isRequired,
  onDone: PropTypes.func.isRequired,
};

// ─── Étape 4 : Rapport ────────────────────────────────────────────────────────

const DA_STATUS_LABELS = {
  TO_QUALIFY: { label: 'À qualifier', color: 'orange' },
  NO_SUPPLIER_REF: { label: 'Sans fournisseur', color: 'red' },
  PENDING_DISPATCH: { label: 'À dispatcher', color: 'blue' },
  OPEN: { label: 'Ouverte', color: 'indigo' },
  QUOTED: { label: 'Devisée', color: 'purple' },
  ORDERED: { label: 'Commandée', color: 'cyan' },
  PARTIAL: { label: 'Partielle', color: 'amber' },
  RECEIVED: { label: 'Reçue', color: 'green' },
  REJECTED: { label: 'Rejetée', color: 'red' },
};

function Step4Report({ result, onClose }) {
  const toQualify = result.lines.filter((l) => l.status === 'created' && l.da_status === 'TO_QUALIFY').length;
  const duplicates = result.lines.filter((l) => l.duplicate_warning && l.status === 'created').length;

  return (
    <Flex direction="column" gap="4">
      {/* Résumé */}
      <Flex gap="3" wrap="wrap">
        <Badge size="2" color="green" variant="surface">
          <CheckCircle2 size={12} /> {result.created} créée{result.created > 1 ? 's' : ''}
        </Badge>
        {(result.skipped ?? 0) > 0 && (
          <Badge size="2" color="gray" variant="surface">
            {result.skipped} ignorée{result.skipped > 1 ? 's' : ''}
          </Badge>
        )}
        {toQualify > 0 && (
          <Badge size="2" color="orange" variant="surface">
            {toQualify} à qualifier
          </Badge>
        )}
        {duplicates > 0 && (
          <Badge size="2" color="amber" variant="surface">
            <AlertTriangle size={12} /> {duplicates} doublon{duplicates > 1 ? 's' : ''}
          </Badge>
        )}
        {result.errors > 0 && (
          <Badge size="2" color="red" variant="surface">
            {result.errors} erreur{result.errors > 1 ? 's' : ''}
          </Badge>
        )}
      </Flex>

      {/* Tableau rapport */}
      <Box style={{ overflowX: 'auto', maxHeight: 380, overflowY: 'auto' }}>
        <Table.Root size="1">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell>#</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Référence brute</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Qté</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Résolution</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Statut DA</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Alerte</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {result.lines.map((line) => {
              const statusCfg = DA_STATUS_LABELS[line.da_status] ?? null;
              const isSkipped = line.status === 'skipped';
              return (
                <Table.Row
                  key={line.row}
                  style={{
                    background: line.status === 'error'
                      ? 'var(--red-2)'
                      : isSkipped
                      ? 'var(--gray-2)'
                      : undefined,
                    opacity: isSkipped ? 0.6 : 1,
                  }}
                >
                  <Table.Cell>
                    <Text size="1" color="gray">{line.row}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="1" style={{ fontFamily: 'monospace' }}>{line.raw_ref || '—'}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    <Text size="1">{line.raw_qty}</Text>
                  </Table.Cell>
                  <Table.Cell>
                    {line.status === 'error' ? (
                      <Text size="1" color="red">{line.error}</Text>
                    ) : isSkipped ? (
                      <Text size="1" color="gray">Ignorée</Text>
                    ) : line.internal_ref ? (
                      <Flex direction="column" gap="1">
                        <Badge size="1" color="blue" variant="soft" style={{ fontFamily: 'monospace' }}>
                          {line.internal_ref}
                        </Badge>
                        {line.display_name && (
                          <Text size="1" color="gray">{line.display_name}</Text>
                        )}
                      </Flex>
                    ) : (
                      <Badge size="1" color="orange" variant="soft">À qualifier</Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {statusCfg ? (
                      <Badge size="1" color={statusCfg.color} variant="soft">{statusCfg.label}</Badge>
                    ) : line.status === 'error' ? (
                      <Badge size="1" color="red" variant="soft">Erreur</Badge>
                    ) : isSkipped ? (
                      <Badge size="1" color="gray" variant="soft">Ignorée</Badge>
                    ) : (
                      <Text size="1" color="gray">—</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    {line.duplicate_warning && !isSkipped ? (
                      <Flex align="center" gap="1">
                        <AlertTriangle size={12} color="var(--amber-9)" />
                        <Text size="1" color="amber">
                          {line.existing_qty != null ? `${line.existing_qty} déjà commandé(s)` : 'Doublon'}
                        </Text>
                      </Flex>
                    ) : (
                      <Text size="1" color="gray">—</Text>
                    )}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>
      </Box>

      <Flex justify="end">
        <Button onClick={onClose}>Fermer</Button>
      </Flex>
    </Flex>
  );
}
Step4Report.propTypes = {
  result: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
};

// ─── Composant principal ──────────────────────────────────────────────────────

export default function CsvImportWizard({ open, onOpenChange, onSuccess }) {
  const [step, setStep] = useState(1);
  const [step1Data, setStep1Data] = useState(null);
  const [step2Data, setStep2Data] = useState(null);
  const [result, setResult] = useState(null);

  const reset = () => {
    setStep(1);
    setStep1Data(null);
    setStep2Data(null);
    setResult(null);
  };

  const handleOpenChange = (v) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const handleStep1Next = (data) => {
    setStep1Data(data);
    setStep(2);
  };

  const handleStep2Next = ({ result: previewResult, colRef, colQty }) => {
    setStep2Data({ previewResult, colRef, colQty });
    setStep(3);
  };

  const handleStep3Done = (res) => {
    setResult(res);
    setStep(4);
    onSuccess?.();
  };

  const handleClose = () => {
    handleOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Content style={{ maxWidth: 720 }} aria-describedby={undefined}>
        <Dialog.Title>
          <Flex align="center" gap="2">
            <Upload size={18} />
            Import CSV — Demandes d&apos;achat
          </Flex>
        </Dialog.Title>

        <StepIndicator step={step} />

        {step === 1 && <Step1Upload onNext={handleStep1Next} />}

        {step === 2 && step1Data && (
          <Step2Mapping
            file={step1Data.file}
            preview={step1Data.preview}
            intervention={step1Data.intervention}
            urgency={step1Data.urgency}
            onBack={() => setStep(1)}
            onNext={handleStep2Next}
          />
        )}

        {step === 3 && step1Data && step2Data && (
          <Step3Review
            file={step1Data.file}
            intervention={step1Data.intervention}
            urgency={step1Data.urgency}
            colRef={step2Data.colRef}
            colQty={step2Data.colQty}
            preview={step2Data.previewResult}
            onBack={() => setStep(2)}
            onDone={handleStep3Done}
          />
        )}

        {step === 4 && result && (
          <Step4Report result={result} onClose={handleClose} />
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}

CsvImportWizard.propTypes = {
  open: PropTypes.bool.isRequired,
  onOpenChange: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
};
