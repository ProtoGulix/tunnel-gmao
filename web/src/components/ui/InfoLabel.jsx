/**
 * @fileoverview Libellé suivi d'une icône d'aide : la définition s'affiche au survol, au
 * focus clavier et au toucher (un appui ouvre, un second ferme), sans occuper de place dans
 * la page (ADR 0034).
 * @module components/ui/InfoLabel
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Flex, Text, Tooltip } from '@radix-ui/themes';
import { Info } from 'lucide-react';

const BUTTON_STYLE = {
  display: 'inline-flex', padding: 0, border: 0, background: 'none', cursor: 'help', color: 'var(--gray-10)',
};

/**
 * @component
 * @param {Object} props
 * @param {string} props.label - Libellé affiché
 * @param {React.ReactNode} props.definition - Texte de la définition (infobulle)
 * @param {string} [props.size] - Taille Radix du texte
 * @param {string} [props.weight] - Graisse Radix du texte
 * @param {string} [props.color] - Couleur Radix du texte
 * @example
 * <InfoLabel label="Charge du service" definition="Temps total / capacité." />
 */
export default function InfoLabel({ label, definition, size = '1', weight, color }) {
  // Ouverture pilotée : l'infobulle Radix ne s'ouvre pas au toucher, le clic la bascule
  const [open, setOpen] = useState(false);
  const toggle = (e) => {
    e.preventDefault(); // l'icône peut se trouver dans un <summary> : ne pas le replier
    setOpen((value) => !value);
  };
  return (
    <Flex as="span" align="center" gap="1" display="inline-flex">
      <Text size={size} weight={weight} color={color}>{label}</Text>
      <Tooltip content={definition} maxWidth="340px" open={open} onOpenChange={setOpen}>
        <button type="button" aria-label={`Définition : ${label}`} style={BUTTON_STYLE} onClick={toggle}>
          <Info size={13} aria-hidden />
        </button>
      </Tooltip>
    </Flex>
  );
}
InfoLabel.propTypes = {
  label: PropTypes.string.isRequired,
  definition: PropTypes.node.isRequired,
  size: PropTypes.string,
  weight: PropTypes.string,
  color: PropTypes.string,
};
