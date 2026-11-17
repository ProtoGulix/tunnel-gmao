/**
 * Extrait l'objet d'une réponse « single » du backend, quelle que soit sa forme.
 *
 * L'intercepteur de client.js retire l'enveloppe { data } quand c'est la seule clé :
 * une route qui renvoie { data } arrive déjà déballée, une route qui renvoie
 * { data, audit } garde son enveloppe. Sans ce traitement, lire body.data sur une
 * réponse déballée donne undefined (en-tête d'intervention vidé après un PUT).
 */
export function singleBody(body) {
  if (body && typeof body === 'object' && 'data' in body && 'audit' in body) return body.data;
  return body ?? {};
}
