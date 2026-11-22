/**
 * Fenêtre d'export de masse des fiches d'interventions fermées : période de fermeture,
 * équipement optionnel, puis ZIP (un PDF par fiche) ou PDF unique à imprimer.
 * Le backend reste seul juge (rôle, plafond de fiches, période) : son message d'erreur
 * est affiché tel quel.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Checkbox, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import EquipementSearch from '@/components/planning/EquipementSearch';
import { ErrorCallout, ExportProgress } from '@/components/interventions/ExportFeedback';
import { ArchiveBlock, ExportBlock, ExportBlocks } from '@/components/interventions/ExportBlocks';
import ExportPreview from '@/components/interventions/ExportPreview';
import { fetchClosedInterventionsExport } from '@/api/interventions';
import { useMarkExportedPrinted } from '@/hooks/interventions/useMarkExportedPrinted';
import { useClosedExportPreview } from '@/hooks/interventions/useClosedExportPreview';

function triggerDownload(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => window.URL.revokeObjectURL(url), 10000);
}

// Le résultat et l'indicateur d'un marquage vont dans le bloc qui l'a lancé
function splitByOrigin(lastMark, marking, result) {
  const pick = (origin) => ({
    marking: marking && lastMark === origin,
    result: lastMark === origin ? result : null,
  });
  return { mark: pick('mark'), archive: pick('archive') };
}

async function runExport(params, tab) {
  const blob = await fetchClosedInterventionsExport(params);
  if (params.format === 'pdf') {
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
    if (tab) tab.location.href = url;
    else window.location.assign(url);
  } else {
    triggerDownload(blob, `fiches-fermees_${params.dateFrom}_${params.dateTo}.zip`);
  }
}

export default function ExportClosedInterventionsDialog({ open, onClose, onMarked }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [equipement, setEquipement] = useState(null);
  const [includePrinted, setIncludePrinted] = useState(false);
  // Confirmation liée aux critères affichés : elle disparaît si la sélection change
  const [confirmKey, setConfirmKey] = useState(null);
  // Origine du dernier résultat (marquage après export ou archivage) : il s'affiche dans son bloc
  const [lastMark, setLastMark] = useState(null);
  const [busyFormat, setBusyFormat] = useState(null);
  const [error, setError] = useState(null);
  // Incrémenté après chaque marquage : l'aperçu est recalculé (les fiches marquées en sortent)
  const [selectionVersion, setSelectionVersion] = useState(0);
  const handleMarked = () => {
    setSelectionVersion((v) => v + 1);
    onMarked?.();
  };
  const equipementId = equipement?.id;
  const currentKey = `${dateFrom}|${dateTo}|${equipementId ?? ''}|${includePrinted}`;
  const confirmingArchive = confirmKey === currentKey;
  const { canMark, marking, markResult, markError, markPrinted, archiveWithoutExport, resetMark, setExportedKey } =
    useMarkExportedPrinted({
      currentKey, dateFrom, dateTo, equipementId, includePrinted, onMarked: handleMarked,
    });

  const { preview, previewError, previewLoading, hasSelection } = useClosedExportPreview({
    dateFrom, dateTo, equipementId, includePrinted, enabled: open, version: selectionVersion,
  });

  const isBusy = !!busyFormat || marking;
  const canSubmit = hasSelection && !isBusy && !confirmingArchive;

  const byOrigin = splitByOrigin(lastMark, marking, markResult);

  const handleArchive = async () => {
    setError(null);
    setConfirmKey(null);
    setLastMark('archive');
    await archiveWithoutExport();
  };

  const handleMark = () => {
    setLastMark('mark');
    return markPrinted();
  };

  const handleExport = async (format) => {
    setError(null);
    resetMark();
    // L'onglet est ouvert dans le geste de clic : après un await, le bloqueur de fenêtres le refuserait
    const tab = format === 'pdf' ? window.open('', '_blank') : null;
    setBusyFormat(format);
    try {
      await runExport({ dateFrom, dateTo, equipementId, includePrinted, format }, tab);
      setExportedKey(currentKey);
    } catch (err) {
      tab?.close();
      setError(err.message);
    } finally {
      setBusyFormat(null);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && !isBusy && onClose()}>
      <Dialog.Content maxWidth="640px">
        <Dialog.Title>Fiches fermées : exporter ou archiver</Dialog.Title>
        <Dialog.Description size="2" mb="3">
          Période de fermeture, 100 fiches au maximum.
        </Dialog.Description>

        <Flex direction="column" gap="3">
          <Flex gap="3" wrap="wrap">
            <label style={{ flex: 1, minWidth: 150 }}>
              <Text as="div" size="2" weight="bold" mb="1">Fermées du <Text color="red">*</Text></Text>
              <TextField.Root type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </label>
            <label style={{ flex: 1, minWidth: 150 }}>
              <Text as="div" size="2" weight="bold" mb="1">au <Text color="red">*</Text></Text>
              <TextField.Root type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </label>
          </Flex>

          <div>
            <Text as="div" size="2" weight="bold" mb="1">Équipement (optionnel)</Text>
            <EquipementSearch value={equipement} onChange={setEquipement} />
          </div>

          <Text as="label" size="2">
            <Flex gap="2" align="center">
              <Checkbox checked={includePrinted} onCheckedChange={(v) => setIncludePrinted(v === true)} />
              Inclure les fiches déjà imprimées
            </Flex>
          </Text>

          <ExportPreview
            preview={preview} loading={previewLoading} error={previewError} dateFrom={dateFrom} dateTo={dateTo}
          />
          <ErrorCallout error={error || markError} />
          <ExportProgress busyFormat={busyFormat} marking={marking} />
          <ExportBlocks>
            <ExportBlock
              onExport={handleExport} onMark={handleMark} disabled={!canSubmit} busyFormat={busyFormat}
              canMark={canMark} marking={byOrigin.mark.marking}
              markResult={byOrigin.mark.result}
            />
            <ArchiveBlock
              onArchive={() => { resetMark(); setConfirmKey(currentKey); }}
              onConfirm={handleArchive} onCancel={() => setConfirmKey(null)}
              disabled={!canSubmit} marking={byOrigin.archive.marking} confirming={confirmingArchive}
              count={preview ? preview.count : undefined}
              archiveResult={byOrigin.archive.result}
              scope={{ dateFrom, dateTo, equipement }}
            />
          </ExportBlocks>
        </Flex>

        <Flex justify="end" mt="4">
          <Button variant={markResult ? 'solid' : 'soft'} color="gray" onClick={onClose} disabled={isBusy}>
            Fermer
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

ExportClosedInterventionsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onMarked: PropTypes.func,
};
