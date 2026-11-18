/**
 * Messages de la fenêtre d'export : erreur du backend (affichée telle quelle),
 * invitation à marquer les fiches après un export réussi, résultat du marquage.
 */

import PropTypes from 'prop-types';
import { Callout } from '@radix-ui/themes';
import { AlertTriangle, CheckCheck } from 'lucide-react';

export default function ExportFeedback({ error, markResult, canMark }) {
  return (
    <>
      {error && (
        <Callout.Root color="red" size="1" role="alert">
          <Callout.Icon><AlertTriangle size={16} /></Callout.Icon>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}
      {canMark && (
        <Callout.Root color="green" size="1">
          <Callout.Text>Export terminé. Une fois les fiches imprimées, vous pouvez les marquer comme imprimées.</Callout.Text>
        </Callout.Root>
      )}
      {markResult && (
        <Callout.Root color="green" size="1" role="status">
          <Callout.Icon><CheckCheck size={16} /></Callout.Icon>
          <Callout.Text>{markResult}</Callout.Text>
        </Callout.Root>
      )}
    </>
  );
}

ExportFeedback.propTypes = {
  error: PropTypes.string,
  markResult: PropTypes.string,
  canMark: PropTypes.bool,
};
