import { useCallback, useEffect, useState } from 'react';
import { fetchConstatQuestions, fetchInterventionConstats } from '@/api/constats';
import { fetchIntervention } from '@/api/interventions';
import { useInterventionTypeRefs } from '@/hooks/shared/useInterventionTypeRefs';
import { isConstatRequired } from '@/components/constats/constatRules';

/** Questions du formulaire : lues de l'API à l'ouverture. */
export function useConstatQuestions(enabled = true) {
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    fetchConstatQuestions()
      .then((q) => alive && setQuestions(q))
      .catch(() => alive && setError(true));
    return () => { alive = false; };
  }, [enabled]);
  return { questions, error };
}

/** Constats courants d'une intervention. `constats` reste null tant que la liste n'est pas lue. */
export function useInterventionConstats(interventionId) {
  const [constats, setConstats] = useState(null);
  const reload = useCallback(async () => {
    try {
      setConstats(await fetchInterventionConstats(interventionId));
    } catch {
      setConstats((prev) => prev ?? []);
    }
  }, [interventionId]);
  useEffect(() => { reload(); }, [reload]);
  return { constats, reload };
}

/**
 * Faut-il un constat pour clôturer ? Aide à l'écran : le refus final vient de l'API.
 * `ready` reste faux tant que type, machine et constats ne sont pas lus.
 */
export function useClosureConstatGate(interventionId) {
  const { types } = useInterventionTypeRefs();
  const { constats } = useInterventionConstats(interventionId);
  const [intervention, setIntervention] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchIntervention(String(interventionId))
      .then((i) => alive && setIntervention(i))
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [interventionId]);

  const ready = failed || (intervention !== null && constats !== null && types.length > 0);
  return {
    ready,
    required: isConstatRequired(types, intervention?.type, constats),
    machine: intervention?.machine ? { id: intervention.machine.id, name: intervention.machine.name } : null,
  };
}
