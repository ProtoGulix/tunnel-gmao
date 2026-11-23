/**
 * Demande issue d'un constat (ADR 0043) : lien vers l'intervention d'origine ; pour qui peut
 * rattacher (RESP, ADMIN), choix d'une idée d'amélioration ouverte de la machine.
 * Le rattachement rejette la demande côté serveur ; les refus s'affichent tels quels.
 */
import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { Badge, Box, Button, Callout, Flex, Select, Text } from '@radix-ui/themes';
import { usePermissions } from '@/auth/usePermissions';
import { PERM } from '@/auth/permissionCodes';
import { entityCodeUrl } from '@/components/shared/entityCodeUrl';
import { fetchConstatByRequest, fetchImprovementIdeas, linkConstat } from '@/api/constats';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

function IdeaLinker({ requestId, onLinked }) {
  const [constat, setConstat] = useState(null);
  const [ideas, setIdeas] = useState([]);
  const [ideaId, setIdeaId] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchConstatByRequest(requestId)
      .then(async ([current]) => {
        if (!alive || !current) return;
        setConstat(current);
        const list = current.linked_request_id ? [] : await fetchImprovementIdeas(current.id);
        if (alive) setIdeas(list);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [requestId]);

  if (!constat || constat.linked_request_id || ideas.length === 0) return null;

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

IdeaLinker.propTypes = { requestId: PropTypes.string.isRequired, onLinked: PropTypes.func };

export default function RequestConstatBlock({ detail, onLinked }) {
  const { can } = usePermissions();
  if (!detail.source_intervention_id) return null;
  const canLink = can(PERM.constats.link) && (detail.allowed_transitions ?? []).includes('rejetee');
  return (
    <Box mb="3">
      <Flex align="center" gap="2">
        <Badge variant="soft" color="orange">Constat</Badge>
        <Link to={entityCodeUrl('intervention', detail.source_intervention_id)}>Intervention d&apos;origine</Link>
      </Flex>
      {canLink && <IdeaLinker requestId={detail.id} onLinked={onLinked} />}
    </Box>
  );
}

RequestConstatBlock.propTypes = { detail: PropTypes.object.isRequired, onLinked: PropTypes.func };
