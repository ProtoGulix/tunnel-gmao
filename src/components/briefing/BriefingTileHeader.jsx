import PropTypes from 'prop-types';
import { Flex, Text, Badge } from '@radix-ui/themes';

const SITUATION_BADGE = {
  no_intervention: { color: 'gray',   label: 'sans intervention' },
  no_action:       { color: 'orange', label: 'sans action'       },
  no_task:         { color: 'orange', label: 'sans tâche'        },
  blocked_piece:   { color: 'orange', label: 'pièces en attente' },
  decision:        { color: 'red',    label: 'décision requise'  },
};

function DiCodes({ diCode, diStatutLabel, diStatutColor }) {
  return (
    <>
      {diCode && (
        <Text size="1" style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--gray-8)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {diCode}
        </Text>
      )}
      {diStatutLabel && (
        <Badge size="1" variant="soft" style={{
          flexShrink: 0,
          backgroundColor: (diStatutColor || '#888') + '22',
          color: diStatutColor || '#888',
        }}>
          {diStatutLabel}
        </Badge>
      )}
    </>
  );
}
DiCodes.propTypes = {
  diCode: PropTypes.string,
  diStatutLabel: PropTypes.string,
  diStatutColor: PropTypes.string,
};

function TagsRow({ typeLabel, typeColor, situationCfg, hasIntervention }) {
  if (!typeLabel && !situationCfg && hasIntervention) return null;
  return (
    <Flex gap="1" align="center">
      {typeLabel && <Badge color={typeColor} variant="soft" size="1">{typeLabel}</Badge>}
      {situationCfg && <Badge color={situationCfg.color} variant="soft" size="1">{situationCfg.label}</Badge>}
      {!hasIntervention && (
        <Text size="1" style={{ color: 'var(--gray-8)', fontStyle: 'italic' }}>
          pas encore d&apos;intervention
        </Text>
      )}
    </Flex>
  );
}
TagsRow.propTypes = {
  typeLabel: PropTypes.string,
  typeColor: PropTypes.string,
  situationCfg: PropTypes.object,
  hasIntervention: PropTypes.bool,
};

function OrphanCode({ interCode }) {
  return (
    <>
      {interCode && (
        <Text size="1" style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--gray-8)', whiteSpace: 'nowrap', flexShrink: 0 }}>
          {interCode}
        </Text>
      )}
      <Badge size="1" variant="soft" color="gray" style={{ marginLeft: 'auto', flexShrink: 0 }}>
        sans demande
      </Badge>
    </>
  );
}
OrphanCode.propTypes = { interCode: PropTypes.string };

export function BriefingTileHeader({
  isDiSection, diCode, machineCode, machineName,
  diStatutLabel, diStatutColor, interCode, hasIntervention,
  typeLabel, typeColor, situationType,
}) {
  const situationCfg = SITUATION_BADGE[situationType] ?? null;

  return (
    <Flex align="center" gap="2" style={{ padding: '6px 12px', borderBottom: '1px solid var(--gray-4)', background: 'var(--gray-2)', minWidth: 0 }}>
      {machineCode && (
        <Badge
          size="2"
          variant="solid"
          color="gray"
          title={machineName ?? undefined}
          style={{
            fontFamily: 'var(--font-mono, monospace)',
            letterSpacing: '0.04em',
            flexShrink: 0,
            cursor: machineName ? 'default' : undefined,
          }}
        >
          {machineCode}
        </Badge>
      )}
      <TagsRow typeLabel={typeLabel} typeColor={typeColor} situationCfg={situationCfg} hasIntervention={hasIntervention} />
      <div style={{ flex: 1 }} />
      {isDiSection
        ? <DiCodes diCode={diCode} diStatutLabel={diStatutLabel} diStatutColor={diStatutColor} />
        : <OrphanCode interCode={interCode} />
      }
    </Flex>
  );
}

BriefingTileHeader.propTypes = {
  isDiSection: PropTypes.bool.isRequired,
  diCode: PropTypes.string,
  machineCode: PropTypes.string,
  machineName: PropTypes.string,
  diStatutLabel: PropTypes.string,
  diStatutColor: PropTypes.string,
  interCode: PropTypes.string,
  hasIntervention: PropTypes.bool,
  typeLabel: PropTypes.string,
  typeColor: PropTypes.string,
  situationType: PropTypes.string,
};
