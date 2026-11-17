/**
 * Règle de déballage de l'enveloppe des réponses du backend (ADR 0022).
 *
 * Un objet (non tableau) qui porte une clé `data` et pas de clé `items` est une
 * enveloppe : `data` devient le corps lu par les appels, `audit` (s'il existe) est
 * gardé à part. Les listes paginées ({ items, pagination }), les tableaux bruts et
 * les objets nus restent tels quels. Même règle que mobile/src/lib/api/client.js.
 *
 * @param {*} body - corps de réponse HTTP
 * @returns {{ data: *, audit?: * }}
 */
export function unwrapEnvelope(body) {
  const isEnvelope =
    body !== null &&
    typeof body === 'object' &&
    !Array.isArray(body) &&
    'data' in body &&
    !('items' in body);
  if (!isEnvelope) return { data: body };
  return 'audit' in body ? { data: body.data, audit: body.audit } : { data: body.data };
}
