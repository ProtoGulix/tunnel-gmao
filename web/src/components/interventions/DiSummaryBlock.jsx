import PropTypes from 'prop-types';
import { Badge, Flex, Text } from '@radix-ui/themes';
import { Bot, Link as LinkIcon, MapPin, User } from 'lucide-react';

function normalize(d) {
  const eq = d.equipement ?? null;
  return {
    code:        d.code,
    statutLabel: d.statut_label ?? null,
    statutColor: d.statut_color ?? 'var(--green-7)',
    description: d.description ?? null,
    eqCode:      eq?.code ?? d.machine_code ?? null,
    eqName:      eq?.name ?? d.machine_name ?? null,
    demandeur:   d.demandeur_nom ?? null,
    service:     d.service?.label ?? d.demandeur_service ?? null,
    isSystem:    d.is_system ?? false,
    createdAt:   d.created_at ?? null,
  };
}

export function DiSummaryBlock({ diDetail }) {
  const n = normalize(diDetail);
  const borderColor = n.statutColor;
  const bandBg = borderColor + '18';

  return (
    <Flex align="stretch" gap="4">
      {/* Icône lien avec pointillés */}
      <Flex direction="column" align="center" style={{ flexShrink: 0, width: 18 }}>
        <div style={{ flex: 1, borderLeft: '2.5px dashed var(--gray-6)' }} />
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <LinkIcon size={18} strokeWidth={2.5} style={{ color: 'var(--green-9)', display: 'block' }} />
        </div>
        <div style={{ flex: 1, borderLeft: '2.5px dashed var(--gray-6)', marginTop: 5 }} />
      </Flex>

      {/* Bloc DI — même esthétique que DiBlock du briefing */}
      <div style={{
        flex: 1, minWidth: 0,
        margin: '10px 0',
        display: 'flex', flexDirection: 'column',
        border: `2px solid ${borderColor}`,
        borderRadius: 8, overflow: 'hidden',
        background: 'var(--color-panel-solid)',
      }}>
        {/* Header */}
        <Flex align="center" gap="2" wrap="wrap" style={{ padding: '6px 10px', borderBottom: '1px solid var(--gray-4)', background: bandBg, minWidth: 0 }}>
          <Badge size="2" variant="outline" color="gray" style={{ fontFamily: 'monospace', flexShrink: 0 }}>{n.code}</Badge>
          {n.statutLabel && (
            <Badge size="2" variant="soft" style={{ background: borderColor + '22', color: borderColor, flexShrink: 0 }}>
              {n.statutLabel}
            </Badge>
          )}
          {(n.eqCode || n.eqName) && (
            <>
              <div style={{ flex: 1 }} />
              <Flex align="center" gap="1" style={{ flexShrink: 0 }}>
                <MapPin size={11} color="var(--gray-8)" style={{ flexShrink: 0 }} />
                {n.eqCode && <Text size="1" style={{ fontFamily: 'monospace', color: 'var(--gray-11)', fontWeight: 700 }}>{n.eqCode}</Text>}
                {n.eqName && <Text size="1" color="gray">{n.eqName}</Text>}
              </Flex>
            </>
          )}
        </Flex>

        {/* Body */}
        {n.description && (
          <div style={{ padding: '10px 12px', flex: 1 }}>
            <Text size="2" weight="medium" style={{ color: 'var(--gray-12)', fontStyle: 'italic', display: 'block' }}>
              &laquo;&nbsp;{n.description}&nbsp;&raquo;
            </Text>
          </div>
        )}

        {/* Footer */}
        <Flex align="center" gap="2" style={{ padding: '4px 10px', borderTop: '1px solid var(--gray-4)', background: bandBg, minWidth: 0 }}>
          {n.isSystem
            ? <Bot size={13} color="var(--gray-8)" style={{ flexShrink: 0 }} />
            : <User size={13} color="var(--gray-8)" style={{ flexShrink: 0 }} />
          }
          {n.demandeur && (
            <Text size="1" color="gray" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {n.demandeur}
            </Text>
          )}
          {n.service && <Badge size="1" variant="outline" color="gray" style={{ flexShrink: 0 }}>{n.service}</Badge>}
          <div style={{ flex: 1 }} />
          {n.createdAt && (
            <Text size="1" color="gray" style={{ fontFamily: 'monospace', flexShrink: 0 }}>
              {new Date(n.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
            </Text>
          )}
        </Flex>
      </div>
    </Flex>
  );
}

DiSummaryBlock.propTypes = { diDetail: PropTypes.object.isRequired };
