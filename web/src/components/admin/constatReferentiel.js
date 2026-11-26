/**
 * @fileoverview Mise en forme du référentiel des constats (administration)
 * @module components/admin/constatReferentiel
 */

const CODE_RE = /^[A-Z][A-Z0-9_]{1,49}$/;
const NONE = '__none';

export { NONE };

/** Questions dans l'ordre, chaque sous-question juste après sa question parente. */
export function orderQuestions(questions) {
  const list = questions || [];
  const parentOf = (code) => list.find((q) => (q.choices || []).some((c) => c.code === code));
  const children = (q) => list.filter((s) => s.parent_choice_code
    && (q.choices || []).some((c) => c.code === s.parent_choice_code));
  const roots = list.filter((q) => !q.parent_choice_code || !parentOf(q.parent_choice_code));
  return roots.flatMap((q) => [q, ...children(q)]);
}

/** Libellé du choix parent d'une sous-question, null pour une question racine. */
export function parentChoiceLabel(question, questions) {
  if (!question.parent_choice_code) return null;
  for (const q of questions || []) {
    const c = (q.choices || []).find((x) => x.code === question.parent_choice_code);
    if (c) return c.label;
  }
  return question.parent_choice_code;
}

export function choiceToForm(choice) {
  return {
    label: choice.label || '',
    sort_order: String(choice.sort_order ?? ''),
    suggested_type_inter: choice.suggested_type_inter || NONE,
    creates_request: Boolean(choice.creates_request),
    is_exclusive: Boolean(choice.is_exclusive),
  };
}

/** Champs modifiés seulement ; type retiré = null (l'API l'efface). */
export function choicePatch(choice, form) {
  const patch = {};
  const label = form.label.trim();
  if (label !== choice.label) patch.label = label;
  const order = Number.parseInt(form.sort_order, 10);
  if (Number.isFinite(order) && order !== choice.sort_order) patch.sort_order = order;
  const type = form.suggested_type_inter === NONE ? null : form.suggested_type_inter;
  if (type !== (choice.suggested_type_inter || null)) patch.suggested_type_inter = type;
  if (form.creates_request !== Boolean(choice.creates_request)) patch.creates_request = form.creates_request;
  if (form.is_exclusive !== Boolean(choice.is_exclusive)) patch.is_exclusive = form.is_exclusive;
  return patch;
}

export function isValidChoiceCode(code) {
  return CODE_RE.test(code);
}

export function newChoicePayload(questionId, form) {
  const payload = {
    question_id: questionId,
    code: form.code.trim().toUpperCase(),
    label: form.label.trim(),
    creates_request: form.creates_request,
    is_exclusive: form.is_exclusive,
  };
  if (form.suggested_type_inter !== NONE) payload.suggested_type_inter = form.suggested_type_inter;
  return payload;
}
