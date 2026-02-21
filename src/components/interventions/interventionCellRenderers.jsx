/**
 * Fonctions de rendu des cellules pour InteractiveTable
 * 
 * Contient les fonctions de rendu et de style pour les lignes d'interventions.
 * Séparé du Tab pour respecter la limite de 200 lignes.
 */

import { Flex, Badge, Text } from '@radix-ui/themes';
import { PRIORITY_CONFIG, STATUS_CONFIG } from '@/config/interventionTypes';

/**
 * Calcul de l'âge en jours
 */
export function calculateAge(reportedDate) {
  if (!reportedDate) return 0;
  const now = new Date();
  const reported = new Date(reportedDate);
  const diffTime = Math.abs(now - reported);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Code couleur âge
 */
export function getAgeColor(days) {
  if (days < 7) return 'gray';
  if (days < 30) return 'amber';
  return 'red';
}

/**
 * Seuil affichage âge
 */
export function shouldShowAge(days, priority) {
  if (priority?.toLowerCase() === 'urgent' && days > 7) return true;
  if (days > 30) return true;
  return false;
}

/**
 * Rendu cellule - BLOC 1: À faire maintenant
 */
// eslint-disable-next-line complexity
export function renderActionnableCell(interv, column) {
  const priorityConfig = PRIORITY_CONFIG[interv.priority?.toLowerCase()] || PRIORITY_CONFIG.normal;
  const age = calculateAge(interv.reportedDate);
  const ageColor = getAgeColor(age);
  const showAge = shouldShowAge(age, interv.priority);
  const machineCode = interv.machine?.code || 'SUPP';
  const machineName = interv.machine?.name || '—';
  const intervCode = interv.code || '';
  const responsableInitiales = (interv.techInitials || '—').toUpperCase();
  const typeLabel = interv.type?.toUpperCase() || 'CUR';
  const priorityLower = interv.priority?.toLowerCase() || 'normal';
  const priorityVariant = priorityLower === 'important' ? 'solid' : 'soft';

  switch (column.key) {
    case 'code':
      return (
        <Flex direction="column" gap="1">
          <Badge color="blue" variant="solid" size="1" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
            {intervCode}
          </Badge>
          <Flex align="center" gap="1">
            <Badge color="gray" variant="solid" size="1" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
              {machineCode}
            </Badge>
            <Text size="1" style={{ color: 'var(--gray-11)' }}>
              {machineName}
            </Text>
          </Flex>
        </Flex>
      );
    
    case 'title':
      return (
        <Flex direction="column" gap="1">
          <Text size="2" weight="medium" style={{ lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {interv.title || 'Sans titre'}
          </Text>
          <Flex align="center" gap="1" wrap="wrap">
            {interv.printedFiche && (
              <Badge color="green" variant="soft" size="1">
                ✓ Imprimée
              </Badge>
            )}
          </Flex>
        </Flex>
      );
    
    case 'info':
      return (
        <Flex direction="column" gap="1">
          <Flex align="center" gap="1" wrap="wrap">
            <Badge color="gray" variant="soft" size="1">
              {typeLabel}
            </Badge>
            <Badge color={priorityConfig.color} size="1" variant={priorityVariant}>
              {interv.priority || 'Normal'}
            </Badge>
          </Flex>
          <Text size="1" style={{ color: 'var(--gray-11)' }}>
            {responsableInitiales}
          </Text>
        </Flex>
      );
    
    case 'age':
      if (!showAge) {
        return <Text size="2" color="gray">{age}j</Text>;
      }
      return (
        <Badge color={ageColor} variant="soft" size="1">
          {age}j
        </Badge>
      );
    
    default:
      return null;
  }
}

/**
 * Rendu cellule - BLOC 2: Bloqué
 */
// eslint-disable-next-line complexity
export function renderBloqueCell(interv, column) {
  const age = calculateAge(interv.reportedDate);
  const machineCode = interv.machine?.code || 'SUPP';
  const machineName = interv.machine?.name || '—';
  const intervCode = interv.code || '';
  const responsableInitiales = (interv.techInitials || '—').toUpperCase();
  const typeLabel = interv.type?.toUpperCase() || 'CUR';
  const causeLabel = interv.status === 'attente_pieces' ? 'FOURNISSEUR' : 'INTERNE';

  switch (column.key) {
    case 'code':
      return (
        <Flex direction="column" gap="1">
          <Badge color="blue" variant="solid" size="1" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
            {intervCode}
          </Badge>
          <Flex align="center" gap="1">
            <Badge color="gray" variant="solid" size="1" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
              {machineCode}
            </Badge>
            <Text size="1" style={{ color: 'var(--gray-11)' }}>
              {machineName}
            </Text>
          </Flex>
        </Flex>
      );
    
    case 'title':
      return (
        <Flex direction="column" gap="1">
          <Text size="2" weight="medium" style={{ lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {interv.title || 'Sans titre'}
          </Text>
          <Flex align="center" gap="1" wrap="wrap">
            <Badge color="amber" variant="soft" size="1">
              ⏸ {causeLabel}
            </Badge>
            {interv.printedFiche && (
              <Badge color="green" variant="soft" size="1">
                ✓ Imprimée
              </Badge>
            )}
          </Flex>
        </Flex>
      );
    
    case 'info':
      return (
        <Flex direction="column" gap="1">
          <Flex align="center" gap="1" wrap="wrap">
            <Badge color="gray" variant="soft" size="1">
              {typeLabel}
            </Badge>
          </Flex>
          <Text size="1" style={{ color: 'var(--gray-11)' }}>
            {responsableInitiales}
          </Text>
        </Flex>
      );
    
    case 'age':
      return <Text size="2" color="gray">{age}j</Text>;
    
    default:
      return null;
  }
}

/**
 * Rendu cellule - BLOC 3 & 4: Projets et Archivé
 */
// eslint-disable-next-line complexity
export function renderStandardCell(interv, column) {
  const statusConfig = STATUS_CONFIG[interv.status?.toLowerCase()] || STATUS_CONFIG.ouvert;
  const age = calculateAge(interv.reportedDate);
  const machineCode = interv.machine?.code || 'SUPP';
  const machineName = interv.machine?.name || '—';
  const intervCode = interv.code || '';
  const responsableInitiales = (interv.techInitials || '—').toUpperCase();
  const typeLabel = interv.type?.toUpperCase() || 'CUR';
  const ageColor = getAgeColor(age);

  switch (column.key) {
    case 'code':
      return (
        <Flex direction="column" gap="1">
          <Badge color="blue" variant="solid" size="1" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
            {intervCode}
          </Badge>
          <Flex align="center" gap="1">
            <Badge color="gray" variant="solid" size="1" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
              {machineCode}
            </Badge>
            <Text size="1" style={{ color: 'var(--gray-11)' }}>
              {machineName}
            </Text>
          </Flex>
        </Flex>
      );
    
    case 'title':
      return (
        <Flex direction="column" gap="1">
          <Text size="2" weight="medium" style={{ lineHeight: '1.3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {interv.title || 'Sans titre'}
          </Text>
          <Flex align="center" gap="1" wrap="wrap">
            <Badge color={statusConfig.color} size="1" variant="soft">
              {statusConfig.label}
            </Badge>
            {interv.printedFiche && (
              <Badge color="green" variant="soft" size="1">
                ✓ Imprimée
              </Badge>
            )}
          </Flex>
        </Flex>
      );
    
    case 'info':
      return (
        <Flex direction="column" gap="1">
          <Flex align="center" gap="1" wrap="wrap">
            <Badge color="gray" variant="soft" size="1">
              {typeLabel}
            </Badge>
          </Flex>
          <Text size="1" style={{ color: 'var(--gray-11)' }}>
            {responsableInitiales}
          </Text>
        </Flex>
      );
    
    case 'age':
      if (age > 30) {
        return (
          <Badge color={ageColor} variant="soft" size="1">
            {age}j
          </Badge>
        );
      }
      return <Text size="2" color="gray">{age}j</Text>;
    
    default:
      return null;
  }
}

/**
 * Style de ligne - BLOC 1: À faire maintenant
 */
export function getActionnableRowStyle(interv) {
  const priorityConfig = PRIORITY_CONFIG[interv.priority?.toLowerCase()] || PRIORITY_CONFIG.normal;
  
  return {
    opacity: interv.printedFiche ? 0.5 : 1,
    backgroundColor: interv.printedFiche ? 'var(--gray-2)' : 'transparent',
    borderLeft: `4px solid ${interv.printedFiche ? 'var(--gray-6)' : `var(--${priorityConfig.color}-9)`}`
  };
}

/**
 * Style de ligne - BLOC 2: Bloqué
 */
export function getBloqueRowStyle() {
  return {
    opacity: 0.7,
    backgroundColor: 'var(--gray-2)',
    borderLeft: '4px solid var(--amber-9)'
  };
}

/**
 * Style de ligne - BLOC 3 & 4: Projets et Archivé
 */
export function getStandardRowStyle(interv) {
  return {
    opacity: interv.printedFiche ? 0.5 : 1,
    backgroundColor: interv.printedFiche ? 'var(--gray-2)' : 'transparent',
    borderLeft: `4px solid ${interv.printedFiche ? 'var(--gray-6)' : 'var(--blue-9)'}`
  };
}
