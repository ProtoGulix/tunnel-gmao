/**
 * Affichage du formulaire de constat : sous-questions selon les choix cochés.
 * Aucune règle de validité ici, le backend les vérifie.
 */

/** Questions à afficher : sans parent, ou dont le choix parent est coché. */
export function visibleQuestions(questions, selected) {
  return questions.filter((q) => !q.parent_choice_code || selected.includes(q.parent_choice_code));
}

/** Coche ou décoche un choix ; retire les réponses des sous-questions qui disparaissent. */
export function toggleChoice(questions, selected, question, choiceCode) {
  const codes = question.choices.map((c) => c.code);
  const others = selected.filter((c) => !codes.includes(c));
  const wasChecked = selected.includes(choiceCode);
  const own = selected.filter((c) => codes.includes(c));
  let next;
  if (question.is_multiple) {
    next = [...others, ...(wasChecked ? own.filter((c) => c !== choiceCode) : [...own, choiceCode])];
  } else {
    next = wasChecked ? others : [...others, choiceCode];
  }
  return pruneHidden(questions, next);
}

function pruneHidden(questions, selected) {
  const visible = new Set(visibleQuestions(questions, selected).map((q) => q.code));
  const kept = selected.filter((code) => {
    const owner = questions.find((q) => q.choices.some((c) => c.code === code));
    return owner && visible.has(owner.code);
  });
  return kept.length === selected.length ? kept : pruneHidden(questions, kept);
}

/**
 * Formulaire proposé avant la clôture : le type l'exige et aucun constat n'existe.
 * Les types de GET /interventions/types portent leur code dans `id`.
 */
export function isConstatRequired(types, typeCode, constats) {
  const type = types.find((t) => t.id === typeCode);
  return type?.constat_required === true && constats?.length === 0;
}

/** Choix des réponses d'un constat existant (pour préremplir une correction). */
export function choicesOf(constat) {
  return (constat?.answers ?? []).map((a) => a.choice_code);
}

/** Réponses groupées par question, dans l'ordre reçu ; sans `question_label`, un seul groupe. */
export function groupAnswers(answers) {
  const groups = [];
  for (const a of answers ?? []) {
    const question = a.question_label ?? null;
    const group = groups.find((g) => g.question === question);
    if (group) group.choices.push(a);
    else groups.push({ question, choices: [a] });
  }
  return groups;
}

/** État en clair de la demande d'un constat selon son statut ; null sans statut. */
export function requestState(constat) {
  if (constat.linked_request_code) {
    return { kind: 'linked', id: constat.linked_request_id, code: constat.linked_request_code };
  }
  switch (constat.request_status) {
    case 'rejetee':
      return { kind: 'rejected' };
    case 'acceptee':
      return { kind: 'accepted', id: constat.request_intervention_id, code: constat.request_intervention_code };
    case 'nouvelle':
    case 'en_attente':
      return { kind: 'pending' };
    default:
      return null;
  }
}
