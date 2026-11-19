/**
 * Fenêtre d'export de masse des fiches d'interventions fermées : période de fermeture,
 * équipement optionnel, puis ZIP (un PDF par fiche) ou PDF unique à imprimer.
 * Le backend reste seul juge (rôle, plafond de fiches, période) : son message d'erreur
 * est affiché tel quel.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Checkbox, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { CheckCheck, Download, Printer } from 'lucide-react';
import EquipementSearch from '@/components/planning/EquipementSearch';
import ExportFeedback from '@/components/interventions/ExportFeedback';
import { fetchClosedInterventionsExport } from '@/api/interventions';
import { useMarkExportedPrinted } from '@/hooks/interventions/useMarkExportedPrinted';

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

// Boutons du pied de fenêtre ; une fois les fiches marquées, fermer devient l'action principale
function ExportDialogActions({ onClose, onExport, onMark, isBusy, canSubmit, busyFormat, canMark, marking, marked }) {
  return (
    <Flex justify="end" gap="2" mt="4" wrap="wrap">
      <Button variant={marked ? 'solid' : 'soft'} color="gray" onClick={onClose} disabled={isBusy}>
        Fermer
      </Button>
      {canMark && (
        <Button variant="soft" color="green" loading={marking} onClick={onMark}>
          <CheckCheck size={16} />
          Marquer ces fiches comme imprimées
        </Button>
      )}
      <Button variant="soft" disabled={!canSubmit} loading={busyFormat === 'pdf'} onClick={() => onExport('pdf')}>
        <Printer size={16} />
        Imprimer (PDF)
      </Button>
      <Button variant={marked ? 'soft' : 'solid'} disabled={!canSubmit} loading={busyFormat === 'zip'} onClick={() => onExport('zip')}>
        <Download size={16} />
        Télécharger (ZIP)
      </Button>
    </Flex>
  );
}

ExportDialogActions.propTypes = {
  onClose: PropTypes.func.isRequired,
  onExport: PropTypes.func.isRequired,
  onMark: PropTypes.func.isRequired,
  isBusy: PropTypes.bool,
  canSubmit: PropTypes.bool,
  busyFormat: PropTypes.string,
  canMark: PropTypes.bool,
  marking: PropTypes.bool,
  marked: PropTypes.bool,
};

export default function ExportClosedInterventionsDialog({ open, onClose, onMarked }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [equipement, setEquipement] = useState(null);
  const [includePrinted, setIncludePrinted] = useState(false);
  const [busyFormat, setBusyFormat] = useState(null);
  const [error, setError] = useState(null);
  const currentKey = `${dateFrom}|${dateTo}|${equipement?.id ?? ''}|${includePrinted}`;
  const { canMark, marking, markResult, markError, markPrinted, resetMark, setExportedKey } =
    useMarkExportedPrinted({
      currentKey, dateFrom, dateTo, equipementId: equipement?.id, includePrinted, onMarked,
    });

  const isBusy = !!busyFormat || marking;
  const canSubmit = dateFrom && dateTo && !isBusy;

  const handleExport = async (format) => {
    setError(null);
    resetMark();
    // L'onglet est ouvert dans le geste de clic : après un await, le bloqueur de fenêtres le refuserait
    const tab = format === 'pdf' ? window.open('', '_blank') : null;
    setBusyFormat(format);
    try {
      const blob = await fetchClosedInterventionsExport({
        dateFrom,
        dateTo,
        equipementId: equipement?.id,
        includePrinted,
        format,
      });
      if (format === 'pdf') {
        const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        if (tab) tab.location.href = url;
        else window.location.assign(url);
      } else {
        triggerDownload(blob, `fiches-fermees_${dateFrom}_${dateTo}.zip`);
      }
      setExportedKey(currentKey);
    } catch (err) {
      tab?.close();
      setError(err.message);
    } finally {
      setBusyFormat(null);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && !busyFormat && onClose()}>
      <Dialog.Content maxWidth="480px">
        <Dialog.Title>Exporter les fiches fermées</Dialog.Title>
        <Dialog.Description size="2" mb="3">
          Fiches des interventions fermées sur la période (date de fermeture), 100 au maximum,
          rangées par équipement puis par date de fermeture.
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

          <ExportFeedback error={error || markError} markResult={markResult} canMark={canMark} />
          {busyFormat && (
            <Text size="2" color="gray" aria-live="polite">
              Génération en cours, cela peut prendre un moment…
            </Text>
          )}
        </Flex>

        <ExportDialogActions
          onClose={onClose} onExport={handleExport} onMark={markPrinted}
          isBusy={isBusy} canSubmit={!!canSubmit} busyFormat={busyFormat}
          canMark={canMark} marking={marking} marked={!!markResult}
        />
      </Dialog.Content>
    </Dialog.Root>
  );
}

ExportClosedInterventionsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onMarked: PropTypes.func,
};
