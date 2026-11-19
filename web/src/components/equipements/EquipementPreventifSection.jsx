/**
 * @fileoverview Section Préventif d'un équipement : état à jour ou en retard, accès au détail
 * (plans, interventions préventives, courbe d'écart, lancement en avance)
 * @module components/equipements/EquipementPreventifSection
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Button, Dialog, Flex, Text } from '@radix-ui/themes';
import { CalendarClock, CheckCircle2 } from 'lucide-react';
import { usePreventiveFollow } from '@/hooks/preventive/usePreventiveFollow';
import EquipementPreventifTab from '@/components/equipements/tabs/EquipementPreventifTab';
import { Section, formatDate } from '@/components/equipements/EquipementDetailSections';

// Pastille d'après l'échéancier ; rien sans le droit ou sans plan (aucune erreur affichée)
function PreventifStatusBadge({ schedule }) {
  if (schedule.length === 0) return null;
  const overdue = schedule.filter((e) => e.state === 'overdue').length;
  return overdue > 0
    ? <Badge color="red" variant="soft">{overdue} en retard</Badge>
    : <Badge color="green" variant="soft"><CheckCircle2 size={12} /> Préventif à jour</Badge>;
}
PreventifStatusBadge.propTypes = { schedule: PropTypes.array.isRequired };

export default function PreventifSection({ eq }) {
  const [open, setOpen] = useState(false);
  const { schedule, history, anticipate, canSchedule } = usePreventiveFollow(String(eq.id));
  const summary = eq.preventive_occurrences_summary;
  if (!summary && eq.preventive_plans == null) return null;
  const pending = summary?.pending_count ?? 0;
  return (
    <Section title="Préventif">
      <Flex align="center" gap="3" wrap="wrap">
        {canSchedule && !schedule.error && <PreventifStatusBadge schedule={schedule.items} />}
        <Badge color={pending > 0 ? 'orange' : 'gray'} variant="soft">{pending} en attente</Badge>
        {summary?.next_scheduled && <Text size="2" color="gray">Prochaine : {formatDate(summary.next_scheduled)}</Text>}
        <Button size="1" variant="soft" color="gray" onClick={() => setOpen(true)}>
          <CalendarClock size={13} /> Détail
        </Button>
      </Flex>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Content maxWidth="720px">
          <Dialog.Title>Maintenance préventive — {eq.code}</Dialog.Title>
          <EquipementPreventifTab
            equipement={eq}
            schedule={schedule.items}
            history={history}
            anticipate={anticipate}
          />
        </Dialog.Content>
      </Dialog.Root>
    </Section>
  );
}
PreventifSection.propTypes = { eq: PropTypes.object.isRequired };
