/**
 * Fenêtre d'export de masse des fiches d'interventions fermées : période de fermeture,
 * équipement optionnel, puis ZIP (un PDF par fiche) ou PDF unique à imprimer.
 * Le backend reste seul juge (rôle, plafond de fiches, période) : son message d'erreur
 * est affiché tel quel.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Callout, Dialog, Flex, Text, TextField } from '@radix-ui/themes';
import { AlertTriangle, Download, Printer } from 'lucide-react';
import EquipementSearch from '@/components/planning/EquipementSearch';
import { fetchClosedInterventionsExport } from '@/api/interventions';

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

export default function ExportClosedInterventionsDialog({ open, onClose }) {
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [equipement, setEquipement] = useState(null);
  const [busyFormat, setBusyFormat] = useState(null);
  const [error, setError] = useState(null);

  const canSubmit = dateFrom && dateTo && !busyFormat;

  const handleExport = async (format) => {
    setError(null);
    // L'onglet est ouvert dans le geste de clic : après un await, le bloqueur de fenêtres le refuserait
    const tab = format === 'pdf' ? window.open('', '_blank') : null;
    setBusyFormat(format);
    try {
      const blob = await fetchClosedInterventionsExport({
        dateFrom,
        dateTo,
        equipementId: equipement?.id,
        format,
      });
      if (format === 'pdf') {
        const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
        if (tab) tab.location.href = url;
        else window.location.assign(url);
      } else {
        triggerDownload(blob, `fiches-fermees_${dateFrom}_${dateTo}.zip`);
      }
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
          Fiches des interventions fermées sur la période (date de fermeture), 100 au maximum.
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

          {error && (
            <Callout.Root color="red" size="1" role="alert">
              <Callout.Icon><AlertTriangle size={16} /></Callout.Icon>
              <Callout.Text>{error}</Callout.Text>
            </Callout.Root>
          )}
          {busyFormat && (
            <Text size="2" color="gray" aria-live="polite">
              Génération en cours, cela peut prendre un moment…
            </Text>
          )}
        </Flex>

        <Flex justify="end" gap="2" mt="4" wrap="wrap">
          <Button variant="soft" color="gray" onClick={onClose} disabled={!!busyFormat}>
            Fermer
          </Button>
          <Button variant="soft" disabled={!canSubmit} loading={busyFormat === 'pdf'} onClick={() => handleExport('pdf')}>
            <Printer size={16} />
            Imprimer (PDF)
          </Button>
          <Button disabled={!canSubmit} loading={busyFormat === 'zip'} onClick={() => handleExport('zip')}>
            <Download size={16} />
            Télécharger (ZIP)
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}

ExportClosedInterventionsDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};
