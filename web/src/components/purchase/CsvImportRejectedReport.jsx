/**
 * Rapport d'un import CSV refusé (tout ou rien) : aucune demande d'achat n'a été créée,
 * chaque ligne en erreur est listée avec sa raison. Le texte vient de l'API, rendu en texte.
 */

import PropTypes from 'prop-types';
import { Callout, Flex, Table, Text } from '@radix-ui/themes';
import { AlertTriangle } from 'lucide-react';
import { getRejectedLines } from './csvImportReport';

export default function CsvImportRejectedReport({ report }) {
  const lines = getRejectedLines(report);
  return (
    <Flex direction="column" gap="2">
      <Callout.Root color="red" size="1" role="alert">
        <Callout.Icon><AlertTriangle size={14} /></Callout.Icon>
        <Callout.Text>
          Import refusé : aucune demande d&apos;achat n&apos;a été créée, {lines.length} ligne
          {lines.length > 1 ? 's sont invalides' : ' est invalide'}. Corrigez le fichier puis relancez l&apos;import.
        </Callout.Text>
      </Callout.Root>
          <Table.Root size="1">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeaderCell>Ligne</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Référence</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Quantité</Table.ColumnHeaderCell>
                <Table.ColumnHeaderCell>Erreur</Table.ColumnHeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {lines.map((line) => (
                <Table.Row key={line.row}>
                  <Table.Cell>{line.row}</Table.Cell>
                  <Table.Cell><Text size="1" style={{ fontFamily: 'monospace' }}>{line.raw_ref || '—'}</Text></Table.Cell>
                  <Table.Cell>{line.raw_qty || '—'}</Table.Cell>
                  <Table.Cell>{line.error || 'Ligne invalide'}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
    </Flex>
  );
}

CsvImportRejectedReport.propTypes = {
  report: PropTypes.shape({ lines: PropTypes.array.isRequired }).isRequired,
};
