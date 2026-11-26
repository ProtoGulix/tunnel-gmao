/**
 * Affichage du formulaire de constat. Aide d'écran seulement : le backend valide les choix
 * (obligatoires, uniques, sous-questions).
 */

// Questions à afficher : sans parent, ou dont le choix parent est coché.
export function visibleQuestions(questions, selected) {
  return questions.filter((q) => !q.parent_choice_code || selected.includes(q.parent_choice_code))
}

// Choix de la question après un clic : un choix exclusif (is_exclusive, lu de l'API) retire
// les autres, et tout autre choix retire l'exclusif.
function ownAfterToggle(question, own, code) {
  if (own.includes(code)) return own.filter((c) => c !== code)
  if (!question.is_multiple) return [code]
  const exclusive = new Set(question.choices.filter((c) => c.is_exclusive).map((c) => c.code))
  if (exclusive.has(code)) return [code]
  return [...own.filter((c) => !exclusive.has(c)), code]
}

// Coche ou décoche un choix ; retire les réponses des sous-questions qui disparaissent.
export function toggleChoice(questions, selected, question, code) {
  const codes = question.choices.map((c) => c.code)
  const others = selected.filter((c) => !codes.includes(c))
  const own = selected.filter((c) => codes.includes(c))
  return pruneHidden(questions, [...others, ...ownAfterToggle(question, own, code)])
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
