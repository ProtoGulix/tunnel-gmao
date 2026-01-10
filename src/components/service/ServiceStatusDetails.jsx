/**
 * @fileoverview Composants détaillés pour la page ServiceStatus
 * 
 * Composants secondaires pour l'affichage détaillé des analyses :
 * - FragmentationDetail : Analyse de la fragmentation
 * - DecisionGuide : Bloc de règles de décision
 * - CriticalAlert : Alerte situationnelle
 * 
 * @module components/service/ServiceStatusDetails
 */

import PropTypes from 'prop-types';
import { Box, Text, Callout } from '@radix-ui/themes';
import { AlertTriangle, Info } from 'lucide-react';
import { THRESHOLDS } from './ServiceStatusComponents';

/**
 * Bloc de lecture décisionnelle
 */
export function DecisionGuide() {
  return (
    <Callout.Root color="blue" mb="4">
      <Callout.Icon>
        <Info size={20} />
      </Callout.Icon>
      <Box pl="2">
        <Text weight="bold" size="2" mb="2" as="div">Règles de lecture</Text>
        <Box as="ul" style={{ margin: 0, paddingLeft: '1.5rem' }}>
          <li>
            <Text size="2">
              <strong>PILOT &lt; 15%</strong> → Aucune capacité d&apos;amélioration
            </Text>
          </li>
          <li>
            <Text size="2">
              <strong>FRAG &gt; 25%</strong> → Fuite organisationnelle
            </Text>
          </li>
          <li>
            <Text size="2">
              <strong>Charge &gt; 85%</strong> → Service au plafond
            </Text>
          </li>
        </Box>
      </Box>
    </Callout.Root>
  );
}

/**
 * Affiche l'alerte si situation critique
 */
export function CriticalAlert({ chargePercent, fragPercent, pilotPercent }) {
  const isCritical = chargePercent > THRESHOLDS.CHARGE.HIGH || 
                     fragPercent > THRESHOLDS.FRAGMENTATION.MEDIUM || 
                     pilotPercent < THRESHOLDS.PILOTAGE.CRITICAL;

  if (!isCritical) return null;

  return (
    <Callout.Root color="red">
      <Callout.Icon>
        <AlertTriangle size={20} />
      </Callout.Icon>
      <Box pl="2">
        <Text weight="bold" size="2" mb="1" as="div">Attention : Situation critique détectée</Text>
        <Text size="2" as="div">
          {chargePercent > THRESHOLDS.CHARGE.HIGH && '• Service saturé. '}
          {fragPercent > THRESHOLDS.FRAGMENTATION.MEDIUM && '• Fragmentation excessive. '}
          {pilotPercent < THRESHOLDS.PILOTAGE.CRITICAL && '• Pas de temps pour amélioration. '}
        </Text>
      </Box>
    </Callout.Root>
  );
}

CriticalAlert.propTypes = {
  chargePercent: PropTypes.number.isRequired,
  fragPercent: PropTypes.number.isRequired,
  pilotPercent: PropTypes.number.isRequired
};
