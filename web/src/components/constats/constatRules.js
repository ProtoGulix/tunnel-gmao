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
