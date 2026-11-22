/**
 * Messages de la fenêtre d'export : erreur du backend (affichée telle quelle), progression
 * pendant une opération, résultat d'un marquage ou d'un archivage (affiché dans son bloc).
 */

import PropTypes from 'prop-types';
import { Callout, Flex, Spinner, Text } from '@radix-ui/themes';
import { AlertTriangle, CheckCheck } from 'lucide-react';

// Bandeau de progression pendant l'export ou l'archivage (la fenêtre n'est pas fermable)
export function ExportProgress({ busyFormat, marking }) {
  if (!busyFormat && !marking) return null;
  const text = busyFormat
    ? 'Génération en cours, cela peut prendre un moment…'
    : 'Traitement des fiches en cours…';
  return (
    <Flex gap="2" align="center" p="2" role="status" aria-live="polite"
      style={{ background: 'var(--gray-a3)', borderRadius: 'var(--radius-2)' }}>
      <Spinner size="2" />
      <Text size="2">{text}</Text>
    </Flex>
  );
}

ExportProgress.propTypes = {
  busyFormat: PropTypes.string,
  marking: PropTypes.bool,
};

export function ErrorCallout({ error }) {
  if (!error) return null;
  return (
    <Callout.Root color="red" size="1" role="alert">
      <Callout.Icon><AlertTriangle size={16} /></Callout.Icon>
      <Callout.Text>{error}</Callout.Text>
    </Callout.Root>
  );
}

ErrorCallout.propTypes = { error: PropTypes.string };

export function ResultCallout({ result }) {
  if (!result) return null;
  return (
    <Callout.Root color="green" size="1" role="status">
      <Callout.Icon><CheckCheck size={16} /></Callout.Icon>
      <Callout.Text>{result}</Callout.Text>
    </Callout.Root>
  );
}

ResultCallout.propTypes = { result: PropTypes.string };
