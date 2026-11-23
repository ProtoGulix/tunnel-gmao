/**
 * Demande issue d'un constat (ADR 0043), dans la mise en page commune des demandes : ligne
 * d'origine sous le demandeur ; pour qui peut rattacher (RESP, ADMIN), choix d'une idée
 * d'amélioration ouverte de la machine.
 * Le rattachement rejette la demande côté serveur ; les refus s'affichent tels quels.
 */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Callout, Flex, Select, Text } from '@radix-ui/themes';
import { Flag } from 'lucide-react';
import { usePermissions } from '@/auth/usePermissions';
import { PERM } from '@/auth/permissionCodes';
import { EntityCodeLink } from '@/components/shared/EntityCodeLink';
import { fetchConstatByRequest, fetchImprovementIdeas, linkConstat } from '@/api/constats';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

function IdeaLinker({ constat, onLinked }) {
  const [ideas, setIdeas] = useState([]);
  const [ideaId, setIdeaId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!constat.linked_request_id) {
      fetchImprovementIdeas(constat.id).then((list) => { if (alive) setIdeas(list); }).catch(() => {});
    }
    return () => { alive = false; };
  }, [constat.id, constat.linked_request_id]);

  if (constat.linked_request_id || ideas.length === 0) return null;

  const link = async () => {
    setSaving(true);
    setError('');
    try {
      await linkConstat(constat.id, ideaId);
      await onLinked?.();
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Rattachement impossible'));
      setSaving(false);
    }
  };

  return (
    <Flex direction="column" gap="2" mt="2">
      <Text size="1" color="gray">Idée d&apos;amélioration ouverte</Text>
      <Flex gap="2" align="center" wrap="wrap">
        <Select.Root value={ideaId} onValueChange={setIdeaId}>
          <Select.Trigger placeholder="Choisir une idée" />
          <Select.Content>
            {ideas.map((i) => (
              <Select.Item key={i.id} value={i.id}>{i.code} - {i.description}</Select.Item>
            ))}
          </Select.Content>
        </Select.Root>
        <Button size="1" variant="soft" disabled={!ideaId || saving} onClick={link}>Rattacher</Button>
      </Flex>
      {error && <Callout.Root color="red" size="1" role="alert"><Callout.Text>{error}</Callout.Text></Callout.Root>}
    </Flex>
  );
}

IdeaLinker.propTypes = { constat: PropTypes.object.isRequired, onLinked: PropTypes.func };

/** Constat dont la demande est issue (null tant qu'il n'est pas lu, ou sans constat). */
export function useRequestConstat(detail) {
  const [constat, setConstat] = useState(null);
  // `detail` est null tant que la demande n'est pas lue
  const requestId = detail?.id;
  const sourceId = detail?.source_intervention_id;
  useEffect(() => {
    setConstat(null);
    if (!sourceId) return undefined;
    let alive = true;
    fetchConstatByRequest(requestId)
      .then((current) => { if (alive) setConstat(current); })
      .catch(() => {});
    return () => { alive = false; };
  }, [requestId, sourceId]);
  return constat;
}

/** Ligne d'origine sous le demandeur, comme « Générée automatiquement » du préventif. */
export function ConstatOrigin({ detail, constat }) {
  if (!detail.source_intervention_id) return null;
  const code = detail.source_intervention_code ?? constat?.source_intervention_code;
  return (
    <Flex gap="2" align="center" mt="1" style={{ paddingLeft: 22 }}>
      <Flag size={13} color="var(--gray-9)" />
      <Text size="1" color="gray">Constat de</Text>
      <EntityCodeLink type="intervention" id={detail.source_intervention_id} code={code} size={1} />
    </Flex>
  );
}

ConstatOrigin.propTypes = { detail: PropTypes.object.isRequired, constat: PropTypes.object };

/** Rattachement à une idée d'amélioration, pour qui en a le droit et tant que la demande se rejette. */
export function ConstatIdeaLink({ detail, constat, onLinked }) {
  const { can } = usePermissions();
  const canLink = can(PERM.constats.link) && (detail.allowed_transitions ?? []).includes('rejetee');
  if (!canLink || !constat) return null;
  return <Box mb="3"><IdeaLinker constat={constat} onLinked={onLinked} /></Box>;
}

ConstatIdeaLink.propTypes = { detail: PropTypes.object.isRequired, constat: PropTypes.object, onLinked: PropTypes.func };
