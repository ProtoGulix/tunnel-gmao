/**
 * Onglet Fiche - Visualisation et téléchargement PDF
 *
 * Affiche la fiche d'intervention en PDF dans un iframe.
 */

import { useState } from 'react';
import { Box, Flex, Button, Callout } from '@radix-ui/themes';
import { FileText, Download, CheckCircle, Archive } from 'lucide-react';
import PropTypes from 'prop-types';
import LoadingState from '@/components/ui/LoadingState';

/**
 * Calcule les styles du visualiseur selon le mode d'affichage
 */
function getViewerStyles(fillHeight) {
  if (!fillHeight) {
    return { root: undefined, list: undefined, viewer: { height: '70vh' } };
  }
  const flexFill = { flex: 1, minHeight: 0 };
  return {
    root: { ...flexFill, display: 'flex', flexDirection: 'column' },
    list: flexFill,
    viewer: flexFill,
  };
}

/**
 * Bouton « Marquer comme imprimée », ou mention « Fiche imprimée ».
 * Le marquage archive l'intervention fermée (ADR 0041) : confirmation d'abord.
 */
function MarkPrinted({ printedFiche, onMarkPrinted, disabled }) {
  const [confirming, setConfirming] = useState(false);

  if (printedFiche) {
    return (
      <Flex align="center" gap="1" style={{ color: 'var(--green-11)', fontSize: '14px' }}>
        <CheckCircle size={16} />
        <span>Fiche imprimée</span>
      </Flex>
    );
  }
  if (!onMarkPrinted) return null;

  const confirm = () => {
    setConfirming(false);
    onMarkPrinted();
  };

  return (
    <>
      <Button
        size="2"
        variant="soft"
        color="green"
        onClick={() => setConfirming(true)}
        disabled={disabled || confirming}
      >
        <CheckCircle size={16} />
        Marquer comme imprimée
      </Button>
      {confirming && (
        <Callout.Root color="orange" size="1" role="alertdialog" style={{ flexBasis: '100%' }}>
          <Callout.Icon><Archive size={16} /></Callout.Icon>
          <Callout.Text>
            L’intervention sera archivée et ne pourra plus être rouverte.
            <Flex gap="2" mt="2">
              <Button size="1" color="orange" onClick={confirm}>Confirmer</Button>
              <Button size="1" variant="soft" color="gray" onClick={() => setConfirming(false)}>Annuler</Button>
            </Flex>
          </Callout.Text>
        </Callout.Root>
      )}
    </>
  );
}

MarkPrinted.propTypes = {
  printedFiche: PropTypes.bool,
  onMarkPrinted: PropTypes.func,
  disabled: PropTypes.bool,
};

/**
 * Composant SheetTab
 *
 * @param {Object} props
 * @param {string} props.pdfUrl - URL du blob PDF
 * @param {boolean} props.pdfLoading - État de chargement du PDF
 * @param {boolean} props.printedFiche - Indique si la fiche a été imprimée
 * @param {string} props.fileName - Nom du fichier PDF
 * @param {Function} props.onMarkPrinted - Callback marquage imprimé
 * @param {boolean} props.fillHeight - Si vrai, le visualiseur occupe toute la hauteur disponible du parent (au lieu d'une hauteur fixe en vh)
 */
export default function SheetTab({
  pdfUrl,
  pdfLoading,
  printedFiche,
  fileName,
  onMarkPrinted,
  fillHeight,
}) {
  const handleDownload = () => {
    if (!pdfUrl) return;

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const viewerStyles = getViewerStyles(fillHeight);

  return (
    <Box pt="4" style={viewerStyles.root}>
      <Flex direction="column" gap="3" style={viewerStyles.list}>
        {/* Actions */}
        <Flex gap="2" align="center" wrap="wrap">
          <Button
            size="2"
            variant="soft"
            onClick={handleDownload}
            disabled={!pdfUrl || pdfLoading}
          >
            <Download size={16} />
            Télécharger
          </Button>

          <MarkPrinted
            printedFiche={printedFiche}
            onMarkPrinted={onMarkPrinted}
            disabled={pdfLoading}
          />
        </Flex>

        {/* Visualiseur PDF */}
        <Box
          style={{
            ...viewerStyles.viewer,
            position: 'relative',
            border: '1px solid var(--gray-6)',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: 'var(--gray-2)',
          }}
        >
          {pdfLoading && (
            <Box p="8" style={{ position: 'absolute', inset: 0 }}>
              <LoadingState message="Chargement du PDF..." />
            </Box>
          )}

          {!pdfLoading && !pdfUrl && (
            <Flex
              align="center"
              justify="center"
              direction="column"
              gap="2"
              style={{ position: 'absolute', inset: 0, color: 'var(--gray-11)' }}
            >
              <FileText size={48} />
              <div>Impossible de charger la fiche PDF</div>
            </Flex>
          )}

          {!pdfLoading && pdfUrl && (
            <object
              data={pdfUrl}
              type="application/pdf"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
            >
              <p>
                Votre navigateur ne peut pas afficher le PDF.{' '}
                <a href={pdfUrl} download={fileName}>
                  Télécharger le fichier
                </a>
              </p>
            </object>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

SheetTab.propTypes = {
  pdfUrl: PropTypes.string,
  pdfLoading: PropTypes.bool,
  printedFiche: PropTypes.bool,
  fileName: PropTypes.string.isRequired,
  onMarkPrinted: PropTypes.func,
  fillHeight: PropTypes.bool,
};

SheetTab.defaultProps = {
  pdfUrl: null,
  pdfLoading: false,
  printedFiche: false,
  onMarkPrinted: null,
  fillHeight: false,
};
