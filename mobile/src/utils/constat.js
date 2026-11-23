/**
 * Affichage du formulaire de constat. Aide d'écran seulement : le backend valide les choix
 * (obligatoires, uniques, sous-questions).
 */

// Questions à afficher : sans parent, ou dont le choix parent est coché.
export function visibleQuestions(questions, selected) {
  return questions.filter((q) => !q.parent_choice_code || selected.includes(q.parent_choice_code))
}

// Coche ou décoche un choix ; un choix unique remplace les autres de sa question.
export function toggleChoice(questions, selected, question, code) {
  const own = question.choices.map((c) => c.code)
  let next
  if (selected.includes(code)) next = selected.filter((c) => c !== code)
  else if (question.is_multiple) next = [...selected, code]
  else next = [...selected.filter((c) => !own.includes(c)), code]
  return pruneHidden(questions, next)
}

// Retire les choix des sous-questions dont le parent n'est plus coché (boucle jusqu'à stabilité).
export function pruneHidden(questions, selected) {
  let current = selected
  for (;;) {
    const shown = new Set(visibleQuestions(questions, current).flatMap((q) => q.choices.map((c) => c.code)))
    const next = current.filter((c) => shown.has(c))
    if (next.length === current.length) return next
    current = next
  }
}
